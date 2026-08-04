import { Contenido } from '@/components/layout/AppShell';

import { EstadoRecurso } from './EstadoRecurso';
import { MuscleGroupList } from './MuscleGroupList';
import { useMuscleGroups } from '../hooks/useMuscleGroups';

/** Paso 1: elegir uno o varios grupos musculares. */
export function PasoGrupos() {
  const grupos = useMuscleGroups();

  return (
    <Contenido>
      <div className="pt-10 pb-8">
        <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
          Paso 1 de 3
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.9] tracking-wide text-ink">
          ¿Qué vas
          <br />a trabajar?
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
          Elige uno o varios grupos musculares.
        </p>
      </div>

      <EstadoRecurso
        estado={grupos.estado}
        error={grupos.error}
        onReintentar={grupos.reintentar}
        esqueleto="rejilla"
      >
        <MuscleGroupList grupos={grupos.datos} />
      </EstadoRecurso>

      {/* Aire para que la barra fija no tape la última tarjeta. */}
      <div className="h-40" />
    </Contenido>
  );
}
