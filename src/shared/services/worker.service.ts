/**
 * Worker — consumes jobs from all queues.
 *
 * Run this in a separate process:
 *   node src/worker.js
 *
 * Each job handler receives a BullMQ Job object and can:
 *   - Read job.data (the payload)
 *   - Report progress via job.updateProgress(0-100)
 *   - Log via job.log(message)
 *   - Return a value that becomes job.returnvalue
 *   - Throw to trigger automatic retry (up to job.opts.attempts)
 */

import { Worker, MetricsTime } from 'bullmq';
import redisService from './Redis/queue-redis.service';
import emailService from './email.service';
import { ENVIRONMENT } from 'src/config';
import { JOB_TYPES, JobType } from './queue.service';

// ─── Job handlers ────────────────

const handlers = {
  // ── Email ──────────────────────
  async [JOB_TYPES.SEND_EMAIL](job: any) {
    const { to, subject, body, templateId, templateData } = job.data;
    await job.log(`Sending email to ${to}`);
    await job.updateProgress(10);

    // Simulate email sending (replace with your mailer, e.g. Nodemailer, SES)
    await emailService.sendEmail({ to, subject }, body);

    await job.updateProgress(80);

    // Simulate transient failure to demo retries (remove in production)
    // if (Math.random() < 0.1)
    //   throw new Error('SMTP connection refused — will retry');

    await job.updateProgress(100);
    await job.log(`Email delivered to ${to}`);
    return { delivered: true, to, subject };
  },

  async [JOB_TYPES.SEND_BULK_EMAIL](job: any) {
    const { recipients, subject, templateId } = job.data;
    const total = recipients.length;
    await job.log(`Sending bulk email to ${total} recipients`);

    for (let i = 0; i < total; i++) {
      await simulateWork(50);
      await job.updateProgress(Math.round(((i + 1) / total) * 100));
    }

    await job.log(`Bulk email complete: ${total} sent`);
    return { sent: total };
  },

  // ── Data processing ────────────────────
  async [JOB_TYPES.PROCESS_CSV](job: any) {
    const { filePath, options = {} } = job.data;
    await job.log(`Processing CSV: ${filePath}`);
    await job.updateProgress(5);

    // Simulate chunked processing
    const CHUNKS = 10;
    for (let i = 0; i < CHUNKS; i++) {
      await simulateWork(200);
      await job.updateProgress(Math.round(((i + 1) / CHUNKS) * 100));
      await job.log(`Processed chunk ${i + 1}/${CHUNKS}`);
    }

    return { filePath, rowsProcessed: 5000, status: 'success' };
  },

  async [JOB_TYPES.GENERATE_REPORT](job: any) {
    const { reportType, startDate, endDate, userId } = job.data;
    await job.log(`Generating ${reportType} report`);
    await job.updateProgress(20);

    await simulateWork(800);
    await job.updateProgress(70);

    const reportUrl = `https://storage.example.com/reports/${reportType}-${Date.now()}.pdf`;
    await simulateWork(200);
    await job.updateProgress(100);

    return { reportUrl, reportType, generatedAt: new Date().toISOString() };
  },

  async [JOB_TYPES.RESIZE_IMAGE](job: any) {
    const { imageUrl, width, height, format = 'webp', quality = 80 } = job.data;
    await job.log(`Resizing image: ${imageUrl}`);
    await job.updateProgress(10);

    await simulateWork(400);
    await job.updateProgress(90);

    const outputUrl = `https://cdn.example.com/resized/${Date.now()}.${format}`;
    await job.updateProgress(100);

    return { originalUrl: imageUrl, outputUrl, width, height, format };
  },

  // ── Notifications ─────────────────
  async [JOB_TYPES.PUSH_NOTIFICATION](job: any) {
    const { userId, message, data = {}, platform = 'all' } = job.data;
    await job.log(`Pushing notification to user ${userId}`);

    await simulateWork(150);

    return { userId, delivered: true, platform };
  },

  async [JOB_TYPES.WEBHOOK](job: any) {
    const {
      url,
      method = 'POST',
      payload = {},
      headers = {},
      secret,
    } = job.data;
    await job.log(`Calling webhook: ${method} ${url}`);

    // In production: use fetch/axios with HMAC signature
    await simulateWork(300);

    // Simulate occasional 5xx so we can see retries in action
    if (Math.random() < 0.15)
      throw new Error('Webhook target returned 503 — will retry');

    return { url, status: 200, deliveredAt: new Date().toISOString() };
  },

  // ── Maintenance ─────────────────────
  async [JOB_TYPES.CLEANUP](job: any) {
    const { olderThanDays = 30, target = 'temp-files' } = job.data;
    await job.log(`Cleanup: removing ${target} older than ${olderThanDays}d`);
    await simulateWork(500);
    return { target, itemsRemoved: 42, status: 'ok' };
  },

  async [JOB_TYPES.SYNC_DATA](job: any) {
    const { source, destination, fullSync = false } = job.data;
    await job.log(`Syncing ${source} → ${destination} (full=${fullSync})`);
    await job.updateProgress(10);
    await simulateWork(600);
    await job.updateProgress(100);
    return { source, destination, recordsSynced: 1_200 };
  },
};

// ─── Worker factory ────────────────────

function createWorker(queueName: string) {
  const worker = new Worker(
    queueName,
    async (job) => {
      const handler = handlers[job.name as JobType];

      if (!handler) {
        // Unknown job type — log and skip (don't block the queue)
        console.warn(
          `[Worker] Unknown job type "${job.name}" (id: ${job.id}) — skipping`,
        );
        return { skipped: true, reason: 'unknown_job_type' };
      }

      console.log(
        `[Worker] ▶ Processing job ${job.id} (${job.name}) attempt ${job.attemptsMade + 1}`,
      );

      try {
        const result = await handler(job);
        console.log(`[Worker] ✓ Completed job ${job.id} (${job.name})`);
        return result;
      } catch (err: any) {
        // Re-throw so BullMQ can apply retry logic
        console.error(
          `[Worker] ✗ Job ${job.id} (${job.name}) failed: ${err.message}`,
        );
        throw err;
      }
    },
    {
      connection: redisService.getInstance(),
      concurrency: ENVIRONMENT.WORKER.CONCURRENCY,

      // Collect metrics for the last hour (accessible via queue.getMetrics())
      metrics: { maxDataPoints: MetricsTime.ONE_HOUR * 2 },

      // Stalled job detection — re-queue jobs where the worker crashed
      stalledInterval: 30000,
      maxStalledCount: 2,
    },
  );

  // ─── Worker event hooks ──────────────
  worker.on('completed', (job, result) => {
    console.log(`[Worker] 🎉 Job ${job.id} done →`, JSON.stringify(result));
  });

  worker.on('failed', (job, err) => {
    const attemptsLeft =
      (job?.opts?.attempts ?? 1) - (job?.attemptsMade ?? 0) - 1;
    console.error(
      `[Worker] 💥 Job ${job?.id} failed (${attemptsLeft} retries left): ${err.message}`,
    );
  });

  worker.on('progress', (job, progress) => {
    console.log(`[Worker] ⏳ Job ${job.id} progress: ${progress}%`);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] ⚠ Job ${jobId} stalled — will be re-queued`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error →', err.message);
  });

  return worker;
}

// ─── Bootstrap ─────────────────────

const worker = createWorker(ENVIRONMENT.QUEUE.QUEUE_NAME);

console.log(
  `[Worker] Listening on queue "${ENVIRONMENT.QUEUE.QUEUE_NAME}" (concurrency: ${ENVIRONMENT.WORKER.CONCURRENCY})`,
);

// ─── Graceful shutdown ───────────────────

async function shutdown(signal: string) {
  console.log(`\n[Worker] ${signal} received — draining active jobs…`);
  await worker.close(); // waits for active jobs to finish
  console.log('[Worker] Shutdown complete.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Helpers ───────────────────
function simulateWork(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default createWorker;
