import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductServicesModule } from './product-services/product-services.module';
import { ProfileModule } from './profile/profile.module';
import { SavedModule } from './saved/saved.module';
import { ShortlistModule } from './shortlist/shortlist.module';
import { VendorsModule } from './vendors/vendors.module';
import { VisitorsModule } from './visitors/visitors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    VendorsModule,
    ProductServicesModule,
    ProfileModule,
    SavedModule,
    ShortlistModule,
    ConsultationsModule,
    VisitorsModule,
    AdminModule,
  ],
})
export class AppModule {}
