import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { UpdateProfileDto } from './identity.dto';
import { IdentityService } from './identity.service';

@ApiTags('identity')
@ApiBearerAuth()
@Controller('me')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  @ApiOperation({ summary: 'Current profile after lazy create' })
  @ApiOkResponse({ description: 'Application profile and organizer memberships' })
  me(@Req() request: FastifyRequest & { auth?: AuthPrincipal }) {
    const userId = getAuthUserId(request);
    return this.identity.getMe(userId, request.auth?.jwtRole ?? 'authenticated');
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update the current profile' })
  complete(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Body() body: UpdateProfileDto,
  ) {
    const userId = getAuthUserId(request);
    return this.identity.updateProfile(userId, body, request.auth?.jwtRole ?? 'authenticated');
  }
}
