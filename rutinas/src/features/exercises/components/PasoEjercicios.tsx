import { Contenido } from '@/components/layout/AppShell';
import { Chip } from '@/components/ui/Chip';
import { grupoMuscularPorId } from '@/config/muscleGroups';
import type { RecursoAsincrono } from '@/hooks/useAsync';
import type { SeccionGrupo } from '@/services/exercises.service';
import type { MuscleGroupId } from '@/types/exercise';

import { EstadoRecurso } from './EstadoRecurso';
import { ExerciseList } from './ExerciseList';

interface PasoEjerciciosProps {
  readonly grupos: readonly MuscleGroupId[];
  readonly secciones: RecursoAsincrono<readonly SeccionGrupo[]>;
}

/** Paso 2: elegir ejercicios de entre los grupos escogidos. */
export function PasoEjercicios({ grupos, secciones }: PasoEjerciciosProps) {
  return (
    <Contenido>
      <div className="pt-10 pb-8">
        <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
          Paso 2 de 3
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none tracking-wide text-ink">
          Ejercicios
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Toca los que quieras añadir a tu rutina.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {grupos.map((id) => (
            <Chip key={id}>{grupoMuscularPorId(id).nombre}</Chip>
          ))}
        </div>
      </div>

      <EstadoRecurso
        estado={secciones.estado}
        error={secciones.error}
        onReintentar={secciones.reintentar}
        esqueleto="lista"
      >
        <ExerciseList secciones={secciones.datos} />
      </EstadoRecurso>

      <div className="h-40" />
    </Contenido>
  );
}
