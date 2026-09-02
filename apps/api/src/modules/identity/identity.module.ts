import { Global, Module } from '@nestjs/common';
import { AuthOtpController } from './auth-otp.controller';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { PhoneOtpService } from './phone-otp.service';
import { SupabaseGoTrueClient } from './supabase-gotrue.client';

@Global()
@Module({
  controllers: [AuthOtpController, IdentityController],
  providers: [IdentityService, PhoneOtpService, SupabaseGoTrueClient],
  exports: [IdentityService],
})
export class IdentityModule {}
