import { create } from 'zustand';

import type { Exercise, MuscleGroupId } from '@/types/exercise';

/** Un ejercicio elegido. Se guarda su grupo para poder soltarlo con él. */
export interface EjercicioSeleccionado {
  readonly id: string;
  readonly grupo: MuscleGroupId;
}

interface EstadoSeleccion {
  /** Grupos elegidos, en el orden en que se tocaron. */
  readonly grupos: readonly MuscleGroupId[];
  /** Ejercicios elegidos, en el orden en que se tocaron. */
  readonly ejercicios: readonly EjercicioSeleccionado[];

  alternarGrupo: (grupo: MuscleGroupId) => void;
  alternarEjercicio: (ejercicio: Exercise) => void;
  /** Lo marca como elegido si no lo estaba. Idempotente, a diferencia de alternar. */
  asegurarSeleccionado: (ejercicio: Exercise) => void;
  reiniciar: () => void;
}

/**
 * Lo que el socio lleva elegido: grupos musculares y ejercicios.
 *
 * Vive en un store y no en la página porque es la semilla de la rutina:
 * las pantallas de días, resumen y compartir van a leer exactamente esto.
 * Guardarlo en `useState` obligaría a subirlo aquí en cuanto exista la
 * siguiente pantalla.
 *
 * Todavía sin `persist`: la rutina terminada será lo que se guarde en
 * localStorage (ARQUITECTURA.md §7), no la selección a medias.
 */
export const useSeleccion = create<EstadoSeleccion>()((set) => ({
  grupos: [],
  ejercicios: [],

  alternarGrupo: (grupo) =>
    set((estado) => {
      if (!estado.grupos.includes(grupo)) {
        return { grupos: [...estado.grupos, grupo] };
      }

      /* Al soltar un grupo se sueltan sus ejercicios. Si no, el contador
         de la barra diría "6 ejercicios" con solo 3 a la vista: un número
         que el socio no puede comprobar ni corregir. */
      return {
        grupos: estado.grupos.filter((g) => g !== grupo),
        ejercicios: estado.ejercicios.filter((e) => e.grupo !== grupo),
      };
    }),

  alternarEjercicio: (ejercicio) =>
    set((estado) => ({
      ejercicios: estado.ejercicios.some((e) => e.id === ejercicio.id)
        ? estado.ejercicios.filter((e) => e.id !== ejercicio.id)
        : [...estado.ejercicios, { id: ejercicio.id, grupo: ejercicio.grupoMuscular }],
    })),

  /* La usa el panel de "Añadir ejercicio" de la pantalla semanal. Sin
     esto, lo añadido allí no estaría en la selección y `sincronizar` lo
     borraría en cuanto el socio volviera atrás y regresara: habría metido
     un ejercicio a mano y se lo habría encontrado desaparecido. */
  asegurarSeleccionado: (ejercicio) =>
    set((estado) =>
      estado.ejercicios.some((e) => e.id === ejercicio.id)
        ? {}
        : {
            ejercicios: [
              ...estado.ejercicios,
              { id: ejercicio.id, grupo: ejercicio.grupoMuscular },
            ],
          },
    ),

  reiniciar: () => set({ grupos: [], ejercicios: [] }),
}));

/* ------------------------------------------------------------
   SELECTORES

   Cada uno devuelve un valor primitivo, así que un componente solo se
   vuelve a pintar cuando cambia *su* dato. Suscribirse al store entero
   haría que tocar un ejercicio repintase las 120 tarjetas.
------------------------------------------------------------ */

export const useGrupoSeleccionado = (grupo: MuscleGroupId): boolean =>
  useSeleccion((estado) => estado.grupos.includes(grupo));

export const useEjercicioSeleccionado = (id: string): boolean =>
  useSeleccion((estado) => estado.ejercicios.some((e) => e.id === id));

export const useTotalGrupos = (): number => useSeleccion((estado) => estado.grupos.length);

export const useTotalEjercicios = (): number =>
  useSeleccion((estado) => estado.ejercicios.length);
