import { useEffect, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';

import { Loader } from '@/components/ui/Loader';

import { FormLabel } from '@/components/forms/FormLabel';

import { useDraftDirty } from '@/hooks/useDraftDirty';

import {

  createClientNote,

  deleteClientNote,

  fetchClientNotes,

} from '@/services/clients.service';



export function ClientNotesSection({

  clientId,

  onDirtyChange,

}: {

  clientId: string;

  onDirtyChange?: (dirty: boolean) => void;

}) {

  const queryClient = useQueryClient();

  const [text, setText] = useState('');

  const { isDirty, markClean } = useDraftDirty({ text }, clientId);



  useEffect(() => {

    onDirtyChange?.(isDirty);

  }, [isDirty, onDirtyChange]);



  const { data: notes, isLoading, isError } = useQuery({

    queryKey: ['client', clientId, 'notes'],

    queryFn: () => fetchClientNotes(clientId),

  });



  const createMutation = useMutation({

    mutationFn: (noteText: string) => createClientNote(clientId, noteText),

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['client', clientId, 'notes'] });

      queryClient.invalidateQueries({ queryKey: ['client', clientId, 'timeline'] });

      setText('');

      markClean();

    },

  });



  const deleteMutation = useMutation({

    mutationFn: (noteId: string) => deleteClientNote(clientId, noteId),

    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['client', clientId, 'notes'] });

      queryClient.invalidateQueries({ queryKey: ['client', clientId, 'timeline'] });

    },

  });



  return (

    <Card className="space-y-4 p-6">

      <h2 className="text-lg font-semibold">Notas CRM</h2>



      <div className="space-y-2">

        <FormLabel required>Nueva nota</FormLabel>

        <textarea

          className="min-h-[80px] w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"

          placeholder="Añadir nota sobre el cliente…"

          value={text}

          onChange={(e) => setText(e.target.value)}

        />

        <Button

          loading={createMutation.isPending}

          disabled={!text.trim()}

          onClick={() => createMutation.mutate(text.trim())}

        >

          Guardar nota

        </Button>

      </div>



      {isLoading ? (

        <div className="flex justify-center py-6"><Loader /></div>

      ) : isError ? (

        <p className="text-sm text-red-600">No se pudieron cargar las notas.</p>

      ) : !notes?.length ? (

        <p className="text-sm text-muted-foreground">Sin notas todavía.</p>

      ) : (

        <ul className="space-y-3">

          {notes.map((note) => {

            const author = note.user

              ? [note.user.firstName, note.user.lastName].filter(Boolean).join(' ') || note.user.email

              : 'Usuario';

            return (

              <li

                key={note.id}

                className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3"

              >

                <div className="min-w-0">

                  <p className="whitespace-pre-wrap text-sm">{note.text}</p>

                  <p className="mt-1 text-xs text-muted-foreground">

                    {author} · {new Date(note.createdAt).toLocaleString('es-ES')}

                  </p>

                </div>

                <button

                  type="button"

                  className="rounded p-2 text-red-600 hover:bg-red-500/10"

                  title="Eliminar nota"

                  onClick={() => {

                    if (!confirm('¿Eliminar esta nota?')) return;

                    deleteMutation.mutate(note.id);

                  }}

                >

                  <Trash2 className="h-4 w-4" />

                </button>

              </li>

            );

          })}

        </ul>

      )}

    </Card>

  );

}


