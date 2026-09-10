import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { CheckInController } from './check-in.controller';
import { CheckInService } from './check-in.service';

@Module({
  imports: [TicketsModule],
  controllers: [CheckInController],
  providers: [CheckInService],
})
export class CheckInModule {}
