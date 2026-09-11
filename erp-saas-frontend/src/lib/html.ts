/** Convierte HTML a texto plano seguro para previsualizaciones (sin ejecutar el markup). */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const withBreaks = html
    .replace(/<(br|\/p|\/div|\/li)\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
