# RGPD — Derechos del interesado y retención de datos

> **Fase 4** · Julio 2026  
> Módulo backend: `src/modules/privacy/` · UI: **Ajustes → Privacidad y datos**

---

## 1. Endpoints

| Método | Ruta | Permiso | Derecho RGPD |
|---|---|---|---|
| GET | `/api/v1/privacy/retention` | autenticado | Información (art. 13) |
| GET | `/api/v1/privacy/export` | `settings.write` | Portabilidad (art. 20) |
| GET | `/api/v1/privacy/clients/:id/export` | `clients.read` | Acceso (art. 15) |
| POST | `/api/v1/privacy/clients/:id/anonymize` | `clients.write` | Supresión (art. 17) |
| DELETE | `/api/v1/privacy/company` | `settings.write` | Supresión de cuenta |

Todas las operaciones quedan registradas en auditoría con acciones `privacy.*`.

---

## 2. Export de datos

`GET /privacy/export` descarga un JSON con formato `domo-gdpr-export/1` que incluye empresa,
usuarios, clientes, proveedores, productos, empleados, facturas (con líneas y cobros),
presupuestos, pedidos, órdenes de compra, pagos y movimientos de stock.

El export de un cliente concreto (`domo-gdpr-subject-export/1`) devuelve sus datos de contacto,
notas y el histórico de documentos comerciales, y sirve para atender una solicitud de acceso.

---

## 3. Anonimización de cliente

Un cliente **no se puede borrar** si tiene facturas: la documentación fiscal es de conservación
obligatoria. La supresión se implementa como anonimización:

**Se borra:** nombre (sustituido por `Cliente anonimizado {id}`), email, teléfono, NIF, dirección,
ciudad, código postal, notas y todas las notas de seguimiento (`ClientNote`).

**Se conserva:** facturas, rectificativas, presupuestos, pedidos y asientos contables, ya sin datos
identificativos del interesado.

El cliente queda marcado con `anonymizedAt` y `isActive = false`. La operación es irreversible y no
se puede repetir.

Desde la UI: ficha del cliente → panel **Privacidad**.

---

## 4. Baja de cuenta

`DELETE /privacy/company` requiere escribir el **nombre exacto de la empresa** como confirmación.

Efectos:

1. Se escribe el registro de auditoría *antes* de cerrar el tenant
2. Todos los usuarios se anonimizan: email sustituido por `deleted-{uuid}@domo.invalid`, nombre y
   apellidos a null, `isActive = false`, `deletedAt` establecido
3. Se eliminan todos los refresh tokens (cierre de sesiones)
4. La empresa queda con `isActive = false` y `deletedAt` establecido

La documentación fiscal permanece en base de datos, bloqueada e inaccesible desde la aplicación,
durante el periodo legal de retención. Su eliminación definitiva es una tarea de operación (ver
`docs/RUNBOOK.md`), no una acción de usuario.

---

## 5. Política de retención

| Categoría | Retención | Base jurídica | Suprimible |
|---|---|---|---|
| Facturación y contabilidad | 6 años | Obligación legal (C. Comercio art. 30, LGT art. 66) | No |
| Contacto de clientes y proveedores | Mientras exista relación comercial | Contrato / interés legítimo | Sí |
| Cuentas de usuario y credenciales | Hasta la baja de la cuenta | Ejecución de contrato | Sí |
| Auditoría y accesos | 12 meses | Interés legítimo (seguridad) | No |
| Analítica y errores | 90 días | Consentimiento (cookies analíticas) | Sí |

La política se sirve desde `GET /privacy/retention` para que la UI y la página pública de
privacidad no se desincronicen.

---

## 6. Consentimiento de cookies

Implementado en Fase 3: Sentry y la analítica solo se inicializan tras consentimiento explícito
(`CookieConsent` en el frontend). Ver `docs/PUBLIC_LAUNCH_PLAYBOOK.md`.

---

## 7. Purga automática de auditoría

Las tablas `audit_logs` y `webhook_deliveries` están particionadas por mes. El **worker** ejecuta
a diario (03:15 UTC) un `DROP` de las particiones anteriores a
`AUDIT_RETENTION_MONTHS` (por defecto **12 meses**), alineado con la tabla de retención anterior.

- Cron: solo en el proceso worker (`npm run start:worker`)
- Manual / dry-run: `AUDIT_RETENTION_DRY_RUN=true npm run audit:purge`
- El interceptor de auditoría guarda solo IDs de ruta en `metadata` (no query completa) para
  reducir el tamaño de cada fila

---

## 8. Pendiente

- Eliminación definitiva de tenants dados de baja tras el periodo de retención
- Registro de actividades de tratamiento (documento externo, no software)
- Contratos de encargado de tratamiento con subencargados (Stripe, proveedor SMTP, S3, Sentry)
