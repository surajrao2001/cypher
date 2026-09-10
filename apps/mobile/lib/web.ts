/** Public web origin for Cashfree checkout handoff (device must reach this URL). */
export function webBaseUrl(): string {
  return process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';
}

export function cashfreePayUrl(paymentSessionId: string): string {
  const base = webBaseUrl().replace(/\/$/, '');
  return `${base}/pay/cashfree?session=${encodeURIComponent(paymentSessionId)}`;
}
