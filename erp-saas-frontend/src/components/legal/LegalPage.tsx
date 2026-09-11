import { ReactNode } from 'react';

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">Última actualización: {updated}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
