import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { cn } from '@/lib/cn';
import type { Dia } from '@/config/dias';
import type { EjercicioAsignado } from '@/store/rutina.store';
import type { Exercise } from '@/types/exercise';

import { TarjetaAsignada } from './TarjetaAsignada';

interface DiaSeccionProps {
  readonly dia: Dia;
  readonly ejercicios: readonly EjercicioAsignado[];
  readonly indice: ReadonlyMap<string, Exercise>;
  readonly onQuitar: (uid: string) => void;
  readonly onAgregar: (dia: Dia) => void;
  /** Hay un arrastre en curso: se marcan las zonas donde se puede soltar. */
  readonly arrastrando: boolean;
}

/**
 * Un día de la semana con sus ejercicios.
 *
 * El día entero es zona de destino **solo cuando está vacío**. Con
 * tarjetas dentro se desactiva a propósito: si no, el contenedor gana la
 * detección de colisión a sus propias tarjetas —es más grande y sus
 * esquinas quedan más cerca— y todo aterrizaba al final del día, con lo
 * que reordenar dentro de un mismo día no hacía nada.
 */
export function DiaSeccion({
  dia,
  ejercicios,
  indice,
  onQuitar,
  onAgregar,
  arrastrando,
}: DiaSeccionProps) {
  const vacio = ejercicios.length === 0;
  const { setNodeRef, isOver } = useDroppable({ id: dia.id, disabled: !vacio });

  return (
    <section
      className={cn(
        'rounded-card border p-4 transition-colors duration-200',
        isOver ? 'border-accent-line bg-accent-soft' : 'border-line bg-base',
      )}
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl leading-none tracking-wide text-ink">{dia.nombre}</h2>
        <span className="font-accent text-xs font-extrabold tracking-[0.16em] text-ink-mute uppercase">
          {vacio ? 'Descanso' : `${ejercicios.length} ${ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}`}
        </span>
      </header>

      <div ref={setNodeRef}>
        <SortableContext
          id={dia.id}
          items={ejercicios.map((e) => e.uid)}
          strategy={verticalListSortingStrategy}
        >
          {vacio ? (
            <p
              className={cn(
                'rounded-tile border border-dashed px-4 py-6 text-center text-xs transition-colors',
                arrastrando ? 'border-accent-line text-accent' : 'border-line text-ink-mute',
              )}
            >
              {arrastrando ? 'Suelta aquí' : 'Día de descanso'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ejercicios.map((asignado) => (
                <TarjetaAsignada
                  key={asignado.uid}
                  asignado={asignado}
                  ejercicio={indice.get(asignado.ejercicioId)}
                  onQuitar={onQuitar}
                />
              ))}
            </ul>
          )}
        </SortableContext>
      </div>

      <button
        type="button"
        onClick={() => onAgregar(dia)}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-btn border border-line text-sm font-medium text-ink-soft transition-colors hover:border-accent-line hover:text-accent"
      >
        <span aria-hidden="true" className="text-accent">
          +
        </span>
        Añadir ejercicio
      </button>
    </section>
  );
}
