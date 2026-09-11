export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
      <p className="text-muted-foreground">{title} — módulo pendiente</p>
    </div>
  );
}
