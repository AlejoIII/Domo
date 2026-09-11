import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TimeEntriesService } from './time-entries.service';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, TimeEntriesService],
})
export class ProjectsModule {}
