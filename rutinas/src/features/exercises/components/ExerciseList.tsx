import { NOMBRES_EQUIPO, NOMBRES_NIVEL } from '@/config/labels';
import { nombreMusculo } from '@/config/muscleGroups';
import type { Exercise } from '@/types/exercise';

interface ExerciseListProps {
  readonly ejercicios: readonly Exercise[];
}

/**
 * Los ejercicios de un grupo. Presentación pura, sin estilos.
 *
 * Los ids del JSON (`peso-corporal`, `intermedio`) no se enseñan nunca en
 * crudo: se traducen con los diccionarios de config/.
 */
export function ExerciseList({ ejercicios }: ExerciseListProps) {
  if (ejercicios.length === 0) {
    return <p role="status">Este grupo muscular todavía no tiene ejercicios.</p>;
  }

  return (
    <ul>
      {ejercicios.map((ejercicio) => (
        <li key={ejercicio.id}>
          <article>
            <h3>{ejercicio.nombre}</h3>
            <p>
              {NOMBRES_EQUIPO[ejercicio.equipo]} · {NOMBRES_NIVEL[ejercicio.nivel]}
            </p>
            {ejercicio.musculosSecundarios.length > 0 && (
              <p>
                También trabaja:{' '}
                {ejercicio.musculosSecundarios.map(nombreMusculo).join(', ')}
              </p>
            )}
            <p>{ejercicio.descripcion}</p>
          </article>
        </li>
      ))}
    </ul>
  );
}
