import { useState } from 'react';

import { grupoMuscularPorId } from '@/config/muscleGroups';
import type { MuscleGroupId } from '@/types/exercise';

import { EstadoRecurso } from '../components/EstadoRecurso';
import { ExerciseList } from '../components/ExerciseList';
import { MuscleGroupList } from '../components/MuscleGroupList';
import { useExercisesByGroup } from '../hooks/useExercisesByGroup';
import { useMuscleGroups } from '../hooks/useMuscleGroups';

/**
 * Catálogo de ejercicios.
 *
 * Las dos vistas se turnan, no conviven: mientras no hay grupo elegido se
 * ven únicamente los grupos musculares, y al elegir uno se ven únicamente
 * sus ejercicios. Es lo que describe el paso ⑤ del diseño, donde la lista
 * sustituye a la rejilla en lugar de apilarse debajo.
 *
 * Esta página es la única que tiene estado; todo lo demás son componentes
 * de presentación y hooks de carga.
 */
export function ExercisesPage() {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<MuscleGroupId | null>(null);

  const grupos = useMuscleGroups();
  const ejercicios = useExercisesByGroup(grupoSeleccionado);

  if (grupoSeleccionado === null) {
    return (
      <main>
        <h1>Grupos musculares</h1>
        <p>Elige un grupo para ver sus ejercicios.</p>

        <EstadoRecurso
          estado={grupos.estado}
          error={grupos.error}
          onReintentar={grupos.reintentar}
        >
          <MuscleGroupList grupos={grupos.datos} onSeleccionar={setGrupoSeleccionado} />
        </EstadoRecurso>
      </main>
    );
  }

  const grupo = grupoMuscularPorId(grupoSeleccionado);

  return (
    <main>
      <button type="button" onClick={() => setGrupoSeleccionado(null)}>
        ← Grupos musculares
      </button>

      <h1>
        <span aria-hidden="true">{grupo.kanji}</span> {grupo.nombre}
      </h1>

      <EstadoRecurso
        estado={ejercicios.estado}
        error={ejercicios.error}
        onReintentar={ejercicios.reintentar}
      >
        <>
          <p>
            {ejercicios.datos.length}{' '}
            {ejercicios.datos.length === 1 ? 'ejercicio' : 'ejercicios'}
          </p>
          <ExerciseList ejercicios={ejercicios.datos} />
        </>
      </EstadoRecurso>
    </main>
  );
}
