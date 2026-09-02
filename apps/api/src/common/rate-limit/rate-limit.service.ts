import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation';
import { RedisService } from '../redis/redis.service';

const memoryHits = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class RateLimitService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  isEnabled(): boolean {
    return this.config.get('RATE_LIMIT_ENABLED', { infer: true });
  }

  async consume(key: string, limit: number, windowSec: number): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    const count = await this.incrementRedis(key, windowSec).catch(() => this.incrementMemory(key, windowSec));
    if (count > limit) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private incrementMemory(key: string, windowSec: number): number {
    const now = Date.now();
    const current = memoryHits.get(key);
    if (!current || current.resetAt <= now) {
      memoryHits.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      return 1;
    }
    current.count += 1;
    return current.count;
  }

  private async incrementRedis(key: string, windowSec: number): Promise<number> {
    const client = this.redis.client;
    if (client.status === 'wait' || client.status === 'end') {
      await client.connect();
    }
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSec);
    }
    return count;
  }
}
