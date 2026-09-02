import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

type HealthResponse = {
  status: 'ok';
  service: 'api';
  timestamp: string;
};

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness' })
  @ApiOkResponse({ description: 'Process is up' })
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness' })
  @ApiOkResponse({ description: 'Database and Redis are reachable' })
  async ready(): Promise<HealthResponse & { database: boolean; redis: boolean }> {
    let database = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }
    const redis = await this.redis.ping();
    if (!database || !redis) {
      throw new ServiceUnavailableException({
        status: 'degraded',
        service: 'api',
        timestamp: new Date().toISOString(),
        database,
        redis,
      });
    }
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      database,
      redis,
    };
  }
}
