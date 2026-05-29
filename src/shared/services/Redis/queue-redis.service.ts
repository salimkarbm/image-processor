import Redis from 'ioredis';
import { ENVIRONMENT } from '../../../config';

class QueueRedisService {
  public redis: Redis;

  constructor() {
    this.redis = new Redis(ENVIRONMENT.REDIS.queue_url, {
      maxRetriesPerRequest: null,
      tls: ENVIRONMENT.REDIS.queue_url.startsWith('rediss://') ? {} : undefined,
      enableReadyCheck: true,
      lazyConnect: true, // connect manually so we control logging
      enableOfflineQueue: true,
      retryStrategy: (times) => {
        if (times > 10) {
          console.error('[Redis] Too many reconnection attempts — giving up.');
          return null; // stop retrying
        }
        const delay = Math.min(times * 200, 3000);
        console.warn(
          `[Redis] Reconnecting in ${delay}ms (attempt ${times}) ...`,
        );
        return delay;
      },
    });
    this.registerEventHandlers();
    this.setupGracefulShutdown();
  }

  private registerEventHandlers() {
    this.redis.on('connect', () => console.log('✅ Redis: TCP connected'));
    this.redis.on('ready', () => console.log('✅ Redis: Connected and Ready'));
    this.redis.on('error', (err) => console.error('❌ Redis Error:', err));
    this.redis.on('close', () => console.log('⚠️  Redis: Connection closed'));
    this.redis.on('reconnecting', () =>
      console.log('🔄 Redis: Reconnecting...'),
    );
    this.redis.on('end', () => console.log('🔚 Redis: Connection ended'));
    this.redis.on('reconnected', () => console.log('✅ Redis: Reconnected'));
    this.redis.on('disconnected', () => console.log('⚠️  Redis: Disconnected'));
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Closing Redis...`);

      try {
        if (this.redis.status !== 'end') {
          await this.redis.quit();
        }
      } catch (error) {
        console.error('Redis shutdown error:', error);
      }

      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM')); // Render uses this
    // process.on('exit', () => this.redis.disconnect());
  }

  public async connect(): Promise<void> {
    try {
      await this.redis.connect();

      console.log('✅ Redis initial connection successful');

      await this.redis.ping();

      console.log('🏓 Redis ping successful');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
    }
  }

  public getInstance() {
    return this.redis;
  }

  public async set(
    prefix: string,
    value: string,
    key?: string,
  ): Promise<string | null> {
    try {
      return await this.redis.set(`${prefix}:${key}`, value);
    } catch (error) {
      console.error('Redis GET failed:', error);
      return null;
    }
  }

  public async get(prefix: string, key?: string): Promise<string | null> {
    try {
      return await this.redis.get(`${prefix}:${key}`);
    } catch (error) {
      console.error('Redis GET failed:', error);
      return null;
    }
  }

  public async del(prefix: string, key: string): Promise<void> {
    try {
      await this.redis.del(`${prefix}:${key}`);
    } catch (error) {
      console.error('Redis DELETE failed:', error);
    }
  }

  public async flushall(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (e) {
      console.log(e);
    }
  }

  public async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (e) {
      console.log(e);
    }
  }

  public async quit(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (e) {
      console.log(e);
    }
  }

  public async ping(): Promise<void> {
    try {
      await this.redis.ping();
    } catch (e) {
      console.log(e);
    }
  }

  public async info(): Promise<void> {
    try {
      await this.redis.info();
    } catch (e) {
      console.log(e);
    }
  }

  public async keys(pattern: string) {
    try {
      return await this.redis.keys(pattern);
    } catch (e) {
      console.log(e);
    }
  }

  public async ttl(key: string) {
    try {
      return await this.redis.ttl(key);
    } catch (e) {
      console.log(e);
    }
  }

  public async setWithExpiry(
    value: string,
    prefix: string,
    expiry: number,
    key?: string,
  ): Promise<void> {
    try {
      await this.redis.set(`${prefix}:${key}`, value, 'EX', expiry);
    } catch (e) {
      console.log(e);
    }
  }

  public async getWithExpiry(key: string) {
    try {
      return await this.redis.get(key);
    } catch (e) {
      console.log(e);
    }
  }

  public async delWithExpiry(key: string) {
    try {
      return await this.redis.del(key);
    } catch (e) {
      console.log(e);
    }
  }

  public async flushAllWithExpiry() {
    try {
      return await this.redis.flushall();
    } catch (e) {
      console.log(e);
    }
  }

  public async flushdbWithExpiry() {
    try {
      return await this.redis.flushdb();
    } catch (e) {
      console.log(e);
    }
  }
}

const queueRedisService = new QueueRedisService();

export default queueRedisService;
