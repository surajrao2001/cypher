import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseJwtVerifier } from './supabase-jwt.verifier';
import { SupabaseJwtGuard } from '../guards/supabase-jwt.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';

@Module({
  providers: [
    SupabaseJwtVerifier,
    { provide: APP_GUARD, useClass: SupabaseJwtGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [SupabaseJwtVerifier],
})
export class AuthModule {}
