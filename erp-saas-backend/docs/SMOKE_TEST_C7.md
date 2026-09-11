# Smoke test — Fase C7 (Producto SaaS)

Checklist para cerrar la **Fase C** antes de staging. Tiempo estimado: **20–30 min**.

**Requisitos:** backend `:3000`, frontend `:5173`, Docker (postgres + redis), seed ejecutado.

```powershell
cd erp-saas-backend
docker compose up -d postgres redis
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

---

## A. Automatizado (API)

Con el backend corriendo y `.env` con Stripe configurado:

```powershell
npm run smoke:c7
```

Debe pasar **todos** los pasos (registro Free, límite usuarios, webhook, plan Pro).

Si falla el webhook → reinicia el backend tras añadir `STRIPE_WEBHOOK_SECRET` en `.env`.

---

## B. Webhooks Stripe en local

### Opción 1 — Sin Stripe CLI (dev rápido)

En `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_local_dev_c7
```

Reinicia el backend. El script `npm run smoke:c7` envía un webhook firmado de prueba.

Probar manualmente tras un checkout real:

```powershell
node scripts/test-stripe-webhook.mjs <companyId>
```

(`companyId` lo ves en JWT / Ajustes → red DevTools → `/auth/me`)

### Opción 2 — Stripe CLI (recomendado, igual que producción)

1. Instalar CLI: https://docs.stripe.com/stripe-cli#install
   - Windows (Scoop): `scoop install stripe`
2. Login: `stripe login`
3. Reenviar eventos:

```powershell
stripe listen --forward-to localhost:3000/api/v1/billing/webhook
```

4. Copia el `whsec_...` que muestra y pégalo en `.env` como `STRIPE_WEBHOOK_SECRET`
5. Reinicia el backend
6. Haz un checkout test → el plan debe cambiar **sin** recargar (o con F5)

Eventos que escucha el backend:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## C. Manual en UI

| # | Paso | Resultado esperado |
|---|------|-------------------|
| C1 | `/register` → nueva empresa | Redirige a onboarding |
| C2 | Completar wizard (5 pasos) | Entra al dashboard |
| C3 | Ajustes → Plan: plan **Free** | 3 usuarios, 50 docs/mes |
| C4 | Invitar 2 usuarios más (3 en total) | OK |
| C5 | Intentar 4.º usuario/invitación | Pantalla límite / error plan |
| C6 | Ajustes → **Mejorar a Pro** | Checkout Stripe |
| C7 | Pagar con `4242 4242 4242 4242` | Vuelta a Ajustes |
| C8 | Plan muestra **Pro** | Botón "Gestionar suscripción" |
| C9 | Campana alertas (🔔) | Carga sin 401 (sesión válida) |
| C10 | Subir imagen producto | OK en `local`; con S3 → URL firmada |
| C11 | Ajustes → Plan → **Activar Free/Premium/Enterprise** (modo demo) | Plan cambia al instante; menú se actualiza |
| C12 | Imprimir factura en plan Free | Marca de agua en PDF / pie "Domo Free" |
| C13 | Usuario ventas abre `/accounting` directo | Pantalla "Sin acceso" (permiso RBAC) |

**Usuario demo** (ya con datos): `admin@demo.com` / `admin123`

**Tarjeta test:** `4242 4242 4242 4242` · fecha futura · CVC `123`

---

## D. Storage S3 (opcional)

Solo si vas a probar C4 en cloud:

```env
STORAGE_DRIVER=s3
S3_BUCKET=tu-bucket
S3_REGION=eu-west-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
```

Sube imagen en un producto → en red debe aparecer `GET /uploads/signed-url` con URL temporal.

---

## Criterio de paso C7

- [ ] `npm run smoke:c7` — 100 % verde
- [ ] `npm test` incluye `plan-limits.service.spec.ts`
- [ ] `npm run test:e2e` incluye `billing.e2e-spec.ts`
- [ ] Checkout Pro en UI con webhook o sync
- [ ] Límite Free comprobado (usuarios)
- [ ] Cambio de plan demo (C11) y watermark PDF (C12)
- [ ] Permisos frontend en rutas premium (C13)
- [ ] Onboarding completo en registro nuevo
- [ ] (Opcional) Upload S3

**Fecha / revisado por:** _______________

---

## Siguiente paso

Tras C7 → **C5** (API keys + webhooks salientes) o **Fase E** (CI, tests, deploy staging).
