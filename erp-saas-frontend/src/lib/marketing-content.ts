import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Boxes,
  FileText,
  Handshake,
  Lock,
  Receipt,
  ShoppingCart,
  Sparkles,
  Users,
  Warehouse,
  Workflow,
} from 'lucide-react';

export const marketingFeatureModules: {
  title: string;
  description: string;
  icon: LucideIcon;
  bullets: string[];
}[] = [
  {
    title: 'Ventas y documentos',
    description: 'Del presupuesto al cobro, con trazabilidad en cada paso.',
    icon: ShoppingCart,
    bullets: [
      'Pedidos, presupuestos y facturas conectados',
      'Estados claros y numeración automática',
      'PDF listos para enviar al cliente',
    ],
  },
  {
    title: 'Inventario y almacenes',
    description: 'Stock fiable en uno o varios almacenes.',
    icon: Warehouse,
    bullets: [
      'Movimientos de entrada y salida',
      'Productos, categorías y proveedores',
      'Valoración y alertas de stock',
    ],
  },
  {
    title: 'Finanzas e informes',
    description: 'Visión del negocio sin exportar a hojas de cálculo.',
    icon: BarChart3,
    bullets: [
      'Informes de ventas y finanzas',
      'Tesorería y contabilidad básica (Premium)',
      'Dashboard con indicadores clave',
    ],
  },
  {
    title: 'CRM y relaciones',
    description: 'Seguimiento comercial integrado con tus clientes.',
    icon: Handshake,
    bullets: [
      'Pipeline y etapas personalizables',
      'Historial en la ficha del cliente',
      'Plantillas y comunicaciones (según plan)',
    ],
  },
  {
    title: 'Equipo y permisos',
    description: 'Cada persona ve solo lo que necesita.',
    icon: Users,
    bullets: [
      'Roles y permisos granulares',
      'Invitaciones por email',
      'Auditoría de acciones sensibles',
    ],
  },
  {
    title: 'Operaciones avanzadas',
    description: 'Para equipos que escalan procesos (Enterprise).',
    icon: Workflow,
    bullets: [
      'Proyectos y fabricación',
      'API y webhooks para integraciones',
      'Soporte prioritario',
    ],
  },
];

export const marketingWorkflowSteps = [
  {
    step: '1',
    title: 'Regístrate',
    text: 'Crea tu empresa y usuarios iniciales en pocos minutos.',
    icon: Sparkles,
  },
  {
    step: '2',
    title: 'Configura',
    text: 'Importa clientes, productos y almacenes con el asistente.',
    icon: Boxes,
  },
  {
    step: '3',
    title: 'Opera',
    text: 'Emite pedidos y facturas desde un único panel.',
    icon: FileText,
  },
  {
    step: '4',
    title: 'Crece',
    text: 'Activa Premium o Enterprise cuando lo necesites.',
    icon: Receipt,
  },
];

export const marketingValues = [
  {
    title: 'Claridad',
    description: 'Interfaces pensadas para el día a día, sin jerga innecesaria.',
    icon: Sparkles,
  },
  {
    title: 'Confianza',
    description: 'Datos aislados por empresa, copias de seguridad y controles de acceso.',
    icon: Lock,
  },
  {
    title: 'Crecimiento',
    description: 'Empieza gratis y sube de plan sin migrar a otro software.',
    icon: BarChart3,
  },
];

export const marketingFaqs = [
  {
    q: '¿Necesito tarjeta para registrarme?',
    a: 'No. Puedes crear cuenta gratis y probar Premium durante 14 días sin introducir datos de pago.',
  },
  {
    q: '¿Puedo cambiar de plan más adelante?',
    a: 'Sí. Puedes pasar de Free a Premium o Enterprise cuando tu equipo lo necesite desde ajustes de facturación.',
  },
  {
    q: '¿Qué incluye Enterprise?',
    a: 'Módulos avanzados (proyectos, fabricación), API, webhooks, usuarios ilimitados y soporte prioritario.',
  },
  {
    q: '¿Dónde se alojan mis datos?',
    a: 'Domo es un ERP en la nube con aislamiento por empresa. Consulta privacidad y cookies en el pie de página.',
  },
];

export const pricingComparisonRows: {
  label: string;
  free: string | boolean;
  premium: string | boolean;
  enterprise: string | boolean;
}[] = [
  { label: 'Usuarios', free: 'Hasta 2', premium: 'Múltiples', enterprise: 'Ilimitados' },
  { label: 'Informes avanzados', free: false, premium: true, enterprise: true },
  { label: 'CRM y tesorería', free: false, premium: true, enterprise: true },
  { label: 'Contabilidad básica', free: false, premium: true, enterprise: true },
  { label: 'Marca de agua en PDF', free: true, premium: false, enterprise: false },
  { label: 'Proyectos y fabricación', free: false, premium: false, enterprise: true },
  { label: 'API y webhooks', free: false, premium: 'Webhooks', enterprise: true },
  { label: 'Soporte', free: 'Comunidad', premium: 'Email', enterprise: 'Prioritario' },
];
