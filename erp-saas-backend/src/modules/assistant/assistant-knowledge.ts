/**
 * Base de conocimiento estática para el asistente de uso (sin datos de tenant).
 * Ampliar aquí cuando cambien flujos o rutas de la app.
 */
export const ASSISTANT_KNOWLEDGE = `
# Domo ERP — guía de uso (referencia para el asistente)

## General
- Domo es un ERP multi-empresa: cada usuario ve solo los datos de su empresa.
- La navegación principal está en el menú lateral (clientes, productos, pedidos, facturas, etc.).
- Configuración de empresa, roles, IVA y prefijos: menú **Configuración** (\`/settings\`).
- Importación masiva CSV (almacenes, productos, clientes): **Configuración → Privacidad y datos → Importación masiva** o ruta \`/settings/import\`. Orden recomendado: almacenes → productos → clientes. Máximo 500 filas por archivo. Plantillas descargables en la misma pantalla.

## Onboarding inicial
- Tras registrarse, el asistente de configuración (\`/onboarding\`) guía: datos de empresa, IVA y prefijos de documentos, primer almacén, primer producto e invitación opcional al equipo.
- Hasta completar el onboarding, algunas pantallas del panel pueden estar limitadas.

## Clientes
- Listado y fichas en \`/clients\`. Crear: \`/clients/new\`.
- Permisos típicos: ver con \`clients.read\`, crear/editar con \`clients.write\`.

## Productos, categorías y almacenes
- Productos: \`/products\`. Almacenes: \`/warehouses\`. Categorías: \`/categories\`.
- El stock se gestiona por almacén; al crear producto puedes indicar stock inicial.
- Permisos de catálogo/stock suelen requerir \`products.read\` / \`products.write\`.

## Ventas
- Pedidos: \`/orders\`. Presupuestos: \`/quotes\`. Facturas: \`/invoices\`.
- Prefijos y numeración se configuran en Configuración → documentos / empresa.

## Compras
- Proveedores: \`/suppliers\`. Órdenes de compra: \`/purchase-orders\`.

## Informes
- Ventas: \`/reports/sales\`. Finanzas: \`/reports/finance\`. Valoración stock: \`/reports/stock-valuation\`.

## Contabilidad y tesorería
- Contabilidad: \`/accounting\` (según plan).
- Tesorería: \`/treasury\` — cuentas bancarias, movimientos e import CSV de movimientos (formato distinto al de clientes/productos).

## CRM
- Pipeline: \`/crm\`. Ajustes de etapas y plantillas: \`/crm/settings\`.

## Roles y permisos
- Admin de empresa configura roles en Configuración → Roles.
- Si el usuario no ve un menú o acción, probablemente le falta permiso; no es un fallo técnico.

## Feedback
- Botón de feedback beta en la cabecera para comentarios sobre la app (no sustituye soporte fiscal/legal).

## Límites del asistente
- Este asistente orienta sobre **cómo usar** Domo. No diagnostica errores de servidor, no accede a datos concretos del usuario ni da asesoramiento legal/fiscal vinculante.
- Ante errores técnicos (pantalla en blanco, 500, datos incorrectos), recomendar revisar conexión, permisos, recargar y usar feedback con la ruta donde ocurrió.
`.trim();
