import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

import { useTrampaDeFoco } from '@/hooks/useTrampaDeFoco';
import { SUAVE } from '@/lib/motion';

interface SheetProps {
  readonly abierto: boolean;
  readonly titulo: string;
  readonly onCerrar: () => void;
  readonly children: ReactNode;
}

/** Cuánto hay que arrastrar —o con qué impulso— para que se cierre. */
const UMBRAL_ARRASTRE = 110;
const UMBRAL_IMPULSO = 500;

/**
 * Panel que sube desde abajo.
 *
 * Se usa en lugar de una pantalla nueva porque deja ver el contexto
 * detrás: el socio sabe a qué día está añadiendo sin tener que recordarlo.
 *
 * Se cierra de cuatro maneras —arrastrando hacia abajo, tocando el fondo,
 * con Escape o con el botón—, porque en móvil el gesto es lo primero que
 * la gente intenta y quedarse encerrado en un panel es de las cosas que
 * más rápido hacen abandonar.
 */
export function Sheet({ abierto, titulo, onCerrar, children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  useTrampaDeFoco(panel, abierto);

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
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.38, ease: SUAVE }}
            drag="y"
            dragDirectionLock
            /* Solo hacia abajo, y con resistencia si se tira hacia arriba:
               el panel se siente sujeto por el borde superior. */
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > UMBRAL_ARRASTRE || info.velocity.y > UMBRAL_IMPULSO) {
                onCerrar();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col rounded-t-3xl border-t border-line bg-elevated shadow-lift"
          >
            <div className="shrink-0 cursor-grab px-5 pt-3 pb-4 active:cursor-grabbing">
              <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-line-strong" />
              <h2 className="mt-4 font-display text-2xl tracking-wide text-ink">{titulo}</h2>
            </div>

            {/* `overscroll-contain` evita que al llegar al final de la lista
                el gesto siga arrastrando la página de detrás. */}
            <div className="pb-segura min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
