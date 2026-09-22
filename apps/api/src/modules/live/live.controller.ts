import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { LiveService } from './live.service';

@ApiTags('live')
@ApiBearerAuth()
@Controller('me/events')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get(':eventId/live')
  @ApiOperation({
    summary: 'Authenticated dancer Live read model for an event (read-only)',
  })
  getMyEventLive(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('eventId') eventId: string,
  ) {
    return this.live.getMyEventLive(getAuthUserId(request), eventId);
  }
}
