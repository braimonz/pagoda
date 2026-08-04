import { Sheet } from '@/components/ui/Sheet';
import { NOMBRES_EQUIPO, NOMBRES_NIVEL } from '@/config/labels';
import type { Dia } from '@/config/dias';
import type { SeccionGrupo } from '@/services/exercises.service';
import type { Exercise } from '@/types/exercise';

interface AgregarEjercicioSheetProps {
  /** El día al que se añade, o null con el panel cerrado. */
  readonly dia: Dia | null;
  readonly secciones: readonly SeccionGrupo[];
  readonly onElegir: (ejercicio: Exercise) => void;
  readonly onCerrar: () => void;
}

/**
 * Panel para añadir un ejercicio a un día concreto.
 *
 * Ofrece los ejercicios de los grupos que el socio eligió, no el catálogo
 * entero: si está montando una semana de pecho y espalda, enseñarle 120
 * ejercicios sería ruido.
 *
 * Se permite repetir: el mismo ejercicio puede estar el lunes y el viernes,
 * y cada instancia tiene su propio identificador.
 */
export function AgregarEjercicioSheet({
  dia,
  secciones,
  onElegir,
  onCerrar,
}: AgregarEjercicioSheetProps) {
  return (
    <Sheet
      abierto={dia !== null}
      titulo={dia ? `Añadir al ${dia.nombre.toLowerCase()}` : ''}
      onCerrar={onCerrar}
    >
      <div className="flex flex-col gap-6 pb-6">
        {secciones.map((seccion) => (
          <section key={seccion.grupo.id}>
            <h3 className="mb-2 font-accent text-[0.6875rem] font-extrabold tracking-[0.28em] text-accent uppercase">
              {seccion.grupo.nombre}
            </h3>

            <ul className="flex flex-col gap-2">
              {seccion.ejercicios.map((ejercicio) => (
                <li key={ejercicio.id}>
                  <button
                    type="button"
                    onClick={() => onElegir(ejercicio)}
                    className="flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-accent-line"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {ejercicio.nombre}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-mute">
                        {NOMBRES_EQUIPO[ejercicio.equipo]} · {NOMBRES_NIVEL[ejercicio.nivel]}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"
                    >
                      +
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}
