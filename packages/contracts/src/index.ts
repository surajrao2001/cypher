export type PlatformRole = 'user' | 'admin';
export type ProfileStatus = 'active' | 'suspended' | 'deleted';
export type OrganizerVerificationStatus = 'pending' | 'verified' | 'rejected';
export type OrganizerMemberRole = 'owner' | 'manager' | 'editor';
export type CategoryEntryType = 'solo' | 'team' | 'viewer';
export type OrganizerType =
  | 'independent'
  | 'collective'
  | 'college'
  | 'studio'
  | 'community'
  | 'other';
export type EventType =
  | 'battle'
  | 'workshop'
  | 'jam'
  | 'showcase'
  | 'cypher'
  | 'session'
  | 'camp'
  | 'audition'
  | 'competition'
  | 'other';
export type EventStatus =
  | 'draft'
  | 'published'
  | 'registration_closed'
  | 'completed'
  | 'cancelled';
/** @deprecated Prefer RegistrationPaymentStatus */
export type PaymentStatus = RegistrationPaymentStatus;
export type RegistrationPaymentStatus =
  | 'not_started'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';
export type RegistrationStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'waitlist'
  | 'expired'
  | 'cancelled'
  | 'refunded';
export type PaymentProvider = 'razorpay' | 'cashfree';
export type OrganizerPayoutAccountStatus =
  | 'not_started'
  | 'pending'
  | 'action_required'
  | 'active'
  | 'suspended'
  | 'rejected';
export type PaymentOrderStatus =
  | 'created'
  | 'attempted'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';
export type PaymentRecordStatus =
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';
export type WebhookProcessingStatus = 'received' | 'processing' | 'processed' | 'failed';
export type VideoVisibility = 'public' | 'registered_only' | 'private';

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
  requestId?: string;
}

export interface HealthResponse {
  status: 'ok';
  service: 'api';
  timestamp: string;
}

export interface CurrentUserDto {
  userId: string;
  jwtRole: string;
  needsOnboarding: boolean;
  profile: {
    id: string;
    name: string;
    dancerName: string | null;
    city: string | null;
    crew: string | null;
    styles: string[];
    instagram: string | null;
    avatarUrl: string | null;
    bio: string | null;
    platformRole: PlatformRole;
    status: ProfileStatus;
  };
  organizerMemberships: Array<{
    organizerId: string;
    role: OrganizerMemberRole;
    orgName: string;
    slug: string;
    verificationStatus: OrganizerVerificationStatus;
  }>;
}

export interface OtpRequestResponse {
  ok: true;
}

export interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: string;
}

export interface EventCardDto {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  city: string;
  venue: string | null;
  /** WGS84 — set when organizer drops a pin */
  venueLatitude: number | null;
  venueLongitude: number | null;
  startTime: string;
  createdAt: string;
  posterUrl: string | null;
  status: EventStatus;
  eventType: EventType;
  organizerName: string;
  organizerSlug: string;
  crew: string;
  styles: string[];
  tags: string[];
  featured: boolean;
  priceMinor: number;
  spotsConfirmed: number;
  spotsCapacity: number;
}

export interface EventCategoryPublicDto {
  id: string;
  name: string;
  /** Legacy / fallback list price (also used when no active tier). */
  priceMinor: number;
  /** Resolved sell price right now (tier or fallback). */
  currentPriceMinor: number;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  entryType: CategoryEntryType;
  minTeamSize: number;
  maxTeamSize: number;
  /** @deprecated use maxTeamSize */
  teamSize: number;
  posterUrl: string | null;
  priceTiers: CategoryPriceTierDto[];
  validDayIds: string[];
  activeTierName: string | null;
  nextTier: CategoryPriceTierDto | null;
}

export interface CategoryPriceTierDto {
  id: string;
  name: string;
  priceMinor: number;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  maxQuantity: number | null;
}

export interface EventDayDto {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string | null;
  sortOrder: number;
}

/** Easy audience / door pass summary (first viewer category when multiple exist). */
export interface EventAudiencePassDto {
  enabled: boolean;
  categoryId: string | null;
  name: string;
  priceMinor: number;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  spotsLeft: number;
}

export interface EventDetailDto extends EventCardDto {
  description: string | null;
  endTime: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  categories: EventCategoryPublicDto[];
  /** Compete categories only (excludes viewer). */
  competeCategories: EventCategoryPublicDto[];
  /** All viewer / audience SKUs (day passes, full weekend, etc.). */
  viewerCategories: EventCategoryPublicDto[];
  audience: EventAudiencePassDto;
  days: EventDayDto[];
  mediaLinks: EventMediaLinkDto[];
  updates: EventUpdateDto[];
  lineup: EventLineupPersonDto[];
}

export type MediaLinkKind = 'youtube' | 'instagram' | 'drive' | 'other';

export interface EventMediaLinkDto {
  id: string;
  eventId: string;
  categoryId: string | null;
  battleId: string | null;
  title: string;
  url: string;
  kind: MediaLinkKind;
  sortOrder: number;
  createdAt: string;
}

export interface CreateEventMediaLinkBody {
  title: string;
  url: string;
  kind?: MediaLinkKind;
  categoryId?: string | null;
  sortOrder?: number;
}

export interface UpdateEventMediaLinkBody {
  title?: string;
  url?: string;
  kind?: MediaLinkKind;
  categoryId?: string | null;
  sortOrder?: number;
}

export interface EventListResponse {
  items: EventCardDto[];
  featured: EventCardDto[];
  nextUp: EventCardDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrganizerDto {
  id: string;
  orgName: string;
  slug: string;
  type: OrganizerType;
  city: string | null;
  bio: string | null;
  instagram: string | null;
  verificationStatus: OrganizerVerificationStatus;
  role: OrganizerMemberRole;
  createdAt: string;
}

export interface CreateOrganizerBody {
  orgName: string;
  slug?: string;
  type?: OrganizerType;
  city?: string;
  bio?: string;
  instagram?: string;
}

export interface UpdateOrganizerBody {
  orgName?: string;
  type?: OrganizerType;
  city?: string | null;
  bio?: string | null;
  instagram?: string | null;
}

export interface CreateOrganizerEventBody {
  title: string;
  slug?: string;
  description?: string;
  eventType?: EventType;
  city: string;
  venue?: string;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  startTime: string;
  endTime?: string;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  posterUrl?: string;
  tags?: string[];
  styles?: string[];
  categories?: Array<{
    name: string;
    priceMinor?: number;
    capacity: number;
    entryType?: CategoryEntryType;
    minTeamSize?: number;
    maxTeamSize?: number;
    /** @deprecated prefer min/max */
    teamSize?: number;
    posterUrl?: string | null;
  }>;
  /** Optional viewers / door pass (creates a single viewer category). */
  audiencePass?: {
    enabled: boolean;
    priceMinor?: number;
    capacity?: number;
    name?: string;
  };
}

export interface UpdateOrganizerEventBody {
  title?: string;
  description?: string | null;
  eventType?: EventType;
  city?: string;
  venue?: string | null;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  startTime?: string;
  endTime?: string | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  posterUrl?: string | null;
  tags?: string[];
  styles?: string[];
  featured?: boolean;
  audiencePass?: {
    enabled: boolean;
    priceMinor?: number;
    capacity?: number;
    name?: string;
  };
}

export interface CreateEventCategoryBody {
  name: string;
  priceMinor?: number;
  capacity: number;
  entryType?: CategoryEntryType;
  minTeamSize?: number;
  maxTeamSize?: number;
  /** @deprecated prefer min/max */
  teamSize?: number;
  posterUrl?: string | null;
  validDayIds?: string[];
  priceTiers?: Array<{
    name: string;
    priceMinor: number;
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
  }>;
}

export interface UpdateEventCategoryBody {
  name?: string;
  priceMinor?: number;
  capacity?: number;
  entryType?: CategoryEntryType;
  minTeamSize?: number;
  maxTeamSize?: number;
  /** @deprecated prefer min/max */
  teamSize?: number;
  posterUrl?: string | null;
  validDayIds?: string[];
}

export interface ReplaceCategoryPriceTiersBody {
  tiers: Array<{
    name: string;
    priceMinor: number;
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
    maxQuantity?: number | null;
  }>;
}

export interface ReplaceEventDaysBody {
  days: Array<{
    id?: string;
    label: string;
    startsAt: string;
    endsAt?: string | null;
    sortOrder?: number;
  }>;
}

export interface GenerateAudienceDayPassesBody {
  dayPriceMinor: number;
  fullPriceMinor: number;
  capacityPerDay: number;
  fullCapacity?: number;
  /** Optional early-bird window applied to generated SKUs. */
  earlyBird?: {
    priceMinorDay: number;
    priceMinorFull: number;
    endsAt: string;
  };
}

export interface RegistrationParticipantDto {
  id: string;
  userId: string | null;
  displayName: string;
  dancerName: string | null;
  isTeamCaptain: boolean;
}

export interface RegistrationDto {
  id: string;
  eventId: string;
  categoryId: string;
  priceTierId: string | null;
  entryName: string | null;
  registrationStatus: RegistrationStatus;
  paymentStatus: RegistrationPaymentStatus;
  reservationExpiresAt: string | null;
  totalAmountMinor: number;
  currency: string;
  registrationCode: string;
  /** HMAC payload for QR rendering; null until confirmed */
  ticketQrPayload: string | null;
  hasTicket: boolean;
  confirmedAt: string | null;
  createdAt: string;
  event: {
    id: string;
    slug: string;
    title: string;
    city: string;
    startTime: string;
    organizerName: string;
  };
  category: {
    id: string;
    name: string;
    entryType: CategoryEntryType;
    minTeamSize: number;
    maxTeamSize: number;
    priceMinor: number;
  };
  participants: RegistrationParticipantDto[];
}

export interface CreateRegistrationBody {
  categoryId: string;
  entryName?: string;
  participants: Array<{
    displayName: string;
    dancerName?: string;
    email?: string;
    phoneNumber?: string;
    userId?: string;
    isTeamCaptain?: boolean;
  }>;
}

export interface RegistrationListResponse {
  items: RegistrationDto[];
}

export interface OrganizerPaymentAccountDto {
  organizerId: string;
  provider: PaymentProvider;
  status: OrganizerPayoutAccountStatus;
  payoutReady: boolean;
  providerVendorId: string | null;
  displayName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  lastError: string | null;
}

export interface StartOrganizerPayoutSetupBody {
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  /** Indian PAN for Cashfree Easy Split vendor KYC. */
  pan: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankIfsc?: string;
  upiVpa?: string;
}

export interface PaymentCheckoutSessionDto {
  registrationId: string;
  provider: 'cashfree';
  orderId: string;
  paymentSessionId: string;
  amountMinor: number;
  currency: string;
}

export interface CreatePaymentCheckoutBody {
  customerPhone: string;
}

export interface OrganizerEventDetailDto extends EventDetailDto {
  organizerId: string;
}

export interface OrganizerEventListResponse {
  items: OrganizerEventDetailDto[];
}

export interface OrganizerRegistrationParticipantDto {
  id: string;
  displayName: string;
  dancerName: string | null;
  isTeamCaptain: boolean;
}

export interface OrganizerRegistrationItemDto {
  id: string;
  categoryId: string;
  categoryName: string;
  entryName: string | null;
  registrationStatus: RegistrationStatus;
  paymentStatus: RegistrationPaymentStatus;
  reservationExpiresAt: string | null;
  totalAmountMinor: number;
  currency: string;
  registrationCode: string;
  confirmedAt: string | null;
  createdAt: string;
  participants: OrganizerRegistrationParticipantDto[];
}

export interface OrganizerEventRegistrationsResponse {
  eventId: string;
  eventTitle: string;
  categories: Array<{
    id: string;
    name: string;
    capacity: number;
    reservedCount: number;
    confirmedCount: number;
    priceMinor: number;
  }>;
  items: OrganizerRegistrationItemDto[];
  totals: {
    pending: number;
    confirmed: number;
    other: number;
  };
}

export const routes = {
  discover: '/discover',
  events: '/events',
  map: '/map',
  videos: '/videos',
  organizers: '/organizers',
  organize: '/organize',
  tickets: '/tickets',
  profile: '/profile',
  login: '/login',
  saved: '/saved',
  checkIn: '/check-in',
  organizePayouts: (slug: string) => `/organize/${slug}/payouts` as const,
  organizeEventCheckIn: (slug: string, eventId: string) =>
    `/organize/${slug}/events/${eventId}/check-in` as const,
  organizeEventEntry: (slug: string, eventId: string) =>
    `/organize/${slug}/events/${eventId}/entry` as const,
  organizeEventPeople: (slug: string, eventId: string) =>
    `/organize/${slug}/events/${eventId}/people` as const,
  organizeEventMoney: (slug: string, eventId: string) =>
    `/organize/${slug}/events/${eventId}/money` as const,
  organizeEventPage: (slug: string, eventId: string) =>
    `/organize/${slug}/events/${eventId}/page` as const,
  organizeEventUpdates: (slug: string, eventId: string) =>
    `/organize/${slug}/events/${eventId}/updates` as const,
  organizeEventUpdate: (slug: string, eventId: string, updateId: string) =>
    `/organize/${slug}/events/${eventId}/updates/${updateId}` as const,
  /** Dancer event-day companion (authenticated). */
  eventLive: (slug: string) => `/events/${slug}/live` as const,
} as const;

export type CheckInChannel = 'SCAN' | 'MANUAL' | 'CODE';

export type EventUpdateKind =
  | 'GENERAL'
  | 'LINEUP'
  | 'MEDIA'
  | 'SCHEDULE'
  | 'RULES'
  | 'OTHER';

export type LineupRole =
  | 'judge'
  | 'choreographer'
  | 'instructor'
  | 'dj'
  | 'emcee'
  | 'guest'
  | 'performer'
  | 'other';

export interface CheckInDto {
  id: string;
  eventId: string;
  registrationId: string;
  checkedInAt: string;
  checkedInByUserId: string;
  channel: CheckInChannel;
  registrationCode?: string;
  entryName?: string | null;
  dancerName?: string | null;
  /**
   * Optional G1 event-day progression summary.
   * Authoritative reward *state* for this dancer at the event — not “XP inserted by this request”.
   * Omitted on older clients / when progression is not yet applicable.
   */
  progression?: EventDayProgressionDto;
}

export interface CheckInListResponse {
  items: CheckInDto[];
  totals: { checkedIn: number; confirmed: number };
}

export interface CreateCheckInBody {
  qrToken?: string;
  registrationCode?: string;
  channel?: CheckInChannel;
}

/* -------------------------------------------------------------------------- */
/* Phase G1 — event day ops / Live / progression (contracts only)             */
/* -------------------------------------------------------------------------- */

/**
 * Event-day operational status (doors / check-in / live / done).
 * Not `EventStatus`, not tournament/category/bracket competition state.
 */
export type EventOpsStatus =
  | 'scheduled'
  | 'check_in_open'
  | 'check_in_closed'
  | 'event_live'
  | 'completed';

/**
 * Effective event-day configuration.
 * GET may return defaults when no DB row exists — consumers must not assume persistence.
 * Window fields are always present; unconfigured windows are explicit `null`.
 * Timestamps are ISO-8601 instants (UTC offset), not local wall-clock strings.
 */
export interface EventDayConfigDto {
  eventId: string;
  /** IANA timezone (e.g. Asia/Kolkata) — authoritative for event-day wall-clock. */
  timezone: string;
  checkInOpensAt: string | null;
  earlyCheckInEndsAt: string | null;
  checkInClosesAt: string | null;
  opsStatus: EventOpsStatus;
}

/**
 * Partial day-config update (windows + timezone only).
 * Omitted field → leave unchanged.
 * Explicit `null` on a window field → clear that configured value.
 * Ops status is not patched here — use `SetEventOpsStatusBody`.
 */
export interface PatchEventDayConfigBody {
  timezone?: string;
  checkInOpensAt?: string | null;
  earlyCheckInEndsAt?: string | null;
  checkInClosesAt?: string | null;
}

/** Separate operational transition; backend validates legal transitions. */
export interface SetEventOpsStatusBody {
  opsStatus: EventOpsStatus;
}

/**
 * Event-scoped XP *state* for the current dancer (not per-request award flags).
 * Amounts are 0 when the reward does not exist yet.
 * Idempotent re-check-in should return the same numbers without implying a new grant.
 */
export interface EventDayProgressionDto {
  attendanceXp: number;
  earlyCheckInXp: number;
  totalEventDayXp: number;
}

/**
 * One registration-level entry for Live.
 * Team check-in is registration-scoped (whole linked roster); no participant-level states in G1.
 */
export interface EventLiveEntryDto {
  registrationId: string;
  categoryId: string;
  categoryName: string;
  entryType: CategoryEntryType;
  checkedIn: boolean;
  checkedInAt: string | null;
}

/**
 * Read-only dancer Live projection. Not a raw DB dump.
 * `myEntries` is registration-scoped — a dancer may have multiple categories at one event.
 */
export interface EventLiveDto {
  eventId: string;
  ops: {
    status: EventOpsStatus;
    timezone: string;
  };
  checkIn: {
    opensAt: string | null;
    earlyEndsAt: string | null;
    closesAt: string | null;
    /** True when any of the dancer’s eligible competitor entries is checked in. */
    attendanceVerified: boolean;
    /** True when EVENT-scoped early-check-in XP already exists for this user. */
    earlyCheckInEarned: boolean;
    myEntries: EventLiveEntryDto[];
  };
  progression: EventDayProgressionDto;
  /** Reuses `EventUpdateDto` — filtered/sliced by the Live endpoint, not a new announcement type. */
  announcements: EventUpdateDto[];
}

export interface EventUpdateDto {
  id: string;
  eventId: string;
  authorUserId: string;
  kind: EventUpdateKind;
  title: string | null;
  body: string;
  posterUrl: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventUpdateBody {
  kind?: EventUpdateKind;
  title?: string | null;
  body: string;
  posterUrl?: string | null;
}

export interface UpdateEventUpdateBody {
  kind?: EventUpdateKind;
  title?: string | null;
  body?: string;
  posterUrl?: string | null;
}

export interface EventLineupPersonDto {
  id: string;
  eventId: string;
  name: string;
  role: LineupRole;
  categoryId: string | null;
  instagram: string | null;
  photoUrl: string | null;
  blurb: string | null;
  sortOrder: number;
}

export interface UpsertEventLineupPersonBody {
  name: string;
  role: LineupRole;
  categoryId?: string | null;
  instagram?: string | null;
  photoUrl?: string | null;
  blurb?: string | null;
  sortOrder?: number;
}

export interface ReplaceEventLineupBody {
  people: UpsertEventLineupPersonBody[];
  announce?: boolean;
}

export interface UpdateProfileBody {
  dancerName?: string;
  name?: string;
  city?: string | null;
  crew?: string | null;
  instagram?: string | null;
  styles?: string[];
  bio?: string | null;
  avatarUrl?: string | null;
}
