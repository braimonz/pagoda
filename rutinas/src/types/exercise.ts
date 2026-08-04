import { z } from 'zod';

/* ============================================================
   VOCABULARIOS CONTROLADOS

   Son la única fuente de verdad: de aquí salen a la vez el tipo de
   TypeScript (compilación) y el esquema de validación (ejecución), así
   que no pueden desincronizarse.
============================================================ */

/** Grupos musculares elegibles. El orden es el de presentación en la app. */
export const MUSCLE_GROUP_IDS = [
  'pecho',
  'espalda',
  'hombros',
  'biceps',
  'triceps',
  'piernas',
  'gluteos',
  'abdomen',
] as const;

export type MuscleGroupId = (typeof MUSCLE_GROUP_IDS)[number];

/**
 * Músculos que solo aparecen como secundarios. No son un grupo elegible
 * —nadie entrena "día de trapecio"— pero describir un peso muerto sin
 * mencionar el lumbar, o un curl martillo sin el antebrazo, sería impreciso.
 */
export const SECONDARY_MUSCLE_IDS = ['antebrazo', 'trapecio', 'lumbar'] as const;

export type SecondaryMuscleId = (typeof SECONDARY_MUSCLE_IDS)[number];

/** Todo lo que puede aparecer en `musculosSecundarios`. */
export const MUSCLE_IDS = [...MUSCLE_GROUP_IDS, ...SECONDARY_MUSCLE_IDS] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export const EQUIPMENT_IDS = [
  'barra',
  'mancuerna',
  'maquina',
  'polea',
  'peso-corporal',
  'banda',
  'disco',
  'accesorio',
] as const;

export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

export const LEVEL_IDS = ['principiante', 'intermedio', 'avanzado'] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

/* ============================================================
   ESQUEMA DEL EJERCICIO
============================================================ */

export const exerciseSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  grupoMuscular: z.enum(MUSCLE_GROUP_IDS),
  equipo: z.enum(EQUIPMENT_IDS),
  nivel: z.enum(LEVEL_IDS),
  musculosSecundarios: z.array(z.enum(MUSCLE_IDS)),
  descripcion: z.string(),
  /* Cadena vacía mientras no exista el material gráfico, nunca ausente:
     así la UI comprueba `if (ejercicio.imagen)` y no `?.` en cada uso. */
  imagen: z.string(),
  video: z.string(),

  /* PENDIENTES — todavía no están en ejercicios.json.
     Los consumen la fila del catálogo ("4 × 8-12"), los contadores del
     sheet de ajuste y el temporizador de descanso. Opcionales para que el
     catálogo actual valide, y ya declarados para que el día que se añadan
     no haya que tocar el esquema. */
  seriesSugeridas: z.number().int().positive().optional(),
  repsSugeridas: z.string().optional(),
  descansoSugeridoSeg: z.number().int().nonnegative().optional(),
  ejecucion: z.array(z.string()).optional(),
});

export type Exercise = z.infer<typeof exerciseSchema>;

/** El archivo completo: un arreglo de ejercicios, nunca vacío. */
export const exerciseCatalogSchema = z.array(exerciseSchema).min(1);
