export const marketingPlans = [
  {
    name: 'Free',
    price: '0 €',
    period: '/mes',
    description: 'Para emprendedores que empiezan',
    features: [
      'Ventas, compras e inventario básico',
      'Hasta 2 usuarios',
      'Adjuntos en documentos',
      'Trial Premium 14 días al registrarte',
    ],
    cta: 'Empezar gratis',
    href: '/register',
    highlight: false,
    footnote: 'Ideal para usuario único',
  },
  {
    name: 'Premium',
    price: '49 €',
    period: '/mes',
    description: 'Para PYMEs en crecimiento',
    features: [
      'Informes, CRM, tesorería y contabilidad',
      'Personalización de apariencia',
      'Webhooks e integraciones',
      'PDF sin marca de agua',
    ],
    cta: 'Comenzar prueba gratis',
    href: '/register',
    highlight: true,
    footnote: 'Usuarios múltiples',
  },
  {
    name: 'Enterprise',
    price: '149 €',
    period: '/mes',
    description: 'Operaciones complejas y API',
    features: [
      'Proyectos y fabricación',
      'API REST completa',
      'Usuarios ilimitados',
      'Soporte prioritario',
    ],
    cta: 'Contactar ventas',
    href: '/contact',
    highlight: false,
    footnote: 'Equipos grandes y partners',
  },
] as const;

export const marketingFeatureHighlights = [
  'Ventas, pedidos y facturación conectados',
  'Inventario y almacenes en tiempo real',
  'Informes y CRM para hacer crecer tu negocio',
  'Usuarios y permisos por rol',
] as const;
