import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Chip } from '@/components/ui/Chip';
import { NOMBRES_EQUIPO } from '@/config/labels';
import { cn } from '@/lib/cn';
import type { EjercicioAsignado } from '@/store/rutina.store';
import type { Exercise } from '@/types/exercise';

interface TarjetaAsignadaProps {
  readonly asignado: EjercicioAsignado;
  readonly ejercicio: Exercise | undefined;
  readonly onQuitar: (uid: string) => void;
}

/**
 * Tarjeta de un ejercicio ya colocado en un día.
 *
 * Más compacta que la del catálogo: aquí el socio ya sabe qué eligió y lo
 * que necesita es ver la sesión entera de un vistazo, no volver a leer las
 * descripciones.
 *
 * El arrastre sale de un asa y no de toda la tarjeta. Es deliberado: si la
 * tarjeta entera arrastrase, en móvil no se podría hacer scroll por la
 * lista sin mover ejercicios sin querer.
 */
function TarjetaAsignadaBase({ asignado, ejercicio, onQuitar }: TarjetaAsignadaProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: asignado.uid });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-card border bg-surface p-3 shadow-soft',
        isDragging ? 'z-10 border-accent-line opacity-40' : 'border-line',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Mover ${ejercicio?.nombre ?? 'ejercicio'}`}
        /* `touch-none` es obligatorio: sin ella el navegador se queda el
           gesto para hacer scroll y el arrastre nunca llega a empezar. */
        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-tile bg-elevated text-ink-mute transition-colors hover:text-ink active:cursor-grabbing"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ⠿
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-snug font-semibold text-ink">
          {ejercicio?.nombre ?? 'Ejercicio no encontrado'}
        </p>
        {ejercicio && (
          <div className="mt-1.5">
            <Chip>{NOMBRES_EQUIPO[ejercicio.equipo]}</Chip>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onQuitar(asignado.uid)}
        aria-label={`Quitar ${ejercicio?.nombre ?? 'ejercicio'} de este día`}
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink-mute transition-colors hover:bg-elevated hover:text-ink"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ×
        </span>
      </button>
    </li>
  );
}

/* Memoizada: en la semana o en un catálogo de 45 fichas, un cambio de
   estado en el padre repintaría todas. Cada tarjeta lee del store lo suyo
   —un booleano—, así que solo se repinta la que de verdad cambia. */
export const TarjetaAsignada = memo(TarjetaAsignadaBase);
