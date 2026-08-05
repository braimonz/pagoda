import { motion } from 'framer-motion';

import { lista } from '@/lib/motion';
import type { SeccionGrupo } from '@/services/exercises.service';

import { ExerciseCard } from './ExerciseCard';

interface ExerciseListProps {
  readonly secciones: readonly SeccionGrupo[];
}

/**
 * Los ejercicios de los grupos elegidos, en secciones.
 *
 * Con varios grupos a la vez, una lista plana de 30 o 45 fichas sería
 * imposible de recorrer; el encabezado de sección le dice al socio dónde
 * está sin tener que leer los nombres.
 */
export function ExerciseList({ secciones }: ExerciseListProps) {
  if (secciones.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-mute">
        Los grupos elegidos todavía no tienen ejercicios.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-9">
      {secciones.map((seccion) => (
        <section key={seccion.grupo.id}>
          {/* Pegajoso bajo la barra superior: al recorrer 45 fichas, el
              socio siempre sabe de qué grupo son las que está viendo. */}
          <div className="sticky top-14 z-20 -mx-5 mb-3 bg-base/85 px-5 py-2 backdrop-blur-lg">
            <h2 className="flex items-baseline gap-2">
              <span aria-hidden="true" className="font-kanji text-lg text-accent/40">
                {seccion.grupo.kanji}
              </span>
              <span className="font-display text-xl tracking-wide text-ink">
                {seccion.grupo.nombre}
              </span>
              <span className="text-xs text-ink-mute">{seccion.ejercicios.length}</span>
            </h2>
          </div>

          <motion.div
            variants={lista}
            initial="entra"
            animate="visible"
            /* `content-visibility` deja que el navegador se salte el
               cálculo de estilo y trazado de lo que queda fuera de la
               pantalla. Con 45 fichas de tres grupos, el scroll pasa de
               notarse a no notarse en gama baja. */
            className="flex flex-col gap-3 [content-visibility:auto] [contain-intrinsic-size:auto_9rem]"
          >
            {seccion.ejercicios.map((ejercicio, indice) => (
              <ExerciseCard key={ejercicio.id} ejercicio={ejercicio} orden={indice + 1} />
            ))}
          </motion.div>
        </section>
      ))}
    </div>
  );
}
