import { motion } from 'framer-motion';

import { elemento, PULSACION } from '@/lib/motion';
import type { MuscleGroupSummary } from '@/services/exercises.service';
import type { MuscleGroupId } from '@/types/exercise';

interface MuscleGroupCardProps {
  readonly grupo: MuscleGroupSummary;
  readonly onSeleccionar: (grupoId: MuscleGroupId) => void;
}

/**
 * Tarjeta de un grupo muscular.
 *
 * Cuadrada, no 3:4: sin fotografía una tarjeta alta es un hueco vacío que
 * obliga a hacer scroll, y así los ocho grupos casi caben en una pantalla
 * de móvil. Cuando lleguen las fotos puede volver al formato vertical.
 */
export function MuscleGroupCard({ grupo, onSeleccionar }: MuscleGroupCardProps) {
  return (
    <motion.button
      type="button"
      variants={elemento}
      whileTap={PULSACION}
      onClick={() => onSeleccionar(grupo.id)}
      className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-card border border-line bg-surface p-4 text-left shadow-soft transition-colors duration-200 hover:border-accent-line hover:bg-elevated"
    >
      {/* Sello decorativo, oculto a los lectores de pantalla.
          Contenido, no protagonista: a 56 px y al 8 % acompaña al nombre;
          más grande competía con él y la tarjeta se leía como un logotipo. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-3.5 font-kanji text-[3.5rem] leading-none text-accent/8 transition-all duration-300 ease-suave group-hover:text-accent/15"
      >
        {grupo.kanji}
      </span>

      {/* Halo verde que sube desde el pie de la tarjeta al pasar por encima. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-accent-soft to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="block font-display text-2xl leading-none tracking-wide text-ink">
            {grupo.nombre}
          </span>
          <span className="mt-1.5 block text-xs font-medium text-ink-mute">
            {grupo.total} {grupo.total === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
        </div>

        {/* La única marca verde de la tarjeta: dice "esto se toca".
            Se rellena al pasar por encima o al pulsar. */}
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-on-accent"
        >
          →
        </span>
      </div>
    </motion.button>
  );
}
