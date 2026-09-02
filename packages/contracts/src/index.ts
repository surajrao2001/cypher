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

export interface EventCardDto {
  id: string;
  slug: string;
  title: string;
  city: string;
  venue: string | null;
  startTime: string;
  posterUrl: string | null;
  status: EventStatus;
  spotsConfirmed: number;
  spotsCapacity: number;
}

export const routes = {
  discover: '/discover',
  events: '/events',
  map: '/map',
  videos: '/videos',
  organizers: '/organizers',
  tickets: '/tickets',
  profile: '/profile',
  saved: '/saved',
} as const;
