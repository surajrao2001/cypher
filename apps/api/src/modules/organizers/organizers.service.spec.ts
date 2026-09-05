import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventStatus, OrganizerMemberRole, OrganizerVerificationStatus } from '@prisma/client';
import { OrganizersService } from './organizers.service';

describe('OrganizersService', () => {
  const prisma = {
    organizer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    organizerMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventCategory: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    registration: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    mediaLink: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const identity = { ensureProfile: jest.fn() };
  const payments = { organizerCanAcceptPaid: jest.fn().mockResolvedValue(false) };
  const service = new OrganizersService(prisma as never, identity as never, payments as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an auto-verified organizer and owner membership', async () => {
    identity.ensureProfile.mockResolvedValue({ id: 'user-1' });
    prisma.organizer.findUnique.mockResolvedValue(null);
    prisma.organizer.create.mockResolvedValue({
      id: 'org-1',
      orgName: 'Mumbai City Breakers',
      slug: 'mumbai-city-breakers',
      city: 'Mumbai',
      bio: null,
      instagram: null,
      verificationStatus: OrganizerVerificationStatus.verified,
      createdAt: new Date('2026-09-03T00:00:00.000Z'),
    });

    const result = await service.createOrganizer('user-1', {
      orgName: 'Mumbai City Breakers',
      city: 'Mumbai',
    });

    expect(result).toMatchObject({
      id: 'org-1',
      slug: 'mumbai-city-breakers',
      verificationStatus: 'verified',
      role: 'owner',
    });
    expect(prisma.organizer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: OrganizerVerificationStatus.verified,
          members: {
            create: { userId: 'user-1', role: OrganizerMemberRole.owner },
          },
        }),
      }),
    );
  });

  it('publishes a draft when the organizer is verified and has categories', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({
      role: OrganizerMemberRole.owner,
    });
    prisma.organizer.findUnique.mockResolvedValue({
      id: 'org-1',
      verificationStatus: OrganizerVerificationStatus.verified,
    });
    prisma.event.findFirst.mockResolvedValue({
      id: 'evt-1',
      organizerId: 'org-1',
      status: EventStatus.draft,
      categories: [{ id: 'cat-1' }],
    });
    prisma.event.update.mockResolvedValue({
      id: 'evt-1',
      organizerId: 'org-1',
      slug: 'andheri-cypher',
      title: 'Andheri Cypher',
      description: null,
      eventType: 'battle',
      city: 'Mumbai',
      venue: null,
      startTime: new Date('2026-10-01T12:00:00.000Z'),
      endTime: null,
      registrationOpensAt: null,
      registrationClosesAt: null,
      posterUrl: null,
      tags: [],
      featured: false,
      status: EventStatus.published,
      organizer: { orgName: 'MCB', slug: 'mcb' },
      danceStyles: [{ style: { id: 'style-1', slug: 'breaking', name: 'Breaking' } }],
      mediaLinks: [],
      categories: [
        {
          id: 'cat-1',
          name: '1v1',
          priceMinor: 0,
          capacity: 32,
          reservedCount: 0,
          confirmedCount: 0,
          teamSize: 1,
          entryType: 'solo',
          minTeamSize: 1,
          maxTeamSize: 1,
        },
      ],
    });

    const published = await service.publishEvent('user-1', 'org-1', 'evt-1');
    expect(published.status).toBe('published');
  });

  it('rejects publish for non-members', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue(null);
    await expect(service.publishEvent('user-1', 'org-1', 'evt-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('404s when updating an unknown organizer event', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({ role: OrganizerMemberRole.owner });
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(
      service.updateEvent('user-1', 'org-1', 'missing', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('surfaces slug conflicts after allocation retries', async () => {
    identity.ensureProfile.mockResolvedValue({ id: 'user-1' });
    prisma.organizer.findUnique.mockResolvedValue({ id: 'taken' });
    await expect(
      service.createOrganizer('user-1', { orgName: 'Taken', slug: 'taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes a category when more than one exists and none are occupied', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({ role: OrganizerMemberRole.owner });
    prisma.registration.count.mockResolvedValue(0);
    prisma.eventCategory.delete.mockResolvedValue({});
    prisma.event.findFirst
      .mockResolvedValueOnce({
        id: 'evt-1',
        organizerId: 'org-1',
        status: EventStatus.draft,
        categories: [
          { id: 'cat-1', reservedCount: 0, confirmedCount: 0 },
          { id: 'cat-2', reservedCount: 0, confirmedCount: 0 },
        ],
      })
      .mockResolvedValueOnce({
        id: 'evt-1',
        organizerId: 'org-1',
        slug: 'andheri-cypher',
        title: 'Andheri Cypher',
        description: null,
        eventType: 'battle',
        city: 'Mumbai',
        venue: null,
        startTime: new Date('2026-10-01T12:00:00.000Z'),
        endTime: null,
        registrationOpensAt: null,
        registrationClosesAt: null,
        posterUrl: null,
        tags: [],
        featured: false,
        status: EventStatus.draft,
        organizer: { orgName: 'MCB', slug: 'mcb' },
        danceStyles: [{ style: { id: 'style-1', slug: 'breaking', name: 'Breaking' } }],
        mediaLinks: [],
        categories: [
          {
            id: 'cat-2',
            name: '2v2',
            priceMinor: 0,
            capacity: 16,
            reservedCount: 0,
            confirmedCount: 0,
            teamSize: 2,
            entryType: 'team',
            minTeamSize: 2,
            maxTeamSize: 2,
          },
        ],
      });

    const result = await service.deleteCategory('user-1', 'org-1', 'evt-1', 'cat-1');
    expect(prisma.eventCategory.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    expect(result.categories).toHaveLength(1);
  });

  it('lists event registrations with category capacity and totals', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({ role: OrganizerMemberRole.owner });
    prisma.event.findFirst.mockResolvedValue({
      id: 'evt-1',
      title: 'Andheri Cypher',
      categories: [
        {
          id: 'cat-1',
          name: '1v1',
          capacity: 32,
          reservedCount: 1,
          confirmedCount: 1,
          priceMinor: 0,
        },
      ],
    });
    prisma.registration.findMany.mockResolvedValue([
      {
        id: 'reg-1',
        categoryId: 'cat-1',
        category: { name: '1v1' },
        entryName: null,
        registrationStatus: 'confirmed',
        paymentStatus: 'not_required',
        reservationExpiresAt: null,
        totalAmountMinor: 0,
        currency: 'INR',
        registrationCode: 'NC-ABC123',
        confirmedAt: new Date('2026-09-04T10:00:00.000Z'),
        createdAt: new Date('2026-09-04T09:00:00.000Z'),
        participants: [
          {
            id: 'p-1',
            displayName: 'Riya',
            dancerName: 'Riya',
            isTeamCaptain: true,
          },
        ],
      },
      {
        id: 'reg-2',
        categoryId: 'cat-1',
        category: { name: '1v1' },
        entryName: 'Crew A',
        registrationStatus: 'pending_payment',
        paymentStatus: 'pending',
        reservationExpiresAt: new Date('2026-09-04T12:00:00.000Z'),
        totalAmountMinor: 0,
        currency: 'INR',
        registrationCode: 'NC-DEF456',
        confirmedAt: null,
        createdAt: new Date('2026-09-04T11:00:00.000Z'),
        participants: [
          {
            id: 'p-2',
            displayName: 'Asha',
            dancerName: null,
            isTeamCaptain: true,
          },
        ],
      },
    ]);

    const result = await service.listEventRegistrations('user-1', 'org-1', 'evt-1');

    expect(result.eventTitle).toBe('Andheri Cypher');
    expect(result.categories).toHaveLength(1);
    expect(result.items).toHaveLength(2);
    expect(result.totals).toEqual({ pending: 1, confirmed: 1, other: 0 });
    expect(result.items[0]?.registrationCode).toBe('NC-ABC123');
  });

  it('404s when listing registrations for an unknown event', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({ role: OrganizerMemberRole.owner });
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(
      service.listEventRegistrations('user-1', 'org-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds a media link and infers youtube kind from the URL', async () => {
    prisma.organizerMember.findUnique.mockResolvedValue({ role: OrganizerMemberRole.owner });
    prisma.event.findFirst
      .mockResolvedValueOnce({
        id: 'evt-1',
        organizerId: 'org-1',
        categories: [{ id: 'cat-1' }],
      })
      .mockResolvedValueOnce({
        id: 'evt-1',
        organizerId: 'org-1',
        slug: 'andheri-cypher',
        title: 'Andheri Cypher',
        description: null,
        eventType: 'battle',
        city: 'Mumbai',
        venue: null,
        startTime: new Date('2026-10-01T12:00:00.000Z'),
        endTime: null,
        registrationOpensAt: null,
        registrationClosesAt: null,
        posterUrl: null,
        tags: [],
        featured: false,
        status: EventStatus.draft,
        organizer: { orgName: 'MCB', slug: 'mcb' },
        danceStyles: [],
        mediaLinks: [
          {
            id: 'ml-1',
            eventId: 'evt-1',
            categoryId: null,
            battleId: null,
            title: 'Finals',
            url: 'https://www.youtube.com/watch?v=abc',
            kind: 'youtube',
            sortOrder: 0,
            createdAt: new Date('2026-09-05T12:00:00.000Z'),
          },
        ],
        categories: [
          {
            id: 'cat-1',
            name: '1v1',
            priceMinor: 0,
            capacity: 32,
            reservedCount: 0,
            confirmedCount: 0,
            teamSize: 1,
            entryType: 'solo',
            minTeamSize: 1,
            maxTeamSize: 1,
          },
        ],
      });
    prisma.mediaLink.create.mockResolvedValue({});

    const result = await service.addMediaLink('user-1', 'org-1', 'evt-1', {
      title: 'Finals',
      url: 'https://www.youtube.com/watch?v=abc',
    });

    expect(prisma.mediaLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Finals',
          kind: 'youtube',
          url: 'https://www.youtube.com/watch?v=abc',
        }),
      }),
    );
    expect(result.mediaLinks).toHaveLength(1);
    expect(result.mediaLinks[0]?.kind).toBe('youtube');
  });
});
