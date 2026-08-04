import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { EstadoCarga } from '@/hooks/useAsync';

type FormaEsqueleto = 'rejilla' | 'lista';

interface EstadoRecursoProps {
  readonly estado: EstadoCarga;
  readonly error: string | null;
  readonly onReintentar: () => void;
  readonly esqueleto: FormaEsqueleto;
  readonly children: ReactNode;
}

/**
 * Resuelve los cuatro estados de una carga y solo entonces pinta.
 *
 * Concentrarlo aquí evita que cada pantalla repita el mismo `if (cargando)`
 * y garantiza que ninguna se quede sin estado de error —el que siempre se
 * olvida— ni sin forma de reintentar.
 */
export function EstadoRecurso({
  estado,
  error,
  onReintentar,
  esqueleto,
  children,
}: EstadoRecursoProps) {
  if (estado === 'inactivo') return null;

  if (estado === 'cargando') {
    return <Esqueleto forma={esqueleto} />;
  }

  if (estado === 'error') {
    return (
      <div
        role="alert"
        className="rounded-card border border-line bg-surface p-8 text-center shadow-soft"
      >
        <span aria-hidden="true" className="block font-kanji text-5xl text-accent/20">
          力
        </span>
        <p className="mt-4 text-sm text-ink-soft">{error ?? 'Algo salió mal.'}</p>
        <Button onClick={onReintentar} className="mt-6">
          Reintentar
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * El esqueleto imita la forma exacta de lo que va a llegar, para que la
 * pantalla se rellene en lugar de saltar. Un spinner centrado no dice ni
 * cuánto falta ni qué va a aparecer.
 */
function Esqueleto({ forma }: { readonly forma: FormaEsqueleto }) {
  const huecos = forma === 'rejilla' ? 6 : 5;

  return (
    <>
      {/* Los bloques son decorativos; quien no los ve necesita que se lo digan. */}
      <p role="status" className="sr-only">
        Cargando…
      </p>

      <div
        aria-hidden="true"
        className={forma === 'rejilla' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3' : 'flex flex-col gap-3'}
      >
        {Array.from({ length: huecos }, (_, i) => (
          <Skeleton
            key={i}
            className={forma === 'rejilla' ? 'aspect-4/5 rounded-card' : 'h-32 rounded-card'}
          />
        ))}
      </div>
    </>
  );
}
