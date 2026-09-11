import { Global, Module } from '@nestjs/common';
import { DocumentPdfService } from './document-pdf.service';

@Global()
@Module({
  providers: [DocumentPdfService],
  exports: [DocumentPdfService],
})
export class PdfModule {}
