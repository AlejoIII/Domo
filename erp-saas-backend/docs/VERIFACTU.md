# Verifactu / SIF — diseño e implementación (esqueleto)

> Fase propia · Septiembre 2026  
> Estado: **esqueleto** — cadena + XML + cola + API de ajustes. Cliente SOAP AEAT y QR en PDF pendientes.

## Objetivo

Cumplir el Reglamento de sistemas informáticos de facturación (RD 1007/2023) y la OM HAC/1177/2024 en modalidad **VERI\*FACTU** (remisión a AEAT), por empresa.

## Qué hay en este esqueleto

| Pieza | Ubicación | Notas |
|---|---|---|
| Modelos `VerifactuRecord` / `VerifactuChainHead` + flags en `Company` | `prisma/schema.prisma` | Cadena por `companyId` |
| Migración | `prisma/migrations/20260923120000_verifactu_skeleton` | |
| Huella SHA-256 | `src/modules/verifactu/verifactu-hash.ts` | Orden de campos OM; validar con vectores AEAT |
| XML RegistroAlta / Anulación | `verifactu-xml.builder.ts` | Estructura mínima; falta validación XSD |
| Cliente AEAT | `verifactu-aeat.client.ts` | Dry-run / skipped; SOAP mTLS pendiente |
| Secretos cert | `verifactu-secrets.service.ts` | AES-256-GCM con `VERIFACTU_SECRETS_KEY` |
| Gancho emisión/anulación | `InvoicesService` | Solo si `company.verifactuEnabled` |
| Cola BullMQ `verifactu` | `QueueService` + worker | Remisión asíncrona |
| API | `GET/PATCH /api/v1/verifactu/settings`, records, retry | |

## Activación por empresa

1. Configurar en servidor: `VERIFACTU_SECRETS_KEY`, opcionalmente `VERIFACTU_SOFTWARE_NIF`.
2. `PATCH /api/v1/verifactu/settings` con `{ "enabled": true, "mode": "verifactu", "nif": "..." }`.
3. Subir certificado (PEM) cuando exista cliente SOAP real.
4. Emitir factura → se crea `VerifactuRecord` + job de cola.

Por defecto **nada cambia** para empresas con `verifactuEnabled=false`.

## Variables de entorno

Ver `docs/ENV.md` sección Verifactu.

## Pendiente (siguiente iteración)

1. Validar huella contra documento oficial AEAT de ejemplos.
2. Cliente SOAP mTLS + parseo CSV/respuesta.
3. ~~QR Verifactu en PDF (`DocumentPdfService`).~~
4. ~~Multi-IVA en líneas de factura (`InvoiceLine.taxRate`).~~
5. Declaración responsable del fabricante Domo.
6. ~~UI ajustes + estado en factura.~~
7. Entorno de preproducción AEAT end-to-end.

## Referencias

- RD 1007/2023
- OM HAC/1177/2024
- [Descripción servicio web AEAT](https://sede.agenciatributaria.gob.es/static_files/AEAT_Desarrolladores/EEDD/IVA/VERI-FACTU/Veri-Factu_Descripcion_SWeb.pdf)
- `docs/LEGAL_ES.md`
