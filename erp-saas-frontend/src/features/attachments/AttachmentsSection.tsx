import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Paperclip, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { TableImagePreview } from '@/components/ui/TableImagePreview';
import {
  createAttachment, deleteAttachment, fetchAttachments,
  type Attachment,
} from '@/services/attachments.service';
import { uploadFile, uploadErrorMessage, fetchSignedUploadUrl } from '@/services/upload.service';
import {
  ATTACHMENT_ACCEPT,
  attachmentWritePermission,
  DEFAULT_MAX_UPLOAD_MB,
  isImageAttachment,
  type AttachmentEntityType,
} from '@/lib/attachmentEntity';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/cn';

interface AttachmentsSectionProps {
  entityType: AttachmentEntityType;
  entityId: string;
  maxUploadMb?: number;
}

function AttachmentImageTile({
  item,
  canWrite,
  onDelete,
  deleting,
}: {
  item: Attachment;
  canWrite: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="group relative">
      <TableImagePreview
        src={item.fileUrl}
        alt={item.fileName}
        title={item.fileName}
        className="h-24 w-24 sm:h-28 sm:w-28"
      />
      {canWrite && (
        <button
          type="button"
          disabled={deleting}
          title={`Eliminar ${item.fileName}`}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`¿Eliminar ${item.fileName}?`)) onDelete();
          }}
          className={cn(
            'absolute right-1.5 top-1.5 rounded-md bg-black/55 p-1.5 text-white opacity-0 transition',
            'hover:bg-red-600 group-hover:opacity-100',
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function AttachmentsSection({
  entityType,
  entityId,
  maxUploadMb = DEFAULT_MAX_UPLOAD_MB,
}: AttachmentsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission(attachmentWritePermission(entityType));
  const queryKey = ['attachments', entityType, entityId];
  const maxBytes = maxUploadMb * 1024 * 1024;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchAttachments(entityType, entityId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadError(null);
      setUploadSuccess(null);
      if (file.size > maxBytes) {
        throw new Error(`El archivo supera el límite de ${maxUploadMb} MB`);
      }
      const uploaded = await uploadFile(file);
      return createAttachment({
        entityType,
        entityId,
        fileName: uploaded.fileName,
        fileUrl: uploaded.url,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      });
    },
    onSuccess: (attachment) => {
      queryClient.invalidateQueries({ queryKey });
      setUploadSuccess(`${attachment.fileName} guardado`);
      window.setTimeout(() => setUploadSuccess(null), 3000);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error && err.message
        ? err.message
        : uploadErrorMessage(err);
      setUploadError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const items = data ?? [];
  const images = items.filter((item) => isImageAttachment(item.mimeType, item.fileName));
  const documents = items.filter((item) => !isImageAttachment(item.mimeType, item.fileName));

  const openPicker = () => inputRef.current?.click();

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Adjuntos</h2>
        <p className="text-sm text-muted-foreground">
          Se guardan al subirlas (no hace falta pulsar Guardar). Máx. {maxUploadMb} MB.
        </p>
      </div>

      {uploadSuccess && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
          {uploadSuccess}
        </p>
      )}
      {uploadError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader /></div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {images.map((item) => (
              <AttachmentImageTile
                key={item.id}
                item={item}
                canWrite={canWrite}
                deleting={deletingId === item.id}
                onDelete={() => deleteMutation.mutate(item.id)}
              />
            ))}
            {canWrite && (
              <button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={openPicker}
                className={cn(
                  'flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed',
                  'border-border/70 bg-muted/15 text-muted-foreground transition',
                  'hover:border-primary/40 hover:bg-muted/30 hover:text-foreground',
                  'sm:h-28 sm:w-28',
                )}
              >
                {uploadMutation.isPending ? (
                  <Loader />
                ) : (
                  <>
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs font-medium">Añadir</span>
                  </>
                )}
              </button>
            )}
          </div>

          {!canWrite && images.length === 0 && documents.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin adjuntos todavía.</p>
          )}

          {canWrite && images.length === 0 && documents.length === 0 && !uploadMutation.isPending && (
            <p className="text-sm text-muted-foreground">
              Pulsa <strong>Añadir</strong> para subir imágenes o documentos.
            </p>
          )}

          {documents.length > 0 && (
            <div className="space-y-2 border-t border-border/60 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documentos
              </p>
              <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
                {documents.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 text-left hover:text-primary"
                      onClick={async () => {
                        try {
                          const url = await fetchSignedUploadUrl(item.fileUrl);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch {
                          setUploadError('No se pudo abrir el archivo');
                        }
                      }}
                    >
                      <Paperclip className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.fileName}</span>
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        className="rounded p-2 text-red-600 hover:bg-red-500/10"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${item.fileName}?`)) deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadMutation.mutate(file);
          e.target.value = '';
        }}
      />
    </Card>
  );
}
