import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Env } from '../../config/env.validation';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService<Env, true>) {
    this.client = new Redis(config.get('REDIS_URL', { infer: true }), {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    });
    this.client.on('error', (error) => {
      this.logger.error(error.message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }

  async ping(): Promise<boolean> {
    try {
      if (this.client.status === 'wait' || this.client.status === 'end') {
        await this.client.connect();
      }
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
