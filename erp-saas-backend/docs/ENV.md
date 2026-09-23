# Variables de entorno — Domo ERP Backend

Referencia de todas las variables soportadas. Copia `.env.example` como base.

## Core

| Variable | Obligatoria | Default | Descripción |
|----------|-------------|---------|-------------|
| `NODE_ENV` | No | `development` | `development`, `test`, `production` |
| `PORT` | No | `3000` | Puerto HTTP de la API |
| `DATABASE_URL` | **Sí** | — | PostgreSQL. Con PgBouncer añade `?pgbouncer=true&connection_limit=10` |
| `DATABASE_DIRECT_URL` | **Sí** | igual que `DATABASE_URL` | Conexión directa para `prisma migrate` (sin pooler) |
| `DATABASE_READ_URL` | No | — | Réplica de lectura; dashboard/informes la usan si está definida |

## Auth / JWT

| Variable | Obligatoria prod | Default | Descripción |
|----------|------------------|---------|-------------|
| `JWT_SECRET` | **Sí** | — | Secreto access token (min. 32 chars aleatorios) |
| `JWT_EXPIRES_IN` | No | `15m` | Caducidad access token |
| `JWT_REFRESH_SECRET` | **Sí** | — | Secreto refresh token |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Caducidad refresh token |

## CORS y URLs

| Variable | Obligatoria prod | Default | Descripción |
|----------|------------------|---------|-------------|
| `CORS_ORIGIN` | **Sí** | `http://localhost:5173` | Origen(es) permitidos. En producción **no** usar `*`. Lista separada por comas. |
| `FRONTEND_URL` | Recomendada | `http://localhost:5173` | URL pública del frontend (emails, invitaciones) |
| `TRUST_PROXY` | Recomendada prod | `1` en prod | Confiar en `X-Forwarded-*` (Cloudflare / LB). `false` para desactivar. |
| `SWAGGER_ENABLED` | No | off en prod | `true` para exponer `/docs` también en producción |
| `METRICS_TOKEN` | Recomendada prod | — | Bearer/query token para `GET /api/metrics`. Sin token en prod → 404 |

## Email

| Variable | Default | Descripción |
|----------|---------|-------------|
| `EMAIL_PROVIDER` | `console` | `console` \| `smtp` \| `resend` |
| `EMAIL_VERIFICATION_ENABLED` | `false` | Verificación por código al registrarse |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | — | Solo si `EMAIL_PROVIDER=smtp` |
| `RESEND_API_KEY`, `RESEND_FROM` | — | Solo si `EMAIL_PROVIDER=resend` |

## Redis y rate limits

| Variable | Default | Descripción |
|----------|---------|-------------|
| `REDIS_URL` | — | Redis para rate limit, cache y colas BullMQ. Sin Redis → jobs inline en la API |
| `CACHE_DEFAULT_TTL_SEC` | `60` | TTL por defecto del cache de aplicación |
| `CACHE_DASHBOARD_TTL_SEC` | `60` | TTL cache del dashboard por empresa |
| `CACHE_REPORTS_TTL_SEC` | `120` | TTL cache de informes de ventas |
| `CACHE_SETTINGS_TTL_SEC` | `300` | TTL cache de settings, roles y layouts |
| `CACHE_PERMISSIONS_TTL_SEC` | `300` | TTL cache de permisos por usuario (JWT) |
| `CACHE_KEY_PREFIX` | `domo:cache:` | Prefijo de claves Redis para cache |
| `API_RATE_LIMIT_TTL_SEC` | `60` | Ventana rate limit por API key |
| `API_RATE_LIMIT_MAX` | `120` | Máx. peticiones por ventana y API key |

Throttling HTTP global (NestJS): 100 req/min por IP; auth: 5–20 req/min según endpoint.

**Cola BullMQ** (webhooks, auditoría, emails): requiere `REDIS_URL` y un proceso worker (`npm run start:worker:dev` o servicio `worker` en Docker). Sin worker, los jobs se encolan pero no se procesan. Sin Redis, la API procesa jobs inline en segundo plano (solo desarrollo).

| Script | Descripción |
|--------|-------------|
| `npm run start:worker:dev` | Worker BullMQ en modo watch (+ cron de purga de auditoría) |
| `npm run start:worker:prod` | Worker en producción (`node dist/worker.js`) |
| `npm run audit:purge` | Purga manual de particiones de auditoría / webhooks |

**Retención de auditoría** (particiones mensuales `audit_logs` y `webhook_deliveries`):

| Variable | Default | Descripción |
|----------|---------|-------------|
| `AUDIT_RETENTION_MONTHS` | `12` | Meses a conservar; el worker elimina particiones anteriores cada día a las 03:15 UTC |
| `AUDIT_RETENTION_DRY_RUN` | `false` | Si `true`, solo registra qué se borraría (`npm run audit:purge`) |

**Métricas y alertas:** `GET /api/metrics` expone uptime, memoria, cache, colas y alertas. Umbrales configurables:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `QUEUE_FAILED_ALERT_THRESHOLD` | `1` | Alerta si jobs fallidos ≥ umbral |
| `QUEUE_WAITING_ALERT_THRESHOLD` | `500` | Alerta si backlog de cola ≥ umbral |

Throttling HTTP global usa **Redis** cuando `REDIS_URL` está disponible (multi-instancia); fallback en memoria en desarrollo.

## Storage

| Variable | Default | Descripción |
|----------|---------|-------------|
| `STORAGE_DRIVER` | `local` | `local` \| `s3` |
| `MAX_UPLOAD_MB` | `10` | Tamaño máximo adjuntos |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | — | Obligatorios con `STORAGE_DRIVER=s3` |
| `S3_ENDPOINT`, `S3_PREFIX` | — | MinIO / R2 / prefijo de claves |

## Stripe (billing)

| Variable | Descripción |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Clave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto firma webhooks |
| `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` | Price IDs del dashboard |

## Plataforma

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PLATFORM_ADMIN_ENABLED` | — | `true` para habilitar panel super-admin en seed |

## Observabilidad (opcional)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `SENTRY_DSN` | — | Errores en API y worker (activo si está definido) |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Muestreo de trazas Sentry |
| `BULL_BOARD_ENABLED` | — | `true` para UI de colas en `/admin/queues` |
| `BULL_BOARD_TOKEN` | — | Token Bearer o query `?token=` para Bull Board |
| `LOG_LEVEL` | `info` | Nivel pino: `info`, `debug`, `warn`, `error` |

## Verifactu / SIF (esqueleto)

Ver detalle en `docs/VERIFACTU.md`. Por defecto **desactivado** por empresa (`verifactuEnabled=false`).

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VERIFACTU_SECRETS_KEY` | — | Clave ≥32 chars para cifrar certificados en reposo |
| `VERIFACTU_SOFTWARE_NIF` | `B00000000` | NIF del productor del software (declaración responsable) |
| `VERIFACTU_SOFTWARE_VERSION` | `1.0.0` | Versión SIF enviada en registros |
| `VERIFACTU_INSTALLATION_ID` | `1` | Nº instalación del SIF |
| `VERIFACTU_AEAT_ENABLED` | `false` | Si `true`, el worker intenta remitir |
| `VERIFACTU_AEAT_DRY_RUN` | `true` | No llama a la red; marca registros como `dry_run` |
| `VERIFACTU_AEAT_ENV` | `pre` | `pre` \| `prod` |
| `VERIFACTU_AEAT_URL_PRE` / `_PROD` | URLs AEAT | Override del endpoint SOAP |
| `VERIFACTU_QR_BASE_URL` | URL AEAT ValidarQR | Base del QR (PDF pendiente) |

Health checks:

- `GET /api/health` — liveness (load balancer)
- `GET /api/status` — readiness (DB, Redis, storage, email, colas)
- `GET /api/metrics` — uptime, memoria, cache, colas, alertas
- `GET /api/version` — versión API

**Exports async:** `GET /api/v1/reports/sales/export` y `/finance/export` devuelven `202` con `jobId`. Consultar `GET /api/v1/reports/exports/:jobId` y descargar en `/download`.

Los logs incluyen `requestId` (header `X-Request-Id`) y `companyId` cuando hay sesión JWT o API key.

## Frontend (repo `erp-saas-frontend`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base API (vacío = proxy Vite `/api`) |
| `VITE_SENTRY_DSN` | DSN Sentry frontend (opcional) |

## Seguridad en producción

- Nunca commitear `.env` ni secretos JWT/Stripe/S3.
- Usar GitHub Secrets / vault del proveedor cloud.
- Rotar `JWT_SECRET` y `JWT_REFRESH_SECRET` según `docs/RUNBOOK.md`.
- `CORS_ORIGIN` explícito y `EMAIL_PROVIDER` distinto de `console`.
