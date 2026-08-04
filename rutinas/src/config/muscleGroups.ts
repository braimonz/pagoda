import {
  MUSCLE_GROUP_IDS,
  SECONDARY_MUSCLE_IDS,
  type MuscleGroupId,
  type MuscleId,
  type SecondaryMuscleId,
} from '@/types/exercise';

/**
 * Presentación de un grupo muscular: nombre visible y sello kanji.
 * El dato de cuántos ejercicios tiene NO vive aquí — se cuenta del JSON.
 */
export interface MuscleGroup {
  readonly id: MuscleGroupId;
  readonly nombre: string;
  readonly kanji: string;
}

/* Declarado como Record y no como arreglo a propósito: TypeScript exige
   que estén las ocho claves, así que añadir un grupo al vocabulario sin
   darle nombre y kanji es un error de compilación, no un hueco en la UI. */
const DEFINICIONES: Record<MuscleGroupId, Omit<MuscleGroup, 'id'>> = {
  pecho: { nombre: 'Pecho', kanji: '胸' },
  espalda: { nombre: 'Espalda', kanji: '背' },
  hombros: { nombre: 'Hombros', kanji: '肩' },
  /* 屈 (flexionar) y 伸 (extender): describen lo que hace cada músculo. */
  biceps: { nombre: 'Bíceps', kanji: '屈' },
  triceps: { nombre: 'Tríceps', kanji: '伸' },
  piernas: { nombre: 'Piernas', kanji: '脚' },
  gluteos: { nombre: 'Glúteos', kanji: '臀' },
  abdomen: { nombre: 'Abdomen', kanji: '腹' },
};

const NOMBRES_SECUNDARIOS: Record<SecondaryMuscleId, string> = {
  antebrazo: 'Antebrazo',
  trapecio: 'Trapecio',
  lumbar: 'Lumbar',
};

/** Los ocho grupos, en orden de presentación. */
export const MUSCLE_GROUPS: readonly MuscleGroup[] = MUSCLE_GROUP_IDS.map((id) => ({
  id,
  ...DEFINICIONES[id],
}));

const POR_ID = new Map<MuscleGroupId, MuscleGroup>(MUSCLE_GROUPS.map((g) => [g.id, g]));

/** Grupo por id. Lanza si el id no existe: sería un fallo de programación. */
export function grupoMuscularPorId(id: MuscleGroupId): MuscleGroup {
  const grupo = POR_ID.get(id);
  if (!grupo) throw new Error(`Grupo muscular desconocido: ${id}`);
  return grupo;
}

function esSecundario(id: MuscleId): id is SecondaryMuscleId {
  return (SECONDARY_MUSCLE_IDS as readonly string[]).includes(id);
}

/** Nombre visible de cualquier músculo, sea grupo o solo secundario. */
export function nombreMusculo(id: MuscleId): string {
  return esSecundario(id) ? NOMBRES_SECUNDARIOS[id] : grupoMuscularPorId(id).nombre;
}
