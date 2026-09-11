export function parseDateRange(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
  if (!from?.trim() && !to?.trim()) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (from?.trim()) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    range.gte = start;
  }
  if (to?.trim()) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return range;
}
