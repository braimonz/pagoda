import { AnimatePresence, motion } from 'framer-motion';

import { SUAVE } from '@/lib/motion';

interface ContadorProps {
  readonly valor: number;
  readonly className?: string;
}

/**
 * Número que rueda al cambiar en lugar de reemplazarse de golpe.
 *
 * La cifra vieja sale hacia arriba y la nueva entra desde abajo, dentro de
 * una máscara. Es lo que hace que un contador se sienta como un marcador
 * físico y no como un `textContent` reasignado.
 *
 * `tabular-nums` evita que la caja cambie de ancho al pasar de 9 a 10, que
 * movería el texto de al lado.
 */
export function Contador({ valor, className }: ContadorProps) {
  return (
    <span className={`relative inline-grid overflow-hidden tabular-nums ${className ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={valor}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.2, ease: SUAVE }}
          className="col-start-1 row-start-1"
        >
          {valor}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
