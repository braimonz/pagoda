import type { ReactNode } from 'react';

interface TopBarProps {
  /** Se pinta a la izquierda, en lugar del logo. Para el botón de volver. */
  readonly izquierda?: ReactNode;
}

/**
 * Barra superior fija.
 *
 * Translúcida con desenfoque en lugar de opaca: el contenido se intuye
 * pasando por debajo, que es lo que da sensación de capas. Un rectángulo
 * sólido cortaría la pantalla en dos.
 */
export function TopBar({ izquierda }: TopBarProps) {
  return (
    <header className="pt-segura sticky top-0 z-30 border-b border-line bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-md items-center gap-3 px-5">
        {/* Comprobación de verdad, no `??`: quien llama suele escribir
            `condicion && <Boton/>`, y eso vale `false` —no `undefined`—
            cuando la condición no se cumple, así que `??` no caería al
            logo y la barra se quedaba sin marca. */}
        {izquierda ? (
          izquierda
        ) : (
          <img src="/rutinas/logo.png" alt="Pagoda Fitness Center" className="h-6 w-auto" />
        )}

        <span className="ml-auto font-accent text-[0.6875rem] font-extrabold uppercase tracking-[0.28em] text-ink-mute">
          Rutinas
        </span>
      </div>
    </header>
  );
}
