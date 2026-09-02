import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { IdentityService } from './identity.service';

@ApiTags('identity')
@ApiBearerAuth()
@Controller('me')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  @ApiOperation({ summary: 'Current authenticated principal' })
  @ApiOkResponse({ description: 'JWT subject after verification' })
  me(@Req() request: FastifyRequest & { auth?: AuthPrincipal }) {
    const userId = getAuthUserId(request);
    return this.identity.currentUser(userId, request.auth?.jwtRole ?? 'authenticated');
  }
}
