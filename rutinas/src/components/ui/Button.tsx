import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/cn';
import { PULSACION } from '@/lib/motion';

type Variante = 'primario' | 'fantasma' | 'discreto';
type Tamano = 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
  readonly variante?: Variante;
  readonly tamano?: Tamano;
  readonly ancho?: boolean;
}

const VARIANTES: Record<Variante, string> = {
  /* El verde es la única invitación a tocar de la pantalla. Texto casi
     negro encima, que es lo que da contraste legible sobre este verde. */
  primario: 'bg-accent text-on-accent shadow-accent hover:bg-accent-dark active:bg-accent-dark',
  fantasma: 'bg-elevated text-ink border border-line hover:border-line-strong',
  discreto: 'bg-transparent text-ink-soft hover:text-ink',
};

const TAMANOS: Record<Tamano, string> = {
  /* Botones grandes: 48 y 56 px de alto. Por encima del mínimo táctil de
     44 px, y cómodos con el pulgar sin mirar. */
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
};

/**
 * Botón de la app.
 *
 * Es `motion.button` para que toda pulsación tenga respuesta física: la
 * superficie cede un 3 % y vuelve. Es el detalle que más hace que una
 * interfaz se sienta viva bajo el dedo.
 */
export function Button({
  variante = 'primario',
  tamano = 'md',
  ancho = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={PULSACION}
      transition={{ duration: 0.12 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-btn',
        'font-accent font-extrabold uppercase tracking-[0.14em]',
        'transition-colors duration-200 select-none',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTES[variante],
        TAMANOS[tamano],
        ancho && 'w-full',
        className,
      )}
      {...props}
    />
  );
}
