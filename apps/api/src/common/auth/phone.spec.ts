import { maskPhone, phoneFingerprint } from './phone';

describe('phone helpers', () => {
  it('masks a number for logs', () => {
    expect(maskPhone('+919876543210')).toBe('+91******3210');
  });

  it('fingerprints without echoing the phone', () => {
    const fp = phoneFingerprint('+919876543210', 'secret');
    expect(fp).not.toContain('9876');
    expect(fp).toHaveLength(24);
  });
});
