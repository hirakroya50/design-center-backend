import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CRM_PROVIDER } from './crm-provider';
import { CrmHubspot } from './crm-hubspot';
import { CrmMock } from './crm-mock';

const CrmProviderFactory = {
  provide: CRM_PROVIDER,
  useFactory: (config: ConfigService) => {
    const key = config.get<string>('HUBSPOT_API_KEY');
    return key ? new CrmHubspot(key) : new CrmMock();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [CrmProviderFactory],
  exports: [CRM_PROVIDER],
})
export class CrmModule {}
