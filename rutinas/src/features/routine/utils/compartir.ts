import { z } from 'zod';

import { DIA_IDS, type DiaId } from '@/config/dias';
import { aBase64Url, deBase64Url } from '@/lib/base64url';
import { ErrorConMensaje } from '@/lib/errors';
import { nuevoUid } from '@/lib/id';
import type { EjercicioAsignado, Semana } from '@/store/rutina.store';
import type { Exercise } from '@/types/exercise';

/* ============================================================
   RUTINA COMPARTIBLE

   Formato de intercambio: lo que viaja dentro del enlace. No es el
   estado de la app, es su versión mínima.
============================================================ */

/** Nombre del parámetro del enlace: misitio.com/rutina?data=… */
export const PARAMETRO = 'data';

/** Versión del formato. Sube cuando la forma del objeto cambie. */
export const VERSION_FORMATO = 1;

const listaDeIds = z.array(z.string().min(1));

/**
 * Claves de una letra y días vacíos omitidos. No es tacañería: cada
 * carácter del JSON se infla un 33 % al pasar a base64 y acaba en una
 * URL que alguien pega en WhatsApp. Con quince ejercicios, el formato
 * largo pasaba de 1 200 caracteres; este se queda en unos 500.
 */
const rutinaCompartidaSchema = z.object({
  /** Versión del formato. */
  v: z.number().int().positive(),
  /** Días con ejercicios. Un día ausente es día de descanso. */
  d: z.object({
    lun: listaDeIds.optional(),
    mar: listaDeIds.optional(),
    mie: listaDeIds.optional(),
    jue: listaDeIds.optional(),
    vie: listaDeIds.optional(),
    sab: listaDeIds.optional(),
    dom: listaDeIds.optional(),
  }),
});

export type RutinaCompartida = z.infer<typeof rutinaCompartidaSchema>;

/** Lo que se recupera de un enlace, ya cotejado con el catálogo. */
export interface RutinaImportada {
  readonly semana: Semana;
  /** Ejercicios del enlace que ya no existen en el catálogo. */
  readonly descartados: number;
  readonly total: number;
}

/* ------------------------------------------------------------
   RUTINA → JSON → ENLACE
------------------------------------------------------------ */

/**
 * La rutina semanal como objeto JSON plano.
 *
 * Solo viajan los ids de los ejercicios. Ni el `uid` de cada instancia
 * —que es local y se regenera al importar— ni el grupo muscular, que se
 * deduce del catálogo. Copiar el ejercicio entero además congelaría los
 * datos: si mañana se corrige una descripción, la rutina compartida
 * seguiría enseñando la vieja.
 */
export function rutinaAJson(semana: Semana): RutinaCompartida {
  const dias: RutinaCompartida['d'] = {};

  for (const dia of DIA_IDS) {
    const ejercicios = semana[dia];
    if (ejercicios.length > 0) {
      dias[dia] = ejercicios.map((asignado) => asignado.ejercicioId);
    }
  }

  return { v: VERSION_FORMATO, d: dias };
}

/** La rutina como cadena base64url, lista para meter en una URL. */
export function codificarRutina(semana: Semana): string {
  return aBase64Url(JSON.stringify(rutinaAJson(semana)));
}

/**
 * El enlace para compartir: `<origen><base>?data=<base64url>`.
 *
 * En producción sale `https://pagoda.mx/rutinas/?data=…`. La app se sirve
 * bajo /rutinas, así que ese es su `/rutina` — cuando entre el router, la
 * ruta podrá ser cualquiera: lo que importa es el parámetro `data`.
 */
export function crearEnlaceRutina(semana: Semana, base?: string): string {
  const raiz = base ?? `${window.location.origin}${import.meta.env.BASE_URL}`;
  const url = new URL(raiz);
  url.searchParams.set(PARAMETRO, codificarRutina(semana));
  return url.toString();
}

/* ------------------------------------------------------------
   WHATSAPP
------------------------------------------------------------ */

/** Encabezado del mensaje. Es lo que el socio verá en su lista de chats. */
export const TITULO_MENSAJE = 'Mi rutina semanal';

/**
 * El texto que se manda por WhatsApp: título, un resumen de una línea y
 * el enlace.
 *
 * El enlace va en su propia línea y al final para que WhatsApp lo detecte
 * y lo enlace entero. Pegado a otro texto, el punto o el paréntesis de
 * cierre acaban dentro de la URL y el enlace deja de funcionar.
 */
export function crearMensajeWhatsApp(semana: Semana, enlace?: string): string {
  const url = enlace ?? crearEnlaceRutina(semana);

  const ejercicios = DIA_IDS.reduce((total, dia) => total + semana[dia].length, 0);
  const dias = DIA_IDS.filter((dia) => semana[dia].length > 0).length;

  const resumen =
    `${ejercicios} ${ejercicios === 1 ? 'ejercicio' : 'ejercicios'} ` +
    `en ${dias} ${dias === 1 ? 'día' : 'días'}`;

  return `${TITULO_MENSAJE} — Pagoda Fitness Center\n${resumen}\n\n${url}`;
}

/**
 * La dirección `wa.me` que abre WhatsApp con el mensaje ya escrito.
 *
 * Sin número de destino: `wa.me/?text=` abre el selector de contactos, así
 * que sirve tanto para mandársela a alguien como para guardársela uno
 * mismo en su propio chat. Y no necesita servidor ni la API de WhatsApp
 * Business, igual que los avisos del panel de socios.
 */
export function crearEnlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

/* ------------------------------------------------------------
   ENLACE → JSON → RUTINA
------------------------------------------------------------ */

/** El valor de `?data=` de una URL, o null si no lo lleva. */
export function leerDatosDeUrl(url: string = window.location.href): string | null {
  try {
    return new URL(url).searchParams.get(PARAMETRO);
  } catch {
    return null;
  }
}

const NO_SE_PUDO_LEER = 'Este enlace de rutina no es válido.';

/** base64url → objeto JSON validado. Lanza si el enlace está corrupto. */
export function decodificarRutina(codificado: string): RutinaCompartida {
  let texto: string;
  try {
    texto = deBase64Url(codificado);
  } catch (causa) {
    throw new ErrorConMensaje(NO_SE_PUDO_LEER, 'La cadena no es base64url válido', {
      cause: causa,
    });
  }

  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch (causa) {
    throw new ErrorConMensaje(NO_SE_PUDO_LEER, 'El contenido decodificado no es JSON', {
      cause: causa,
    });
  }

  const validado = rutinaCompartidaSchema.safeParse(crudo);
  if (!validado.success) {
    throw new ErrorConMensaje(NO_SE_PUDO_LEER, validado.error.issues[0]?.message ?? 'Forma inesperada', {
      cause: validado.error,
    });
  }

  if (validado.data.v > VERSION_FORMATO) {
    throw new ErrorConMensaje(
      'Este enlace se creó con una versión más nueva de la app. Actualízala para abrirlo.',
      `versión ${validado.data.v} > ${VERSION_FORMATO}`,
    );
  }

  return validado.data;
}

/**
 * El objeto JSON de vuelta a una semana utilizable.
 *
 * Cada id se coteja con el catálogo: si el enlace es viejo y algún
 * ejercicio ya no existe, se descarta en lugar de dejar una tarjeta rota
 * —y se informa de cuántos, que callarlo sería peor—.
 */
export function jsonARutina(
  datos: RutinaCompartida,
  catalogo: ReadonlyMap<string, Exercise>,
): RutinaImportada {
  const semana: Record<DiaId, readonly EjercicioAsignado[]> = {
    lun: [],
    mar: [],
    mie: [],
    jue: [],
    vie: [],
    sab: [],
    dom: [],
  };

  let total = 0;
  let descartados = 0;

  for (const dia of DIA_IDS) {
    const ids = datos.d[dia] ?? [];
    const asignados: EjercicioAsignado[] = [];

    for (const ejercicioId of ids) {
      total += 1;
      const ejercicio = catalogo.get(ejercicioId);
      if (!ejercicio) {
        descartados += 1;
        continue;
      }
      /* uid nuevo: el del emisor no significa nada aquí, y así el mismo
         ejercicio puede repetirse sin que dos instancias choquen. */
      asignados.push({
        uid: nuevoUid(),
        ejercicioId,
        grupo: ejercicio.grupoMuscular,
      });
    }

    semana[dia] = asignados;
  }

  return { semana, descartados, total };
}
