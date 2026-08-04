import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { AppShell, Contenido } from '@/components/layout/AppShell';
import { BarraInferior } from '@/components/layout/BarraInferior';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Toast } from '@/components/ui/Toast';
import { grupoMuscularPorId } from '@/config/muscleGroups';
import { pantalla } from '@/lib/motion';
import { useSeleccion, useTotalEjercicios, useTotalGrupos } from '@/store/seleccion.store';

import { EstadoRecurso } from '../components/EstadoRecurso';
import { ExerciseList } from '../components/ExerciseList';
import { MuscleGroupList } from '../components/MuscleGroupList';
import { useExercisesByGroups } from '../hooks/useExercisesByGroups';
import { useMuscleGroups } from '../hooks/useMuscleGroups';

type Vista = 'grupos' | 'ejercicios';

/**
 * Selección de ejercicios, en dos pasos.
 *
 * 1. **Grupos** — se eligen varios. La barra inferior cuenta grupos.
 * 2. **Ejercicios** — se eligen varios de entre los grupos elegidos. La
 *    barra cuenta ejercicios y bloquea *Continuar* hasta que haya al menos
 *    uno.
 *
 * Las dos vistas se turnan, no conviven, y `AnimatePresence mode="wait"`
 * garantiza que la saliente termine antes de que entre la nueva.
 *
 * La selección no vive aquí sino en el store: al volver atrás a cambiar de
 * grupos, lo ya elegido sigue marcado.
 */
export function ExercisesPage() {
  const [vista, setVista] = useState<Vista>('grupos');
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const gruposSeleccionados = useSeleccion((estado) => estado.grupos);
  const totalGrupos = useTotalGrupos();
  const totalEjercicios = useTotalEjercicios();

  const grupos = useMuscleGroups();
  const secciones = useExercisesByGroups(gruposSeleccionados);

  return (
    <AppShell>
      <TopBar
        izquierda={
          vista === 'ejercicios' && (
            <Button
              variante="discreto"
              onClick={() => setVista('grupos')}
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
        {vista === 'grupos' ? (
          <motion.main key="grupos" variants={pantalla} initial="entra" animate="visible" exit="sale">
            <Contenido>
              <div className="pt-10 pb-8">
                <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
                  Paso 1 de 2
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
          </motion.main>
        ) : (
          <motion.main
            key="ejercicios"
            variants={pantalla}
            initial="entra"
            animate="visible"
            exit="sale"
          >
            <Contenido>
              <div className="pt-10 pb-8">
                <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
                  Paso 2 de 2
                </p>
                <h1 className="mt-3 font-display text-5xl leading-none tracking-wide text-ink">
                  Ejercicios
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  Toca los que quieras añadir a tu rutina.
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {gruposSeleccionados.map((id) => (
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
          </motion.main>
        )}
      </AnimatePresence>

      {vista === 'grupos' ? (
        <BarraInferior
          key="barra-grupos"
          cantidad={totalGrupos}
          singular="grupo"
          plural="grupos"
          textoBoton="Ver ejercicios"
          ayuda="Elige al menos un grupo muscular."
          onContinuar={() => setVista('ejercicios')}
        />
      ) : (
        <BarraInferior
          key="barra-ejercicios"
          cantidad={totalEjercicios}
          singular="ejercicio"
          plural="ejercicios"
          textoBoton="Continuar"
          ayuda="Elige al menos un ejercicio."
          onContinuar={() =>
            setConfirmacion(
              `${totalEjercicios} ${totalEjercicios === 1 ? 'ejercicio listo' : 'ejercicios listos'} para tu rutina.`,
            )
          }
        />
      )}

      <Toast mensaje={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </AppShell>
  );
}
