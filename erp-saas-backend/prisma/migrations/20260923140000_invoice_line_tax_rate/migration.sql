-- Multi-IVA por línea (Verifactu desglose) + taxRate en invoice_lines

ALTER TABLE "invoice_lines" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2);
