# Lanzamiento público — playbook

Guía para abrir Domo al registro público (Fase 3) tras la beta cerrada.

## 1. Preparación

1. Aplicar migraciones en producción:
   ```bash
   npx prisma migrate deploy
   ```
2. Configurar variables de entorno (ver sección 2).
3. Desplegar backend y frontend (workflows `deploy-prod.yml` o manual).
4. Verificar `/status` y `/api/v1/status/public`.

## 2. Variables de entorno (producción)

### Backend (`.env`)

```env
NODE_ENV=production
CORS_ORIGIN=https://app.tudominio.com
FRONTEND_URL=https://app.tudominio.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
AUTH_EXPOSE_TOKENS_IN_BODY=false

# Registro abierto
REGISTRATION_MODE=open
# BETA_SIGNUP_CAP=   # vacío o eliminar en lanzamiento público

# Email transaccional
EMAIL_PROVIDER=resend
EMAIL_VERIFICATION_ENABLED=true
RESEND_API_KEY=re_...
RESEND_FROM=Domo <hola@tudominio.com>

# Stripe live
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...

# Observabilidad
SENTRY_DSN=https://...@sentry.io/...
```

### Frontend (build)

```env
VITE_SENTRY_DSN=https://...@sentry.io/...
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_APP_VERSION=1.0.0
```

## 3. Cambios de producto incluidos

| Área | Qué incluye |
|------|-------------|
| Landing | `/` — pricing, CTA registro |
| Legal | `/terms`, `/privacy`, `/cookies` |
| Estado | `/status` — API pública sanitizada |
| Cookies | Banner GDPR; Sentry solo con consentimiento analítico |
| Registro | Checkbox obligatorio `acceptedTerms` |
| Auth | Footer con enlaces legales en login/registro |

## 4. Activar registro abierto

**Opción A — variables** (recomendado):

```env
REGISTRATION_MODE=open
```

**Opción B — panel plataforma** (`/platform/beta`):
- Pulsa **Registro abierto**
- Quita o sube el cupo beta si ya no aplica

## 5. Checklist pre-lanzamiento

### Hecho en código (hardening)
- [x] `trust proxy` activable (`TRUST_PROXY`, por defecto en prod)
- [x] Swagger `/docs` desactivado en producción salvo `SWAGGER_ENABLED=true`
- [x] `/api/metrics` exige `METRICS_TOKEN` en producción (sin token → 404)
- [x] Arranque en prod rechaza `JWT_SECRET` / `JWT_REFRESH_SECRET` débiles
- [x] Docker entrypoint ejecuta `prisma migrate deploy` (`RUN_MIGRATIONS=true`)
- [x] Páginas legales leen `VITE_LEGAL_*` (aviso si faltan)

### Operativa (pendiente de tu cuenta / dominio)
- [ ] SSL en frontend y API
- [ ] `CORS_ORIGIN` y `FRONTEND_URL` apuntan al dominio real
- [ ] Cookies `Secure` en producción (`COOKIE_SECURE=true`)
- [ ] Worker desplegado junto a la API (Redis + BullMQ)
- [ ] Stripe webhook apunta a `/api/v1/billing/webhook` (live)
- [ ] Email de verificación funciona (Resend/SMTP + `EMAIL_VERIFICATION_ENABLED=true`)
- [ ] Sentry recibe eventos tras aceptar cookies analíticas
- [ ] `VITE_LEGAL_*` rellenado y textos revisados por responsable legal
- [ ] Backup de base de datos configurado
- [ ] `STORAGE_DRIVER=s3` (R2/S3) para adjuntos

## 6. Smoke checklist (público)

- [ ] `GET /` muestra landing con pricing
- [ ] `/terms`, `/privacy`, `/cookies` cargan correctamente
- [ ] `/status` muestra estado de API, DB y Redis
- [ ] Banner de cookies aparece en primera visita
- [ ] "Solo esenciales" no activa replay Sentry
- [ ] "Aceptar todo" activa Sentry (si `VITE_SENTRY_DSN` configurado)
- [ ] `/register` exige checkbox de términos
- [ ] Registro completo crea empresa y redirige a onboarding/dashboard
- [ ] `GET /auth/registration-config` → `requiresInvite: false`
- [ ] Login y flujo post-auth (`/dashboard`) operativos

## 7. Monitorización post-lanzamiento

| Métrica | Dónde |
|---------|-------|
| Registros nuevos | `/platform` funnel |
| Errores API | Sentry backend |
| Errores frontend | Sentry web (usuarios con consentimiento) |
| Colas / jobs | Bull Board o logs worker |
| Pagos | Stripe Dashboard + `/platform/billing` |
| Feedback beta | `/platform/beta` (opcional mantener) |

## 8. Rollback rápido

Si hay incidencias graves:

1. **Cerrar registro**: `REGISTRATION_MODE=invite_only` + redeploy API
2. **Modo mantenimiento**: `/platform/system` → activar banner
3. **Revertir deploy**: usar artifact anterior del workflow o tag git previo

## 9. CI/CD producción

Workflows en ambos repos: `.github/workflows/deploy-prod.yml`

- Trigger: push a `main` o `workflow_dispatch`
- Build + tests + artifact
- Conectar paso `deploy` a tu hosting (Railway, Fly, VPS, S3+CloudFront…)
