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

## PWA (app instalable sin stores)

Domo se puede instalar como aplicación web (Chrome/Edge/Android; en iOS vía Safari → Compartir → “Añadir a pantalla de inicio”).

Requisitos: **HTTPS** (o `localhost`) + build de producción con service worker.

```bash
npm run build
npm run preview   # http://localhost:4173 — prueba “Instalar app” en el menú del navegador
```

En producción: despliega el `dist/` detrás de HTTPS (misma API/proxy que uses hoy). El SW cachea solo estáticos; `/api` y `/uploads` van siempre a red.

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
