import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { PatchEventDayConfigDto, SetEventOpsStatusDto } from './event-day.dto';
import { EventDayService } from './event-day.service';

@ApiTags('event-day')
@ApiBearerAuth()
@Controller('organizers/:organizerId/events/:eventId/day-config')
export class EventDayController {
  constructor(private readonly eventDay: EventDayService) {}

  @Get()
  @ApiOperation({ summary: 'Get effective event-day config (defaults when no row; never inserts)' })
  get(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.eventDay.getDayConfig(getAuthUserId(request), organizerId, eventId);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update event-day windows/timezone (upsert; not ops status)' })
  patch(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Body() body: PatchEventDayConfigDto,
  ) {
    return this.eventDay.patchDayConfig(getAuthUserId(request), organizerId, eventId, body);
  }

  @Post('ops-status')
  @ApiOperation({ summary: 'Transition event-day operational status' })
  setOpsStatus(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Body() body: SetEventOpsStatusDto,
  ) {
    return this.eventDay.setOpsStatus(getAuthUserId(request), organizerId, eventId, body);
  }
}
