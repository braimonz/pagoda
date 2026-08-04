import type { ReactNode } from 'react';

import { Grain } from '@/components/brand/Grain';

interface AppShellProps {
  readonly children: ReactNode;
}

/**
 * Lienzo de la aplicación.
 *
 * Fija el fondo, el grano y el ancho máximo del contenido. En móvil ocupa
 * todo el ancho con 20 px de margen; a partir de tablet el contenido se
 * centra y deja de estirarse, porque una línea de texto de 1400 px es
 * incómoda de leer por muy grande que sea la pantalla.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh bg-base">
      <Grain />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Contenedor de contenido: el margen lateral y el ancho máximo comunes. */
export function Contenido({ children }: AppShellProps) {
  return <div className="mx-auto w-full max-w-screen-md px-5">{children}</div>;
}
