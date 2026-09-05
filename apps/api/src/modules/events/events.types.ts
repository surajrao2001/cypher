export type EventCardDto = {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  city: string;
  venue: string | null;
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
  capacity: number;
  reservedCount: number;
  confirmedCount: number;
  entryType: string;
  minTeamSize: number;
  maxTeamSize: number;
  teamSize: number;
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
  mediaLinks: EventMediaLinkDto[];
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
