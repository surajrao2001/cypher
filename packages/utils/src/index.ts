export function formatMinorUnits(amountMinor: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export function formatEventDate(iso: string, timeZone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

export function spotsLeft(capacity: number, confirmedCount: number): number {
  return Math.max(0, capacity - confirmedCount);
}
