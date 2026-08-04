import { useCallback } from 'react';

import { useAsync, type RecursoAsincrono } from '@/hooks/useAsync';
import {
  getMuscleGroups,
  limpiarCacheCatalogo,
  type MuscleGroupSummary,
} from '@/services/exercises.service';

const SIN_GRUPOS: readonly MuscleGroupSummary[] = [];

/**
 * Los grupos musculares que el catálogo contiene de verdad, con su conteo.
 *
 * La lista no está escrita a mano en ningún sitio: sale de agrupar el JSON.
 * Añadir ejercicios de un grupo nuevo lo hace aparecer solo, y quitarlos
 * todos lo hace desaparecer, sin tocar código.
 */
export function useMuscleGroups(): RecursoAsincrono<readonly MuscleGroupSummary[]> {
  const { estado, datos, error, reintentar: reintentarCarga } = useAsync(getMuscleGroups, SIN_GRUPOS);

  /* Reintentar tras un fallo tiene que volver a la red de verdad, no
     devolver lo que quedó en memoria. */
  const reintentar = useCallback(() => {
    limpiarCacheCatalogo();
    reintentarCarga();
  }, [reintentarCarga]);

  return { estado, datos, error, reintentar };
}
