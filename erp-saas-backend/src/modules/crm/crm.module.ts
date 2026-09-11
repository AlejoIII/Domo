import { Module } from '@nestjs/common';

import { CrmController } from './crm.controller';

import { CrmConfigController } from './crm-config.controller';

import { CrmStagesService } from './crm-stages.service';

import { CrmLeadsService } from './crm-leads.service';

import { CrmOpportunitiesService } from './crm-opportunities.service';

import { CrmActivitiesService } from './crm-activities.service';

import { CrmIncidentsService } from './crm-incidents.service';

import { CrmCommunicationsService } from './crm-communications.service';

import { AcreliaSmsService } from './acrelia-sms.service';

import { CrmConfigService } from './crm-config.service';

import { CrmCatalogResolverService } from './crm-catalog-resolver.service';

import { QuotesModule } from '../quotes/quotes.module';

import { MailModule } from '../../common/mail/mail.module';



@Module({

  imports: [QuotesModule, MailModule],

  controllers: [CrmController, CrmConfigController],

  providers: [

    CrmStagesService,

    CrmLeadsService,

    CrmOpportunitiesService,

    CrmActivitiesService,

    CrmIncidentsService,

    CrmCommunicationsService,

    AcreliaSmsService,

    CrmConfigService,

    CrmCatalogResolverService,

  ],

})

export class CrmModule {}

