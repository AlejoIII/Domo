export const CLIENT_SEGMENT_LABELS: Record<string, string> = {
  lead: 'Lead',
  active: 'Activo',
  inactive: 'Inactivo',
};

export function clientSegmentLabel(segment?: string | null) {
  if (!segment) return 'Activo';
  return CLIENT_SEGMENT_LABELS[segment] ?? segment;
}

export function clientSegmentBadgeVariant(segment?: string | null): 'default' | 'success' | 'muted' | 'danger' {
  if (segment === 'lead') return 'default';
  if (segment === 'inactive') return 'muted';
  return 'success';
}
