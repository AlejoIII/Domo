/** Respuestas locales en desarrollo (sin llamar a OpenAI). */
export function devMockAssistantReply(message: string): string {
  const q = message.toLowerCase();

  if (/import|csv|plantilla|masiv/.test(q)) {
    return `Importación masiva en Domo:
1. Ve a **Configuración → Privacidad y datos → Importación masiva** (o \`/settings/import\`).
2. Descarga la plantilla (almacenes → productos → clientes).
3. Sube el CSV (máx. 500 filas) y usa **Validar sin guardar** antes de importar.

En desarrollo esta respuesta es simulada; en producción usarás el modelo configurado con OPENAI_API_KEY.`;
  }

  if (/cliente/.test(q)) {
    return `Clientes: menú **Clientes** (\`/clients\`). Alta en **Nuevo** (\`/clients/new\`). Necesitas permiso \`clients.write\` para crear o editar.`;
  }

  if (/producto|stock|almac/.test(q)) {
    return `Productos en \`/products\`, almacenes en \`/warehouses\`. El stock va por almacén. Para muchos registros, importa primero almacenes y luego productos desde \`/settings/import\`.`;
  }

  if (/factura|pedido|presupuesto/.test(q)) {
    return `Ventas: pedidos \`/orders\`, presupuestos \`/quotes\`, facturas \`/invoices\`. Prefijos e IVA en **Configuración** (empresa / documentos).`;
  }

  if (/onboarding|configur.*inicial|empez/.test(q)) {
    return `Tras registrarte, completa el asistente en \`/onboarding\`: empresa, IVA y prefijos, primer almacén y producto. Después puedes importar CSV masivamente.`;
  }

  if (/permiso|rol|no veo|acceso/.test(q)) {
    return `Si no ves un menú, suele faltar permiso. El admin puede revisar **Configuración → Roles**. No es un error del chatbot ni de la API.`;
  }

  if (/error|500|conexion|refused|no carga/.test(q)) {
    return `Si la app no carga datos, comprueba que el **backend** esté en marcha (\`npm run start:dev\` en erp-saas-backend, puerto 3000) y Vite en 5173. Usa el botón de feedback beta con la pantalla donde falla.`;
  }

  return `Modo **desarrollo** del asistente Domo (sin IA externa).

Puedo orientarte sobre: importación CSV, clientes, productos, facturas, onboarding y permisos. Prueba por ejemplo: "¿Cómo importo clientes?".

Para respuestas con IA real, define \`OPENAI_API_KEY\` en el \`.env\` del backend y reinicia la API.`;
}
