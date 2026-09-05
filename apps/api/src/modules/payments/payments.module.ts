import { Module } from '@nestjs/common';

import { QueuesModule } from '../../common/queues/queues.module';
import { TicketsModule } from '../tickets/tickets.module';
import { CashfreeClient } from './cashfree.client';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TicketsModule, QueuesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, CashfreeClient],
  exports: [PaymentsService, CashfreeClient],
})
export class PaymentsModule {}
