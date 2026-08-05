import { memo } from 'react';
import { motion } from 'framer-motion';

import { Chip } from '@/components/ui/Chip';
import { NOMBRES_EQUIPO, NOMBRES_NIVEL } from '@/config/labels';
import { nombreMusculo } from '@/config/muscleGroups';
import { cn } from '@/lib/cn';
import { elemento, PULSACION, RAPIDA } from '@/lib/motion';
import { useEjercicioSeleccionado, useSeleccion } from '@/store/seleccion.store';
import type { Exercise } from '@/types/exercise';

interface ExerciseCardProps {
  readonly ejercicio: Exercise;
  /** Posición dentro de su grupo, empezando en 1. */
  readonly orden: number;
}

/** Color del punto de nivel: una señal más, además del texto del chip. */
const COLOR_NIVEL: Record<Exercise['nivel'], string> = {
  principiante: 'bg-accent',
  intermedio: 'bg-amber-400',
  avanzado: 'bg-rose-400',
};

/**
 * Ficha de un ejercicio. Toda la tarjeta alterna la selección.
 *
 * Es un `<button aria-pressed>` y no un `<div onClick>`: así funciona con
 * teclado, se anuncia como pulsado o no, y el navegador da el foco solo.
 * Por eso el nombre va en `<span>` y no en `<h3>` — un encabezado dentro
 * de un botón no es HTML válido.
 *
 * Mientras `imagen` venga vacía del catálogo, la baldosa lleva el número
 * de orden; al seleccionar, el número deja paso a la marca de verificación.
 */
function ExerciseCardBase({ ejercicio, orden }: ExerciseCardProps) {
  const seleccionado = useEjercicioSeleccionado(ejercicio.id);
  const alternarEjercicio = useSeleccion((estado) => estado.alternarEjercicio);

  return (
    <motion.button
      type="button"
      variants={elemento}
      whileTap={PULSACION}
      aria-pressed={seleccionado}
      onClick={() => alternarEjercicio(ejercicio)}
      className={cn(
        'flex w-full gap-4 rounded-card border p-4 text-left shadow-soft',
        'transition-colors duration-200',
        seleccionado
          ? 'border-accent-line bg-accent-soft'
          : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <motion.span
        aria-hidden="true"
        animate={seleccionado ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={RAPIDA}
        className={cn(
          'grid size-14 shrink-0 place-items-center overflow-hidden rounded-tile',
          'font-accent text-xl font-extrabold tabular-nums transition-colors duration-200',
          seleccionado ? 'bg-accent text-on-accent' : 'bg-elevated text-ink-mute',
        )}
      >
        {seleccionado ? '✓' : String(orden).padStart(2, '0')}
      </motion.span>

      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] leading-snug font-semibold text-ink">
          {ejercicio.nombre}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          <Chip>{NOMBRES_EQUIPO[ejercicio.equipo]}</Chip>
          <Chip className="gap-1.5">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${COLOR_NIVEL[ejercicio.nivel]}`}
            />
            {NOMBRES_NIVEL[ejercicio.nivel]}
          </Chip>
        </span>

        <span className="mt-2.5 block text-[0.8125rem] leading-relaxed text-ink-soft">
          {ejercicio.descripcion}
        </span>

        {ejercicio.musculosSecundarios.length > 0 && (
          <span className="mt-2 block text-xs text-ink-mute">
            También trabaja: {ejercicio.musculosSecundarios.map(nombreMusculo).join(', ')}
          </span>
        )}
      </span>
    </motion.button>
  );
}

/* Memoizada: en la semana o en un catálogo de 45 fichas, un cambio de
   estado en el padre repintaría todas. Cada tarjeta lee del store lo suyo
   —un booleano—, así que solo se repinta la que de verdad cambia. */
export const ExerciseCard = memo(ExerciseCardBase);
