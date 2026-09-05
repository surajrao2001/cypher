import { join } from 'node:path';
import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { QueuesModule } from './common/queues/queues.module';
import { AuthModule } from './common/auth/auth.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { validateEnv } from './config/env.validation';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrganizersModule } from './modules/organizers/organizers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '../../.env')],
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    QueuesModule,
    IdentityModule,
    AuthModule,
    HealthModule,
    UsersModule,
    OrganizersModule,
    EventsModule,
    RegistrationsModule,
    PaymentsModule,
    TicketsModule,
    MediaModule,
    NotificationsModule,
    AdminModule,
    AuditModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*splat');
  }
}
