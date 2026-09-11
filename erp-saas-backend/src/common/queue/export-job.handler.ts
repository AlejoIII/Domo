import { Injectable } from '@nestjs/common';
import { ReportsService } from '../../modules/reports/reports.service';
import {
  buildFinanceCsv,
  buildFinanceXlsx,
  buildSalesCsv,
  buildSalesXlsx,
} from '../../modules/reports/reports-export.util';
import { ExportStoreService } from './export-store.service';
import type { ExportJobPayload } from './queue.types';

@Injectable()
export class ExportJobHandler {
  constructor(
    private readonly reports: ReportsService,
    private readonly store: ExportStoreService,
  ) {}

  async handle(payload: ExportJobPayload): Promise<void> {
    await this.store.markProcessing(payload.jobId);
    const stamp = new Date().toISOString().slice(0, 10);

    try {
      const ctx = await this.reports.getExportContext(
        payload.companyId,
        payload.query.from,
        payload.query.to,
      );

      if (payload.reportType === 'sales') {
        const data = await this.reports.sales(payload.companyId, payload.query);
        if (payload.format === 'xlsx') {
          const buffer = await buildSalesXlsx(data, ctx);
          const fileName = `ventas_${stamp}.xlsx`;
          await this.store.saveFile(payload.companyId, payload.jobId, 'xlsx', Buffer.from(buffer));
          await this.store.markCompleted(
            payload.jobId,
            fileName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          );
          return;
        }
        const csv = buildSalesCsv(data, ctx);
        const fileName = `ventas_${stamp}.csv`;
        await this.store.saveFile(payload.companyId, payload.jobId, 'csv', csv);
        await this.store.markCompleted(payload.jobId, fileName, 'text/csv; charset=utf-8');
        return;
      }

      const data = await this.reports.finance(payload.companyId, payload.query);
      if (payload.format === 'xlsx') {
        const buffer = await buildFinanceXlsx(data, ctx);
        const fileName = `finanzas_${stamp}.xlsx`;
        await this.store.saveFile(payload.companyId, payload.jobId, 'xlsx', Buffer.from(buffer));
        await this.store.markCompleted(
          payload.jobId,
          fileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        return;
      }
      const csv = buildFinanceCsv(data, ctx);
      const fileName = `finanzas_${stamp}.csv`;
      await this.store.saveFile(payload.companyId, payload.jobId, 'csv', csv);
      await this.store.markCompleted(payload.jobId, fileName, 'text/csv; charset=utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      await this.store.markFailed(payload.jobId, message);
      throw err;
    }
  }
}
