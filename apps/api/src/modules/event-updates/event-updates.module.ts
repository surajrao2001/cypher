import { Module } from '@nestjs/common';
import { EventUpdatesController } from './event-updates.controller';
import { EventUpdatesService } from './event-updates.service';

@Module({
  controllers: [EventUpdatesController],
  providers: [EventUpdatesService],
})
export class EventUpdatesModule {}
