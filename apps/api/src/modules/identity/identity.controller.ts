import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import { CompleteOnboardingDto } from './identity.dto';
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
  @ApiOperation({ summary: 'Complete dancer onboarding' })
  complete(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Body() body: CompleteOnboardingDto,
  ) {
    const userId = getAuthUserId(request);
    return this.identity.completeOnboarding(userId, body, request.auth?.jwtRole ?? 'authenticated');
  }
}
