# B7 — MVP entregable Fase B

Checklist de cierre de la Fase B (profundidad y retención).

## Criterios de aceptación

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Flujo venta completo con albarán e impresión OC | ✅ | Presupuesto → pedido → **Marcar entregado** → albarán → factura; `DocumentPrintPage` para OC y albaranes |
| CRM básico operativo | ✅ | Ficha cliente: resumen, timeline, notas, segmento, **Crear presupuesto** |
| Adjuntos en ≥4 entidades | ✅ | client, order, invoice, quote, purchase_order, product, supplier (7 entidades) |
| Filtros en listados ventas/compras | ✅ | Presupuestos, pedidos, facturas, OC (+ clientes/productos con URL + sessionStorage) |

## Demo guiada (~20 min)

### 1. Flujo de venta

1. **Dashboard** → widget «Flujo de venta» o `/quotes/new`
2. Crear presupuesto con líneas → **Convertir a pedido**
3. En el pedido → **Marcar entregado** (genera `deliveryNoteNumber`)
4. **Albarán** → imprimir desde la ficha del pedido
5. **Convertir a factura** → registrar cobro en la ficha

### 2. Compras

1. Crear orden de compra → **Imprimir** (`/purchase-orders/:id/print`)

### 3. CRM

1. Ficha cliente → ver resumen (facturado / pendiente)
2. Timeline con pedidos y facturas
3. **Crear presupuesto** desde la ficha

### 4. Adjuntos

1. Subir archivo en pedido o cliente
2. Ver galería en la sidebar de la ficha

### 5. Filtros

1. Pedidos: `?status=confirmed&clientId=...`
2. Facturas vencidas: `/invoices?overdue=1` (desde dashboard)
3. Recargar → filtros persisten (sessionStorage)

## Rutas clave

| Acción | Ruta |
|--------|------|
| Flujo venta (dashboard) | `/` |
| Presupuestos filtrados | `/quotes?status=...` |
| Pedidos por enviar | `/orders?status=confirmed` |
| Albarán | `/orders/:id/delivery-note/print` |
| Imprimir OC | `/purchase-orders/:id/print` |
| Meta ventas | `/settings?tab=documents` |

## Dependencias completadas (B1–B6)

- **B1** Documentos: albarán, imprimir OC, duplicar, email PDF
- **B2** Stock: transferencias, valoración
- **B3** CRM clientes
- **B4** Adjuntos universales
- **B5** Dashboard accionable
- **B6** Filtros avanzados + URL + sessionStorage

## Siguiente fase

**Fase C** — Producto SaaS: planes, límites, onboarding comercial, Stripe.
