# Smoke test manual — Fase A (v1.0)

Checklist para validar el núcleo production-ready antes de release. Tiempo estimado: **30–40 min**.

**Requisitos:** backend en `http://localhost:3000`, frontend en `http://localhost:5173` (o `5174`), seed ejecutado.

```bash
# Backend
cd erp-saas-backend
docker compose up -d postgres redis
npx prisma migrate deploy
npm run db:seed
npm run start:dev

# Frontend (otra terminal)
cd erp-saas-frontend
npm run dev
```

---

## Usuarios demo


| Rol    | Email                                     | Contraseña | Notas                       |
| ------ | ----------------------------------------- | ---------- | --------------------------- |
| Admin  | [admin@demo.com](mailto:admin@demo.com)   | admin123   | Acceso completo             |
| Ventas | [ventas@demo.com](mailto:ventas@demo.com) | ventas123  | Sin permiso `invoices.read` |


---



## 1. Inventario (A1)


| #   | Paso                                                               | Resultado esperado                                    |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| 1.1 | Login admin → Productos → abrir **Ratón inalámbrico** (stock bajo) | Badge stock bajo visible                              |
| 1.2 | Abrir **Pack papel A4** → pestaña stock por almacén                | Total **70** ud en MAD-01                             |
| 1.3 | Almacenes → MAD-01 → ajustar stock de un producto (+5 con motivo)  | Stock sube; movimiento tipo `adjustment` en histórico |
| 1.4 | Pedidos → **PED-DEMO-001** (confirmado)                            | Existe y está vinculado a Acme Corp                   |
| 1.5 | Producto PAP-A4 → movimientos de stock                             | Movimiento `out` por pedido demo (-10)                |


---



## 2. Cobros (A2)


| #   | Paso                                        | Resultado esperado                                             |
| --- | ------------------------------------------- | -------------------------------------------------------------- |
| 2.1 | Facturas → **FAC-DEMO-001**                 | Estado vencida / emitida, sin pagos                            |
| 2.2 | **FAC-DEMO-002**                            | Estado **parcialmente pagada**, sección Pagos con anticipo 40% |
| 2.3 | Registrar pago adicional hasta cubrir total | Estado pasa a **pagada**                                       |
| 2.4 | Dashboard                                   | Widget pendiente de cobro coherente                            |
| 2.5 | Informes → Finanzas                         | Cobros del periodo reflejan pagos reales                       |


---



## 3. Export informes (A5)


| #   | Paso                                 | Resultado esperado                 |
| --- | ------------------------------------ | ---------------------------------- |
| 3.1 | Informes → Ventas → Exportar CSV     | Descarga UTF-8, totales = pantalla |
| 3.2 | Informes → Finanzas → Exportar Excel | Abre en Excel/LibreOffice          |


---



## 4. Email (A3)


| #   | Paso                                            | Resultado esperado                                    |
| --- | ----------------------------------------------- | ----------------------------------------------------- |
| 4.1 | `.env`: `EMAIL_PROVIDER=console`                | Sin SMTP real                                         |
| 4.2 | Configuración → Invitaciones → crear invitación | Consola backend muestra enlace; UI indica si se envió |
| 4.3 | (Opcional) SMTP real / Mailtrap                 | Email llega a bandeja de prueba                       |


---



## 5. Permisos (A4)


| #   | Paso                                                         | Resultado esperado                |
| --- | ------------------------------------------------------------ | --------------------------------- |
| 5.1 | Logout → login **[ventas@demo.com](mailto:ventas@demo.com)** | Entra correctamente               |
| 5.2 | Sidebar                                                      | No aparece Facturas               |
| 5.3 | Navegar manualmente a `/invoices`                            | Pantalla **Sin acceso** (403 UI)  |
| 5.4 | Clientes → crear/editar                                      | Permitido (tiene `clients.write`) |


---



## 6. Fichas configurables y campos custom


| #   | Paso                                                        | Resultado esperado                        |
| --- | ----------------------------------------------------------- | ----------------------------------------- |
| 6.1 | Clientes → Nuevo → **Personalizar ficha**                   | Modo editor activo                        |
| 6.2 | Añadir campo personalizado (ej. Fecha revisión, tipo Fecha) | Campo colocado; guardar diseño OK         |
| 6.3 | Crear cliente rellenando campo custom                       | Valor persiste al reabrir ficha           |
| 6.4 | Grid lleno (12 filas) → intentar añadir campo               | Aviso de sin espacio; botón deshabilitado |


---



## 7. Flujo venta rápido (regresión)


| #   | Paso                                    | Resultado esperado                   |
| --- | --------------------------------------- | ------------------------------------ |
| 7.1 | Nuevo presupuesto → convertir a pedido  | Pedido borrador creado               |
| 7.2 | Confirmar pedido con líneas de producto | Stock baja en almacén por defecto    |
| 7.3 | Convertir pedido a factura              | Factura creada con totales correctos |


---



## Criterio de paso

- [x] Todos los pasos 1–5 sin errores 4xx/5xx inesperados
- [x] Al menos un export descargado y verificado
- [x] Usuario ventas bloqueado en facturas
- [x] Seed reproducible (`npm run db:seed` tras migraciones)

**Fecha / revisado por:** Alejandro

