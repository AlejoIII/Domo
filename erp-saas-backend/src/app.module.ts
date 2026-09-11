import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './common/redis/redis.module';
import { RedisService } from './common/redis/redis.service';
import { RedisThrottlerStorage } from './common/redis/redis-throttler.storage';
import { MetricsModule } from './modules/metrics/metrics.module';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './common/config/config.module';
import { buildPinoHttpOptions } from './common/logging/pino.config';
import { DatabaseModule } from './common/database/database.module';
import { GuardsModule } from './common/guards/guards.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProductsModule } from './modules/products/products.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './common/audit/audit.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './common/uploads/uploads.module';
import { StorageModule } from './common/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './common/inventory/inventory.module';
import { CustomFieldsModule } from './common/custom-fields/custom-fields.module';
import { DocumentsModule } from './common/documents/documents.module';
import { PdfModule } from './common/pdf/pdf.module';
import { BillingModule } from './modules/billing/billing.module';
import { CacheModule } from './common/cache/cache.module';
import { QueueModule } from './common/queue/queue.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { PlatformModule } from './modules/platform/platform.module';
import { BetaModule } from './modules/beta/beta.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { TreasuryModule } from './modules/treasury/treasury.module';
import { CrmModule } from './modules/crm/crm.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    LoggerModule.forRoot({
      pinoHttp: buildPinoHttpOptions(),
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        // Only one global bucket. Auth routes tighten via @Throttle({ default: ... }).
        // A second named "auth" throttler would also apply to EVERY route (10/min) and
        // @SkipThrottle() only skips "default", which caused false 429s on platform UI.
        throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    CacheModule,
    QueueModule.forRoot(),
    BillingModule,
    BetaModule,
    FeedbackModule,
    GuardsModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    ProductsModule,
    EmployeesModule,
    SuppliersModule,
    CategoriesModule,
    WarehousesModule,
    OrdersModule,
    InvoicesModule,
    QuotesModule,
    PurchaseOrdersModule,
    DashboardModule,
    ReportsModule,
    SettingsModule,
    PrivacyModule,
    RolesModule,
    AuditModule,
    AttachmentsModule,
    NotificationsModule,
    UploadsModule,
    StorageModule,
    HealthModule,
    MetricsModule,
    InventoryModule,
    CustomFieldsModule,
    DocumentsModule,
    PdfModule,
    IntegrationsModule,
    PlatformModule,
    AccountingModule,
    TreasuryModule,
    CrmModule,
    ProjectsModule,
    ManufacturingModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
