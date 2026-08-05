import { useCallback, useEffect, useRef, useState } from 'react';

import { DIA_IDS } from '@/config/dias';
import { MUSCLE_GROUPS } from '@/config/muscleGroups';
import { mensajeParaUsuario } from '@/lib/errors';
import { useRutina, type Semana } from '@/store/rutina.store';
import { useSeleccion, type EjercicioSeleccionado } from '@/store/seleccion.store';
import { avisar } from '@/store/ui.store';
import type { Exercise, MuscleGroupId } from '@/types/exercise';

import { decodificarRutina, jsonARutina, leerDatosDeUrl, PARAMETRO } from '../utils/compartir';

export type EstadoImportacion = 'sin-enlace' | 'esperando' | 'confirmar' | 'importada' | 'error';

export interface RutinaCompartidaEnUrl {
  readonly estado: EstadoImportacion;
  /** Cuántos ejercicios se perderían al aceptar. Solo en 'confirmar'. */
  readonly ejerciciosEnRiesgo: number;
  readonly confirmar: () => void;
  readonly cancelar: () => void;
}

/**
 * Reconstruye la rutina si la URL trae `?data=…`.
 *
 * El parámetro se lee **una sola vez, al montar**, antes de que nada lo
 * borre. La importación espera al catálogo: hay que cotejar cada id contra
 * él para no dejar tarjetas rotas si el enlace es viejo.
 *
 * Si el socio ya tenía una semana montada, se le **pregunta antes**: abrir
 * un enlace no puede tirarle a la basura el trabajo de diez minutos sin
 * avisar. Si la semana está vacía no hay nada que perder y entra directo.
 *
 * Al terminar se limpia la URL con `replaceState`. Sin eso, recargar
 * volvería a importar y pisaría los cambios hechos después.
 */
export function useRutinaCompartida(
  catalogo: ReadonlyMap<string, Exercise>,
  catalogoListo: boolean,
  onImportada: () => void,
): RutinaCompartidaEnUrl {
  const datosRef = useRef<string | null>(leerDatosDeUrl());
  const resuelto = useRef(false);

  const [estado, setEstado] = useState<EstadoImportacion>(
    datosRef.current === null ? 'sin-enlace' : 'esperando',
  );
  const [ejerciciosEnRiesgo, setEjerciciosEnRiesgo] = useState(0);

  const semanaActual = useRutina((estado) => estado.semana);
  const reemplazarSemana = useRutina((estado) => estado.reemplazar);
  const reemplazarSeleccion = useSeleccion((estado) => estado.reemplazar);

  /** Guarda la semana ya reconstruida hasta que se decida qué hacer. */
  const pendiente = useRef<{ semana: Semana; descartados: number; total: number } | null>(null);

  const aplicar = useCallback(() => {
    const listo = pendiente.current;
    if (!listo) return;

    /* La selección tiene que reflejar lo importado: si no, el paso 2 se
       vería vacío y `sincronizar` borraría la semana recién traída en
       cuanto el socio volviera atrás. */
    const ejercicios: EjercicioSeleccionado[] = [];
    const vistos = new Set<string>();
    for (const dia of DIA_IDS) {
      for (const asignado of listo.semana[dia]) {
        if (vistos.has(asignado.ejercicioId)) continue;
        vistos.add(asignado.ejercicioId);
        ejercicios.push({ id: asignado.ejercicioId, grupo: asignado.grupo });
      }
    }

    const grupos: MuscleGroupId[] = MUSCLE_GROUPS.map((g) => g.id).filter((id) =>
      ejercicios.some((e) => e.grupo === id),
    );

    reemplazarSemana(listo.semana);
    reemplazarSeleccion(grupos, ejercicios);

    const colocados = listo.total - listo.descartados;
    avisar({
      tono: 'exito',
      texto:
        listo.descartados === 0
          ? `Rutina recibida: ${colocados} ${colocados === 1 ? 'ejercicio' : 'ejercicios'}.`
          : `Rutina recibida: ${colocados} de ${listo.total}. ${
              listo.descartados === 1
                ? '1 ejercicio ya no está'
                : `${listo.descartados} ejercicios ya no están`
            } en el catálogo.`,
    });

    pendiente.current = null;
    setEstado('importada');
    onImportada();
  }, [onImportada, reemplazarSeleccion, reemplazarSemana]);

  const cancelar = useCallback(() => {
    pendiente.current = null;
    setEstado('sin-enlace');
    avisar({ texto: 'Se conservó tu rutina actual.' });
  }, []);

  useEffect(() => {
    const codificado = datosRef.current;
    if (codificado === null || resuelto.current || !catalogoListo) return;

    resuelto.current = true;
    limpiarUrl();

    try {
      pendiente.current = jsonARutina(decodificarRutina(codificado), catalogo);

      const ocupados = DIA_IDS.reduce((total, dia) => total + semanaActual[dia].length, 0);
      if (ocupados > 0) {
        setEjerciciosEnRiesgo(ocupados);
        setEstado('confirmar');
        return;
      }

      aplicar();
    } catch (causa) {
      setEstado('error');
      avisar({ tono: 'error', texto: mensajeParaUsuario(causa) });
    }
  }, [aplicar, catalogo, catalogoListo, semanaActual]);

  return { estado, ejerciciosEnRiesgo, confirmar: aplicar, cancelar };
}

/** Quita `?data=` de la barra de direcciones sin recargar ni navegar. */
function limpiarUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAMETRO)) return;
  url.searchParams.delete(PARAMETRO);
  window.history.replaceState(null, '', url.toString());
}
