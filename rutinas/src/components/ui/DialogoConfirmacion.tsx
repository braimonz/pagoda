import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { useTrampaDeFoco } from '@/hooks/useTrampaDeFoco';
import { SUAVE } from '@/lib/motion';

import { Button } from './Button';

interface DialogoConfirmacionProps {
  readonly abierto: boolean;
  readonly titulo: string;
  readonly descripcion: string;
  readonly textoConfirmar: string;
  readonly textoCancelar?: string;
  readonly onConfirmar: () => void;
  readonly onCancelar: () => void;
}

/**
 * Pregunta antes de una acción que no se puede deshacer.
 *
 * Se reserva para lo que de verdad destruye trabajo. Para lo demás la app
 * prefiere actuar y ofrecer *Deshacer*: preguntar por todo entrena a la
 * gente a dar a "sí" sin leer, que es peor que no preguntar.
 *
 * El foco entra al abrirse, queda encerrado dentro y vuelve a su sitio al
 * cerrarse; Escape cancela.
 */
export function DialogoConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
}: DialogoConfirmacionProps) {
  const panel = useRef<HTMLDivElement>(null);
  useTrampaDeFoco(panel, abierto);

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCancelar();
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [abierto, onCancelar]);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancelar}
            className="fixed inset-0 z-60 bg-black/70"
          />

          <motion.div
            ref={panel}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialogo-titulo"
            aria-describedby="dialogo-descripcion"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.24, ease: SUAVE }}
            className="fixed inset-x-5 top-1/2 z-60 mx-auto max-w-sm -translate-y-1/2 rounded-card border border-line bg-elevated p-6 shadow-lift"
          >
            <h2 id="dialogo-titulo" className="font-display text-2xl tracking-wide text-ink">
              {titulo}
            </h2>
            <p id="dialogo-descripcion" className="mt-3 text-sm leading-relaxed text-ink-soft">
              {descripcion}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button tamano="lg" ancho onClick={onConfirmar}>
                {textoConfirmar}
              </Button>
              <Button variante="fantasma" tamano="lg" ancho onClick={onCancelar}>
                {textoCancelar}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
