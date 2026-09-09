import { routes } from '@cypher/contracts';

/** Discoverable without an account. */
export const PUBLIC_APP_PATHS = [
  routes.discover,
  routes.events,
  routes.map,
  routes.videos,
  routes.organizers,
] as const;

/** Require a Supabase session + Nest user. */
export const PRIVATE_APP_PATHS = [
  routes.profile,
  routes.tickets,
  routes.organize,
  routes.saved,
] as const;

/** Private routes that also require finished dancer onboarding. */
export const ONBOARDED_APP_PATHS = [routes.organize, routes.tickets, routes.saved] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function requiresOnboardingComplete(pathname: string): boolean {
  return ONBOARDED_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function loginUrl(next?: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return `${routes.login}?next=${encodeURIComponent(next)}`;
  }
  return routes.login;
}

export function safeNextPath(next: string | null | undefined, fallback: string = routes.profile): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return fallback;
}
