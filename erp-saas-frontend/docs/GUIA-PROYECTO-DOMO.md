# Domo — Guía del proyecto

Adaptación de la arquitectura CloudTreyFact a **React 19 + NestJS + PostgreSQL**.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind |
| Estado | Zustand (auth, UI) + TanStack Query (servidor) |
| Formularios | React Hook Form + Zod |
| Backend | NestJS, Prisma, PostgreSQL |
| Auth | JWT (access + refresh) |

## Estructura frontend (`src/`)

```text
app/           → App root, providers
config/        → menu.config, entities.config (registro central)
features/      → Módulos por dominio ERP
  clients/     → listado + ficha
layouts/       → AuthLayout, DashboardLayout
pages/         → Páginas sueltas (login, dashboard, settings)
routes/        → Router, guards
services/      → API clients (axios)
store/         → Zustand
components/ui/ → Button, Input, Modal, DataTable…
types/         → Tipos compartidos
```

## Estructura backend (`src/`)

```text
modules/       → auth, users, clients, health…
common/        → guards, filters, interceptors, database
shared/utils/  → Utilidades
prisma/        → schema + migrations
```

## Módulos ERP (como CloudTreyFact)

| Módulo | Ruta base | Estado |
|--------|-----------|--------|
| Inicio | `/dashboard` | ✅ |
| Ventas → Clientes | `/clients` | ✅ |
| Inventario → Productos | `/products` | ✅ |
| Ventas → Pedidos | `/orders` | Pendiente |
| Compras → Proveedores | `/suppliers` | Pendiente |
| Configuración | `/settings` | ✅ básico |

## Patrón por entidad

Cada entidad sigue el patrón **rejilla + ficha**:

| Pieza | Frontend | Backend |
|-------|----------|---------|
| Listado | `{Entity}ListPage` + tabla paginada | `GET /{entity}?page&limit&search` |
| Alta | `{Entity}FormPage` ruta `/new` | `POST /{entity}` |
| Edición | `{Entity}FormPage` ruta `/:id` | `PATCH /{entity}/:id` |
| Borrado | Confirmación | `DELETE /{entity}/:id` (soft delete) |

Registro central: `src/config/entities.config.ts`

## Rutas de clientes

- `/clients` — rejilla
- `/clients/new` — alta
- `/clients/:id` — edición (ficha con pestañas)

## Respuesta API

```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "timestamp": "...",
  "path": "...",
  "statusCode": 200
}
```

Listados paginados en `data`:

```json
{
  "items": [],
  "meta": { "total", "page", "limit", "totalPages" }
}
```

## Multiempresa

Todo filtrado por `companyId` del JWT. Nunca mezclar datos entre empresas.

## Cómo añadir una entidad

1. Modelo Prisma + migración
2. Módulo NestJS: controller, service, repository, DTOs
3. Entrada en `entities.config.ts`
4. `features/{entity}/` con list + form
5. Ruta en router + ítem en menú
