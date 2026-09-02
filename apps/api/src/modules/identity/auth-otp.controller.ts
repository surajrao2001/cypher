import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '../../common/auth/public.decorator';
import { RequestOtpDto, VerifyOtpDto } from './identity.dto';
import { PhoneOtpService } from './phone-otp.service';

@ApiTags('auth')
@Public()
@Controller('auth/otp')
export class AuthOtpController {
  constructor(private readonly otp: PhoneOtpService) {}

  @Post('request')
  @ApiOperation({ summary: 'Send a Phone OTP via Supabase Auth' })
  @ApiOkResponse({ description: 'OTP dispatch accepted' })
  requestCode(@Body() body: RequestOtpDto, @Req() request: FastifyRequest) {
    const ip = request.ip || request.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
    return this.otp.requestOtp(body.phone, ip);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify Phone OTP and return a Supabase session' })
  verifyCode(@Body() body: VerifyOtpDto) {
    return this.otp.verifyOtp(body.phone, body.token);
  }
}
