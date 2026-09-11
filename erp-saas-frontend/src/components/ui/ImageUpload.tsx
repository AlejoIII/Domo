import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { uploadImage, resolveImageUrl, uploadErrorMessage } from '@/services/upload.service';
import { useUploadUrl } from '@/hooks/useUploadUrl';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | undefined) => void;
  label?: string;
  hint?: string;
  className?: string;
  variant?: 'default' | 'avatar';
}

export function ImageUpload({
  value,
  onChange,
  label = 'Imagen',
  hint = 'JPEG, PNG, WebP o GIF. Máx. 5 MB.',
  className,
  variant = 'default',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: signedUrl } = useUploadUrl(value);
  const preview = signedUrl ?? resolveImageUrl(value);
  const isAvatar = variant === 'avatar';

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className={cn('rounded-lg border border-border/60 bg-muted/15 p-3', className)}>
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          disabled={uploading}
          onClick={openPicker}
          className={cn(
            'group relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-border/70 bg-background transition hover:border-primary/40 hover:bg-muted/30',
            isAvatar ? 'h-16 w-16 rounded-full' : 'h-20 w-20 rounded-lg',
          )}
        >
          {uploading ? (
            <Loader />
          ) : preview ? (
            <>
              <img
                src={preview}
                alt=""
                className={cn('h-full w-full object-cover', isAvatar && 'rounded-full')}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                Cambiar
              </span>
            </>
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            loading={uploading}
            onClick={openPicker}
          >
            {preview ? 'Cambiar' : 'Subir'}
          </Button>
          {preview && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
