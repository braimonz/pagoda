import { motion } from 'framer-motion';

import { Chip } from '@/components/ui/Chip';
import { NOMBRES_EQUIPO, NOMBRES_NIVEL } from '@/config/labels';
import { nombreMusculo } from '@/config/muscleGroups';
import { elemento } from '@/lib/motion';
import type { Exercise } from '@/types/exercise';

interface ExerciseCardProps {
  readonly ejercicio: Exercise;
  /** Posición dentro del grupo, empezando en 1. */
  readonly orden: number;
}

/** Color del punto de nivel: una señal más, además del texto del chip. */
const COLOR_NIVEL: Record<Exercise['nivel'], string> = {
  principiante: 'bg-accent',
  intermedio: 'bg-amber-400',
  avanzado: 'bg-rose-400',
};

/**
 * Ficha de un ejercicio.
 *
 * Mientras `imagen` venga vacía del catálogo, la baldosa lleva el número
 * de orden. Repetir ahí el kanji del grupo llenaba la pantalla con quince
 * copias del mismo glifo —relleno decorativo—; el número, en cambio,
 * informa: el catálogo está ordenado con los básicos primero.
 * El día que haya fotos se sustituye solo ese bloque.
 */
export function ExerciseCard({ ejercicio, orden }: ExerciseCardProps) {
  return (
    <motion.article
      variants={elemento}
      className="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-soft"
    >
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-tile bg-elevated">
        {ejercicio.imagen ? (
          <img
            src={ejercicio.imagen}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden="true"
            className="font-accent text-xl font-extrabold tabular-nums text-ink-mute"
          >
            {String(orden).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[0.9375rem] leading-snug font-semibold text-ink">
          {ejercicio.nombre}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Chip>{NOMBRES_EQUIPO[ejercicio.equipo]}</Chip>
          <Chip className="gap-1.5">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${COLOR_NIVEL[ejercicio.nivel]}`}
            />
            {NOMBRES_NIVEL[ejercicio.nivel]}
          </Chip>
        </div>

        <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-soft">
          {ejercicio.descripcion}
        </p>

        {ejercicio.musculosSecundarios.length > 0 && (
          <p className="mt-2 text-xs text-ink-mute">
            También trabaja: {ejercicio.musculosSecundarios.map(nombreMusculo).join(', ')}
          </p>
        )}
      </div>
    </motion.article>
  );
}
