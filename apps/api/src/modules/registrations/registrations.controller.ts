import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { CreateRegistrationDto } from './registrations.dto';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Post()
  create(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Body() body: CreateRegistrationDto,
  ) {
    return this.registrations.createHold(getAuthUserId(request), body);
  }

  @Get('mine')
  listMine(@Req() request: FastifyRequest & { auth?: AuthPrincipal }) {
    return this.registrations.listMine(getAuthUserId(request));
  }

  @Get(':id')
  getMine(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.registrations.getMine(getAuthUserId(request), id);
  }

  @Post(':id/cancel')
  cancel(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.registrations.cancelHold(getAuthUserId(request), id);
  }

  @Post(':id/confirm-free')
  confirmFree(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.registrations.confirmFree(getAuthUserId(request), id);
  }
}
