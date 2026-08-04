import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { AppShell, Contenido } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { grupoMuscularPorId } from '@/config/muscleGroups';
import { pantalla } from '@/lib/motion';
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
 * sus ejercicios. `AnimatePresence` con `mode="wait"` garantiza que la
 * saliente termine antes de que entre la nueva, para que nunca se solapen.
 *
 * Es el único componente con estado; el resto son presentación y hooks.
 */
export function ExercisesPage() {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<MuscleGroupId | null>(null);

  const grupos = useMuscleGroups();
  const ejercicios = useExercisesByGroup(grupoSeleccionado);

  const grupo = grupoSeleccionado === null ? null : grupoMuscularPorId(grupoSeleccionado);

  return (
    <AppShell>
      <TopBar
        izquierda={
          grupo && (
            <Button
              variante="discreto"
              tamano="md"
              onClick={() => setGrupoSeleccionado(null)}
              className="-ml-3 px-3"
            >
              <span aria-hidden="true">←</span> Grupos
            </Button>
          )
        }
      />

      {/* Sin `initial={false}`: esa prop se propaga por todo el subárbol y
          anulaba también el escalonado de la rejilla en la primera carga,
          que es justo el momento que más se nota. */}
      <AnimatePresence mode="wait">
        {grupo === null ? (
          <motion.main
            key="grupos"
            variants={pantalla}
            initial="entra"
            animate="visible"
            exit="sale"
          >
            <Contenido>
              <div className="pt-10 pb-8">
                <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
                  Catálogo
                </p>
                <h1 className="mt-3 font-display text-5xl leading-[0.9] tracking-wide text-ink">
                  Grupos
                  <br />
                  musculares
                </h1>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
                  Elige un grupo para ver sus ejercicios.
                </p>
              </div>

              <EstadoRecurso
                estado={grupos.estado}
                error={grupos.error}
                onReintentar={grupos.reintentar}
                esqueleto="rejilla"
              >
                <MuscleGroupList grupos={grupos.datos} onSeleccionar={setGrupoSeleccionado} />
              </EstadoRecurso>

              <div className="pb-segura" />
            </Contenido>
          </motion.main>
        ) : (
          <motion.main
            key={grupo.id}
            variants={pantalla}
            initial="entra"
            animate="visible"
            exit="sale"
          >
            <Contenido>
              <div className="relative pt-10 pb-8">
                {/* Sello a la altura del título y sin recortar por el borde:
                    un glifo cortado a la mitad se lee como un fallo de
                    maquetación, no como una decisión. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-8 right-0 font-kanji text-[5.5rem] leading-none text-accent/8"
                >
                  {grupo.kanji}
                </span>

                <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
                  Ejercicios
                </p>
                <h1 className="mt-3 font-display text-5xl leading-none tracking-wide text-ink">
                  {grupo.nombre}
                </h1>
                {ejercicios.estado === 'listo' && (
                  <p className="mt-3 text-sm text-ink-mute">
                    <span className="font-accent text-lg font-extrabold text-ink">
                      {ejercicios.datos.length}
                    </span>{' '}
                    {ejercicios.datos.length === 1 ? 'ejercicio' : 'ejercicios'}
                  </p>
                )}
              </div>

              <EstadoRecurso
                estado={ejercicios.estado}
                error={ejercicios.error}
                onReintentar={ejercicios.reintentar}
                esqueleto="lista"
              >
                <ExerciseList ejercicios={ejercicios.datos} />
              </EstadoRecurso>

              <div className="pt-8">
                <Button
                  variante="fantasma"
                  tamano="lg"
                  ancho
                  onClick={() => setGrupoSeleccionado(null)}
                >
                  Ver otros grupos
                </Button>
              </div>

              <div className="pb-segura" />
            </Contenido>
          </motion.main>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
