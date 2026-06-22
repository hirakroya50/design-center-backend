import { Module } from '@nestjs/common';
import { CRM_PROVIDER } from './crm-provider';
import { CrmMock } from './crm-mock';

@Module({
  providers: [{ provide: CRM_PROVIDER, useClass: CrmMock }],
  exports: [CRM_PROVIDER],
})
export class CrmModule {}
