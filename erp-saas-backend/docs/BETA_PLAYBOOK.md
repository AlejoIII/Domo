# Beta cerrada — playbook

Guía para lanzar Domo con **5–10 empresas** en beta cerrada antes del lanzamiento público.

## 1. Preparación

1. Aplicar migración:
   ```bash
   npx prisma migrate deploy
   ```
2. Configurar variables (`.env`):
   ```env
   REGISTRATION_MODE=invite_only
   BETA_SIGNUP_CAP=10
   PLATFORM_ADMIN_ENABLED=true
   ```
3. Reiniciar backend y frontend.

## 2. Activar modo beta

**Opción A — variables de entorno** (recomendado en staging/prod).

**Opción B — panel plataforma** (`/platform/beta`):
- Pulsa **Solo invitación**
- Define **cupo** (ej. 10 empresas)
- Crea invitaciones y copia el enlace `register?invite=...`

## 3. Onboarding de una empresa beta

1. Crear invitación (email opcional para bloquear cuenta).
2. Enviar enlace al cliente.
3. Cliente registra empresa → trial 14 días Premium.
4. Empresa queda etiquetada con `betaCohort` (ej. `beta-2026`).
5. Seguimiento en `/platform` (funnel) y notas en ficha de empresa.

## 4. Feedback in-app

Los usuarios autenticados ven el botón **Feedback** (esquina inferior derecha).

Revisar mensajes en `/platform/beta` → sección **Feedback reciente**.

## 5. Métricas de funnel

En `/platform` (resumen):

| Métrica | Significado |
|---------|-------------|
| Registros (30 d) | Nuevas empresas |
| Onboarding completado / pendiente | Configuración inicial |
| En trial | `subscriptionStatus=trialing` |
| Pagos activos | Stripe activo |
| Empresas beta | Con `betaCohort` |
| Usuarios activos (7 d) | Login reciente |
| Feedback recibido | Total mensajes beta |

## 6. Operaciones habituales

| Acción | Dónde |
|--------|-------|
| Suspender empresa | `/platform/companies/:id` |
| Cambiar plan / trial | Ficha empresa o billing demo |
| Impersonar usuario | Ficha empresa |
| Mantenimiento | `/platform/system` |
| Revocar invitación | `/platform/beta` |

## 7. Smoke checklist (beta)

- [ ] `GET /auth/registration-config` → `requiresInvite: true`
- [ ] `/register` sin `?invite=` muestra pantalla de invitación requerida
- [ ] Crear invitación en plataforma y registrar empresa con enlace
- [ ] Empresa aparece con cohorte en listado plataforma
- [ ] Enviar feedback desde app autenticada
- [ ] Feedback visible en `/platform/beta`
- [ ] Cupo bloquea registro cuando se alcanza `BETA_SIGNUP_CAP`

## 8. Volver a registro abierto

```env
REGISTRATION_MODE=open
```

O en `/platform/beta` → **Registro abierto**.
