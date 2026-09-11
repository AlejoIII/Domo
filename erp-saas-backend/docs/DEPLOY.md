# Deploy a producción — Domo ERP

Guía paso a paso para desplegar backend + frontend + PostgreSQL.

## Arquitectura mínima

```
[Browser] → [CDN / nginx] → Frontend estático (Vite build)
                ↓
            [API NestJS :3000]
                ↓
         [PostgreSQL 16]
         [PgBouncer] (opcional, recomendado multi-instancia)
         [Redis 7] (obligatorio en producción)
         [S3 / MinIO] (opcional; local en disco si no)
         [Worker BullMQ] (proceso separado)
```

## 1. Base de datos

1. Crear instancia PostgreSQL 16 (managed o VM).
2. Crear usuario y base (`erp_saas`).
3. Guardar `DATABASE_URL` y `DATABASE_DIRECT_URL` en secrets.
4. (Opcional) Réplica read-only → `DATABASE_READ_URL` para dashboard/informes.
5. (Opcional) PgBouncer delante de Postgres para connection pooling.

```bash
# Desde máquina con acceso directo a la DB (no vía PgBouncer)
cd erp-saas-backend
export DATABASE_URL="postgresql://..."
export DATABASE_DIRECT_URL="postgresql://..."   # misma URL si no hay pooler
npx prisma migrate deploy
npx prisma db seed   # opcional: solo entornos demo/staging
```

### PgBouncer (Docker local)

```bash
docker compose up -d postgres pgbouncer redis
```

En `.env`:

```env
DATABASE_URL=postgresql://erp:erp@localhost:6432/erp_saas?schema=public&pgbouncer=true&connection_limit=10
DATABASE_DIRECT_URL=postgresql://erp:erp@localhost:5433/erp_saas?schema=public
```

## 2. Backend (API)

### Variables obligatorias

Ver `docs/ENV.md`. Mínimo:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
CORS_ORIGIN=https://app.tudominio.com
FRONTEND_URL=https://app.tudominio.com
EMAIL_PROVIDER=smtp   # o resend
```

### Build y arranque

```bash
cd erp-saas-backend
npm ci
npx prisma generate
npm run build
npm run start:prod
```

### Docker (opcional)

```bash
docker compose up -d postgres redis
docker build -t domo-api .
docker run --env-file .env -p 3000:3000 domo-api
```

### Health checks (load balancer)

- **Liveness:** `GET /api/health` → 200 `{ status: "ok" }`
- **Readiness:** `GET /api/status` → 200 si DB ok; `degraded` si Redis/email opcionales fallan
- **Métricas:** `GET /api/metrics` → uptime, memoria, cache hit rate, colas BullMQ, alertas

### Worker BullMQ

```bash
npm run start:worker:prod
# o servicio worker en docker-compose.yml
```

## 3. Frontend

```bash
cd erp-saas-frontend
npm ci
npm run build
```

Servir `dist/` con nginx, CloudFront, o similar. Ejemplo nginx:

```nginx
server {
  listen 80;
  server_name app.tudominio.com;
  root /var/www/domo/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Alternativa: `VITE_API_URL=https://api.tudominio.com/api/v1` en build time.

## 4. CI/CD (GitHub Actions)

Repos separados con workflow en `.github/workflows/ci.yml`:

| Repo | Pipeline |
|------|----------|
| Backend | lint → migrate deploy (CI DB) → unit → e2e → migrate diff → build |
| Frontend | lint → typecheck → vitest → build → Playwright smoke |

### Deploy staging (pendiente automatizar)

1. Push a `main` dispara CI.
2. Job adicional (manual o CD):
   - `prisma migrate deploy` en staging DB
   - Deploy artefacto API (PM2, Docker, Railway, etc.)
   - Subir `dist/` frontend a bucket/CDN

## 5. Post-deploy checklist

- [ ] Login admin funciona
- [ ] `GET /api/status` → `status: ok`
- [ ] CORS: frontend carga sin errores de origen
- [ ] Email de invitación llega (si SMTP configurado)
- [ ] Backups DB programados (ver `RUNBOOK.md`)
- [ ] Secretos rotados respecto a entorno dev

## 6. Rollback

1. Redeploy imagen/artefacto anterior del API.
2. Si hubo migración incompatible: restaurar backup DB (ver runbook).
3. Frontend: redeploy `dist/` anterior desde artefacto CI.
