/**
 * Queue service
 *
 * Handles: job creation, deduplication, retries, priorities,
 * delayed jobs, bulk adds, progress tracking, and graceful shutdown.
 */

import { Job, JobsOptions, Queue, QueueEvents } from 'bullmq';
import redisService from './Redis/queue-redis.service';
import AppError from '../utils/errors/appError';
import { STATUS_CODE } from '../constants';

type JobOpts = {
  attempts: number;
  backoff: { type: 'exponential' | 'fixed'; delay: number };
  removeOnComplete: { count: number } | { age: number };
  removeOnFail: { count: number } | { age: number };
};

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
// ─── Job type registry ──────────────────────────────────────────────────────────
// Central place to define all job types and their default options.
// Add a new entry here whenever you introduce a new job kind.

export const JOB_TYPES = Object.freeze({
  // Email
  SEND_EMAIL: 'send_email',
  SEND_BULK_EMAIL: 'send_bulk_email',

  // Data processing
  PROCESS_CSV: 'process_csv',
  GENERATE_REPORT: 'generate_report',
  RESIZE_IMAGE: 'resize_image',

  // Notifications
  PUSH_NOTIFICATION: 'push_notification',
  WEBHOOK: 'webhook',

  // Maintenance
  CLEANUP: 'cleanup',
  SYNC_DATA: 'sync_data',
});

// Per-job-type default BullMQ options (merged with any caller overrides)
const JOB_DEFAULTS: Record<JobType, JobOpts> = {
  [JOB_TYPES.SEND_EMAIL]: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 2_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
  [JOB_TYPES.SEND_BULK_EMAIL]: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 5_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
  [JOB_TYPES.PROCESS_CSV]: {
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 3_000 },
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 50 },
  },
  [JOB_TYPES.GENERATE_REPORT]: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5_000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 30 },
  },
  [JOB_TYPES.RESIZE_IMAGE]: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
  [JOB_TYPES.PUSH_NOTIFICATION]: {
    attempts: 4,
    backoff: { type: 'exponential' as const, delay: 1_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 200 },
  },
  [JOB_TYPES.WEBHOOK]: {
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 2_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
  [JOB_TYPES.CLEANUP]: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 10_000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 20 },
  },
  [JOB_TYPES.SYNC_DATA]: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5_000 },
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 50 },
  },
} as const;

// ─── Validation ──────────────────

const PAYLOAD_VALIDATORS = {
  [JOB_TYPES.SEND_EMAIL]: (p: {
    to: string;
    subject: string;
    body: string;
    templateId?: string;
  }) => {
    if (!p.to)
      throw new AppError(
        "send_email: 'to' is required",
        STATUS_CODE.BAD_REQUEST,
      );
    if (!p.subject)
      throw new AppError(
        "send_email: 'subject' is required",
        STATUS_CODE.BAD_REQUEST,
      );
    if (!p.body && !p.templateId)
      throw new AppError(
        "send_email: 'body' or 'templateId' is required",
        STATUS_CODE.BAD_REQUEST,
      );
  },
  [JOB_TYPES.PROCESS_CSV]: (p: any) => {
    if (!p.filePath)
      throw new AppError(
        "process_csv: 'filePath' is required",
        STATUS_CODE.BAD_REQUEST,
      );
  },
  [JOB_TYPES.GENERATE_REPORT]: (p: any) => {
    if (!p.reportType)
      throw new AppError(
        "generate_report: 'reportType' is required",
        STATUS_CODE.BAD_REQUEST,
      );
  },
  [JOB_TYPES.RESIZE_IMAGE]: (p: any) => {
    if (!p.imageUrl)
      throw new AppError(
        "resize_image: 'imageUrl' is required",
        STATUS_CODE.BAD_REQUEST,
      );
    if (!p.width && !p.height)
      throw new AppError(
        "resize_image: 'width' or 'height' is required",
        STATUS_CODE.BAD_REQUEST,
      );
  },
  [JOB_TYPES.PUSH_NOTIFICATION]: (p: any) => {
    if (!p.userId)
      throw new AppError(
        "push_notification: 'userId' is required",
        STATUS_CODE.BAD_REQUEST,
      );
    if (!p.message)
      throw new AppError(
        "push_notification: 'message' is required",
        STATUS_CODE.BAD_REQUEST,
      );
  },
  [JOB_TYPES.WEBHOOK]: (p: any) => {
    if (!p.url)
      throw new AppError("webhook: 'url' is required", STATUS_CODE.BAD_REQUEST);
  },
};

function validatePayload(jobType: JobType, payload: object) {
  const validator =
    PAYLOAD_VALIDATORS[jobType as keyof typeof PAYLOAD_VALIDATORS];
  if (validator) validator(payload as any);
}

export class QueueService {
  private queues: Map<string, Queue> = new Map();

  private queueEvents: Map<string, QueueEvents> = new Map();

  private connection: import('ioredis').Redis;

  constructor() {
    this.connection = redisService.getInstance();
  }

  // ── Internal helpers ───────────────────

  /**
   * Lazily create and cache a Queue for the given name.
   * Re-using the same instance avoids redundant Redis connections.
   */
  private getQueue(queueName: string) {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.connection,
        defaultJobOptions: {
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 200 },
        },
      });

      queue.on('error', (err) => {
        console.error(`[Queue:${queueName}] error →`, err.message);
      });

      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName);
  }

  /**
   * Lazily create and cache a QueueEvents listener.
   * Used to await job completion / failure from outside a worker.
   */
  private getQueueEvents(queueName: string) {
    if (!this.queueEvents.has(queueName)) {
      const qe = new QueueEvents(queueName, {
        connection: this.connection,
      });
      this.queueEvents.set(queueName, qe);
    }
    return this.queueEvents.get(queueName);
  }

  // ── Public API ─────────────────

  /**
   * Add a single job.
   */
  async addJob(
    queueName: string,
    jobType: JobType,
    payload: object,
    options: JobsOptions = {},
  ): Promise<Job> {
    if (!queueName)
      throw new AppError(
        'addJob: queueName is required',
        STATUS_CODE.BAD_REQUEST,
      );
    if (!jobType)
      throw new AppError(
        'addJob: jobType is required',
        STATUS_CODE.BAD_REQUEST,
      );
    if (!payload && typeof payload !== 'object')
      throw new AppError(
        'addJob: payload must be an object',
        STATUS_CODE.BAD_REQUEST,
      );

    validatePayload(jobType, payload);

    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }
    const defaults: Partial<JobsOptions> =
      JOB_DEFAULTS[jobType as JobType] ?? {};
    const jobOptions: JobsOptions = { ...defaults, ...options };

    const job = await queue.add(jobType, payload, jobOptions);
    console.log(
      `[QueueService] ✓ Added job ${job.id} (${jobType}) → queue "${queueName}"`,
    );
    return job;
  }

  /**
   * Add a job that runs once after a delay.
   */
  async addDelayedJob(
    queueName: string,
    jobType: JobType,
    payload: object,
    delayMs: number, // - Milliseconds to wait before processing.
    options: object = {},
  ) {
    if (typeof delayMs !== 'number' || delayMs < 0)
      throw new AppError(
        'addDelayedJob: delayMs must be a non-negative number',
        STATUS_CODE.BAD_REQUEST,
      );

    return this.addJob(queueName, jobType, payload, {
      delay: delayMs,
      ...options,
    });
  }

  /**
   * Add a recurring job using a cron expression.
   */
  async addRecurringJob(
    queueName: string,
    jobType: JobType,
    payload: object,
    cronExpression: string, // - e.g. "0 * * * *" (every hour)
    options: object = {},
  ) {
    if (!cronExpression)
      throw new Error('addRecurringJob: cronExpression is required');

    return this.addJob(queueName, jobType, payload, {
      repeat: { pattern: cronExpression },
      ...options,
    });
  }

  /**
   * Add a job only if no job with the same jobId already exists in the queue
   * (deduplication by caller-provided ID).
   */
  async addUniqueJob(
    queueName: string,
    jobType: JobType,
    payload: object,
    dedupeId: string,
    options: object = {},
  ) {
    if (!dedupeId) throw new Error('addUniqueJob: dedupeId is required');

    const queue = this.getQueue(queueName);
    const existing = await queue?.getJob(dedupeId);

    if (existing) {
      const state = await existing.getState();
      if (['waiting', 'active', 'delayed'].includes(state)) {
        console.log(
          `[QueueService] ⚡ Skipped duplicate job "${dedupeId}" (state: ${state})`,
        );
        return existing;
      }
    }

    return this.addJob(queueName, jobType, payload, {
      jobId: dedupeId,
      ...options,
    });
  }

  /**
   * Add multiple jobs at once (bulk insert — much more efficient than looping addJob).
   */
  async addBulkJobs(
    queueName: string,
    jobs: Array<{ jobType: string; payload: object; options?: object }>,
  ): Promise<Job[]> {
    // if (!Array.isArray(jobs) || jobs.length === 0)
    //   throw new Error('addBulkJobs: jobs must be a non-empty array');

    // // Validate all payloads upfront before touching Redis
    // for (const { jobType, payload } of jobs) {
    //   validatePayload(jobType, payload);
    // }

    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    }
    const bulkData = jobs.map(({ jobType, payload, options = {} }) => ({
      name: jobType,
      data: payload,
      opts: { ...(JOB_DEFAULTS[jobType as JobType] ?? {}), ...options },
    }));

    const added = await queue?.addBulk(bulkData);
    console.log(
      `[QueueService] ✓ Bulk-added ${added?.length} jobs → queue "${queueName}"`,
    );
    return added;
  }

  /**
   * Add a high-priority job that jumps the queue.
   * Lower numbers = higher priority in BullMQ.
   */
  async addPriorityJob(
    queueName: string,
    jobType: JobType,
    payload: object,
    priority: number = 1,
    options: object = {},
  ) {
    return this.addJob(queueName, jobType, payload, { priority, ...options });
  }

  /**
   * Wait (up to timeoutMs) for a job to complete and return its result.
   * Throws if the job fails or times out.
   */
  async waitForJob(
    job: Job,
    queueName: string,
    timeoutMs = 30_000,
  ): Promise<any> {
    const queueEvents = this.getQueueEvents(queueName);
    if (!queueEvents)
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    return job.waitUntilFinished(queueEvents, timeoutMs);
  }

  /**
   * Retrieve queue metrics (counts per state).
   */
  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName);
    if (!queue)
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );

    const [waiting, active, completed, failed, delayed, pausedState] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

    // If paused, all waiting jobs are technically "paused"
    const pausedJobs = pausedState ? waiting : 0;

    return {
      queueName,
      waiting: pausedState ? 0 : waiting, // waiting jobs not being processed
      active,
      completed,
      failed,
      delayed,
      paused: pausedState, // boolean
      pausedJobs, // count of jobs sitting because queue is paused
    };
  }

  /**
   * Retry all failed jobs in a queue.
   */
  async retryFailedJobs(queueName: string): Promise<number> {
    const queue = this.getQueue(queueName);
    if (!queue)
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    const failed = await queue.getFailed();
    await Promise.all(failed.map((j) => j.retry()));
    console.log(
      `[QueueService] ↺ Retried ${failed.length} failed jobs in "${queueName}"`,
    );
    return failed.length;
  }

  /**
   * Remove a specific job by ID (if it hasn't started yet).
   */
  async removeJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    if (!queue)
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    const job = await queue.getJob(jobId);
    if (!job)
      throw new AppError(
        `removeJob: job "${jobId}" not found`,
        STATUS_CODE.NOT_FOUND,
      );

    const state = await job.getState();
    if (state === 'active')
      throw new AppError(
        `removeJob: cannot remove active job "${jobId}"`,
        STATUS_CODE.BAD_REQUEST,
      );

    await job.remove();
    console.log(`[QueueService] 🗑 Removed job "${jobId}" from "${queueName}"`);
  }

  /**
   * Pause a queue — workers will stop picking up new jobs.
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    }

    await queue.pause();
    console.log(`[QueueService] ⏸ Paused queue "${queueName}"`);
  }

  /**
   * Resume a previously paused queue.
   */
  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    }
    await queue.resume();
    console.log(`[QueueService] ▶ Resumed queue "${queueName}"`);
  }

  /**
   * Drain a queue (remove all waiting + delayed jobs).
   */
  async drainQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new AppError(
        `Queue "${queueName}" not found`,
        STATUS_CODE.NOT_FOUND,
      );
    }
    await queue.drain();
    console.log(`[QueueService] 🚿 Drained queue "${queueName}"`);
  }

  /**
   * Gracefully close all queues and event listeners.
   * Call this on process SIGTERM / SIGINT.
   */
  async shutdown() {
    console.log('[QueueService] Shutting down…');
    await Promise.all([
      ...[...this.queues.values()].map((q) => q.close()),
      ...[...this.queueEvents.values()].map((qe) => qe.close()),
    ]);
    console.log('[QueueService] Shutdown complete.');
  }
}

export const queueService = new QueueService();
