import { create } from 'zustand';

import { DIA_IDS, type DiaId } from '@/config/dias';
import { MUSCLE_GROUPS } from '@/config/muscleGroups';
import { nuevoUid } from '@/lib/id';
import type { MuscleGroupId } from '@/types/exercise';

import type { EjercicioSeleccionado } from './seleccion.store';

/** Un ejercicio colocado en un día concreto. */
export interface EjercicioAsignado {
  /** Identidad de esta instancia, no del ejercicio. */
  readonly uid: string;
  readonly ejercicioId: string;
  readonly grupo: MuscleGroupId;
}

export type Semana = Readonly<Record<DiaId, readonly EjercicioAsignado[]>>;

interface EstadoRutina {
  readonly semana: Semana;

  /** Cuadra la semana con lo seleccionado, conservando lo ya colocado. */
  sincronizar: (seleccionados: readonly EjercicioSeleccionado[]) => void;
  agregar: (dia: DiaId, ejercicio: EjercicioSeleccionado) => void;
  quitar: (uid: string) => void;
  /** Mueve una instancia a un día y posición. Sirve para reordenar y para cambiar de día. */
  mover: (uid: string, diaDestino: DiaId, indice: number) => void;
  vaciar: () => void;
}

function semanaVacia(): Record<DiaId, readonly EjercicioAsignado[]> {
  return { lun: [], mar: [], mie: [], jue: [], vie: [], sab: [], dom: [] };
}

/** En qué día está una instancia, o null si no está en la semana. */
function diaDe(semana: Semana, uid: string): DiaId | null {
  return DIA_IDS.find((dia) => semana[dia].some((e) => e.uid === uid)) ?? null;
}

/**
 * Reparte los grupos entre los días: el primer grupo al lunes, el segundo
 * al martes, y así. Es el reparto que hace casi todo el mundo y deja la
 * semana lista para retocar, en vez de siete días vacíos que obligan a
 * arrastrar quince tarjetas antes de ver nada.
 */
function diaSugerido(grupo: MuscleGroupId, gruposPresentes: readonly MuscleGroupId[]): DiaId {
  const posicion = gruposPresentes.indexOf(grupo);
  const indice = (posicion === -1 ? 0 : posicion) % DIA_IDS.length;
  return DIA_IDS[indice] ?? 'lun';
}

export const useRutina = create<EstadoRutina>()((set) => ({
  semana: semanaVacia(),

  sincronizar: (seleccionados) =>
    set((estado) => {
      const idsSeleccionados = new Set(seleccionados.map((e) => e.id));
      const semana = semanaVacia();
      const yaColocados = new Set<string>();

      /* 1. Se conserva lo que el socio ya movió a mano, salvo lo que haya
            dejado de estar seleccionado. Volver atrás a añadir un grupo no
            puede deshacerle la semana que acaba de organizar. */
      for (const dia of DIA_IDS) {
        semana[dia] = estado.semana[dia].filter((asignado) => {
          if (!idsSeleccionados.has(asignado.ejercicioId)) return false;
          yaColocados.add(asignado.ejercicioId);
          return true;
        });
      }

      /* 2. Lo recién seleccionado cae en el día que le toca a su grupo. */
      const gruposPresentes = MUSCLE_GROUPS.map((g) => g.id).filter((id) =>
        seleccionados.some((e) => e.grupo === id),
      );

      for (const seleccionado of seleccionados) {
        if (yaColocados.has(seleccionado.id)) continue;
        const dia = diaSugerido(seleccionado.grupo, gruposPresentes);
        semana[dia] = [
          ...semana[dia],
          { uid: nuevoUid(), ejercicioId: seleccionado.id, grupo: seleccionado.grupo },
        ];
      }

      return { semana };
    }),

  agregar: (dia, ejercicio) =>
    set((estado) => ({
      semana: {
        ...estado.semana,
        [dia]: [
          ...estado.semana[dia],
          { uid: nuevoUid(), ejercicioId: ejercicio.id, grupo: ejercicio.grupo },
        ],
      },
    })),

  quitar: (uid) =>
    set((estado) => {
      const dia = diaDe(estado.semana, uid);
      if (dia === null) return {};
      return {
        semana: { ...estado.semana, [dia]: estado.semana[dia].filter((e) => e.uid !== uid) },
      };
    }),

  mover: (uid, diaDestino, indice) =>
    set((estado) => {
      const origen = diaDe(estado.semana, uid);
      if (origen === null) return {};

      const movido = estado.semana[origen].find((e) => e.uid === uid);
      if (!movido) return {};

      /* Quitar y luego insertar en el índice destino equivale a un
         arrayMove cuando origen y destino son el mismo día, y funciona
         igual entre días distintos. Una sola rama para los dos casos. */
      const sinElMovido = estado.semana[origen].filter((e) => e.uid !== uid);
      const destino = origen === diaDestino ? sinElMovido : [...estado.semana[diaDestino]];
      const posicion = Math.max(0, Math.min(indice, destino.length));

      return {
        semana: {
          ...estado.semana,
          [origen]: sinElMovido,
          [diaDestino]: [...destino.slice(0, posicion), movido, ...destino.slice(posicion)],
        },
      };
    }),

  vaciar: () => set({ semana: semanaVacia() }),
}));

/* ------------------------------------------------------------
   SELECTORES
------------------------------------------------------------ */

export const useDia = (dia: DiaId): readonly EjercicioAsignado[] =>
  useRutina((estado) => estado.semana[dia]);

export const useTotalAsignados = (): number =>
  useRutina((estado) => DIA_IDS.reduce((total, dia) => total + estado.semana[dia].length, 0));

export const useDiasConEjercicios = (): number =>
  useRutina((estado) => DIA_IDS.filter((dia) => estado.semana[dia].length > 0).length);
