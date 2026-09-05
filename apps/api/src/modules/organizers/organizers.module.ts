import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { OrganizersController } from './organizers.controller';
import { OrganizersService } from './organizers.service';

@Module({
  imports: [PaymentsModule],
  controllers: [OrganizersController],
  providers: [OrganizersService],
  exports: [OrganizersService],
})
export class OrganizersModule {}
