/* ============================================================
   BASE64 EN VARIANTE URL

   `btoa` y `atob` trabajan sobre cadenas binarias, no sobre texto: con
   cualquier carácter fuera de Latin-1 —una tilde, una eñe— lanzan
   InvalidCharacterError. Por eso el texto pasa antes por TextEncoder.

   Y se usa el alfabeto URL (RFC 4648 §5) en vez del clásico porque el
   base64 normal es inservible dentro de una URL: el `+` se interpreta
   como espacio al leer la query, y `/` y `=` obligan a escapar. Cambiar
   `+/` por `-_` y quitar el relleno lo arregla sin dejar de ser base64.
============================================================ */

/** Texto → base64url, sin relleno. */
export function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);

  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);

  return btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** base64url → texto. Lanza si la cadena no es base64 válido. */
export function deBase64Url(texto: string): string {
  const normalizado = texto.replaceAll('-', '+').replaceAll('_', '/');

  /* Se devuelve el relleno que se quitó al codificar: atob lo exige. */
  const sobrante = normalizado.length % 4;
  const relleno = sobrante === 0 ? '' : '='.repeat(4 - sobrante);

  const binario = atob(normalizado + relleno);
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
