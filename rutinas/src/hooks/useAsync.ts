import { useCallback, useEffect, useRef, useState } from 'react';

import { mensajeParaUsuario } from '@/lib/errors';

export type EstadoCarga = 'inactivo' | 'cargando' | 'listo' | 'error';

export interface RecursoAsincrono<T> {
  readonly estado: EstadoCarga;
  readonly datos: T;
  readonly error: string | null;
  /** Vuelve a ejecutar la carga. Estable entre renders. */
  readonly reintentar: () => void;
}

/**
 * Envuelve una carga asíncrona en los cuatro estados que la UI necesita.
 *
 * Existe para que cada pantalla no reinvente el trío cargando/listo/error
 * ni olvide el guardia de desmontaje. Todas las pantallas del catálogo se
 * apoyan en él.
 *
 * @param cargar  Función de carga. Debe ser estable (useCallback), porque
 *                cambiarla vuelve a disparar la carga. `null` significa
 *                "todavía no hay nada que cargar" y deja el estado inactivo.
 * @param inicial Valor mientras no hay datos.
 */
export function useAsync<T>(cargar: (() => Promise<T>) | null, inicial: T): RecursoAsincrono<T> {
  const [datos, setDatos] = useState<T>(inicial);
  const [estado, setEstado] = useState<EstadoCarga>(cargar ? 'cargando' : 'inactivo');
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  /* En una ref para que cambiar el valor inicial no vuelva a lanzar la carga:
     quien lo pasa suele escribirlo en línea ([] o null) y sería una identidad
     nueva en cada render. */
  const inicialRef = useRef(inicial);

  useEffect(() => {
    if (!cargar) {
      setEstado('inactivo');
      setDatos(inicialRef.current);
      setError(null);
      return;
    }

    /* Guardia de desmontaje: si la pantalla se cierra —o el socio cambia de
       grupo— antes de que llegue la respuesta, no se toca el estado de un
       componente que ya no existe ni se pisa una carga más reciente. */
    let vigente = true;

    setEstado('cargando');
    setError(null);

    cargar().then(
      (resultado) => {
        if (!vigente) return;
        setDatos(resultado);
        setEstado('listo');
      },
      (causa: unknown) => {
        if (!vigente) return;
        setError(mensajeParaUsuario(causa));
        setEstado('error');
      },
    );

    return () => {
      vigente = false;
    };
  }, [cargar, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { estado, datos, error, reintentar };
}
