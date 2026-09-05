import { HttpException, HttpStatus } from '@nestjs/common';
import { PhoneOtpService } from './phone-otp.service';

describe('PhoneOtpService', () => {
  const goTrue = { requestSmsOtp: jest.fn(), verifySmsOtp: jest.fn() };
  const rateLimit = { consume: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('jwt-secret-value') };
  const service = new PhoneOtpService(goTrue as never, rateLimit as never, config as never);

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimit.consume.mockResolvedValue(undefined);
  });

  it('rate-limits send by phone fingerprint and IP before calling Supabase', async () => {
    await service.requestOtp('+919876543210', '1.1.1.1');
    expect(rateLimit.consume).toHaveBeenCalledTimes(3);
    expect(goTrue.requestSmsOtp).toHaveBeenCalledWith('+919876543210');
  });

  it('rate-limits verification attempts', async () => {
    goTrue.verifySmsOtp.mockResolvedValue({ accessToken: 'a' });
    await service.verifyOtp('+919876543210', '123456');
    expect(rateLimit.consume.mock.calls[0]?.[0]).toMatch(/^otp:verify:phone:/);
    expect(goTrue.verifySmsOtp).toHaveBeenCalledWith('+919876543210', '123456');
  });

  it('does not call Supabase when send limits are exceeded', async () => {
    rateLimit.consume.mockRejectedValue(new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS));
    await expect(service.requestOtp('+919876543210', '1.1.1.1')).rejects.toBeInstanceOf(HttpException);
    expect(goTrue.requestSmsOtp).not.toHaveBeenCalled();
  });
});
