import { cn } from '@/lib/cn';

interface SkeletonProps {
  readonly className?: string;
}

/**
 * Hueco con la forma de lo que va a llegar.
 *
 * Se prefiere a un spinner porque anticipa la estructura: la pantalla no
 * salta al cargar, solo se rellena. El brillo que lo recorre está en
 * `styles/index.css` y se detiene con `prefers-reduced-motion`.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('brillo rounded-tile bg-surface', className)}
    />
  );
}
