/** Public legal URLs on the marketing site (bynd8.in). */
export const LEGAL_URLS = {
  terms: 'https://bynd8.in/terms',
  privacy: 'https://bynd8.in/privacy',
  refunds: 'https://bynd8.in/refunds',
} as const;

/**
 * Client-visible stage label.
 * Set NEXT_PUBLIC_APP_STAGE=production to hide the preview badge.
 * staging | preview | local (default) show Early access / Preview cues.
 */
export type AppStage = 'local' | 'staging' | 'preview' | 'production';

export function getAppStage(): AppStage {
  const raw = (process.env.NEXT_PUBLIC_APP_STAGE || process.env.APP_ENV || 'local')
    .trim()
    .toLowerCase();
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'staging' || raw === 'stage') return 'staging';
  if (raw === 'preview') return 'preview';
  return 'local';
}

export function isPreviewStage(stage = getAppStage()): boolean {
  return stage !== 'production';
}

/** Short badge copy for chrome / login. */
export function getReleaseBadgeLabel(stage = getAppStage()): string | null {
  switch (stage) {
    case 'production':
      return null;
    case 'staging':
      return 'Early access · staging';
    case 'preview':
      return 'Early access · preview';
    default:
      return 'Early access · local';
  }
}
