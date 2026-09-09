import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { ReplaceLineupDto } from './lineup.dto';
import { LineupService } from './lineup.service';

@ApiTags('lineup')
@ApiBearerAuth()
@Controller('organizers/:organizerId/events/:eventId/lineup')
export class LineupController {
  constructor(private readonly lineup: LineupService) {}

  @Get()
  list(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.lineup.list(getAuthUserId(request), organizerId, eventId);
  }

  @Put()
  replace(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Body() body: ReplaceLineupDto,
  ) {
    return this.lineup.replace(getAuthUserId(request), organizerId, eventId, body);
  }
}
