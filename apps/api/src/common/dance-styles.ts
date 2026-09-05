import { randomBytes } from 'node:crypto';
import type { DanceStyle, Prisma, PrismaClient } from '@prisma/client';

export function slugifyStyleName(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base.length >= 1 ? base : `style-${randomBytes(2).toString('hex')}`;
}

export function displayStyleName(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

type Db = PrismaClient | Prisma.TransactionClient;

export async function ensureDanceStyles(db: Db, names: string[]): Promise<DanceStyle[]> {
  const cleaned = [
    ...new Map(
      names
        .map((name) => displayStyleName(name))
        .filter((name) => name.length > 0)
        .map((name) => [slugifyStyleName(name), name] as const),
    ).entries(),
  ];

  const styles: DanceStyle[] = [];
  for (const [slug, name] of cleaned) {
    const existing = await db.danceStyle.findFirst({
      where: {
        OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }],
      },
    });
    if (existing) {
      styles.push(existing);
      continue;
    }
    styles.push(
      await db.danceStyle.create({
        data: { slug, name },
      }),
    );
  }
  return styles;
}

export async function replaceEventDanceStyles(
  db: Db,
  eventId: string,
  names: string[],
): Promise<void> {
  const styles = await ensureDanceStyles(db, names);
  await db.eventDanceStyle.deleteMany({ where: { eventId } });
  if (styles.length === 0) {
    return;
  }
  await db.eventDanceStyle.createMany({
    data: styles.map((style) => ({ eventId, styleId: style.id })),
    skipDuplicates: true,
  });
}

export async function replaceProfileDanceStyles(
  db: Db,
  profileId: string,
  names: string[],
): Promise<void> {
  const styles = await ensureDanceStyles(db, names);
  await db.profileDanceStyle.deleteMany({ where: { profileId } });
  if (styles.length === 0) {
    return;
  }
  await db.profileDanceStyle.createMany({
    data: styles.map((style) => ({ profileId, styleId: style.id })),
    skipDuplicates: true,
  });
}
