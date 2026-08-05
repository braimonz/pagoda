import { motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Contador } from '@/components/ui/Contador';
import { SUAVE } from '@/lib/motion';
import { useDiasConEjercicios, useTotalAsignados } from '@/store/rutina.store';

interface BarraSemanaProps {
  readonly onCompartir: () => void;
}

/**
 * Resumen vivo de la semana y acceso a compartir.
 *
 * No lleva botón de guardar: la rutina se actualiza sola en cuanto se
 * mueve, se añade o se quita algo. Un botón "Guardar" que no guardase nada
 * sería mentir; cuando exista la persistencia, aquí irá el indicador.
 */
export function BarraSemana({ onCompartir }: BarraSemanaProps) {
  const total = useTotalAsignados();
  const dias = useDiasConEjercicios();

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: SUAVE, delay: 0.1 }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-elevated/85 backdrop-blur-xl"
    >
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pb-segura mx-auto flex max-w-screen-md items-center gap-6 px-5 pt-4"
      >
        <p className="flex items-baseline gap-1.5 font-accent font-extrabold text-ink">
          <Contador valor={total} className="text-2xl leading-none" />
          <span className="text-xs tracking-[0.16em] text-ink-soft uppercase">
            {total === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
        </p>

        <span aria-hidden="true" className="h-8 w-px bg-line" />

        <p className="flex items-baseline gap-1.5 font-accent font-extrabold text-ink">
          <Contador valor={dias} className="text-2xl leading-none" />
          <span className="text-xs tracking-[0.16em] text-ink-soft uppercase">
            {dias === 1 ? 'día' : 'días'}
          </span>
        </p>

        <Button
          onClick={onCompartir}
          disabled={total === 0}
          aria-disabled={total === 0}
          className="ml-auto shrink-0"
        >
          Compartir
        </Button>
      </div>
    </motion.div>
  );
}
