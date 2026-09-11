import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageSquarePlus, Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { submitFeedback } from '@/services/feedback.service';
import { cn } from '@/lib/cn';

export function BetaFeedbackButton() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => submitFeedback({
      message,
      rating: rating ?? undefined,
      page: location.pathname,
    }),
    onSuccess: () => {
      setDone(true);
      setMessage('');
      setRating(null);
    },
  });

  const close = () => {
    setOpen(false);
    setDone(false);
    mutation.reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-2 transition-colors duration-300 ease-in-out hover:bg-muted"
        title="Enviar feedback beta"
        aria-label="Enviar feedback beta"
      >
        <MessageSquarePlus className="h-4 w-4" />
      </button>

      <Modal open={open} onClose={close} title="Feedback beta">
        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gracias — tu mensaje ayuda a mejorar Domo antes del lanzamiento.
            </p>
            <Button className="w-full" onClick={close}>Cerrar</Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Valoración (opcional)</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={cn(
                      'rounded p-1 transition',
                      rating != null && value <= rating ? 'text-amber-500' : 'text-muted-foreground',
                    )}
                  >
                    <Star className="h-5 w-5 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="beta-feedback-message" className="mb-2 block text-sm font-medium">
                ¿Qué mejorarías?
              </label>
              <textarea
                id="beta-feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                minLength={5}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Cuéntanos qué funciona bien y qué te falta..."
              />
            </div>
            {mutation.isError && (
              <p className="text-sm text-red-600">No se pudo enviar. Inténtalo de nuevo.</p>
            )}
            <Button type="submit" className="w-full" loading={mutation.isPending} disabled={message.trim().length < 5}>
              Enviar feedback
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
