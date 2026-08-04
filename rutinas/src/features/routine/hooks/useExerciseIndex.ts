import { useAsync, type RecursoAsincrono } from '@/hooks/useAsync';
import { getExercisesIndex } from '@/services/exercises.service';
import type { Exercise } from '@/types/exercise';

const VACIO: ReadonlyMap<string, Exercise> = new Map();

/**
 * El catálogo indexado por id.
 *
 * La rutina guarda ids y no copias del ejercicio: si mañana se corrige la
 * descripción de un ejercicio en el JSON, la rutina del socio se actualiza
 * sola. El precio es tener que resolver los ids al pintar, y de eso se
 * encarga este índice.
 */
export function useExerciseIndex(): RecursoAsincrono<ReadonlyMap<string, Exercise>> {
  return useAsync(getExercisesIndex, VACIO);
}
