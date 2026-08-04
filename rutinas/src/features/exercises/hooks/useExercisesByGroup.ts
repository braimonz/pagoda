import { useMemo } from 'react';

import { useAsync, type RecursoAsincrono } from '@/hooks/useAsync';
import { getExercisesByGroup } from '@/services/exercises.service';
import type { Exercise, MuscleGroupId } from '@/types/exercise';

const SIN_EJERCICIOS: readonly Exercise[] = [];

/**
 * Los ejercicios de un grupo muscular.
 *
 * Con `grupoId` en null no carga nada y queda inactivo: es el estado
 * mientras el socio todavía no ha elegido grupo.
 *
 * Pasa por el servicio en lugar de filtrar en el componente aunque hoy el
 * catálogo completo ya esté en memoria. Cuesta lo mismo —el servicio
 * mantiene un índice por grupo— y deja lista la costura para el día en que
 * los ejercicios lleguen paginados desde la API.
 */
export function useExercisesByGroup(
  grupoId: MuscleGroupId | null,
): RecursoAsincrono<readonly Exercise[]> {
  /* Se recrea solo cuando cambia el grupo, que es exactamente cuando debe
     volver a cargar. */
  const cargar = useMemo(
    () => (grupoId === null ? null : () => getExercisesByGroup(grupoId)),
    [grupoId],
  );

  return useAsync(cargar, SIN_EJERCICIOS);
}
