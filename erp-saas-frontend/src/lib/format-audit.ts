type Gender = 'm' | 'f';

interface EntityDef {
  label: string;
  gender: Gender;
}

const ENTITIES: Record<string, EntityDef> = {
  clients: { label: 'cliente', gender: 'm' },
  client: { label: 'cliente', gender: 'm' },
  products: { label: 'producto', gender: 'm' },
  product: { label: 'producto', gender: 'm' },
  orders: { label: 'pedido', gender: 'm' },
  order: { label: 'pedido', gender: 'm' },
  invoices: { label: 'factura', gender: 'f' },
  invoice: { label: 'factura', gender: 'f' },
  quotes: { label: 'presupuesto', gender: 'm' },
  quote: { label: 'presupuesto', gender: 'm' },
  suppliers: { label: 'proveedor', gender: 'm' },
  supplier: { label: 'proveedor', gender: 'm' },
  employees: { label: 'empleado', gender: 'm' },
  employee: { label: 'empleado', gender: 'm' },
  categories: { label: 'categoría', gender: 'f' },
  category: { label: 'categoría', gender: 'f' },
  warehouses: { label: 'almacén', gender: 'm' },
  warehouse: { label: 'almacén', gender: 'm' },
  'purchase-orders': { label: 'orden de compra', gender: 'f' },
  purchase_orders: { label: 'orden de compra', gender: 'f' },
  purchase_order: { label: 'orden de compra', gender: 'f' },
  roles: { label: 'rol', gender: 'm' },
  role: { label: 'rol', gender: 'm' },
  settings: { label: 'configuración', gender: 'f' },
  integrations: { label: 'integración', gender: 'f' },
  integration: { label: 'integración', gender: 'f' },
  attachments: { label: 'adjunto', gender: 'm' },
  attachment: { label: 'adjunto', gender: 'm' },
  notifications: { label: 'notificación', gender: 'f' },
  billing: { label: 'facturación', gender: 'f' },
  invitations: { label: 'invitación', gender: 'f' },
  invitation: { label: 'invitación', gender: 'f' },
  'api-keys': { label: 'clave API', gender: 'f' },
  api_keys: { label: 'clave API', gender: 'f' },
  webhooks: { label: 'webhook', gender: 'm' },
  payments: { label: 'pago', gender: 'm' },
  payment: { label: 'pago', gender: 'm' },
  notes: { label: 'nota', gender: 'f' },
  note: { label: 'nota', gender: 'f' },
  company: { label: 'empresa', gender: 'f' },
  companies: { label: 'empresa', gender: 'f' },
  profile: { label: 'perfil', gender: 'm' },
  users: { label: 'usuario', gender: 'm' },
  user: { label: 'usuario', gender: 'm' },
  'form-layouts': { label: 'formulario', gender: 'm' },
  form_layouts: { label: 'formulario', gender: 'm' },
  form_layout: { label: 'formulario', gender: 'm' },
  platform: { label: 'plataforma', gender: 'f' },
  system: { label: 'sistema', gender: 'm' },
  privacy: { label: 'privacidad', gender: 'f' },
  crm: { label: 'CRM', gender: 'm' },
  leads: { label: 'lead', gender: 'm' },
  lead: { label: 'lead', gender: 'm' },
  opportunities: { label: 'oportunidad', gender: 'f' },
  opportunity: { label: 'oportunidad', gender: 'f' },
  activities: { label: 'actividad', gender: 'f' },
  activity: { label: 'actividad', gender: 'f' },
  incidents: { label: 'incidencia', gender: 'f' },
  incident: { label: 'incidencia', gender: 'f' },
  stages: { label: 'etapa', gender: 'f' },
  stage: { label: 'etapa', gender: 'f' },
  projects: { label: 'proyecto', gender: 'm' },
  project: { label: 'proyecto', gender: 'm' },
  treasury: { label: 'tesorería', gender: 'f' },
  accounts: { label: 'cuenta bancaria', gender: 'f' },
  account: { label: 'cuenta bancaria', gender: 'f' },
  movements: { label: 'movimiento', gender: 'm' },
  movement: { label: 'movimiento', gender: 'm' },
  manufacturing: { label: 'fabricación', gender: 'f' },
  boms: { label: 'lista de materiales', gender: 'f' },
  bom: { label: 'lista de materiales', gender: 'f' },
  feedback: { label: 'comentario', gender: 'm' },
  navigation: { label: 'navegación', gender: 'f' },
};

/** Traducciones exactas para códigos de acción conocidos. */
const ACTION_LABELS: Record<string, string> = {
  // Plataforma (super-admin)
  'company.suspend': 'Suspendió una empresa',
  'company.reactivate': 'Reactivó una empresa',
  'company.plan_change': 'Cambió el plan de una empresa',
  'company.trial_extend': 'Extendió el periodo de prueba',
  'company.notes_update': 'Actualizó las notas internas de una empresa',
  'user.activate': 'Activó un usuario',
  'user.deactivate': 'Desactivó un usuario',
  'impersonate.start': 'Entró como usuario de otra empresa',
  'settings.maintenance': 'Activó o desactivó el modo mantenimiento',
  'settings.registration': 'Cambió la configuración de registro beta',
  'beta.invite_create': 'Creó una invitación beta',
  'beta.invite_revoke': 'Revocó una invitación beta',

  // Entidades — crear
  'client.create': 'Creó un cliente',
  'product.create': 'Creó un producto',
  'order.create': 'Creó un pedido',
  'invoice.create': 'Creó una factura',
  'quote.create': 'Creó un presupuesto',
  'supplier.create': 'Creó un proveedor',
  'employee.create': 'Creó un empleado',
  'category.create': 'Creó una categoría',
  'warehouse.create': 'Creó un almacén',
  'purchase_order.create': 'Creó una orden de compra',
  'role.create': 'Creó un rol',
  'invitation.create': 'Envió una invitación',

  // Entidades — actualizar
  'client.update': 'Actualizó un cliente',
  'product.update': 'Actualizó un producto',
  'order.update': 'Actualizó un pedido',
  'invoice.update': 'Actualizó una factura',
  'quote.update': 'Actualizó un presupuesto',
  'supplier.update': 'Actualizó un proveedor',
  'employee.update': 'Actualizó un empleado',
  'category.update': 'Actualizó una categoría',
  'warehouse.update': 'Actualizó un almacén',
  'purchase_order.update': 'Actualizó una orden de compra',
  'role.update': 'Actualizó un rol',
  'settings.update': 'Actualizó la configuración',
  'settings.company': 'Actualizó los datos de la empresa',
  'settings.profile': 'Actualizó su perfil',
  'settings.notifications': 'Actualizó las preferencias de notificaciones',
  'settings.onboarding': 'Completó el proceso de onboarding',

  // Entidades — eliminar
  'client.delete': 'Eliminó un cliente',
  'product.delete': 'Eliminó un producto',
  'order.delete': 'Eliminó un pedido',
  'invoice.delete': 'Eliminó una factura',
  'quote.delete': 'Eliminó un presupuesto',
  'supplier.delete': 'Eliminó un proveedor',
  'employee.delete': 'Eliminó un empleado',
  'category.delete': 'Eliminó una categoría',
  'warehouse.delete': 'Eliminó un almacén',
  'purchase_order.delete': 'Eliminó una orden de compra',
  'role.delete': 'Eliminó un rol',
  'invitation.revoke': 'Revocó una invitación',
  'client.note.delete': 'Eliminó una nota de cliente',

  // Acciones especiales
  'quote.convert_to_order': 'Convirtió un presupuesto en pedido',
  'order.convert_to_invoice': 'Convirtió un pedido en factura',
  'quote.duplicate': 'Duplicó un presupuesto',
  'order.duplicate': 'Duplicó un pedido',
  'invoice.duplicate': 'Duplicó una factura',
  'purchase_order.duplicate': 'Duplicó una orden de compra',
  'quote.send_email': 'Envió un presupuesto por email',
  'invoice.send_email': 'Envió una factura por email',
  'invoice.payments': 'Registró un cobro en una factura',
  'invoice.credit_note': 'Emitió una factura rectificativa',
  'invoice.cancel': 'Anuló una factura',
  'order.unconfirm': 'Deshizo la confirmación de un pedido',
  'client.notes': 'Añadió una nota a un cliente',
  'warehouse.stock': 'Actualizó el stock de un almacén',
  'profile.password_change': 'Cambió su contraseña',
  'integration.api_keys': 'Creó una clave API',
  'integration.webhooks': 'Creó un webhook',
  'integration.webhook.delete': 'Eliminó un webhook',
  'integration.api_key.delete': 'Revocó una clave API',
  'billing.checkout': 'Inició la mejora de plan',
  'billing.portal': 'Abrió el portal de facturación',
  'billing.sync': 'Sincronizó la suscripción con Stripe',
  'billing.demo_plan': 'Cambió el plan de demostración',
  'platform.impersonate': 'Entró como usuario de otra empresa',
  'platform.status': 'Cambió el estado de una empresa',
  'platform.plan': 'Cambió el plan de una empresa',
  'platform.trial': 'Extendió el periodo de prueba de una empresa',
  'platform.notes': 'Actualizó las notas internas de una empresa',
  'platform.maintenance': 'Cambió el modo mantenimiento',
  'platform.user.status': 'Cambió el estado de un usuario',
  'post.platform.companies.id.impersonate': 'Entró como usuario de otra empresa',
  'patch.platform.companies.id.status': 'Cambió el estado de una empresa',
  'patch.platform.companies.id.plan': 'Cambió el plan de una empresa',
  'patch.platform.companies.id.trial': 'Extendió el periodo de prueba',
  'patch.platform.companies.id.notes': 'Actualizó las notas internas de una empresa',
  'patch.platform.users.id.status': 'Cambió el estado de un usuario',
  'patch.platform.settings.maintenance': 'Cambió el modo mantenimiento',

  // Privacidad / RGPD
  'privacy.data_exported': 'Exportó los datos de la empresa',
  'privacy.client_exported': 'Exportó los datos de un cliente',
  'privacy.client_anonymized': 'Anonimizó un cliente',
  'privacy.company_data_deleted': 'Dio de baja la cuenta y suprimió datos personales',
  'privacy.anonymize': 'Anonimizó un cliente',
  'delete.privacy.company': 'Dio de baja la cuenta y suprimió datos personales',

  // Ajustes adicionales
  'settings.navigation': 'Actualizó la navegación del menú',
  'settings.form_layouts': 'Personalizó un formulario',
  'settings.entityid': 'Personalizó un formulario',
  'settings.:entityid': 'Personalizó un formulario',
  'form_layout.update': 'Personalizó un formulario',
  'form_layout.delete': 'Restableció un formulario',
  'settings.users.role': 'Cambió el rol de un usuario',
  'patch.settings.navigation': 'Actualizó la navegación del menú',
  'patch.settings.form_layouts.entityid': 'Personalizó un formulario',
  'delete.settings.form_layouts.entityid': 'Restableció un formulario',
  'patch.settings.company': 'Actualizó los datos de la empresa',
  'patch.settings.profile': 'Actualizó su perfil',
  'patch.settings.notifications': 'Actualizó las preferencias de notificaciones',
  'patch.settings.onboarding': 'Completó el recorrido de onboarding',
  'post.settings.change_password': 'Cambió su contraseña',
  'post.settings.invitations': 'Envió una invitación',
  'delete.settings.invitations.id': 'Revocó una invitación',

  // CRM (códigos semánticos + fallbacks HTTP del interceptor)
  'crm.create': 'Creó un registro de CRM',
  'crm.update': 'Actualizó un registro de CRM',
  'crm.delete': 'Eliminó un registro de CRM',
  'crm.stages': 'Creó una etapa de CRM',
  'crm.leads': 'Creó un lead',
  'crm.opportunities': 'Creó una oportunidad',
  'crm.activities': 'Creó una actividad',
  'crm.incidents': 'Creó una incidencia',
  'crm.convert': 'Convirtió un lead',
  'crm.convert_to_quote': 'Convirtió una oportunidad en presupuesto',
  'crm.complete': 'Completó una actividad',
  'crm.stage': 'Cambió la etapa de una oportunidad',
  'crm.reorder': 'Reordenó las etapas del CRM',
  'crm.send_email': 'Envió un email desde el CRM',
  'crm.send_sms': 'Envió un SMS desde el CRM',
  'crm.catalogs': 'Creó una opción del catálogo CRM',
  'crm.email_templates': 'Creó una plantilla de email',
  'crm.sms_templates': 'Creó una plantilla de SMS',
  'crm.email_settings': 'Actualizó el email del CRM',
  'crm.acrelia_accounts': 'Creó una cuenta Acrelia',
  'crm.category': 'Creó una opción del catálogo CRM',
  'post.crm.stages': 'Creó una etapa de CRM',
  'post.crm.leads': 'Creó un lead',
  'post.crm.opportunities': 'Creó una oportunidad',
  'post.crm.activities': 'Creó una actividad',
  'post.crm.incidents': 'Creó una incidencia',
  'post.crm.send_email': 'Envió un email desde el CRM',
  'post.crm.send_sms': 'Envió un SMS desde el CRM',
  'patch.crm.stages.id': 'Actualizó una etapa de CRM',
  'patch.crm.leads.id': 'Actualizó un lead',
  'patch.crm.opportunities.id': 'Actualizó una oportunidad',
  'patch.crm.activities.id': 'Actualizó una actividad',
  'patch.crm.incidents.id': 'Actualizó una incidencia',
  'delete.crm.stages.id': 'Eliminó una etapa de CRM',
  'delete.crm.leads.id': 'Eliminó un lead',
  'delete.crm.opportunities.id': 'Eliminó una oportunidad',
  'delete.crm.activities.id': 'Eliminó una actividad',
  'delete.crm.incidents.id': 'Eliminó una incidencia',
  'post.crm.config.catalogs.category': 'Creó una opción del catálogo CRM',
  'post.crm.config.email_templates': 'Creó una plantilla de email',
  'post.crm.config.sms_templates': 'Creó una plantilla de SMS',
  'post.crm.config.acrelia_accounts': 'Creó una cuenta Acrelia',
  'patch.crm.config.email_settings': 'Actualizó el email del CRM',
  'crm.config.catalogs': 'Gestionó el catálogo del CRM',
  'crm.config.email_templates': 'Gestionó una plantilla de email',
  'crm.config.sms_templates': 'Gestionó una plantilla de SMS',
  'crm.config.acrelia_accounts': 'Gestionó una cuenta Acrelia',
  'crm.config.email_settings': 'Actualizó el email del CRM',

  // Proyectos
  'projects.create': 'Creó un proyecto',
  'projects.update': 'Actualizó un proyecto',
  'projects.delete': 'Eliminó un proyecto',
  'projects.time_entries': 'Registró un parte de horas',
  'projects.generate_invoice': 'Generó una factura desde un proyecto',
  'post.projects': 'Creó un proyecto',
  'patch.projects.id': 'Actualizó un proyecto',
  'delete.projects.id': 'Eliminó un proyecto',
  'post.projects.id.time_entries': 'Registró un parte de horas',
  'post.projects.id.generate_invoice': 'Generó una factura desde un proyecto',
  'patch.projects.time_entries.entryid': 'Actualizó un parte de horas',
  'delete.projects.time_entries.entryid': 'Eliminó un parte de horas',

  // Tesorería
  'treasury.accounts': 'Creó una cuenta bancaria',
  'treasury.movements': 'Registró un movimiento de tesorería',
  'treasury.import': 'Importó movimientos bancarios',
  'treasury.reconcile': 'Concilió un movimiento bancario',
  'post.treasury.accounts': 'Creó una cuenta bancaria',
  'patch.treasury.accounts.id': 'Actualizó una cuenta bancaria',
  'delete.treasury.accounts.id': 'Eliminó una cuenta bancaria',
  'post.treasury.movements': 'Registró un movimiento de tesorería',
  'post.treasury.movements.import': 'Importó movimientos bancarios',
  'post.treasury.movements.id.reconcile': 'Concilió un movimiento bancario',
  'delete.treasury.movements.id.reconcile': 'Deshizo la conciliación de un movimiento',

  // Fabricación
  'manufacturing.boms': 'Creó una lista de materiales',
  'manufacturing.orders': 'Creó una orden de fabricación',
  'manufacturing.complete': 'Completó una orden de fabricación',
  'manufacturing.revert': 'Revirtió una orden de fabricación',
  'manufacturing.cancel': 'Canceló una orden de fabricación',
  'post.manufacturing.boms': 'Creó una lista de materiales',
  'patch.manufacturing.boms.id': 'Actualizó una lista de materiales',
  'delete.manufacturing.boms.id': 'Eliminó una lista de materiales',
  'post.manufacturing.orders': 'Creó una orden de fabricación',
  'patch.manufacturing.orders.id': 'Actualizó una orden de fabricación',
  'delete.manufacturing.orders.id': 'Eliminó una orden de fabricación',

  // Otros
  'feedback.create': 'Envió un comentario de feedback',
  'post.feedback': 'Envió un comentario de feedback',
  'attachment.create': 'Subió un adjunto',
  'attachment.delete': 'Eliminó un adjunto',
  'post.attachments': 'Subió un adjunto',
  'delete.attachments.id': 'Eliminó un adjunto',
  'delete.payments.paymentid': 'Anuló un cobro de factura',
  'delete.invoices.payments.paymentid': 'Anuló un cobro de factura',
  'post.privacy.clients.id.anonymize': 'Anonimizó un cliente',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  company: 'Empresa',
  user: 'Usuario',
  settings: 'Configuración',
  beta_invite: 'Invitación beta',
  platform: 'Plataforma',
  privacy: 'Privacidad',
  client: 'Cliente',
  invoice: 'Factura',
  project: 'Proyecto',
  crm: 'CRM',
};

function normalizeKey(key: string): string {
  return key.replace(/-/g, '_').replace(/^:/, '').toLowerCase();
}

function getEntity(key: string): EntityDef | null {
  const k = normalizeKey(key);
  return ENTITIES[k] ?? ENTITIES[key.replace(/_/g, '-')] ?? null;
}

function entityLabel(key: string): string {
  return getEntity(key)?.label ?? key.replace(/_/g, ' ');
}

function withArticle(entityKey: string, verb: 'create' | 'update' | 'delete'): string {
  const entity = getEntity(entityKey);
  if (!entity) {
    const verbs = { create: 'Creó', update: 'Actualizó', delete: 'Eliminó' };
    return `${verbs[verb]} ${entityLabel(entityKey)}`;
  }
  const article = entity.gender === 'f' ? 'una' : 'un';
  const verbs = { create: 'Creó', update: 'Actualizó', delete: 'Eliminó' };
  return `${verbs[verb]} ${article} ${entity.label}`;
}

function parseHttpAction(action: string): string {
  const match = action.match(/^(POST|PATCH|PUT|DELETE)\s+(.+)$/i);
  if (!match) return action;

  const [, method, rawPath] = match;
  const path = rawPath.split('?')[0] ?? rawPath;
  const segments = path
    .replace(/^\/api\/v\d+\//, '')
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean);

  if (segments.length === 0) return action;

  const code = `${method.toLowerCase()}.${segments.map((s) => s.replace(/^:/, '')).join('.')}`;
  if (ACTION_LABELS[code]) return ACTION_LABELS[code];

  const resource = segments[0]!;
  const m = method.toUpperCase();

  // Rutas de plataforma
  if (resource === 'platform') {
    const actionSeg = segments[segments.length - 1]!;
    if (actionSeg === 'impersonate') return ACTION_LABELS['platform.impersonate']!;
    if (actionSeg === 'status') return ACTION_LABELS['platform.status']!;
    if (actionSeg === 'plan') return ACTION_LABELS['platform.plan']!;
    if (actionSeg === 'trial') return ACTION_LABELS['platform.trial']!;
    if (actionSeg === 'notes') return ACTION_LABELS['platform.notes']!;
    if (actionSeg === 'maintenance') return ACTION_LABELS['platform.maintenance']!;
    if (segments.includes('users') && actionSeg === 'status') {
      return ACTION_LABELS['platform.user.status']!;
    }
  }

  // POST /resource/:id/sub-action
  if (m === 'POST' && segments.length >= 3) {
    const sub = segments[segments.length - 1]!;
    const subKey = `${normalizeKey(resource)}.${sub.replace(/-/g, '_')}`;
    if (ACTION_LABELS[subKey]) return ACTION_LABELS[subKey];

    const subLabels: Record<string, string> = {
      'convert-to-order': 'Convirtió un presupuesto en pedido',
      'convert-to-invoice': 'Convirtió un pedido en factura',
      'convert-to-quote': 'Convirtió una oportunidad en presupuesto',
      'credit-note': 'Emitió una factura rectificativa',
      cancel: resource === 'invoices'
        ? 'Anuló una factura'
        : 'Canceló el registro',
      unconfirm: 'Deshizo la confirmación de un pedido',
      anonymize: 'Anonimizó un cliente',
      duplicate: withArticle(resource, 'create').replace('Creó', 'Duplicó'),
      'send-email': `Envió ${getEntity(resource)?.gender === 'f' ? 'una' : 'un'} ${entityLabel(resource)} por email`,
      'send-sms': 'Envió un SMS desde el CRM',
      payments: 'Registró un cobro en una factura',
      notes: 'Añadió una nota a un cliente',
      'time-entries': 'Registró un parte de horas',
      'generate-invoice': 'Generó una factura desde un proyecto',
      complete: 'Completó el registro',
      revert: 'Revirtió el registro',
      convert: 'Convirtió un lead',
      reconcile: 'Concilió un movimiento bancario',
      import: 'Importó movimientos bancarios',
      test: 'Probó un webhook',
      impersonate: 'Entró como usuario de otra empresa',
      checkout: 'Inició la mejora de plan',
      portal: 'Abrió el portal de facturación',
      sync: 'Sincronizó la suscripción con Stripe',
    };
    if (subLabels[sub]) return subLabels[sub];
  }

  // PATCH /resource/:id/sub
  if (['PATCH', 'PUT'].includes(m) && segments.length >= 3) {
    const sub = segments[segments.length - 1]!;
    const subKey = `${normalizeKey(resource)}.${sub.replace(/-/g, '_')}`;
    if (ACTION_LABELS[subKey]) return ACTION_LABELS[subKey];

    const patchLabels: Record<string, string> = {
      stock: 'Actualizó el stock de un almacén',
      role: 'Cambió el rol de un usuario',
      notifications: 'Actualizó las preferencias de notificaciones',
      onboarding: 'Completó el proceso de onboarding',
      company: 'Actualizó los datos de la empresa',
      profile: 'Actualizó su perfil',
      maintenance: 'Cambió el modo mantenimiento',
      status: 'Cambió el estado del registro',
      plan: 'Cambió el plan',
      trial: 'Extendió el periodo de prueba',
      notes: 'Actualizó las notas internas',
    };
    if (patchLabels[sub]) return patchLabels[sub];
  }

  if (m === 'DELETE') {
    if (segments.includes('notes')) return 'Eliminó una nota';
    if (resource === 'payments') return 'Anuló un cobro de factura';
    if (resource === 'privacy' && segments.includes('company')) {
      return 'Dio de baja la cuenta y suprimió datos personales';
    }
    if (resource === 'invitations' || segments.includes('invitations')) return 'Revocó una invitación';
    if (segments.includes('api-keys')) return 'Revocó una clave API';
    if (resource === 'webhooks' || segments.includes('webhooks')) return 'Eliminó un webhook';
    if (segments.includes('form-layouts')) return 'Restableció un formulario';
    if (segments[1] === ':id' || segments.length >= 2) {
      return withArticle(resource, 'delete');
    }
  }

  if (m === 'POST') {
    if (resource === 'settings' && segments.includes('change-password')) return 'Cambió su contraseña';
    if (resource === 'settings' && segments.includes('invitations')) return 'Envió una invitación';
    if (resource === 'integrations' && segments.includes('api-keys')) return 'Creó una clave API';
    if (resource === 'integrations' && segments.includes('webhooks')) return 'Creó un webhook';
    if (resource === 'billing') {
      if (segments.includes('checkout')) return 'Inició la mejora de plan';
      if (segments.includes('portal')) return 'Abrió el portal de facturación';
    }
    if (segments.length === 1 || segments[1] === ':id') {
      return withArticle(resource, 'create');
    }
  }

  if (['PATCH', 'PUT'].includes(m) && segments[1] === ':id' && segments.length === 2) {
    return withArticle(resource, 'update');
  }

  // Último recurso: frase genérica sin inglés crudo
  if (m === 'POST') return 'Creó un registro';
  if (['PATCH', 'PUT'].includes(m)) return 'Actualizó un registro';
  if (m === 'DELETE') return 'Eliminó un registro';
  return 'Acción registrada';
}

function articleFor(entityKey: string): string {
  return getEntity(entityKey)?.gender === 'f' ? 'una' : 'un';
}

function parseSemanticAction(action: string): string {
  const normalized = action.toLowerCase().trim().replace(/-/g, '_');

  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];
  if (ACTION_LABELS[action.toLowerCase().trim()]) {
    return ACTION_LABELS[action.toLowerCase().trim()]!;
  }

  if (normalized.includes('impersonate')) {
    return ACTION_LABELS['impersonate.start']!;
  }

  const parts = normalized.split('.').filter(Boolean).map((p) => p.replace(/^:/, ''));
  if (parts.length >= 2) {
    // post.crm.leads / patch.projects.id → quitar verbo HTTP y :id
    const httpVerb = ['post', 'patch', 'put', 'delete'].includes(parts[0]!)
      ? parts[0]!
      : null;
    const meaningful = (httpVerb ? parts.slice(1) : parts)
      .filter((p) => p !== 'id' && !p.endsWith('id') && p !== 'category');

    const joined = meaningful.join('.');
    if (ACTION_LABELS[joined]) return ACTION_LABELS[joined];

    const suffix = meaningful[meaningful.length - 1]!;
    const entityPart = meaningful.find((p) => getEntity(p) !== null)
      ?? meaningful[0]
      ?? parts[0]!;

    const compoundKey = meaningful.slice(-2).join('.');
    if (ACTION_LABELS[compoundKey]) return ACTION_LABELS[compoundKey];

    const entitySuffixKey = `${normalizeKey(entityPart)}.${suffix}`;
    if (ACTION_LABELS[entitySuffixKey]) return ACTION_LABELS[entitySuffixKey];

    const suffixMap: Record<string, string> = {
      create: withArticle(entityPart, 'create'),
      update: withArticle(entityPart, 'update'),
      delete: withArticle(entityPart, 'delete'),
      activate: `Activó ${articleFor(entityPart)} ${entityLabel(entityPart)}`,
      deactivate: `Desactivó ${articleFor(entityPart)} ${entityLabel(entityPart)}`,
      start: ACTION_LABELS['impersonate.start']!,
      suspend: ACTION_LABELS['company.suspend']!,
      reactivate: ACTION_LABELS['company.reactivate']!,
      credit_note: 'Emitió una factura rectificativa',
      cancel: entityPart.includes('invoice')
        ? 'Anuló una factura'
        : `Canceló ${articleFor(entityPart)} ${entityLabel(entityPart)}`,
      anonymize: 'Anonimizó un cliente',
      data_exported: 'Exportó los datos de la empresa',
      client_exported: 'Exportó los datos de un cliente',
      client_anonymized: 'Anonimizó un cliente',
      company_data_deleted: 'Dio de baja la cuenta y suprimió datos personales',
      payments: 'Registró un cobro en una factura',
      convert: 'Convirtió un lead',
      convert_to_order: 'Convirtió un presupuesto en pedido',
      convert_to_invoice: 'Convirtió un pedido en factura',
      convert_to_quote: 'Convirtió una oportunidad en presupuesto',
      send_email: `Envió ${articleFor(entityPart)} ${entityLabel(entityPart)} por email`,
      send_sms: 'Envió un SMS desde el CRM',
      duplicate: withArticle(entityPart, 'create').replace('Creó', 'Duplicó'),
      complete: `Completó ${articleFor(entityPart)} ${entityLabel(entityPart)}`,
      revert: `Revirtió ${articleFor(entityPart)} ${entityLabel(entityPart)}`,
      unconfirm: 'Deshizo la confirmación de un pedido',
      reconcile: 'Concilió un movimiento bancario',
      import: 'Importó movimientos bancarios',
      time_entries: 'Registró un parte de horas',
      generate_invoice: 'Generó una factura desde un proyecto',
      stock: 'Actualizó el stock de un almacén',
      navigation: 'Actualizó la navegación del menú',
      notes: entityPart === 'client'
        ? 'Añadió una nota a un cliente'
        : 'Actualizó las notas',
    };

    if (suffixMap[suffix]) return suffixMap[suffix];

    // Fallback HTTP: post.crm.leads → Creó un lead
    if (httpVerb && getEntity(suffix)) {
      if (httpVerb === 'post') return withArticle(suffix, 'create');
      if (httpVerb === 'delete') return withArticle(suffix, 'delete');
      return withArticle(suffix, 'update');
    }

    if (httpVerb === 'post') {
      return `Creó ${articleFor(entityPart)} ${entityLabel(entityPart)}`;
    }
    if (httpVerb === 'delete') {
      return `Eliminó ${articleFor(entityPart)} ${entityLabel(entityPart)}`;
    }
    if (httpVerb === 'patch' || httpVerb === 'put') {
      return `Actualizó ${articleFor(entityPart)} ${entityLabel(entityPart)}`;
    }
  }

  // Nunca devolver el código crudo en inglés
  return 'Acción registrada';
}

/** Texto legible para una acción de auditoría (empresa o plataforma). */
export function formatAuditAction(action: string): string {
  const trimmed = action.trim();
  if (!trimmed) return 'Acción registrada';

  const lower = trimmed.toLowerCase();
  const normalized = lower.replace(/-/g, '_');

  if (ACTION_LABELS[trimmed]) return ACTION_LABELS[trimmed];
  if (ACTION_LABELS[lower]) return ACTION_LABELS[lower];
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];

  if (/^(POST|PATCH|PUT|DELETE)\s+/i.test(trimmed)) {
    return parseHttpAction(trimmed);
  }

  if (trimmed.includes('.') || trimmed.includes('/')) {
    return parseSemanticAction(trimmed);
  }

  // Código suelto desconocido: no mostrar inglés crudo
  const entity = getEntity(normalized);
  if (entity) {
    return entity.label.charAt(0).toUpperCase() + entity.label.slice(1);
  }

  return 'Acción registrada';
}

/** Etiqueta legible para el tipo de objeto afectado (panel plataforma). */
export function formatAuditTargetType(targetType: string): string {
  return TARGET_TYPE_LABELS[targetType] ?? entityLabel(targetType);
}

/** Subtítulo con entidad traducida (sin UUID visible). */
export function formatAuditContext(
  entity?: string | null,
  entityId?: string | null,
): string | null {
  if (!entity) return entityId ? 'Registro del sistema' : null;
  const def = getEntity(entity);
  const label = def?.label ?? entity.replace(/_/g, ' ');
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
  return entityId ? capitalized : label;
}
