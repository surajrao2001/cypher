import { Module } from '@nestjs/common';
import { EventDayModule } from '../event-day/event-day.module';
import { ProgressionModule } from '../progression/progression.module';
import { TicketsModule } from '../tickets/tickets.module';
import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

@Module({
  imports: [TicketsModule, EventDayModule, ProgressionModule],
  controllers: [CheckInController],
  providers: [CheckInService],
})
export class CheckInModule {}
