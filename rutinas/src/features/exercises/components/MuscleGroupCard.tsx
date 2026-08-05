import { memo } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/cn';
import { elemento, PULSACION, RAPIDA } from '@/lib/motion';
import type { MuscleGroupSummary } from '@/services/exercises.service';
import { useGrupoSeleccionado } from '@/store/seleccion.store';

interface MuscleGroupCardProps {
  readonly grupo: MuscleGroupSummary;
  /** Quien la usa decide qué pasa al tocarla: puede querer preguntar antes. */
  readonly onAlternar: (grupo: MuscleGroupSummary) => void;
}

/**
 * Tarjeta de un grupo muscular. Alterna la selección al tocarla.
 *
 * Cuadrada, no 3:4: sin fotografía una tarjeta alta es un hueco vacío que
 * obliga a hacer scroll, y así los ocho grupos casi caben en una pantalla
 * de móvil. Cuando lleguen las fotos puede volver al formato vertical.
 *
 * Lee su propio estado del store en lugar de recibirlo por props: así
 * tocar un grupo repinta esa tarjeta y no las ocho.
 */
function MuscleGroupCardBase({ grupo, onAlternar }: MuscleGroupCardProps) {
  const seleccionado = useGrupoSeleccionado(grupo.id);

  return (
    <motion.button
      type="button"
      variants={elemento}
      whileTap={PULSACION}
      aria-pressed={seleccionado}
      onClick={() => onAlternar(grupo)}
      className={cn(
        'group relative flex aspect-square flex-col justify-end overflow-hidden',
        'rounded-card border p-4 text-left shadow-soft transition-colors duration-200',
        seleccionado
          ? 'border-accent-line bg-accent-soft'
          : 'border-line bg-surface hover:border-line-strong hover:bg-elevated',
      )}
    >
      {/* Sello decorativo, oculto a los lectores de pantalla.
          Contenido, no protagonista: a 56 px y al 8 % acompaña al nombre;
          más grande competía con él y la tarjeta se leía como un logotipo. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute top-3 right-3.5 font-kanji text-[3.5rem] leading-none',
          'transition-colors duration-300 ease-suave',
          seleccionado ? 'text-accent/20' : 'text-accent/8 group-hover:text-accent/15',
        )}
      >
        {grupo.kanji}
      </span>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="block font-display text-2xl leading-none tracking-wide text-ink">
            {grupo.nombre}
          </span>
          <span className="mt-1.5 block text-xs font-medium text-ink-mute">
            {grupo.total} {grupo.total === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
        </div>

        {/* La única marca verde de la tarjeta. Vacía dice "esto se toca";
            llena, "ya está elegido". La forma cambia además del color, para
            que no dependa de distinguir el verde. */}
        <motion.span
          aria-hidden="true"
          animate={seleccionado ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={RAPIDA}
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full text-sm transition-colors duration-200',
            seleccionado
              ? 'bg-accent text-on-accent'
              : 'bg-accent-soft text-accent group-hover:bg-accent group-hover:text-on-accent',
          )}
        >
          {seleccionado ? '✓' : '→'}
        </motion.span>
      </div>
    </motion.button>
  );
}

/* Memoizada: en la semana o en un catálogo de 45 fichas, un cambio de
   estado en el padre repintaría todas. Cada tarjeta lee del store lo suyo
   —un booleano—, así que solo se repinta la que de verdad cambia. */
export const MuscleGroupCard = memo(MuscleGroupCardBase);
