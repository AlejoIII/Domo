/** Contenido extendido de manuales Domo (es-ES). */

export const MANUALS_META = {
  product: 'Domo ERP',
  version: '1.1',
  locale: 'es-ES',
  supportHint:
    '¿Necesitas ayuda? Contacta al administrador de tu empresa o escribe a soporte desde la web de Domo. Guarda estos PDF y compártelos con nuevos usuarios.',
};

/** @param {string} title @param {string} body @param {{ bullets?: string[], tip?: string, screenshot?: string|false, imageCaption?: string }} [o] */
export function S(title, body, o = {}) {
  return { title, body, bullets: o.bullets ?? [], tip: o.tip, screenshot: o.screenshot, imageCaption: o.imageCaption };
}

/** @type {import('./manuals.types').UserManual[]} */
export const USER_MANUALS = [
  {
    id: 'introduccion',
    module: 'General',
    title: 'Primeros pasos en Domo',
    summary:
      'Esta guía explica cómo entrar en Domo, orientarte por el menú, usar atajos y cerrar sesión de forma segura. Está pensada para usuarios nuevos que acaban de recibir una invitación o credenciales de su empresa.',
    objectives: [
      'Iniciar y cerrar sesión correctamente',
      'Localizar módulos con el menú y la búsqueda rápida',
      'Entender dónde se configura la empresa y los permisos',
    ],
    prerequisites: [
      'Email de invitación o usuario creado por un administrador',
      'Navegador actualizado (Chrome, Edge o Firefox recomendados)',
    ],
    screenshot: 'dashboard.png',
    steps: [
      S(
        'Abrir Domo e iniciar sesión',
        'Accede a la URL que te proporcionó tu empresa (por ejemplo la de registro o la de producción). En la pantalla de login introduce tu email y contraseña. Si la empresa exige verificación en dos pasos (2FA), introduce el código de seis dígitos de tu app de autenticación.',
        {
          bullets: [
            'Si olvidaste la contraseña, usa «¿Olvidaste tu contraseña?» en la pantalla de login',
            'Tras varios intentos fallidos la cuenta puede bloquearse temporalmente',
            'El administrador puede reenviarte una invitación desde Configuración → Usuarios',
          ],
          tip: 'Marca «Recordar este dispositivo» solo en equipos personales y seguros.',
          screenshot: 'dashboard.png',
        },
      ),
      S(
        'Recorrer el menú lateral',
        'El menú izquierdo agrupa el trabajo por áreas: Ventas, Inventario, Compras, Informes, etc. Haz clic en el nombre de un área para desplegar sus pantallas. El icono de flecha en la cabecera del menú lo contrae y deja más espacio útil.',
        {
          bullets: [
            'Solo verás los módulos para los que tienes permiso',
            'Los módulos Premium o Enterprise aparecen bloqueados si tu plan no los incluye',
            'La opción activa se resalta en color verde Domo',
          ],
        },
      ),
      S(
        'Usar la búsqueda rápida (Ctrl+K)',
        'En la barra superior, el campo «Ir a módulo o acción…» permite saltar a Clientes, Pedidos, Configuración, etc. sin desplegar menús. Pulsa Ctrl+K (o Cmd+K en Mac) para enfocarlo al instante.',
        {
          bullets: ['Escribe parte del nombre del módulo', 'Selecciona con Enter o clic', 'Funciona desde casi cualquier pantalla'],
        },
      ),
      S(
        'Revisar notificaciones y perfil',
        'La campana indica avisos del sistema (facturas vencidas, límites de plan, etc.). El acceso a Configuración permite cambiar contraseña, activar 2FA y revisar datos de tu usuario.',
        {
          bullets: ['Las notificaciones se marcan como leídas al abrirlas', 'Configuración → Seguridad concentra opciones sensibles'],
        },
      ),
      S(
        'Completar el onboarding (primera vez)',
        'Si es la primera vez que entras, Domo puede guiarte con un asistente: datos básicos de empresa, moneda y preferencias. Complétalo para que informes y documentos muestren la información correcta.',
        {
          bullets: ['Puedes volver más tarde desde Configuración → Empresa', 'Los administradores pueden omitir pasos según el caso'],
        },
      ),
      S(
        'Cerrar sesión con seguridad',
        'En equipos compartidos o públicos, cierra sesión al terminar: Configuración → Seguridad → Cerrar sesión. Domo invalidará las cookies de sesión en el navegador.',
        {
          bullets: ['No compartas capturas con tokens visibles', 'La sesión expira tras inactividad según la política de tu empresa'],
          tip: 'Si ves datos de otra empresa, cierra sesión y verifica la URL.',
        },
      ),
    ],
    faq: [
      { q: 'No veo un módulo del menú', a: 'Tu rol no tiene permiso o tu plan no incluye esa función. Pide acceso al administrador.' },
      { q: '¿Puedo usar Domo en el móvil?', a: 'La interfaz es responsive; para tareas largas se recomienda escritorio.' },
    ],
  },
  {
    id: 'dashboard',
    module: 'Inicio',
    title: 'Panel de control (Dashboard)',
    summary:
      'El Dashboard concentra indicadores y alertas del día a día: cobros pendientes, pedidos por preparar, stock crítico y evolución de ventas. Úsalo como punto de partida cada mañana.',
    objectives: ['Interpretar KPIs y alertas', 'Acceder rápido a listados filtrados', 'Seguir el flujo comercial recomendado'],
    prerequisites: ['Permiso de acceso al módulo Dashboard', 'Datos de demo o operaciones reales en la empresa'],
    screenshot: 'dashboard.png',
    steps: [
      S(
        'Leer las tarjetas de alerta',
        'Las cuatro tarjetas superiores resumen situaciones urgentes: importe de facturas vencidas, pedidos confirmados sin enviar, productos bajo mínimo y ventas acumuladas del mes en curso.',
        {
          bullets: ['Cada tarjeta incluye un enlace Ver… al listado filtrado', 'Los colores ayudan a priorizar (cobros, logística, stock)', 'Si un valor es 0, puede ser normal o falta de datos en el periodo'],
          screenshot: 'dashboard.png',
        },
      ),
      S(
        'Actuar sobre facturas vencidas',
        'Haz clic en Ver vencidas para abrir facturas con saldo pendiente y fecha de vencimiento superada. Desde allí registra cobros o contacta al cliente.',
        {
          bullets: ['Registra pagos parciales si el cliente abona a plazos', 'Comprueba email y teléfono en la ficha del cliente'],
        },
      ),
      S(
        'Gestionar pedidos por enviar',
        'Los pedidos en estado confirmado sin envío aparecen en el contador. Entra al listado, prepara mercancía y marca como enviado o imprime albarán.',
        {
          bullets: ['Verifica stock en el almacén asignado', 'Imprime albarán antes de la entrega si tu proceso lo requiere'],
        },
      ),
      S(
        'Revisar stock bajo y productos críticos',
        'El bloque inferior lista productos bajo mínimo. Ajusta compras o movimientos de inventario para evitar roturas.',
        {
          bullets: ['Configura mínimos en la ficha de producto', 'El ratio actual/mínimo aparece en formato 27/35'],
        },
      ),
      S(
        'Seguir el flujo de venta guiado',
        'La sección Flujo de venta recuerda el orden Presupuesto → Pedido → Albarán → Factura. Úsalo para formar al equipo comercial.',
        {
          bullets: ['Cada paso enlaza al módulo correspondiente', 'Evita facturar sin pedido si necesitas trazabilidad'],
        },
      ),
      S(
        'Consultar KPIs numéricos',
        'Ingresos facturados, número de clientes, productos y pedidos ofrecen una foto rápida del negocio. Son enlaces a listados completos.',
        {
          bullets: ['Los importes respetan la moneda de la empresa', 'Actualiza datos registrando operaciones reales'],
        },
      ),
      S(
        'Analizar actividad reciente y gráfico',
        'La tabla de actividad muestra últimos pedidos con importe y estado. El gráfico compara ventas y cobros en seis meses; pasa el cursor para ver valores.',
        {
          bullets: ['Si el gráfico está vacío, crea facturas o pedidos en meses anteriores', 'Usa informes avanzados para exportar a Excel'],
        },
      ),
    ],
    faq: [
      { q: '¿Por qué ventas del mes es 0?', a: 'No hay pedidos/facturas fechados en el mes o aún no has configurado meta comercial.' },
    ],
  },
  {
    id: 'clientes',
    module: 'Ventas',
    title: 'Clientes',
    summary:
      'La ficha de cliente centraliza datos fiscales, contacto y relación con presupuestos, pedidos y facturas. Mantener clientes bien definidos evita errores en documentos y CRM.',
    objectives: ['Crear y editar clientes', 'Buscar y filtrar la cartera', 'Añadir notas internas de seguimiento'],
    prerequisites: ['Permiso clients.read (y clients.write para crear)', 'Datos fiscales acordes a tu país'],
    screenshot: 'clients.png',
    steps: [
      S('Abrir el listado', 'Menú Ventas → Clientes. Verás nombre, contacto y acciones. El buscador filtra en tiempo real.', {
        bullets: ['Ordena mentalmente por los más usados usando el buscador', 'Desde móvil el listado es scroll vertical'],
        screenshot: 'clients.png',
      }),
      S('Crear un cliente nuevo', 'Pulsa Nuevo cliente (o equivalente). Rellena nombre comercial, NIF/CIF, dirección fiscal, email y teléfono. Guarda antes de salir.', {
        bullets: ['El nombre es obligatorio para facturar', 'Email sirve para envíos futuros de documentos', 'Revisa tipo de cliente si aplica IVA especial'],
        tip: 'Duplicar NIF puede dar errores en informes; comprueba antes de guardar.',
      }),
      S('Editar datos existentes', 'Haz clic en la fila o en editar. Actualiza dirección o contacto cuando el cliente cambie de sede.', {
        bullets: ['Los documentos ya emitidos conservan datos históricos', 'Los cambios afectan a nuevos presupuestos y facturas'],
      }),
      S('Notas y seguimiento', 'Usa notas internas para recordatorios de cobros, preferencias o incidencias. Solo las ve tu equipo.', {
        bullets: ['Indica fecha y responsable en la nota', 'CRM puede complementar este seguimiento en plan Premium'],
      }),
      S('Vincular con documentos', 'Desde la ficha o al crear pedidos/facturas, selecciona el cliente en el desplegable. El historial de ventas se asocia automáticamente.', {
        bullets: ['No elimines clientes con documentos si tu política es conservar histórico', 'Consulta pedidos recientes desde informes'],
      }),
      S('Buenas prácticas de datos', 'Unifica criterio de nombres (SA, SL, mayúsculas). Revisa email y teléfono antes del primer envío de factura PDF.', {
        bullets: ['Evita clientes de prueba en producción', 'Importa desde hoja de cálculo solo si tu admin habilita migración'],
      }),
    ],
    faq: [{ q: 'No puedo borrar un cliente', a: 'Puede tener documentos vinculados; desactiva o archiva según política interna.' }],
  },
  {
    id: 'pedidos',
    module: 'Ventas',
    title: 'Pedidos de venta',
    summary:
      'Los pedidos registran la intención de compra confirmada: líneas, precios, almacén y estados logísticos. Son el puente entre presupuesto aceptado y factura.',
    objectives: ['Crear pedidos con líneas', 'Cambiar estados correctamente', 'Imprimir albarán y facturar'],
    prerequisites: ['Clientes y productos dados de alta', 'Permiso orders.read / orders.write'],
    screenshot: 'orders.png',
    steps: [
      S('Acceder a Pedidos', 'Ventas → Pedidos. Revisa número, cliente, fecha, total y estado en el listado.', { screenshot: 'orders.png' }),
      S('Crear pedido nuevo', 'Nuevo pedido: elige cliente, almacén de salida y fecha. Añade líneas con producto, cantidad, precio unitario y descuento si aplica.', {
        bullets: ['El stock disponible depende del almacén elegido', 'Puedes buscar producto por nombre o SKU', 'Guarda como borrador si falta información'],
      }),
      S('Revisar totales e impuestos', 'Domo calcula bases, IVA y total. Comprueba que coinciden con lo acordado con el cliente antes de confirmar.', {
        bullets: ['Los precios pueden venir del tarifario del producto', 'Ajusta manualmente solo si tienes permiso'],
      }),
      S('Confirmar el pedido', 'Pasa de Borrador a Confirmado cuando el cliente aprueba. A partir de aquí suele reservarse stock según configuración.', {
        bullets: ['Confirmado habilita impresión de albarán', 'Evita confirmar pedidos incompletos'],
      }),
      S('Preparar envío y albarán', 'Imprime albarán para el reparto o almacén. Marca como enviado cuando salga mercancía.', {
        bullets: ['Incluye número de pedido en el embalaje', 'Adjunta albarán firmado si es necesario'],
      }),
      S('Facturar desde el pedido', 'Usa Convertir a factura (o acción equivalente) para generar factura con las mismas líneas, evitando doble digitación.', {
        bullets: ['Revisa serie de facturación', 'Registra cobro después en la factura'],
        tip: 'Si el pedido es parcial, factura solo líneas entregadas si tu proceso lo permite.',
      }),
      S('Gestionar incidencias', 'Si cancelas, vuelve a estado anterior o anula según permisos. Documenta el motivo en notas.', {
        bullets: ['Cancelar puede liberar stock reservado', 'Consulta con administrador política de anulaciones'],
      }),
    ],
    faq: [{ q: 'No puedo confirmar por stock', a: 'No hay unidades en el almacén seleccionado; haz movimiento de entrada o cambia almacén.' }],
  },
  {
    id: 'facturas',
    module: 'Ventas',
    title: 'Facturas',
    summary:
      'Las facturas formalizan la venta ante el cliente y alimentan informes financieros. Domo genera PDF en servidor y permite registrar cobros.',
    objectives: ['Emitir facturas correctas', 'Descargar PDF', 'Registrar cobros y pendientes'],
    prerequisites: ['Serie de facturación configurada', 'Permiso invoices.read / invoices.write'],
    screenshot: 'invoices.png',
    steps: [
      S('Listado de facturas', 'Ventas → Facturas. Filtra por estado (borrador, emitida, pagada), cliente o fechas.', { screenshot: 'invoices.png' }),
      S('Crear factura', 'Nueva factura o conversión desde pedido/presupuesto. Completa cliente, fechas de emisión y vencimiento, líneas y forma de pago.', {
        bullets: ['La numeración suele ser automática por serie', 'Revisa tipo de IVA por línea'],
      }),
      S('Emitir y bloquear edición', 'Al emitir, la factura adquiere validez legal en tu flujo; campos sensibles pueden bloquearse.', {
        bullets: ['Corrige errores con rectificativa si procede', 'No borres facturas emitidas sin criterio contable'],
      }),
      S('Descargar PDF', 'Usa Descargar PDF: el archivo se genera en el servidor con logo y datos de empresa.', {
        bullets: ['Envía por email fuera de Domo o integra CRM', 'Plan Free puede incluir marca de agua'],
      }),
      S('Registrar cobros', 'Abre la factura → pagos. Indica importe, fecha y método (transferencia, efectivo, etc.).', {
        bullets: ['Cobros parciales dejan saldo pendiente', 'El Dashboard muestra vencidas con saldo > 0'],
      }),
      S('Rectificativas', 'Desde factura emitida, genera rectificativa para abonos o correcciones según normativa y permisos.', {
        bullets: ['Mantén referencia a factura original', 'Consulta con asesoría en casos complejos'],
      }),
      S('Informes relacionados', 'Consulta informe de Finanzas para aging de cobros y exporta Excel para tu gestor.', {
        bullets: ['Cruza con tesorería si está activa', 'Export CSV desde informes Premium'],
      }),
    ],
    faq: [{ q: 'El PDF no descarga', a: 'Comprueba permisos y que la factura esté emitida; revisa bloqueador de pop-ups.' }],
  },
  {
    id: 'presupuestos',
    module: 'Ventas',
    title: 'Presupuestos',
    summary: 'Los presupuestos (ofertas) capturan propuestas comerciales antes del pedido. Permiten negociar y convertir en venta con un clic.',
    objectives: ['Crear ofertas', 'Enviar PDF al cliente', 'Convertir en pedido'],
    prerequisites: ['Clientes y productos', 'Permiso quotes.read / quotes.write'],
    screenshot: 'quotes.png',
    steps: [
      S('Acceder a Presupuestos', 'Ventas → Presupuestos. Identifica estado: borrador, enviado, aceptado, rechazado.', { screenshot: 'quotes.png' }),
      S('Nuevo presupuesto', 'Selecciona cliente, validez de la oferta y líneas de producto/servicio con precios.', {
        bullets: ['Añade condiciones en observaciones', 'Revisa descuentos globales'],
      }),
      S('Enviar al cliente', 'Genera PDF e imágen de marca. Marca como enviado para seguimiento interno.', {
        bullets: ['Guarda copia en email o CRM', 'Registra fecha de envío en notas'],
      }),
      S('Seguimiento comercial', 'Si el cliente negocia, edita el presupuesto en borrador o duplica y ajusta.', {
        bullets: ['Evita múltiples versiones sin numerar', 'Usa CRM pipeline en plan Premium'],
      }),
      S('Aceptación y conversión', 'Marca aceptado y convierte a pedido. Las líneas pasan al pedido automáticamente.', {
        bullets: ['Revisa almacén y plazos en el pedido', 'Continúa flujo hasta factura'],
      }),
      S('Presupuesto no ganado', 'Marca rechazado o deja constancia en notas para estadísticas de conversión.', {
        bullets: ['Informe de ventas muestra tasa de conversión', 'Analiza motivos en reuniones comerciales'],
      }),
    ],
    faq: [{ q: '¿Puedo duplicar un presupuesto?', a: 'Sí, úsalo como plantilla para clientes similares.' }],
  },
  {
    id: 'productos',
    module: 'Inventario',
    title: 'Productos',
    summary: 'El catálogo de productos alimenta pedidos, facturas y stock. Define SKU, precios, impuestos y mínimos por almacén.',
    objectives: ['Dar de alta productos', 'Gestionar precios e IVA', 'Configurar stock mínimo'],
    prerequisites: ['Permiso products.read / products.write', 'Categorías opcionales'],
    screenshot: 'products.png',
    steps: [
      S('Listado de productos', 'Inventario → Productos. Busca por nombre, SKU o categoría.', { screenshot: 'products.png' }),
      S('Alta de producto', 'Nuevo: SKU único, nombre, descripción, precio venta, coste si aplica, tipo IVA y unidad (ud, kg, caja).', {
        bullets: ['SKU recomendado para códigos de barras', 'Activa/desactiva producto sin borrar histórico'],
      }),
      S('Stock por almacén', 'En ficha o movimientos, asigna stock inicial por almacén.', {
        bullets: ['Suma total aparece en informes', 'Movimientos auditables'],
      }),
      S('Stock mínimo y alertas', 'Define mínimo para alertas en Dashboard y listados críticos.', {
        bullets: ['Ajusta según estacionalidad', 'Revisa informe valoración stock'],
      }),
      S('Precios y actualizaciones masivas', 'Edita precio en ficha; para muchos productos consulta importación con admin.', {
        bullets: ['Documenta cambios de tarifa', 'Comunica a ventas'],
      }),
      S('Uso en documentos', 'Al añadir línea en pedido/factura, busca producto; precio y IVA se proponen automáticamente.', {
        bullets: ['Puedes sobrescribir precio si tienes permiso', 'Producto inactivo no debería aparecer en nuevos docs'],
      }),
    ],
    faq: [{ q: 'Stock negativo', a: 'Revisa si permitís venta sin stock; ajusta con movimiento de entrada.' }],
  },
  {
    id: 'categorias',
    module: 'Inventario',
    title: 'Categorías de producto',
    summary: 'Organiza el catálogo en familias para filtros, informes y navegación más clara.',
    objectives: ['Crear jerarquía simple', 'Asignar productos'],
    prerequisites: ['Permiso sobre productos'],
    screenshot: 'categories.png',
    steps: [
      S('Abrir categorías', 'Inventario → Categorías.', { screenshot: 'categories.png' }),
      S('Crear categoría', 'Nombre claro (p. ej. «Periféricos», «Servicios»). Guarda.', { bullets: ['Evita duplicados similares'] }),
      S('Asignar en producto', 'Edita producto y elige categoría.', { bullets: ['Un producto, una categoría principal'] }),
      S('Filtrar informes', 'Usa categoría en listados e informes de inventario.', { bullets: ['Revisa valoración por familia'] }),
    ],
    faq: [],
  },
  {
    id: 'almacenes',
    module: 'Inventario',
    title: 'Almacenes',
    summary: 'Representa ubicaciones físicas o lógicas donde guardas stock.',
    objectives: ['Crear almacenes', 'Seleccionarlos en pedidos'],
    prerequisites: ['Permiso products/warehouses'],
    screenshot: 'warehouses.png',
    steps: [
      S('Listado', 'Inventario → Almacenes.', { screenshot: 'warehouses.png' }),
      S('Nuevo almacén', 'Nombre, código opcional, dirección.', { bullets: ['Central vs tienda vs depósito'] }),
      S('Operar con pedidos', 'Elige almacén en pedido de venta/compra.', { bullets: ['Stock se descuenta del elegido'] }),
      S('Transferencias', 'Usa movimientos entre almacenes si tu flujo lo requiere.', { bullets: ['Salida en origen, entrada en destino'] }),
    ],
    faq: [],
  },
  {
    id: 'movimientos-stock',
    module: 'Inventario',
    title: 'Movimientos de stock',
    summary: 'Registra entradas, salidas y ajustes con trazabilidad.',
    objectives: ['Registrar movimientos correctos', 'Conciliar con inventario físico'],
    prerequisites: ['Productos y almacenes definidos'],
    screenshot: 'stock-movements.png',
    steps: [
      S('Acceder', 'Inventario → Movimientos.', { screenshot: 'stock-movements.png' }),
      S('Nuevo movimiento', 'Tipo, producto, cantidad, almacén, referencia.', { bullets: ['Entrada: compra/devolución', 'Salida: rotura/muestra'] }),
      S('Ajuste de inventario', 'Tras conteo físico, ajusta diferencias con motivo.', { bullets: ['Documenta responsable'] }),
      S('Auditoría', 'Filtra por fechas y exporta si necesitas auditoría.', { bullets: ['Cruza con informe valoración'] }),
      S('Errores frecuentes', 'Cantidad con signo equivocado o almacén incorrecto.', { tip: 'Revisa stock antes y después en ficha producto.' }),
    ],
    faq: [],
  },
  {
    id: 'proveedores',
    module: 'Compras',
    title: 'Proveedores',
    summary: 'Directorio de proveedores para órdenes de compra y pagos.',
    objectives: ['Alta de proveedores', 'Usarlos en compras'],
    prerequisites: ['Permiso suppliers.read'],
    screenshot: 'suppliers.png',
    steps: [
      S('Listado', 'Compras → Proveedores.', { screenshot: 'suppliers.png' }),
      S('Alta', 'Datos fiscales, contacto, plazo de pago.', { bullets: ['IBAN para tesorería futura'] }),
      S('Asociar a orden de compra', 'Selecciona en nueva OC.', { bullets: ['Mismos criterios que clientes'] }),
    ],
    faq: [],
  },
  {
    id: 'ordenes-compra',
    module: 'Compras',
    title: 'Órdenes de compra',
    summary: 'Documenta compras a proveedor y recepción de mercancía.',
    objectives: ['Crear OC', 'Recepcionar', 'Imprimir PDF'],
    prerequisites: ['Proveedores y productos'],
    screenshot: 'purchase-orders.png',
    steps: [
      S('Nueva orden', 'Compras → Órdenes → Nueva. Proveedor, líneas, fechas.', { screenshot: 'purchase-orders.png' }),
      S('Enviar a proveedor', 'PDF/imprimir y marcar enviada.', { bullets: ['Guarda referencia proveedor'] }),
      S('Recepción', 'Confirma cantidades recibidas; stock puede incrementarse.', { bullets: ['Recepción parcial si aplica'] }),
      S('Cierre', 'Marca completada cuando todo entró.', { bullets: ['Liga con factura proveedor externamente'] }),
    ],
    faq: [],
  },
  {
    id: 'informe-ventas',
    module: 'Informes',
    title: 'Informe de ventas',
    summary: 'Analiza pedidos, presupuestos y clientes en un periodo.',
    planNote: 'Requiere plan Premium o trial.',
    objectives: ['Filtrar periodos', 'Leer KPIs', 'Exportar CSV/Excel'],
    prerequisites: ['Permiso reports.read', 'Datos en el rango de fechas'],
    screenshot: 'reports-sales.png',
    steps: [
      S('Abrir informe', 'Informes → Ventas.', { screenshot: 'reports-sales.png' }),
      S('Rango de fechas', 'Desde/Hasta → Aplicar. Usa mismas fechas al exportar.', { bullets: ['Incluye hoy si quieres parcial mes'] }),
      S('Interpretar resumen', 'Pedidos, importes, presupuestos y conversión.', { bullets: ['Conversión = aceptados / total'] }),
      S('Tablas detalle', 'Estados de pedido y top clientes.', { bullets: ['Clic en cliente lleva a ficha si enlace activo'] }),
      S('Exportar CSV', 'Botón CSV: espera generación y descarga.', { bullets: ['Abre en Excel', 'UTF-8 para acentos'] }),
      S('Exportar Excel', 'Botón Excel: mismo periodo aplicado.', { bullets: ['Si tarda, no cierres la pestaña', 'Requiere API y cola activa'] }),
      S('Compartir con dirección', 'Exporta y envía por email; no compartas datos personales sin permiso.', { tip: 'Programa revisión mensual con mismos filtros.' }),
    ],
    faq: [{ q: 'Exportación se queda cargando', a: 'Reinicia backend en dev o arranca worker; en producción contacta soporte.' }],
  },
  {
    id: 'informe-finanzas',
    module: 'Informes',
    title: 'Informe financiero',
    summary: 'Visión de facturación, cobros y pendientes.',
    planNote: 'Requiere plan Premium o trial.',
    objectives: ['Controlar cobros', 'Detectar vencidas'],
    prerequisites: ['Facturas emitidas'],
    screenshot: 'reports-finance.png',
    steps: [
      S('Acceder', 'Informes → Finanzas.', { screenshot: 'reports-finance.png' }),
      S('Aplicar periodo', 'Desde/Hasta → Aplicar.', { bullets: ['Alinea con cierre contable'] }),
      S('Revisar vencidas', 'Lista saldo pendiente y antigüedad.', { bullets: ['Prioriza importes altos'] }),
      S('Exportar', 'CSV/Excel para gestoría.', { bullets: ['Mismas fechas que pantalla'] }),
    ],
    faq: [],
  },
  {
    id: 'valoracion-stock',
    module: 'Informes',
    title: 'Valoración de stock',
    summary: 'Valor económico del inventario.',
    planNote: 'Requiere plan Premium o trial.',
    objectives: ['Ver valor por almacén/producto'],
    prerequisites: ['Stock y costes definidos'],
    screenshot: 'reports-stock.png',
    steps: [
      S('Abrir', 'Informes → Valoración stock.', { screenshot: 'reports-stock.png' }),
      S('Leer totales', 'Unidades y valor.', { bullets: ['Criterio coste medio según config'] }),
      S('Acciones', 'Detecta obsoletos con movimiento bajo.', { bullets: ['Planifica promociones'] }),
    ],
    faq: [],
  },
  {
    id: 'contabilidad',
    module: 'Contabilidad',
    title: 'Contabilidad básica',
    summary: 'Consulta asientos y resúmenes contables simplificados.',
    planNote: 'Módulo Premium.',
    objectives: ['Navegar asientos', 'Entender origen de datos'],
    prerequisites: ['Facturación activa'],
    screenshot: 'accounting.png',
    steps: [
      S('Acceder', 'Menú Contabilidad.', { screenshot: 'accounting.png' }),
      S('Revisar periodo', 'Selecciona mes o rango.', { bullets: ['Coherencia con facturas'] }),
      S('Detalle asiento', 'Abre línea para ver cuenta e importe.', { bullets: ['No editar sin criterio contable'] }),
      S('Cierre con gestor', 'Exporta informes financieros para asesor.', { bullets: [] }),
    ],
    faq: [],
  },
  {
    id: 'crm',
    module: 'CRM',
    title: 'CRM y pipeline',
    summary: 'Gestiona oportunidades comerciales en tablero kanban.',
    planNote: 'Módulo Premium.',
    objectives: ['Mover oportunidades', 'Configurar etapas'],
    prerequisites: ['Permiso crm.read'],
    screenshot: 'crm.png',
    steps: [
      S('Pipeline', 'CRM → Pipeline.', { screenshot: 'crm.png' }),
      S('Nueva oportunidad', 'Crea tarjeta con cliente, importe, etapa.', { bullets: ['Asigna responsable'] }),
      S('Arrastrar etapas', 'Mueve de prospecto a ganado.', { bullets: ['Registra pérdida con motivo'] }),
      S('Configuración', 'Etapas, plantillas email/SMS según plan.', { bullets: ['Menú CRM → Configuración'] }),
      S('Enlace con ventas', 'Al ganar, crea presupuesto o pedido.', { bullets: ['Mantén mismo cliente'] }),
    ],
    faq: [],
  },
  {
    id: 'tesoreria',
    module: 'Tesorería',
    title: 'Tesorería',
    summary: 'Saldos bancarios y movimientos de caja.',
    planNote: 'Módulo Premium.',
    objectives: ['Ver cuentas', 'Registrar movimientos'],
    prerequisites: ['Permiso treasury.read'],
    screenshot: 'treasury.png',
    steps: [
      S('Panel', 'Menú Tesorería.', { screenshot: 'treasury.png' }),
      S('Cuentas', 'Revisa saldo por cuenta.', { bullets: ['Concilia con banco'] }),
      S('Movimientos', 'Entradas/salidas manuales.', { bullets: ['Vincula a factura si procede'] }),
    ],
    faq: [],
  },
  {
    id: 'proyectos',
    module: 'Proyectos',
    title: 'Proyectos',
    summary: 'Seguimiento de proyectos y costes asociados.',
    planNote: 'Plan Enterprise.',
    objectives: ['Crear proyecto', 'Monitorizar avance'],
    prerequisites: ['Permiso projects.read'],
    screenshot: 'projects.png',
    steps: [
      S('Alta', 'Proyectos → Nuevo.', { screenshot: 'projects.png' }),
      S('Planificación', 'Fechas, cliente, presupuesto.', { bullets: ['Define hitos'] }),
      S('Costes', 'Imputa horas/materiales según funciones activas.', { bullets: [] }),
    ],
    faq: [],
  },
  {
    id: 'fabricacion',
    module: 'Fabricación',
    title: 'Fabricación',
    summary: 'Órdenes de fabricación y consumo de materiales.',
    planNote: 'Plan Enterprise.',
    objectives: ['Lanzar OF', 'Registrar producción'],
    prerequisites: ['Lista materiales/BOM'],
    screenshot: 'manufacturing.png',
    steps: [
      S('Nueva OF', 'Fabricación → Nueva.', { screenshot: 'manufacturing.png' }),
      S('Componentes', 'Domo propone consumo según BOM.', { bullets: ['Verifica stock componentes'] }),
      S('Cierre', 'Producto terminado entra a stock.', { bullets: ['Mermas en movimiento si aplica'] }),
    ],
    faq: [],
  },
  {
    id: 'empleados',
    module: 'RRHH',
    title: 'Empleados',
    summary: 'Fichas de empleados vinculadas a usuarios.',
    objectives: ['Alta empleado', 'Vincular login'],
    prerequisites: ['Permiso employees.read'],
    screenshot: 'employees.png',
    steps: [
      S('Listado', 'RRHH → Empleados.', { screenshot: 'employees.png' }),
      S('Alta', 'Datos personales y puesto.', { bullets: ['Documentación según RRHH legal'] }),
      S('Usuario Domo', 'Invita email corporativo y asigna rol.', { bullets: ['Principio mínimo privilegio'] }),
    ],
    faq: [],
  },
  {
    id: 'configuracion',
    module: 'Administración',
    title: 'Configuración de la empresa',
    summary: 'Centro de ajustes: empresa, usuarios, roles, facturación Domo y seguridad.',
    objectives: ['Administrar usuarios', 'Configurar empresa', 'Gestionar plan'],
    prerequisites: ['Rol administrador para cambios sensibles'],
    screenshot: 'settings.png',
    steps: [
      S('Abrir configuración', 'Icono engranaje o menú → Configuración.', { screenshot: 'settings.png' }),
      S('Datos empresa', 'Logo, moneda, formatos fecha/número.', { bullets: ['Afecta PDFs e informes'] }),
      S('Usuarios e invitaciones', 'Invita email, revoca acceso.', { bullets: ['Invitación expira si no se usa'] }),
      S('Roles y permisos', 'Define qué módulos ve cada rol.', { bullets: ['Prueba con usuario test'] }),
      S('Seguridad', '2FA, cerrar sesión, cambio contraseña.', { bullets: ['Obliga 2FA si política empresa'] }),
      S('Facturación Domo', 'Plan actual, límites, upgrade.', { bullets: ['Trial Premium 14 días en registro'] }),
      S('Manuales', 'Enlace Manuales de uso (PDF) descarga guías por módulo.', { bullets: ['Comparte con nuevos empleados'] }),
    ],
    faq: [{ q: 'No puedo invitar usuarios', a: 'Has alcanzado límite del plan; upgrade o libera usuarios inactivos.' }],
  },
];

export const MANUAL_SCREENSHOT_ROUTES = [
  { file: 'dashboard.png', path: '/dashboard' },
  { file: 'clients.png', path: '/clients' },
  { file: 'orders.png', path: '/orders' },
  { file: 'invoices.png', path: '/invoices' },
  { file: 'quotes.png', path: '/quotes' },
  { file: 'products.png', path: '/products' },
  { file: 'categories.png', path: '/categories' },
  { file: 'warehouses.png', path: '/warehouses' },
  { file: 'stock-movements.png', path: '/inventory/movements' },
  { file: 'suppliers.png', path: '/suppliers' },
  { file: 'purchase-orders.png', path: '/purchase-orders' },
  { file: 'reports-sales.png', path: '/reports/sales' },
  { file: 'reports-finance.png', path: '/reports/finance' },
  { file: 'reports-stock.png', path: '/reports/stock-valuation' },
  { file: 'accounting.png', path: '/accounting' },
  { file: 'crm.png', path: '/crm' },
  { file: 'treasury.png', path: '/treasury' },
  { file: 'projects.png', path: '/projects' },
  { file: 'manufacturing.png', path: '/manufacturing' },
  { file: 'employees.png', path: '/hr/employees' },
  { file: 'settings.png', path: '/settings' },
];
