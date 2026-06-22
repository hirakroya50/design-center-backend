import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductServicesModule } from './product-services/product-services.module';
import { ProfileModule } from './profile/profile.module';
import { SavedModule } from './saved/saved.module';
import { ShortlistModule } from './shortlist/shortlist.module';
import { VendorsModule } from './vendors/vendors.module';
import { VendorVisitsModule } from './vendor-visits/vendor-visits.module';
import { VisitorsModule } from './visitors/visitors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    NotificationsModule,
    CategoriesModule,
    VendorsModule,
    ProductServicesModule,
    ProfileModule,
    SavedModule,
    ShortlistModule,
    ConsultationsModule,
    VisitorsModule,
    VendorVisitsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
