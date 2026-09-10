import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { CreateCheckInDto } from './check-in.dto';
import { CheckInService } from './check-in.service';

@ApiTags('check-in')
@ApiBearerAuth()
@Controller('organizers/:organizerId/events/:eventId')
export class CheckInController {
  constructor(private readonly checkIn: CheckInService) {}

  @Post('check-in')
  create(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Body() body: CreateCheckInDto,
  ) {
    return this.checkIn.create(getAuthUserId(request), organizerId, eventId, body);
  }

  @Get('check-ins')
  list(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.checkIn.list(getAuthUserId(request), organizerId, eventId);
  }
}
