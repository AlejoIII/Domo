import { cn } from '@/lib/cn';
import {
  DomoLogoHorizontalSvg,
  DomoLogoStackedSvg,
  DomoMarkSvg,
} from '@/components/brand/DomoLogoSvg';

type DomoLogoVariant = 'full' | 'mark' | 'stacked';

type DomoLogoProps = {
  variant?: DomoLogoVariant;
  className?: string;
  decorative?: boolean;
};

export function DomoLogo({ variant = 'full', className, decorative = true }: DomoLogoProps) {
  const a11y = decorative ? ({ 'aria-hidden': true } as const) : {};

  if (variant === 'mark') {
    return <DomoMarkSvg className={cn('h-9 w-9 shrink-0', className)} {...a11y} />;
  }

  if (variant === 'stacked') {
    return (
      <DomoLogoStackedSvg className={cn('mx-auto h-auto w-full max-w-[220px]', className)} {...a11y} />
    );
  }

  return (
    <DomoLogoHorizontalSvg className={cn('h-8 w-auto max-w-[168px] shrink-0', className)} {...a11y} />
  );
}
