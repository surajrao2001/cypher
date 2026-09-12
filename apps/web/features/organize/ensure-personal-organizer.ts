import type { OrganizerDto } from '@cypher/contracts';

type OrganizerApi = {
  listMyOrganizers: () => Promise<OrganizerDto[]>;
  createOrganizer: (body: {
    orgName: string;
    type?: 'independent' | 'collective' | 'college' | 'studio' | 'community' | 'other';
    city?: string;
  }) => Promise<OrganizerDto>;
  getMyOrganizerBySlug: (slug: string) => Promise<OrganizerDto>;
};

type ProfileLike = {
  dancerName?: string | null;
  name?: string | null;
  city?: string | null;
};

/**
 * Ensure the user has at least one Organizer for event APIs.
 * Uses existing POST /organizers — invisible infrastructure (no toast/ceremony).
 */
export async function ensurePersonalOrganizer(
  api: Pick<OrganizerApi, 'listMyOrganizers' | 'createOrganizer'>,
  profile: ProfileLike | null | undefined,
): Promise<OrganizerDto> {
  const existing = await api.listMyOrganizers();
  if (existing.length > 0) {
    return existing[0]!;
  }

  const orgName =
    profile?.dancerName?.trim() ||
    profile?.name?.trim() ||
    'Host';
  const city = profile?.city?.trim() || undefined;

  return api.createOrganizer({
    orgName: orgName.length >= 2 ? orgName : 'Host',
    type: 'independent',
    city,
  });
}

export async function resolveHostOrganizer(
  api: OrganizerApi,
  profile: ProfileLike | null | undefined,
  preferredSlug?: string | null,
): Promise<OrganizerDto> {
  if (preferredSlug) {
    try {
      return await api.getMyOrganizerBySlug(preferredSlug);
    } catch {
      // fall through
    }
  }
  const list = await api.listMyOrganizers();
  if (list.length === 1) {
    return list[0]!;
  }
  if (list.length > 1 && preferredSlug) {
    const hit = list.find((o) => o.slug === preferredSlug);
    if (hit) return hit;
  }
  if (list.length > 0) {
    return list[0]!;
  }
  return ensurePersonalOrganizer(api, profile);
}
