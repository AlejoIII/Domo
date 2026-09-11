# Domo Backend

API NestJS multiempresa para el ERP Domo (Fase A — núcleo production-ready).

## Requisitos

- Node.js 20+
- Docker (PostgreSQL + Redis)
- npm

## Arranque local

```bash
cd erp-saas-backend
copy .env.example .env
docker compose up -d postgres redis
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

| Recurso | URL |
|---------|-----|
| Health | http://localhost:3000/api/v1/health |
| Swagger | http://localhost:3000/docs |
| API base | http://localhost:3000/api/v1 |

Frontend (repo hermano `erp-saas-frontend`): proxy `/api` → `:3000`. Ajusta `CORS_ORIGIN` y `FRONTEND_URL` si usas otro puerto (p. ej. `5174`).

## Usuarios demo

Tras `npm run db:seed`:

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@demo.com | admin123 | Administrador (todos los permisos) |
| ventas@demo.com | ventas123 | Ventas (sin acceso a facturas) |

## Datos demo incluidos

- 3 productos, 2 clientes, 2 proveedores, 1 almacén (MAD-01) como almacén por defecto
- Stock por almacén alineado con `Product.stock`
- Movimientos de stock (salida por pedido confirmado + ajuste manual)
- Pedido **PED-DEMO-001** confirmado, facturas **FAC-DEMO-001** (vencida) y **FAC-DEMO-002** (parcialmente pagada)
- Presupuesto, pedido borrador, orden de compra

## Variables de entorno

Copia `.env.example` → `.env`. Las más importantes:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL (puerto **5433** en docker compose local) |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Claves de tokens (cambiar en producción) |
| `CORS_ORIGIN` | Origen del frontend |
| `FRONTEND_URL` | URL pública para enlaces en emails e invitaciones |
| `EMAIL_PROVIDER` | `console` (dev), `smtp` o `resend` |
| `EMAIL_VERIFICATION_ENABLED` | `true` exige verificar email al registrarse |
| `SMTP_*` | Cuenta emisor si `EMAIL_PROVIDER=smtp` |

Desarrollo sin SMTP:

```env
EMAIL_PROVIDER=console
EMAIL_VERIFICATION_ENABLED=false
```

## Fase A — funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **A1 Inventario** | Ledger `StockMovement`, stock por almacén, ajustes, descuento en pedidos confirmados |
| **A2 Cobros** | Pagos en facturas, estados `partially_paid` / `paid`, informes con cobros reales |
| **A3 Email** | Invitaciones y verificación (SMTP / Resend / consola) |
| **A4 Permisos** | RBAC backend; frontend con rutas protegidas |
| **A5 Export** | CSV/XLSX en informes ventas y finanzas |
| **Fichas** | Layouts configurables + campos personalizados (`/custom-fields`) |

## Comandos útiles

```bash
npm run start:dev      # desarrollo con hot reload
npm run build          # compilar
npm run db:seed        # datos demo
npx prisma migrate deploy   # migraciones (staging/prod)
npx prisma studio      # explorar BD
```

## Staging / producción

1. Configurar `.env` con secretos reales y SMTP.
2. `npx prisma migrate deploy`
3. `npm run db:seed` solo en entornos demo (no en prod con datos reales).
4. `npm run build && npm run start:prod`

## Smoke test

Checklist manual antes de release: [docs/SMOKE_TEST.md](docs/SMOKE_TEST.md)

## Roadmap

Plan completo por fases: [docs/PHASED_ROADMAP.md](docs/PHASED_ROADMAP.md)
