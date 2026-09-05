import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { TicketsModule } from '../tickets/tickets.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [IdentityModule, TicketsModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
