import { createHash, randomBytes } from 'node:crypto';

export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base.length >= 2 ? base : `org-${randomBytes(3).toString('hex')}`;
}

export function uniqueSlugCandidate(base: string): string {
  const suffix = randomBytes(2).toString('hex');
  const trimmed = base.slice(0, 52);
  return `${trimmed}-${suffix}`;
}

export function shortIdFromSeed(seed: string): string {
  return createHash('sha1').update(seed).digest('hex').slice(0, 8);
}
