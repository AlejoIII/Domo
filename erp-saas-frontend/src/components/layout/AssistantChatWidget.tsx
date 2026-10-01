import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Construction, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import {
  fetchAssistantStatus,
  sendAssistantMessage,
  type AssistantChatMessage,
} from '@/services/assistant.service';

/** Pon `VITE_ASSISTANT_LIVE=true` en `.env` local para activar el chat con IA (solo pruebas internas). */
const ASSISTANT_LIVE = import.meta.env.VITE_ASSISTANT_LIVE === 'true';

const STARTER: AssistantChatMessage = {
  role: 'assistant',
  content:
    'Hola, soy la ayuda de Domo. Pregúntame cómo usar la app: importación CSV, facturas, permisos, configuración… No accedo a tus datos ni resuelvo incidencias técnicas.',
};

function AssistantComingSoonPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed bottom-24 right-6 z-[200] flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      role="dialog"
      aria-label="Asistente Domo — en desarrollo"
    >
      <header className="flex items-start gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">Asistente Domo</p>
            <Badge variant="muted">En desarrollo</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Próximamente disponible</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="space-y-4 p-4">
        <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
          <Construction className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <div className="space-y-2 text-foreground/90">
            <p>
              Estamos preparando una <strong>agente de ayuda con IA</strong> para resolver dudas de
              uso de Domo (menús, importaciones, permisos, flujos habituales).
            </p>
            <p className="text-muted-foreground">
              Todavía <strong>no está disponible</strong> para uso general. Cuando esté lista, podrás
              abrirla desde este mismo botón.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Mientras tanto</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Usa el icono de <strong>feedback</strong> en la cabecera para comentarios o dudas.
            </li>
            <li>
              Importación masiva:{' '}
              <Link to="/settings?tab=import" className="text-primary underline-offset-2 hover:underline">
                Configuración → Importación
              </Link>
            </li>
          </ul>
        </div>

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Función en beta interna; avisaremos cuando se publique.
        </p>
      </div>
    </div>
  );
}

function AssistantLivePanel({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantChatMessage[]>([STARTER]);
  const listRef = useRef<HTMLDivElement>(null);

  const statusQuery = useQuery({
    queryKey: ['assistant', 'status'],
    queryFn: fetchAssistantStatus,
    staleTime: 30_000,
    retry: 1,
  });

  const enabled = statusQuery.data?.enabled === true;

  const chatMutation = useMutation({
    mutationFn: (text: string) => {
      const history = messages.slice(1).slice(-8);
      return sendAssistantMessage(text, history);
    },
    onSuccess: (data, text) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: data.reply },
      ]);
      setInput('');
    },
  });

  useEffect(() => {
    void statusQuery.refetch();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const submit = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending || !enabled) return;
    chatMutation.mutate(text);
  };

  const errorMessage = chatMutation.isError
    ? isAxiosError(chatMutation.error)
      ? (chatMutation.error.response?.data?.message ?? 'No se pudo enviar el mensaje')
      : 'Error de conexión'
    : null;

  return (
    <div
      className="fixed bottom-24 right-6 z-[200] flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      role="dialog"
      aria-label="Chat de ayuda Domo"
    >
      <header className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Ayuda Domo</p>
          <p className="truncate text-xs text-muted-foreground">Modo prueba interna</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={listRef} className="flex max-h-72 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              m.role === 'user'
                ? 'ml-6 bg-primary/10 text-foreground'
                : 'mr-4 bg-muted text-foreground',
            )}
          >
            {m.content}
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="mr-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Loader size="sm" />
            Escribiendo…
          </div>
        )}
      </div>

      {!enabled && !statusQuery.isLoading && (
        <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          Configura <code className="text-[11px]">OPENAI_API_KEY</code> en el backend para probar el chat.
        </p>
      )}

      {errorMessage && (
        <p className="px-4 pb-2 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      <div className="border-t border-border/60 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={!enabled || chatMutation.isPending}
            placeholder={enabled ? 'Ej: ¿Cómo importo clientes?' : 'Asistente no configurado'}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            type="button"
            disabled={!enabled || !input.trim() || chatMutation.isPending}
            onClick={submit}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AssistantChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-6 right-6 z-[200] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform',
          ASSISTANT_LIVE
            ? 'bg-primary text-primary-foreground hover:scale-105'
            : 'bg-primary/90 text-primary-foreground ring-2 ring-amber-500/40 hover:scale-105',
          open && 'scale-95',
        )}
        aria-label={open ? 'Cerrar asistente Domo' : 'Asistente Domo — en desarrollo'}
        title={ASSISTANT_LIVE ? 'Ayuda Domo' : 'Asistente Domo (en desarrollo)'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {!ASSISTANT_LIVE && !open && (
        <span
          className="pointer-events-none fixed bottom-[4.35rem] right-6 z-[200] rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow"
          aria-hidden
        >
          Próximamente
        </span>
      )}

      {open &&
        (ASSISTANT_LIVE ? (
          <AssistantLivePanel onClose={() => setOpen(false)} />
        ) : (
          <AssistantComingSoonPanel onClose={() => setOpen(false)} />
        ))}
    </>
  );
}
