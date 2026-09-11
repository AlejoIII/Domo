import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, ChevronUp, GripVertical, Lock, RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { getNavigationMenuEntries, mergeNavigationPrefs } from '@/lib/navigation-utils';
import { PLAN_FEATURE_LABELS, PLAN_UPGRADE_HINT, planIncludesFeature } from '@/config/plan-features.config';
import { useNavigationPrefs } from '@/hooks/useNavigationPrefs';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { updateNavigationSettings } from '@/services/settings.service';
import type { NavigationPrefs } from '@/types/navigation.types';

interface NavigationSettingsSectionProps {
  canWrite: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export function NavigationSettingsSection({ canWrite, onDirtyChange }: NavigationSettingsSectionProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useNavigationPrefs();
  const menuEntries = useMemo(() => getNavigationMenuEntries(), []);

  const serverPrefs = useMemo(
    () => mergeNavigationPrefs(data?.prefs),
    [data?.prefs],
  );

  const [draft, setDraft] = useState<NavigationPrefs>(serverPrefs);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDraft(mergeNavigationPrefs(data?.prefs));
  }, [data?.prefs]);

  const { isDirty, markClean } = useDraftDirty(draft, data?.prefs ? JSON.stringify(data.prefs) : 'loading');

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const planFeatures = data?.plan.features ?? {};
  const hiddenSet = useMemo(() => new Set(draft.hiddenIds ?? []), [draft.hiddenIds]);

  const saveMutation = useMutation({
    mutationFn: () => updateNavigationSettings(draft),
    onSuccess: (result) => {
      queryClient.setQueryData(['settings', 'navigation'], result);
      markClean();
    },
  });

  const toggleHidden = (id: string, visible: boolean) => {
    setDraft((prev) => {
      const hidden = new Set(prev.hiddenIds ?? []);
      if (visible) hidden.delete(id);
      else hidden.add(id);
      return { ...prev, hiddenIds: [...hidden] };
    });
  };

  const moveItem = (ids: string[], id: string, dir: -1 | 1) => {
    const idx = ids.indexOf(id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= ids.length) return ids;
    const copy = [...ids];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    return copy;
  };

  const orderedTop = draft.itemOrder ?? menuEntries.map((e) => e.id);

  const resetDefaults = () => {
    setDraft(mergeNavigationPrefs(undefined));
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader /></div>;
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-600">No se pudo cargar la configuración de navegación.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Barra lateral</h2>
            <p className="text-sm text-muted-foreground">
              Elige qué módulos mostrar y en qué orden. Plan actual:{' '}
              <strong>{data?.plan.name ?? 'Free'}</strong>.
              Algunos módulos requieren un plan superior.
            </p>
          </div>
          {canWrite && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={resetDefaults}>
                <RotateCcw className="h-4 w-4" />
                Restablecer
              </Button>
              <Button
                type="button"
                loading={saveMutation.isPending}
                disabled={!isDirty}
                onClick={() => saveMutation.mutate()}
              >
                Guardar navegación
              </Button>
            </div>
          )}
        </div>

        {!canWrite && (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Solo lectura: necesitas permiso de escritura en configuración.
          </p>
        )}

        <ul className="space-y-2">
          {orderedTop.map((id, index) => {
            const entry = menuEntries.find((e) => e.id === id);
            if (!entry) return null;

            const onPlan = planIncludesFeature(planFeatures, entry.planFeature);
            const isVisible = !hiddenSet.has(entry.id);
            const isExpanded = expanded[entry.id] ?? false;
            const upgradePlan = entry.planFeature ? PLAN_UPGRADE_HINT[entry.planFeature] : null;

            return (
              <li
                key={entry.id}
                className={cn(
                  'rounded-xl border border-border/60 bg-card',
                  !onPlan && 'opacity-75',
                )}
              >
                <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 font-medium">{entry.label}</span>

                  {!onPlan && entry.planFeature && (
                    <Badge variant="muted">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Plan {upgradePlan ?? 'superior'}
                      </span>
                    </Badge>
                  )}

                  {canWrite && onPlan && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => setDraft((p) => ({
                          ...p,
                          itemOrder: moveItem(orderedTop, entry.id, -1),
                        }))}
                        aria-label="Subir"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={index === orderedTop.length - 1}
                        onClick={() => setDraft((p) => ({
                          ...p,
                          itemOrder: moveItem(orderedTop, entry.id, 1),
                        }))}
                        aria-label="Bajar"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <label className={cn('flex items-center gap-2 text-sm', !canWrite && 'opacity-60')}>
                    <input
                      type="checkbox"
                      checked={onPlan && isVisible}
                      disabled={!canWrite || !onPlan}
                      onChange={(e) => toggleHidden(entry.id, e.target.checked)}
                    />
                    Visible
                  </label>

                  {entry.children.length > 0 && onPlan && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setExpanded((p) => ({ ...p, [entry.id]: !isExpanded }))}
                    >
                      {isExpanded ? 'Ocultar subopciones' : 'Subopciones'}
                    </button>
                  )}
                </div>

                {isExpanded && entry.children.length > 0 && onPlan && (
                  <ul className="border-t border-border/40 px-3 py-2 space-y-1">
                    {(draft.childOrder?.[entry.id] ?? entry.children.map((c) => c.id)).map((childId, childIndex, arr) => {
                      const child = entry.children.find((c) => c.id === childId);
                      if (!child) return null;
                      const childVisible = !hiddenSet.has(child.id);
                      return (
                        <li
                          key={child.id}
                          className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-sm"
                        >
                          <span className="flex-1">{child.label}</span>
                          {canWrite && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={childIndex === 0}
                                onClick={() => setDraft((p) => ({
                                  ...p,
                                  childOrder: {
                                    ...p.childOrder,
                                    [entry.id]: moveItem(arr, child.id, -1),
                                  },
                                }))}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={childIndex === arr.length - 1}
                                onClick={() => setDraft((p) => ({
                                  ...p,
                                  childOrder: {
                                    ...p.childOrder,
                                    [entry.id]: moveItem(arr, child.id, 1),
                                  },
                                }))}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={childVisible}
                                  onChange={(e) => toggleHidden(child.id, e.target.checked)}
                                />
                                Visible
                              </label>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p>
            Los módulos bloqueados por plan no se pueden activar hasta que mejores tu suscripción.
          </p>
          <p>
            <Link to="/settings?tab=billing" className="text-primary hover:underline">
              Ver plan y facturación →
            </Link>
          </p>
          {data?.plan.features && (
            <p className="pt-1">
              Incluidos en tu plan:{' '}
              {Object.entries(data.plan.features)
                .filter(([, v]) => v)
                .map(([k]) => PLAN_FEATURE_LABELS[k] ?? k)
                .join(', ') || 'módulos base'}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
