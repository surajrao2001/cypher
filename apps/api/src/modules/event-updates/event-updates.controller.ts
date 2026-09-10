import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { CreateEventUpdateDto, UpdateEventUpdateDto } from './event-updates.dto';
import { EventUpdatesService } from './event-updates.service';

@ApiTags('event-updates')
@ApiBearerAuth()
@Controller('organizers/:organizerId/events/:eventId/updates')
export class EventUpdatesController {
  constructor(private readonly updates: EventUpdatesService) {}

  @Get()
  list(@Req() req: FastifyRequest & { auth?: AuthPrincipal }, @Param() params: Record<string, string>) {
    return this.updates.list(getAuthUserId(req), params.organizerId!, params.eventId!);
  }

  @Post()
  create(
    @Req() req: FastifyRequest & { auth?: AuthPrincipal },
    @Param() params: Record<string, string>,
    @Body() body: CreateEventUpdateDto,
  ) {
    return this.updates.create(getAuthUserId(req), params.organizerId!, params.eventId!, body);
  }

  @Patch(':updateId')
  update(
    @Req() req: FastifyRequest & { auth?: AuthPrincipal },
    @Param() params: Record<string, string>,
    @Body() body: UpdateEventUpdateDto,
  ) {
    return this.updates.update(
      getAuthUserId(req),
      params.organizerId!,
      params.eventId!,
      params.updateId!,
      body,
    );
  }

  @Delete(':updateId')
  remove(@Req() req: FastifyRequest & { auth?: AuthPrincipal }, @Param() params: Record<string, string>) {
    return this.updates.remove(
      getAuthUserId(req),
      params.organizerId!,
      params.eventId!,
      params.updateId!,
    );
  }
}
