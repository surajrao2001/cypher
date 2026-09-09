export type CategoryPriceTierDto = {
  id: string;
  name: string;
  priceMinor: number;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  maxQuantity: number | null;
};

export type EventDayDto = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string | null;
  sortOrder: number;
};

export type EventCardDto = {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  city: string;
  venue: string | null;
  venueLatitude: number | null;
  venueLongitude: number | null;
  startTime: string;
  posterUrl: string | null;
  status: string;
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
};

export type EventCategoryPublicDto = {
  id: string;
  name: string;
  priceMinor: number;
  currentPriceMinor: number;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  entryType: string;
  minTeamSize: number;
  maxTeamSize: number;
  teamSize: number;
  priceTiers: CategoryPriceTierDto[];
  validDayIds: string[];
  activeTierName: string | null;
  nextTier: CategoryPriceTierDto | null;
};

export type EventMediaLinkDto = {
  id: string;
  eventId: string;
  categoryId: string | null;
  battleId: string | null;
  title: string;
  url: string;
  kind: string;
  sortOrder: number;
  createdAt: string;
};

export type EventDetailDto = EventCardDto & {
  description: string | null;
  endTime: string | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  categories: EventCategoryPublicDto[];
  competeCategories: EventCategoryPublicDto[];
  viewerCategories: EventCategoryPublicDto[];
  audience: EventAudiencePassDto;
  days: EventDayDto[];
  mediaLinks: EventMediaLinkDto[];
};

export type EventAudiencePassDto = {
  enabled: boolean;
  categoryId: string | null;
  name: string;
  priceMinor: number;
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  spotsLeft: number;
};

export type EventListResponse = {
  items: EventCardDto[];
  featured: EventCardDto[];
  nextUp: EventCardDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type OrganizerEventDetailDto = EventDetailDto & {
  organizerId: string;
};
