# Facturación legal en España — Estado y alcance

> **Fase 4** · Julio 2026  
> Alcance: facturas rectificativas, PDF en servidor y series de numeración.

---

## 1. Facturas rectificativas (notas de crédito)

### Modelo de datos

Las rectificativas **son facturas** y viven en la misma tabla `invoices`, distinguidas por
`documentType`:

| Campo | Valores | Descripción |
|---|---|---|
| `documentType` | `invoice` \| `credit_note` | Tipo de documento |
| `originalInvoiceId` | UUID \| null | Factura rectificada |
| `creditReason` | texto | Motivo de la rectificación (obligatorio) |

Los importes se guardan **en positivo**. El signo negativo se aplica en la presentación, en el
asiento contable y en los informes.

### Numeración

Serie independiente configurable en **Ajustes → Documentos → Prefijo rectificativas**
(`Company.creditNotePrefix`, por defecto `REC`). Usa el mismo mecanismo transaccional de
`DocumentNumberService` con `docType = 'credit_note'`, así que no hay huecos ni colisiones con la
serie de facturas.

Formato resultante: `REC-20260726-0001`.

### Flujo funcional

```
POST /api/v1/invoices/:id/credit-note
{ "reason": "Devolución parcial", "lines": [...] }   // sin lines = rectificación total
```

Reglas aplicadas:

- Solo se rectifican facturas en estado `issued`, `partially_paid`, `paid` o `credited`
- No se puede rectificar un borrador, una factura anulada ni otra rectificativa
- El importe acumulado de rectificativas **no puede superar** el total de la factura
- La rectificativa se emite directamente como `issued` y **no admite cobros**
  (una devolución de dinero se registra en Tesorería)
- Una vez emitida no se puede editar, duplicar, eliminar ni anular
- Una factura con rectificativas no se puede anular ni eliminar

### Efecto en saldos y estados

`balanceDue = total − cobrado − rectificado`

Nuevo estado derivado **`credited`** ("Rectificada"): se aplica cuando el importe rectificado cubre
el total de la factura. Estados existentes:

| Estado | Condición |
|---|---|
| `credited` | rectificado ≥ total |
| `paid` | cobrado + rectificado ≥ total |
| `partially_paid` | cobrado > 0 |
| `issued` | sin cobros ni rectificaciones |

### Contabilidad

`AccountingPostingService.postCreditNoteIssue` genera el asiento **inverso** al de emisión:

| Cuenta | Debe | Haber |
|---|---|---|
| 700 Ventas | base | |
| 477 IVA repercutido | cuota | |
| 430 Clientes | | total |

Es idempotente vía `referenceType = 'credit_note_issue'` + `referenceId`.

### Informes

El informe de finanzas minora facturación e IVA repercutido con las rectificativas del periodo y
expone la métrica `credited`. El acumulado por cliente también resta las rectificativas.

### Marco normativo

Art. 15 del Reglamento de facturación (**RD 1619/2012**): la factura rectificativa debe indicar su
condición, el motivo y la referencia a la factura rectificada. El PDF incluye los tres datos.

---

## 2. PDF generado en servidor

Antes de la Fase 4 el PDF se producía con `window.print()` del navegador. Ahora existe generación
real en servidor con **pdfkit** (sin Chromium, funciona en Docker sin dependencias del sistema).

| Endpoint | Documento |
|---|---|
| `GET /api/v1/invoices/:id/pdf` | Factura y rectificativa |
| `GET /api/v1/quotes/:id/pdf` | Presupuesto |

Características:

- Datos completos del emisor y del receptor (NIF, dirección), que la vista de impresión del
  navegador no tenía
- Desglose de base, IVA y total; en facturas también cobrado y pendiente
- Motivo de rectificación y referencia a la factura original en rectificativas
- Marca de agua automática en plan Free (`pdfWatermark`)
- Paginación automática cuando hay muchas líneas

La vista `/:id/print` del navegador se mantiene para impresión directa.

---

## 3. Pendiente (fuera del alcance de Fase 4)

| Requisito | Estado | Nota |
|---|---|---|
| **Verifactu** | Esqueleto (no certificación) | Cadena + XML + cola + API; ver `docs/VERIFACTU.md`. Falta SOAP AEAT, QR en PDF, multi-IVA y declaración responsable |
| **Facturae** (XML) | No implementado | Necesario para facturación a administraciones públicas |
| **SII** | No implementado | Solo aplica a grandes empresas y REDEME |
| **Desglose multi-IVA** | No implementado | Hoy el IVA es único por documento (`taxRate` en cabecera) |
| **Facturas de proveedor (AP)** | No implementado | Existen órdenes de compra, falta conciliación contable |

> Verifactu es el bloqueante real para vender el producto como software de facturación en España.
> El esqueleto actual no habilita el cumplimiento por sí solo: la remisión AEAT está en dry-run
> y debe abordarse hasta certificación en preproducción.
