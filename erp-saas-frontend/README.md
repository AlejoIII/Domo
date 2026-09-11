# Domo Frontend

Frontend React 19 + Vite + TanStack Query para Domo ERP.

## Arranque rápido

```bash
cd erp-saas-frontend
npm install
npm run dev
```

- App: http://localhost:5173 (Vite elige puerto libre si 5173 está ocupado)
- API: proxy automático `/api` → `http://localhost:3000`

**Backend requerido** para login y datos reales. Ver [erp-saas-backend/README.md](../erp-saas-backend/README.md).

## Login demo

| Email | Contraseña |
|-------|------------|
| admin@demo.com | admin123 |
| ventas@demo.com | ventas123 |

Ejecutar seed en backend: `npm run db:seed`

## Estructura

Feature-first: `src/features/`, `src/components/`, `src/layouts/`, `src/store/`, `src/services/`

## Smoke test

Checklist Fase A: [erp-saas-backend/docs/SMOKE_TEST.md](../erp-saas-backend/docs/SMOKE_TEST.md)
