export type PlatformRole = 'user' | 'admin';
export type ProfileStatus = 'active' | 'suspended' | 'deleted';
export type OrganizerVerificationStatus = 'pending' | 'verified' | 'rejected';
export type OrganizerMemberRole = 'owner' | 'manager' | 'editor';
export type EventStatus =
  | 'draft'
  | 'published'
  | 'registration_closed'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type RegistrationStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'waitlist'
  | 'expired'
  | 'cancelled'
  | 'refunded';

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
  eventType: string;
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

export const routes = {
  discover: '/discover',
  events: '/events',
  map: '/map',
  videos: '/videos',
  organizers: '/organizers',
  tickets: '/tickets',
  profile: '/profile',
  login: '/login',
  saved: '/saved',
} as const;
