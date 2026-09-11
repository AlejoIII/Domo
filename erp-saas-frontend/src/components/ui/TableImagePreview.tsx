import { useState, useEffect } from 'react';
import { ZoomIn, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { resolveImageUrl } from '@/services/upload.service';
import { useUploadUrl } from '@/hooks/useUploadUrl';
import { Loader } from '@/components/ui/Loader';

interface TableImagePreviewProps {
  src?: string | null;
  alt?: string;
  title?: string;
  variant?: 'square' | 'circle';
  className?: string;
}

export function TableImagePreview({
  src,
  alt = '',
  title,
  variant = 'square',
  className,
}: TableImagePreviewProps) {
  const [open, setOpen] = useState(false);
  const { data: signedUrl, isLoading } = useUploadUrl(src);
  const url = signedUrl ?? resolveImageUrl(src);
  const rounded = variant === 'circle' ? 'rounded-full' : 'rounded-lg';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (isLoading && !url) {
    return (
      <div className={cn(
        'flex shrink-0 items-center justify-center border border-border/60 bg-muted/30',
        rounded,
        variant === 'circle' ? 'h-11 w-11' : 'h-14 w-14',
        className,
      )}>
        <Loader />
      </div>
    );
  }

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        title="Ver imagen"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          'group relative block shrink-0 overflow-hidden border border-border/60 bg-muted/30 shadow-sm transition hover:border-primary/40 hover:shadow-md',
          rounded,
          variant === 'circle' ? 'h-11 w-11' : 'h-14 w-14',
          className,
        )}
      >
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn('h-full w-full object-cover object-center', rounded)}
        />
        <span className={cn(
          'absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100',
          rounded,
        )}>
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 via-card to-card px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <ZoomIn className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-tight text-foreground">
                    {title ?? alt ?? 'Imagen'}
                  </p>
                  <p className="text-xs text-muted-foreground">Vista ampliada</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex max-h-[calc(88vh-4.5rem)] min-h-[28rem] items-center justify-center overflow-hidden bg-muted/20 p-4 sm:min-h-[32rem] sm:p-6">
              <img
                src={url}
                alt={alt}
                className="max-h-[min(70vh,640px)] w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
