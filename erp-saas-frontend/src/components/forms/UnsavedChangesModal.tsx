import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface UnsavedChangesModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({ open, onConfirm, onCancel }: UnsavedChangesModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Cambios sin guardar">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Quieres salir sin guardar?
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Seguir editando
          </Button>
          <Button type="button" variant="secondary" onClick={onConfirm}>
            Salir sin guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
