import { cn } from '@/lib/cn';

interface MarketingPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: MarketingPageHeaderProps) {
  return (
    <header
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">{eyebrow}</p>
      )}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && (
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
