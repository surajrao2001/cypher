import { Module } from '@nestjs/common';
import { OrganizersService } from './organizers.service';

@Module({
  providers: [OrganizersService],
  exports: [OrganizersService],
})
export class OrganizersModule {}
