export type PlatformRole = 'user' | 'admin';
export type ProfileStatus = 'active' | 'suspended' | 'deleted';
export type OrganizerVerificationStatus = 'pending' | 'verified' | 'rejected';
export type OrganizerMemberRole = 'owner' | 'manager' | 'editor';
export type CategoryEntryType = 'solo' | 'team';
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
export type PaymentProvider = 'razorpay';
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
  startTime: string;
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
  priceMinor: number;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  entryType: CategoryEntryType;
  minTeamSize: number;
  maxTeamSize: number;
  /** @deprecated use maxTeamSize */
  teamSize: number;
}

export interface EventDetailDto extends EventCardDto {
  description: string | null;
  endTime: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  categories: EventCategoryPublicDto[];
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
  startTime: string;
  endTime?: string;
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
  }>;
}

export interface UpdateOrganizerEventBody {
  title?: string;
  description?: string | null;
  eventType?: EventType;
  city?: string;
  venue?: string | null;
  startTime?: string;
  endTime?: string | null;
  posterUrl?: string | null;
  tags?: string[];
  styles?: string[];
  featured?: boolean;
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
} as const;
