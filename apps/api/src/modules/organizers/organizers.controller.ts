import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../../common/auth/auth.types';
import { getAuthUserId } from '../../common/guards/supabase-jwt.guard';
import {
  CreateOrganizerDto,
  CreateOrganizerEventDto,
  EventCategoryInputDto,
  UpdateEventCategoryDto,
  UpdateOrganizerDto,
  UpdateOrganizerEventDto,
} from './organizers.dto';
import { OrganizersService } from './organizers.service';

@ApiTags('organizers')
@ApiBearerAuth()
@Controller('organizers')
export class OrganizersController {
  constructor(private readonly organizers: OrganizersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organizer (caller becomes owner, auto-verified)' })
  create(@Req() request: FastifyRequest & { auth?: AuthPrincipal }, @Body() body: CreateOrganizerDto) {
    return this.organizers.createOrganizer(getAuthUserId(request), body);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List organizers the current user belongs to' })
  mine(@Req() request: FastifyRequest & { auth?: AuthPrincipal }) {
    return this.organizers.listMine(getAuthUserId(request));
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get an organizer by slug when the user is a member' })
  bySlug(@Req() request: FastifyRequest & { auth?: AuthPrincipal }, @Param('slug') slug: string) {
    return this.organizers.getMineBySlug(getAuthUserId(request), slug);
  }

  @Patch(':organizerId')
  @ApiOperation({ summary: 'Update organizer profile (owner)' })
  update(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Body() body: UpdateOrganizerDto,
  ) {
    return this.organizers.updateOrganizer(getAuthUserId(request), organizerId, body);
  }

  @Get(':organizerId/events')
  @ApiOperation({ summary: 'List all events for an organizer (including drafts)' })
  async listEvents(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
  ) {
    const items = await this.organizers.listEvents(getAuthUserId(request), organizerId);
    return { items };
  }

  @Post(':organizerId/events')
  @ApiOperation({ summary: 'Create a draft event with optional categories' })
  createEvent(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Body() body: CreateOrganizerEventDto,
  ) {
    return this.organizers.createEvent(getAuthUserId(request), organizerId, body);
  }

  @Get(':organizerId/events/:eventId')
  getEvent(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.organizers.getEvent(getAuthUserId(request), organizerId, eventId);
  }

  @Patch(':organizerId/events/:eventId')
  updateEvent(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Body() body: UpdateOrganizerEventDto,
  ) {
    return this.organizers.updateEvent(getAuthUserId(request), organizerId, eventId, body);
  }

  @Post(':organizerId/events/:eventId/publish')
  publish(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.organizers.publishEvent(getAuthUserId(request), organizerId, eventId);
  }

  @Post(':organizerId/events/:eventId/unpublish')
  unpublish(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.organizers.unpublishEvent(getAuthUserId(request), organizerId, eventId);
  }

  @Post(':organizerId/events/:eventId/categories')
  addCategory(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Body() body: EventCategoryInputDto,
  ) {
    return this.organizers.addCategory(getAuthUserId(request), organizerId, eventId, body);
  }

  @Patch(':organizerId/events/:eventId/categories/:categoryId')
  updateCategory(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateEventCategoryDto,
  ) {
    return this.organizers.updateCategory(
      getAuthUserId(request),
      organizerId,
      eventId,
      categoryId,
      body,
    );
  }

  @Delete(':organizerId/events/:eventId/categories/:categoryId')
  @ApiOperation({ summary: 'Delete a category (blocked if occupied or last category)' })
  deleteCategory(
    @Req() request: FastifyRequest & { auth?: AuthPrincipal },
    @Param('organizerId') organizerId: string,
    @Param('eventId') eventId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.organizers.deleteCategory(
      getAuthUserId(request),
      organizerId,
      eventId,
      categoryId,
    );
  }
}
