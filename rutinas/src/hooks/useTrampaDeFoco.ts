import { useEffect, useRef, type RefObject } from 'react';

const FOCALIZABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Encierra el foco dentro de un elemento mientras esté activo.
 *
 * Sin esto, tabular dentro de un panel modal saca el foco al contenido de
 * detrás —que está tapado y a veces ni se ve—, y quien navega con teclado
 * o lector de pantalla se pierde por completo.
 *
 * Al cerrarse devuelve el foco a donde estaba, que es lo que espera quien
 * abrió el panel desde un botón.
 */
export function useTrampaDeFoco<T extends HTMLElement>(
  contenedor: RefObject<T | null>,
  activa: boolean,
): void {
  const focoPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!activa) return;

    focoPrevio.current = document.activeElement as HTMLElement | null;

    /* Se espera un fotograma: el panel entra animado y sus elementos
       todavía no están en el DOM en el momento de montar el efecto. */
    const primerFoco = window.requestAnimationFrame(() => {
      const primero = contenedor.current?.querySelector<HTMLElement>(FOCALIZABLES);
      primero?.focus();
    });

    function alTabular(evento: KeyboardEvent) {
      if (evento.key !== 'Tab' || !contenedor.current) return;

      const focalizables = [...contenedor.current.querySelectorAll<HTMLElement>(FOCALIZABLES)];
      if (focalizables.length === 0) return;

      const primero = focalizables[0];
      const ultimo = focalizables[focalizables.length - 1];
      if (!primero || !ultimo) return;

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alTabular);

    return () => {
      window.cancelAnimationFrame(primerFoco);
      document.removeEventListener('keydown', alTabular);
      focoPrevio.current?.focus();
    };
  }, [activa, contenedor]);
}
