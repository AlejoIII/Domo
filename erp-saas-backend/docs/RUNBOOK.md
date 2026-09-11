# Runbook operativo — Domo ERP

Procedimientos para operaciones en producción.

## Backup PostgreSQL

### Backup manual

```bash
pg_dump "$DATABASE_URL" -Fc -f "domo-backup-$(date +%Y%m%d-%H%M).dump"
```

Subir el `.dump` a almacenamiento off-site (S3, Backblaze, etc.).

### Backup automatizado (cron diario)

```bash
0 3 * * * pg_dump "$DATABASE_URL" -Fc -f /backups/domo-$(date +\%Y\%m\%d).dump && find /backups -name 'domo-*.dump' -mtime +14 -delete
```

Retención recomendada: 14 días mínimo; 30 para producción seria.

## Restore PostgreSQL

```bash
# Crear DB vacía o limpiar schema
dropdb erp_saas && createdb erp_saas

# Restaurar
pg_restore -d erp_saas --no-owner --no-privileges domo-backup-YYYYMMDD.dump

# Reaplicar migraciones por si el dump es anterior
cd erp-saas-backend
npx prisma migrate deploy
```

Verificar:

```bash
curl -s http://localhost:3000/api/status | jq
```

## Rotación JWT

Rotar invalida todas las sesiones activas. Planificar ventana de mantenimiento.

1. Generar nuevos secretos (64+ chars aleatorios):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

2. Actualizar secrets en el proveedor:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

3. Redeploy API.

4. Opcional: truncar tabla `refresh_tokens` para forzar re-login:

```sql
TRUNCATE refresh_tokens;
```

5. Comunicar a usuarios que deben volver a iniciar sesión.

## Modo mantenimiento

Panel plataforma (`PLATFORM_ADMIN_ENABLED=true`) o directamente en DB:

```sql
UPDATE platform_settings
SET "maintenanceMode" = true,
    "maintenanceMessage" = 'Mantenimiento programado hasta las 23:00 UTC.'
WHERE id = 'global';
```

Desactivar:

```sql
UPDATE platform_settings SET "maintenanceMode" = false WHERE id = 'global';
```

Bloquea login/registro de usuarios normales; admins plataforma pueden seguir.

## Incidentes frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| 503 / status `database: error` | Postgres caído o URL incorrecta | Verificar servicio DB, credenciales, firewall |
| 429 Too Many Requests | Rate limit (IP o API key) | Revisar logs; ajustar `API_RATE_LIMIT_*` o throttling |
| CORS error en browser | `CORS_ORIGIN` mal configurado | Añadir URL exacta del frontend |
| Emails no llegan | SMTP/Resend mal configurado | `GET /api/status` → check email; probar credenciales |
| Uploads fallan (S3) | Bucket/credenciales | Verificar `S3_*` y permisos IAM |

## Logs

- Formato JSON en producción (pino).
- Campos útiles: `req.id` (requestId), `companyId`, `userId`, `req.url`, `responseTime`.
- Propagar `X-Request-Id` desde el load balancer para trazabilidad end-to-end.

## Contactos y escalado

Documentar internamente:

- Responsable infra / DBA
- Canal de alertas (Slack, PagerDuty)
- RPO/RTO acordados con el negocio
