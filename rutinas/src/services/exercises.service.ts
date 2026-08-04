import { MUSCLE_GROUPS, type MuscleGroup } from '@/config/muscleGroups';
import { ErrorConMensaje } from '@/lib/errors';
import {
  exerciseCatalogSchema,
  type Exercise,
  type MuscleGroupId,
} from '@/types/exercise';
import { z } from 'zod';

/* ============================================================
   SERVICIO DEL CATÁLOGO DE EJERCICIOS

   Única capa que sabe de dónde salen los datos. Hoy lee un archivo
   estático; mañana leerá /api/ejercicios. Las firmas son asíncronas
   justamente para que ese cambio no toque ni un componente.
============================================================ */

/** Un grupo muscular con cuántos ejercicios tiene realmente el catálogo. */
export interface MuscleGroupSummary extends MuscleGroup {
  readonly total: number;
}

interface Catalogo {
  readonly ejercicios: readonly Exercise[];
  /** Índice construido una sola vez: filtrar por grupo es O(1), no O(n). */
  readonly porGrupo: ReadonlyMap<MuscleGroupId, readonly Exercise[]>;
  /** Solo los grupos que tienen al menos un ejercicio, en orden de catálogo. */
  readonly grupos: readonly MuscleGroupSummary[];
}

/**
 * Fallo al obtener el catálogo.
 *
 * Hereda de ErrorConMensaje, así que lleva por separado el texto que ve el
 * socio y el detalle técnico. Que un ejercicio tenga mal el grupo muscular
 * es un problema de quien edita el JSON, no de quien abre la app: al socio
 * se le dice que no se pudo cargar, y el detalle va a la consola.
 */
export class ErrorCatalogo extends ErrorConMensaje {
  constructor(mensajeUsuario: string, detalleTecnico?: string, options?: { cause?: unknown }) {
    super(mensajeUsuario, detalleTecnico, options);
    this.name = 'ErrorCatalogo';
  }
}

const NO_SE_PUDO_CARGAR = 'No se pudieron cargar los ejercicios. Vuelve a intentarlo.';

/* El JSON se sirve como archivo estático, no se importa: así el entrenador
   puede editarlo sin recompilar. BASE_URL lo ancla a /rutinas/ en producción
   y a / en las pruebas locales. */
const URL_CATALOGO = `${import.meta.env.BASE_URL}data/ejercicios.json`;

/**
 * Se memoiza la PROMESA, no el resultado. Dos pantallas que pidan el
 * catálogo a la vez comparten una sola descarga, y el StrictMode de React
 * —que monta cada efecto dos veces en desarrollo— no dispara dos peticiones.
 */
let catalogoEnCurso: Promise<Catalogo> | null = null;

async function descargarCatalogo(): Promise<Catalogo> {
  let respuesta: Response;
  try {
    respuesta = await fetch(URL_CATALOGO, { headers: { Accept: 'application/json' } });
  } catch (causa) {
    throw new ErrorCatalogo(
      'No se pudieron cargar los ejercicios. Revisa tu conexión.',
      `fetch falló contra ${URL_CATALOGO}`,
      { cause: causa },
    );
  }

  if (!respuesta.ok) {
    throw new ErrorCatalogo(
      NO_SE_PUDO_CARGAR,
      `${URL_CATALOGO} respondió ${respuesta.status} ${respuesta.statusText}`,
    );
  }

  let crudo: unknown;
  try {
    crudo = await respuesta.json();
  } catch (causa) {
    throw new ErrorCatalogo(NO_SE_PUDO_CARGAR, 'El catálogo no es un JSON válido', {
      cause: causa,
    });
  }

  const validado = exerciseCatalogSchema.safeParse(crudo);
  if (!validado.success) {
    const detalle = describirFallos(validado.error);
    /* A la vista solo llega "no se pudieron cargar"; el diagnóstico —qué
       ejercicio y qué campo— queda aquí, que es donde lo va a buscar quien
       edite el catálogo. */
    console.error(`[catálogo de ejercicios] ${detalle}`);
    throw new ErrorCatalogo(NO_SE_PUDO_CARGAR, detalle, { cause: validado.error });
  }

  return indexar(validado.data);
}

/** Convierte los fallos de zod en algo que un humano pueda accionar. */
function describirFallos(error: z.ZodError): string {
  const detalles = error.issues.slice(0, 3).map((fallo) => {
    const [indice, ...resto] = fallo.path;
    const posicion = typeof indice === 'number' ? `ejercicio #${indice + 1}` : 'catálogo';
    const campo = resto.length > 0 ? ` · campo "${resto.join('.')}"` : '';
    return `${posicion}${campo}: ${fallo.message}`;
  });

  const restantes = error.issues.length - detalles.length;
  const cola = restantes > 0 ? ` (y ${restantes} problema(s) más)` : '';

  return `El catálogo de ejercicios tiene datos inválidos — ${detalles.join('; ')}${cola}.`;
}

function indexar(ejercicios: readonly Exercise[]): Catalogo {
  const porGrupo = new Map<MuscleGroupId, Exercise[]>();

  /* Se respeta el orden del archivo, que es deliberado: dentro de cada grupo
     los básicos van antes que los de aislamiento. Ordenar alfabéticamente
     destruiría ese criterio de entrenamiento. */
  for (const ejercicio of ejercicios) {
    const lista = porGrupo.get(ejercicio.grupoMuscular);
    if (lista) lista.push(ejercicio);
    else porGrupo.set(ejercicio.grupoMuscular, [ejercicio]);
  }

  /* Un grupo sin ejercicios no se muestra: es preferible una rejilla de siete
     tarjetas a una octava que lleva a una lista vacía. */
  const grupos = MUSCLE_GROUPS.flatMap<MuscleGroupSummary>((grupo) => {
    const total = porGrupo.get(grupo.id)?.length ?? 0;
    return total === 0 ? [] : [{ ...grupo, total }];
  });

  return { ejercicios, porGrupo, grupos };
}

function obtenerCatalogo(): Promise<Catalogo> {
  if (!catalogoEnCurso) {
    catalogoEnCurso = descargarCatalogo().catch((error: unknown) => {
      /* Si falló, se olvida la promesa rechazada. Sin esto, "Reintentar"
         devolvería para siempre el mismo error cacheado. */
      catalogoEnCurso = null;
      throw error;
    });
  }
  return catalogoEnCurso;
}

/* ------------------------------------------------------------
   API PÚBLICA
------------------------------------------------------------ */

/** Grupos musculares presentes en el catálogo, con su conteo. */
export async function getMuscleGroups(): Promise<readonly MuscleGroupSummary[]> {
  return (await obtenerCatalogo()).grupos;
}

/** Ejercicios de un grupo. Devuelve vacío si el grupo no tiene ninguno. */
export async function getExercisesByGroup(
  grupoId: MuscleGroupId,
): Promise<readonly Exercise[]> {
  return (await obtenerCatalogo()).porGrupo.get(grupoId) ?? [];
}

/** Catálogo completo. Lo necesitará el buscador global. */
export async function getExercises(): Promise<readonly Exercise[]> {
  return (await obtenerCatalogo()).ejercicios;
}

/** Un ejercicio por id, o null si no existe. */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { ejercicios } = await obtenerCatalogo();
  return ejercicios.find((ejercicio) => ejercicio.id === id) ?? null;
}

/** Olvida lo descargado. La usan el botón de reintentar y las pruebas. */
export function limpiarCacheCatalogo(): void {
  catalogoEnCurso = null;
}
