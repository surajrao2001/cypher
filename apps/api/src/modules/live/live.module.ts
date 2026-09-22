import { Module } from '@nestjs/common';
import { EventDayModule } from '../event-day/event-day.module';
import { ProgressionModule } from '../progression/progression.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
  imports: [EventDayModule, ProgressionModule],
  controllers: [LiveController],
  providers: [LiveService],
})
export class LiveModule {}
