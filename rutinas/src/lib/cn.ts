import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases condicionales y resuelve conflictos de Tailwind.
 *
 * `clsx` acepta strings, condicionales y arreglos; `twMerge` hace que la
 * última clase gane cuando dos compiten: cn('p-4', 'p-2') da 'p-2'. Sin
 * esto, la prop `className` de un componente no podría sobrescribir su
 * estilo por defecto —quedaría a merced del orden del CSS generado.
 */
export function cn(...clases: ClassValue[]): string {
  return twMerge(clsx(clases));
}
