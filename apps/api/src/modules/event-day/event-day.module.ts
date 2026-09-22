import { Module } from '@nestjs/common';
import { EventDayController } from './event-day.controller';
import { EventDayService } from './event-day.service';

@Module({
  controllers: [EventDayController],
  providers: [EventDayService],
  exports: [EventDayService],
})
export class EventDayModule {}
