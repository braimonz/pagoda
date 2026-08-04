import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

import { SUAVE } from '@/lib/motion';

interface ToastProps {
  /** `null` lo mantiene oculto. */
  readonly mensaje: string | null;
  readonly onCerrar: () => void;
  readonly duracionMs?: number;
}

/**
 * Aviso breve sobre la barra inferior.
 *
 * Se coloca por encima de la barra —no encima del contenido— para no tapar
 * lo que el socio acaba de tocar, y se retira solo.
 */
export function Toast({ mensaje, onCerrar, duracionMs = 3200 }: ToastProps) {
  useEffect(() => {
    if (mensaje === null) return;
    const id = window.setTimeout(onCerrar, duracionMs);
    return () => window.clearTimeout(id);
  }, [mensaje, duracionMs, onCerrar]);

  return (
    <AnimatePresence>
      {mensaje !== null && (
        <motion.div
          role="status"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.24, ease: SUAVE }}
          className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-5"
        >
          <p className="rounded-full border border-accent-line bg-elevated px-5 py-3 text-sm text-ink shadow-lift">
            {mensaje}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
