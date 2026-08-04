import type { MuscleGroupSummary } from '@/services/exercises.service';
import type { MuscleGroupId } from '@/types/exercise';

interface MuscleGroupListProps {
  readonly grupos: readonly MuscleGroupSummary[];
  readonly onSeleccionar: (grupoId: MuscleGroupId) => void;
}

/**
 * Los grupos musculares disponibles. Componente de presentación puro: no
 * carga nada ni conoce el estado de la pantalla, solo pinta lo que recibe.
 *
 * Sin estilos todavía: HTML semántico a propósito. La lista es una <ul> y
 * cada grupo un <button> real, de modo que el teclado y los lectores de
 * pantalla ya funcionan antes de escribir la primera línea de CSS.
 */
export function MuscleGroupList({ grupos, onSeleccionar }: MuscleGroupListProps) {
  if (grupos.length === 0) {
    return <p role="status">El catálogo no tiene ningún grupo muscular con ejercicios.</p>;
  }

  return (
    <ul>
      {grupos.map((grupo) => (
        <li key={grupo.id}>
          <button type="button" onClick={() => onSeleccionar(grupo.id)}>
            <span aria-hidden="true">{grupo.kanji}</span>{' '}
            <strong>{grupo.nombre}</strong>{' '}
            <span>
              {grupo.total} {grupo.total === 1 ? 'ejercicio' : 'ejercicios'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
