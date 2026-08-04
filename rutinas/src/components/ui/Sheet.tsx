import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';

import { SUAVE } from '@/lib/motion';

interface SheetProps {
  readonly abierto: boolean;
  readonly titulo: string;
  readonly onCerrar: () => void;
  readonly children: ReactNode;
}

/**
 * Panel que sube desde abajo.
 *
 * Se usa en lugar de una pantalla nueva porque deja ver el contexto
 * detrás: el socio sabe a qué día está añadiendo sin tener que recordarlo.
 *
 * Se cierra tocando el fondo o con Escape. Mientras está abierto bloquea
 * el scroll del documento, para que arrastrar dentro del panel no mueva la
 * página que hay debajo.
 */
export function Sheet({ abierto, titulo, onCerrar, children }: SheetProps) {
  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar();
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPulsar);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', alPulsar);
    };
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onCerrar}
            className="fixed inset-0 z-50 bg-black/60"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.38, ease: SUAVE }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col rounded-t-3xl border-t border-line bg-elevated shadow-lift"
          >
            <div className="shrink-0 px-5 pt-3 pb-4">
              <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-line-strong" />
              <h2 className="mt-4 font-display text-2xl tracking-wide text-ink">{titulo}</h2>
            </div>

            <div className="pb-segura min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
