import type { ReactNode } from 'react';

import type { EstadoCarga } from '@/hooks/useAsync';

interface EstadoRecursoProps {
  readonly estado: EstadoCarga;
  readonly error: string | null;
  readonly onReintentar: () => void;
  readonly children: ReactNode;
}

/**
 * Resuelve los estados de una carga y solo entonces pinta el contenido.
 *
 * Concentrarlo aquí evita que cada pantalla repita el mismo `if (cargando)`
 * y garantiza que ninguna se quede sin estado de error —el que siempre se
 * olvida— ni sin forma de reintentar.
 */
export function EstadoRecurso({ estado, error, onReintentar, children }: EstadoRecursoProps) {
  if (estado === 'inactivo') return null;

  if (estado === 'cargando') {
    return <p role="status">Cargando…</p>;
  }

  if (estado === 'error') {
    return (
      <div role="alert">
        <p>{error ?? 'Ocurrió un error inesperado.'}</p>
        <button type="button" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
