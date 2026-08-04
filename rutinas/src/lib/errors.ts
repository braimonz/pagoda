/**
 * Error con dos caras: lo que se le enseña a la persona y lo que se registra
 * para quien mantiene la app.
 *
 * `message` —el de Error— lleva el detalle técnico y acaba en la consola.
 * `mensajeUsuario` es lo único que la UI tiene permitido pintar: nunca un
 * código, un stack ni el texto de una librería.
 */
export class ErrorConMensaje extends Error {
  readonly mensajeUsuario: string;

  constructor(mensajeUsuario: string, detalleTecnico?: string, options?: { cause?: unknown }) {
    super(detalleTecnico ?? mensajeUsuario, options);
    this.name = 'ErrorConMensaje';
    this.mensajeUsuario = mensajeUsuario;
  }
}

const MENSAJE_GENERICO = 'Algo salió mal. Vuelve a intentarlo.';

function tieneMensajeUsuario(valor: unknown): valor is { mensajeUsuario: string } {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'mensajeUsuario' in valor &&
    typeof (valor as { mensajeUsuario: unknown }).mensajeUsuario === 'string'
  );
}

/**
 * Traduce cualquier cosa lanzada a un texto que se pueda mostrar.
 *
 * Solo devuelve el mensaje propio si quien lanzó declaró uno pensado para
 * leerse. Un `TypeError` suelto o el texto de una librería se convierten en
 * el mensaje genérico: son ruido para quien está usando la app.
 */
export function mensajeParaUsuario(causa: unknown): string {
  return tieneMensajeUsuario(causa) ? causa.mensajeUsuario : MENSAJE_GENERICO;
}
