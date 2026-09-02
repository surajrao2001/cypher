import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';
import { EventDiscoveryQueryDto } from './events.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Public()
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Public discovery list' })
  @ApiOkResponse({ description: 'Published events with live category counts' })
  list(@Query() query: EventDiscoveryQueryDto) {
    return this.events.list(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Public event detail' })
  @ApiOkResponse({ description: 'Event, organizer, and category capacity' })
  detail(@Param('slug') slug: string) {
    return this.events.getBySlugOrId(slug);
  }
}
