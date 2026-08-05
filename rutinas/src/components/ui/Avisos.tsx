import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import { SUAVE } from '@/lib/motion';
import { useUi, type Aviso, type TonoAviso } from '@/store/ui.store';

const BORDE: Record<TonoAviso, string> = {
  neutro: 'border-line-strong',
  exito: 'border-accent-line',
  error: 'border-rose-500/40',
};

/**
 * Pila de avisos sobre la barra inferior.
 *
 * Va por encima de la barra y no del contenido para no tapar lo que se
 * acaba de tocar. `aria-live="polite"` hace que un lector de pantalla los
 * lea sin interrumpir lo que esté diciendo.
 */
export function Avisos() {
  const avisos = useUi((estado) => estado.avisos);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-5"
    >
      <AnimatePresence initial={false}>
        {avisos.map((aviso) => (
          <Tarjeta key={aviso.id} aviso={aviso} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Tarjeta({ aviso }: { readonly aviso: Aviso }) {
  const cerrar = useUi((estado) => estado.cerrarAviso);

  useEffect(() => {
    const id = window.setTimeout(() => cerrar(aviso.id), aviso.duracionMs);
    return () => window.clearTimeout(id);
  }, [aviso.id, aviso.duracionMs, cerrar]);

  return (
    <motion.div
      layout
      initial={{ y: 16, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 8, opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.24, ease: SUAVE }}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card border',
        'bg-elevated/95 px-4 py-3 shadow-lift backdrop-blur-xl',
        BORDE[aviso.tono],
      )}
    >
      <p className="min-w-0 flex-1 text-sm leading-snug text-ink">{aviso.texto}</p>

      {aviso.accion && (
        <button
          type="button"
          onClick={() => {
            aviso.accion?.alPulsar();
            cerrar(aviso.id);
          }}
          className="-my-2 shrink-0 rounded-btn px-3 py-2 font-accent text-xs font-extrabold tracking-[0.14em] text-accent uppercase transition-colors hover:bg-accent-soft"
        >
          {aviso.accion.etiqueta}
        </button>
      )}

      <button
        type="button"
        onClick={() => cerrar(aviso.id)}
        aria-label="Cerrar aviso"
        className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-mute transition-colors hover:text-ink"
      >
        <span aria-hidden="true">×</span>
      </button>
    </motion.div>
  );
}
