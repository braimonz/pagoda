/**
 * Textura de grano sobre todo el lienzo.
 *
 * Es el mismo ruido del sitio público. Le quita a los negros la planitud
 * digital: sin él, #111111 se ve como un rectángulo vacío; con él, como
 * un material. Fijo, no interactivo y por debajo de todo el contenido.
 */
export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.28] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
