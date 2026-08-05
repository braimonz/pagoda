import { create } from 'zustand';

import { nuevoUid } from '@/lib/id';

export type TonoAviso = 'neutro' | 'exito' | 'error';

export interface AccionAviso {
  readonly etiqueta: string;
  readonly alPulsar: () => void;
}

export interface Aviso {
  readonly id: string;
  readonly texto: string;
  readonly tono: TonoAviso;
  /** Botón dentro del aviso. Es lo que hace posible deshacer. */
  readonly accion: AccionAviso | null;
  readonly duracionMs: number;
}

interface NuevoAviso {
  readonly texto: string;
  readonly tono?: TonoAviso;
  readonly accion?: AccionAviso;
  readonly duracionMs?: number;
}

interface EstadoUi {
  readonly avisos: readonly Aviso[];
  mostrarAviso: (aviso: NuevoAviso) => void;
  cerrarAviso: (id: string) => void;
}

/** Un aviso con acción vive más: hay que leerlo y decidir. */
const DURACION_NORMAL = 3200;
const DURACION_CON_ACCION = 6000;

/** Máximo apilados. Más de tres tapan la pantalla en un móvil. */
const MAXIMO = 3;

/**
 * Avisos de la aplicación.
 *
 * En un store y no en props porque los lanza cualquiera: una tarjeta al
 * quitarse, un hook al importar un enlace, el panel al copiar. Pasarlos
 * por props obligaría a subir un `useState` hasta la raíz y bajarlo por
 * cinco niveles.
 */
export const useUi = create<EstadoUi>()((set) => ({
  avisos: [],

  mostrarAviso: (nuevo) =>
    set((estado) => {
      const aviso: Aviso = {
        id: nuevoUid(),
        texto: nuevo.texto,
        tono: nuevo.tono ?? 'neutro',
        accion: nuevo.accion ?? null,
        duracionMs: nuevo.duracionMs ?? (nuevo.accion ? DURACION_CON_ACCION : DURACION_NORMAL),
      };

      /* Los más viejos salen por arriba cuando se llena la pila. */
      return { avisos: [...estado.avisos, aviso].slice(-MAXIMO) };
    }),

  cerrarAviso: (id) =>
    set((estado) => ({ avisos: estado.avisos.filter((aviso) => aviso.id !== id) })),
}));

/** Atajo para lanzar avisos fuera de un componente. */
export const avisar = (aviso: NuevoAviso): void => useUi.getState().mostrarAviso(aviso);
