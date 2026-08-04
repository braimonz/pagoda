import { useEffect, useRef, useState } from 'react';

import { DIA_IDS } from '@/config/dias';
import { MUSCLE_GROUPS } from '@/config/muscleGroups';
import { mensajeParaUsuario } from '@/lib/errors';
import { useRutina } from '@/store/rutina.store';
import { useSeleccion, type EjercicioSeleccionado } from '@/store/seleccion.store';
import type { Exercise, MuscleGroupId } from '@/types/exercise';

import { decodificarRutina, jsonARutina, leerDatosDeUrl, PARAMETRO } from '../utils/compartir';

export type EstadoImportacion = 'sin-enlace' | 'esperando' | 'importada' | 'error';

export interface RutinaCompartidaEnUrl {
  readonly estado: EstadoImportacion;
  /** Aviso para el socio cuando la importación termina o falla. */
  readonly mensaje: string | null;
}

/**
 * Reconstruye la rutina si la URL trae `?data=…`.
 *
 * El parámetro se lee **una sola vez, al montar**, antes de que nada lo
 * borre, y se guarda en una ref. La importación en sí espera al catálogo:
 * hay que cotejar cada id contra él para no dejar tarjetas rotas si el
 * enlace es viejo.
 *
 * Al terminar se limpia la URL con `replaceState`. Sin eso, recargar la
 * página volvería a importar y le pisaría al socio los cambios que
 * hubiera hecho después de abrir el enlace.
 */
export function useRutinaCompartida(
  catalogo: ReadonlyMap<string, Exercise>,
  catalogoListo: boolean,
): RutinaCompartidaEnUrl {
  const datosRef = useRef<string | null>(null);
  const yaProcesado = useRef(false);

  if (datosRef.current === null && !yaProcesado.current) {
    datosRef.current = leerDatosDeUrl();
  }

  const [estado, setEstado] = useState<EstadoImportacion>(
    datosRef.current === null ? 'sin-enlace' : 'esperando',
  );
  const [mensaje, setMensaje] = useState<string | null>(null);

  const reemplazarSemana = useRutina((estado) => estado.reemplazar);
  const reemplazarSeleccion = useSeleccion((estado) => estado.reemplazar);

  useEffect(() => {
    const codificado = datosRef.current;
    if (codificado === null || yaProcesado.current || !catalogoListo) return;

    yaProcesado.current = true;
    limpiarUrl();

    try {
      const { semana, descartados, total } = jsonARutina(decodificarRutina(codificado), catalogo);

      /* La selección tiene que reflejar lo importado: si no, el paso 2 se
         vería vacío y `sincronizar` borraría la semana recién traída en
         cuanto el socio volviera atrás. */
      const ejercicios: EjercicioSeleccionado[] = [];
      const vistos = new Set<string>();
      for (const dia of DIA_IDS) {
        for (const asignado of semana[dia]) {
          if (vistos.has(asignado.ejercicioId)) continue;
          vistos.add(asignado.ejercicioId);
          ejercicios.push({ id: asignado.ejercicioId, grupo: asignado.grupo });
        }
      }

      const grupos: MuscleGroupId[] = MUSCLE_GROUPS.map((g) => g.id).filter((id) =>
        ejercicios.some((e) => e.grupo === id),
      );

      reemplazarSemana(semana);
      reemplazarSeleccion(grupos, ejercicios);

      const colocados = total - descartados;
      setEstado('importada');
      setMensaje(
        descartados === 0
          ? `Rutina recibida: ${colocados} ${colocados === 1 ? 'ejercicio' : 'ejercicios'}.`
          : `Rutina recibida: ${colocados} de ${total}. ${descartados === 1 ? '1 ejercicio ya no está' : `${descartados} ejercicios ya no están`} en el catálogo.`,
      );
    } catch (causa) {
      setEstado('error');
      setMensaje(mensajeParaUsuario(causa));
    }
  }, [catalogo, catalogoListo, reemplazarSemana, reemplazarSeleccion]);

  return { estado, mensaje };
}

/** Quita `?data=` de la barra de direcciones sin recargar ni navegar. */
function limpiarUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAMETRO)) return;
  url.searchParams.delete(PARAMETRO);
  window.history.replaceState(null, '', url.toString());
}
