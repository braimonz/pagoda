import { useMemo } from 'react';

import { useAsync, type RecursoAsincrono } from '@/hooks/useAsync';
import { getExercisesByGroups, type SeccionGrupo } from '@/services/exercises.service';
import type { MuscleGroupId } from '@/types/exercise';

const SIN_SECCIONES: readonly SeccionGrupo[] = [];

/**
 * Los ejercicios de varios grupos, ya repartidos en secciones.
 *
 * Con la lista vacía queda inactivo: es el estado mientras el socio no ha
 * elegido ningún grupo.
 */
export function useExercisesByGroups(
  grupoIds: readonly MuscleGroupId[],
): RecursoAsincrono<readonly SeccionGrupo[]> {
  /* El arreglo llega con identidad nueva en cada render, así que la
     dependencia es su contenido serializado. Los ids se reconstruyen
     dentro del memo para que la función de carga nunca cierre sobre un
     arreglo de un render anterior. */
  const clave = grupoIds.join('|');

  const cargar = useMemo(() => {
    const ids = clave === '' ? [] : (clave.split('|') as MuscleGroupId[]);
    return ids.length === 0 ? null : () => getExercisesByGroups(ids);
  }, [clave]);

  return useAsync(cargar, SIN_SECCIONES);
}
