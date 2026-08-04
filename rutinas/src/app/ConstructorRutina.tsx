import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { BarraInferior } from '@/components/layout/BarraInferior';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { PasoEjercicios } from '@/features/exercises/components/PasoEjercicios';
import { PasoGrupos } from '@/features/exercises/components/PasoGrupos';
import { useExercisesByGroups } from '@/features/exercises/hooks/useExercisesByGroups';
import { BarraSemana } from '@/features/routine/components/BarraSemana';
import { PasoSemana } from '@/features/routine/components/PasoSemana';
import { pantalla } from '@/lib/motion';
import { useRutina } from '@/store/rutina.store';
import { useSeleccion, useTotalEjercicios, useTotalGrupos } from '@/store/seleccion.store';

type Paso = 'grupos' | 'ejercicios' | 'semana';

const ANTERIOR: Record<Paso, Paso | null> = {
  grupos: null,
  ejercicios: 'grupos',
  semana: 'ejercicios',
};

const ETIQUETA_ATRAS: Record<Paso, string> = {
  grupos: '',
  ejercicios: 'Grupos',
  semana: 'Ejercicios',
};

/**
 * Los tres pasos para montar una rutina.
 *
 * Vive en `app/` porque es cableado: decide qué paso se ve y conecta dos
 * features que, por regla, no pueden importarse entre sí. Cuando entre el
 * router, cada paso será una ruta y este componente desaparecerá.
 */
export function ConstructorRutina() {
  const [paso, setPaso] = useState<Paso>('grupos');

  const gruposSeleccionados = useSeleccion((estado) => estado.grupos);
  const ejerciciosSeleccionados = useSeleccion((estado) => estado.ejercicios);
  const totalGrupos = useTotalGrupos();
  const totalEjercicios = useTotalEjercicios();

  const sincronizar = useRutina((estado) => estado.sincronizar);
  const secciones = useExercisesByGroups(gruposSeleccionados);

  const atras = ANTERIOR[paso];

  /* Cada paso empieza por arriba. Sin esto, el navegador conserva el scroll
     del paso anterior y se entra a media pantalla: al pasar de una lista de
     45 ejercicios a la semana, el título ni se veía. Salto instantáneo, no
     suave: la pantalla ya está cambiando con su propia animación. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [paso]);

  function irALaSemana() {
    /* Se cuadra la semana con lo seleccionado justo al entrar: conserva lo
       que ya estaba colocado y reparte solo lo nuevo. Volver atrás a añadir
       un grupo no puede deshacer la semana que el socio acaba de organizar. */
    sincronizar(ejerciciosSeleccionados);
    setPaso('semana');
  }

  return (
    <AppShell>
      <TopBar
        izquierda={
          atras !== null && (
            <Button variante="discreto" onClick={() => setPaso(atras)} className="-ml-3 px-3">
              <span aria-hidden="true">←</span> {ETIQUETA_ATRAS[paso]}
            </Button>
          )
        }
      />

      {/* Sin `initial={false}`: esa prop se propaga por todo el subárbol y
          anularía también el escalonado de las listas en la primera carga,
          que es justo el momento que más se nota. */}
      <AnimatePresence mode="wait">
        <motion.main key={paso} variants={pantalla} initial="entra" animate="visible" exit="sale">
          {paso === 'grupos' && <PasoGrupos />}
          {paso === 'ejercicios' && (
            <PasoEjercicios grupos={gruposSeleccionados} secciones={secciones} />
          )}
          {paso === 'semana' && <PasoSemana secciones={secciones.datos} />}
        </motion.main>
      </AnimatePresence>

      {paso === 'grupos' && (
        <BarraInferior
          cantidad={totalGrupos}
          singular="grupo"
          plural="grupos"
          textoBoton="Ver ejercicios"
          ayuda="Elige al menos un grupo muscular."
          onContinuar={() => setPaso('ejercicios')}
        />
      )}

      {paso === 'ejercicios' && (
        <BarraInferior
          cantidad={totalEjercicios}
          singular="ejercicio"
          plural="ejercicios"
          textoBoton="Organizar"
          ayuda="Elige al menos un ejercicio."
          onContinuar={irALaSemana}
        />
      )}

      {paso === 'semana' && <BarraSemana />}
    </AppShell>
  );
}
