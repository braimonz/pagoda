import { motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { Contador } from '@/components/ui/Contador';
import { SUAVE } from '@/lib/motion';

interface BarraInferiorProps {
  readonly cantidad: number;
  /** Sustantivo contado. Se pluraliza aquí. */
  readonly singular: string;
  readonly plural: string;
  readonly textoBoton: string;
  /** Qué falta para poder continuar. Solo se ve con la barra bloqueada. */
  readonly ayuda: string;
  readonly onContinuar: () => void;
}

/**
 * Barra fija inferior con el recuento y la acción de avanzar.
 *
 * Vive en el tercio inferior porque es donde llega el pulgar sin recolocar
 * el teléfono, y respeta `safe-area-inset-bottom` para no quedar debajo de
 * la barra de gestos del iPhone.
 *
 * El botón nunca desaparece cuando no se puede continuar: **se deshabilita**
 * y aparece debajo el texto de qué falta. Un botón que va y viene reorganiza
 * la pantalla y deja al socio sin saber qué tiene que hacer.
 */
export function BarraInferior({
  cantidad,
  singular,
  plural,
  textoBoton,
  ayuda,
  onContinuar,
}: BarraInferiorProps) {
  const bloqueada = cantidad === 0;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.32, ease: SUAVE, delay: 0.1 }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-elevated/85 backdrop-blur-xl"
    >
      <div className="pb-segura mx-auto flex max-w-screen-md items-center gap-4 px-5 pt-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 font-accent font-extrabold text-ink">
            <Contador valor={cantidad} className="text-2xl leading-none" />
            <span className="text-xs tracking-[0.16em] text-ink-soft uppercase">
              {cantidad === 1 ? singular : plural}
            </span>
          </p>

          {bloqueada && <p className="mt-1 text-xs text-ink-mute">{ayuda}</p>}
        </div>

        <Button
          tamano="lg"
          disabled={bloqueada}
          onClick={onContinuar}
          /* `aria-disabled` además de `disabled`: algunos lectores de
             pantalla anuncian mejor el motivo con el atributo ARIA. */
          aria-disabled={bloqueada}
          className="shrink-0"
        >
          {textoBoton}
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </motion.div>
  );
}
