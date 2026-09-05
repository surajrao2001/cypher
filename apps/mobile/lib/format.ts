export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

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

export function formatEventDay(iso: string, timeZone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone,
  }).format(new Date(iso));
}

export function spotsLeft(capacity: number, confirmedCount: number): number {
  return Math.max(0, capacity - confirmedCount);
}

export function clampQuantity(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}
