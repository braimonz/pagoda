import type { Transition, Variants } from 'framer-motion';

/* ============================================================
   VOCABULARIO DE MOVIMIENTO

   Un puñado de variantes compartidas en lugar de números sueltos
   repartidos por los componentes. Cambiar el ritmo de la app es
   cambiar este archivo.

   Nada dura más de 400 ms: una animación lenta no se percibe como
   elegancia sino como una app lenta.
============================================================ */

/* `NonNullable` y no `Transition['ease']` a secas: ese tipo admite
   undefined, y con exactOptionalPropertyTypes no se puede pasar a un
   `transition` en línea. */
type Curva = NonNullable<Transition['ease']>;

/** La curva del sitio: arranca rápido y aterriza suave. */
export const SUAVE: Curva = [0.16, 1, 0.3, 1];

/** Un sobrepaso mínimo. Solo para confirmaciones, nunca para entradas. */
export const REBOTE: Curva = [0.34, 1.56, 0.64, 1];

/** Entrada de pantalla: sube 16 px mientras aparece. */
export const pantalla: Variants = {
  entra: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: SUAVE } },
  sale: { opacity: 0, y: -12, transition: { duration: 0.18, ease: SUAVE } },
};

/**
 * Contenedor de una lista escalonada.
 *
 * `staggerChildren` se queda en 40 ms y no se escalona más allá de los
 * primeros elementos: encadenar 40 filas haría que la pantalla tardase
 * un segundo en terminar de existir.
 */
export const lista: Variants = {
  entra: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
};

export const elemento: Variants = {
  entra: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: SUAVE } },
};

/** Presión: la superficie cede bajo el dedo y vuelve. */
export const PULSACION = { scale: 0.97 } as const;

/** Transición corta para cambios de estado (color, borde, sombra). */
export const RAPIDA: Transition = { duration: 0.18, ease: SUAVE };
