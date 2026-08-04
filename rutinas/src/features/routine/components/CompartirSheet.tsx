import { useState } from 'react';

import { BotonEnlace, Button } from '@/components/ui/Button';
import { IconoWhatsApp } from '@/components/ui/IconoWhatsApp';
import { Sheet } from '@/components/ui/Sheet';
import { useRutina } from '@/store/rutina.store';

import {
  crearEnlaceRutina,
  crearEnlaceWhatsApp,
  crearMensajeWhatsApp,
  rutinaAJson,
} from '../utils/compartir';

interface CompartirSheetProps {
  readonly abierto: boolean;
  readonly onCerrar: () => void;
}

/**
 * Panel para compartir la rutina como enlace.
 *
 * Todo el contenido viaja dentro de la propia URL, así que no hace falta
 * servidor ni base de datos: quien la reciba abre el enlace y la app la
 * reconstruye sola.
 */
export function CompartirSheet({ abierto, onCerrar }: CompartirSheetProps) {
  const semana = useRutina((estado) => estado.semana);
  const [copiado, setCopiado] = useState(false);

  /* Se calcula al vuelo y no en un efecto: es una función pura de la
     semana, y el panel solo se abre cuando ya está montada. */
  const enlace = abierto ? crearEnlaceRutina(semana) : '';
  const json = abierto ? JSON.stringify(rutinaAJson(semana)) : '';

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* Sin permiso de portapapeles el enlace sigue a la vista y se puede
         seleccionar a mano; no hay nada que avisar. */
    }
  }

  const mensaje = abierto ? crearMensajeWhatsApp(semana, enlace) : '';

  return (
    <Sheet abierto={abierto} titulo="Compartir rutina" onCerrar={onCerrar}>
      <div className="flex flex-col gap-5 pb-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          La rutina entera viaja dentro del enlace. Quien lo abra la verá reconstruida al
          instante, sin necesidad de cuenta.
        </p>

        <div>
          <label
            htmlFor="enlace-rutina"
            className="mb-2 block font-accent text-[0.6875rem] font-extrabold tracking-[0.28em] text-accent uppercase"
          >
            Enlace
          </label>
          <input
            id="enlace-rutina"
            readOnly
            value={enlace}
            onFocus={(evento) => evento.currentTarget.select()}
            className="w-full rounded-tile border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
          />
          <p className="mt-2 text-xs text-ink-mute">
            {enlace.length} caracteres · {json.length} bytes de JSON antes de codificar
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <BotonEnlace href={crearEnlaceWhatsApp(mensaje)} tamano="lg" ancho>
            <IconoWhatsApp />
            Guardar en WhatsApp
          </BotonEnlace>

          <Button variante="fantasma" tamano="lg" ancho onClick={copiar}>
            {copiado ? '✓ Copiado' : 'Copiar enlace'}
          </Button>
        </div>

        <details className="rounded-tile border border-line bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            Ver el mensaje
          </summary>
          <p className="mt-3 text-xs leading-relaxed whitespace-pre-wrap text-ink-mute">
            {mensaje}
          </p>
        </details>

        <details className="rounded-tile border border-line bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">
            Ver el JSON
          </summary>
          <pre className="mt-3 overflow-x-auto text-xs leading-relaxed text-ink-mute">
            {json}
          </pre>
        </details>
      </div>
    </Sheet>
  );
}
