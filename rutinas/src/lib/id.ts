/**
 * Identificador único para una instancia de ejercicio dentro de la rutina.
 *
 * No es el id del ejercicio: el mismo press de banca puede aparecer el
 * lunes y el viernes, o dos veces el mismo día. Sin un id por instancia,
 * quitar uno quitaría los dos.
 */
export function nuevoUid(): string {
  /* randomUUID solo existe en contextos seguros (https o localhost). En
     http plano el respaldo basta: estos ids no salen del dispositivo. */
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `uid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
