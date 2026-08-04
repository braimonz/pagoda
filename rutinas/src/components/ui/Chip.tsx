import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface ChipProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Etiqueta informativa: equipo, nivel, músculo secundario.
 *
 * Completamente redonda a propósito, frente al botón que es casi recto:
 * la forma distingue *dato* de *acción* sin gastar color en ello.
 */
export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-elevated px-2.5 py-1',
        'text-[0.6875rem] font-medium tracking-wide text-ink-soft',
        className,
      )}
    >
      {children}
    </span>
  );
}
