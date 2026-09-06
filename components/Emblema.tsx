/**
 * El emblema de cada habitación: identifica a la vez al cuarto y a quien lo
 * ocupa, que en este juego son lo mismo.
 *
 * Son siluetas simples a propósito. El requisito no es que sean bonitas a 96px
 * sino que no se confundan ENTRE SÍ a 16px, que es el tamaño al que aparecen en
 * la lista de sospechosos. Por eso la Cocina es una olla y no un cuchillo: a ese
 * tamaño un cuchillo se confunde con los cubiertos del Comedor.
 *
 * Además es el único canal de identidad que no depende del color: hoy las nueve
 * habitaciones se distinguen sólo por matiz.
 */

const TRAZOS: Record<number, React.ReactNode> = {
  /* Biblioteca — Dra. Alma Reyes, archivista.
     Libro ABIERTO: cerrado era un rectángulo y se confundía con el cuadro
     de la Galería, que también es un rectángulo a 12px. */
  0: (
    <>
      <path d="M12 6c-2.4-1.8-5-2.2-8-1.6v12.2c3-.6 5.6-.2 8 1.6" />
      <path d="M12 6c2.4-1.8 5-2.2 8-1.6v12.2c-3-.6-5.6-.2-8 1.6" />
      <path d="M12 6v12.2" />
    </>
  ),
  // Invernadero — Elías Prat, botánico
  1: (
    <>
      <path d="M20 3C10 4 4 9 4 17c0 2 1 3 3 3 8 0 13-6 13-17z" />
      <path d="M7 20 17 7" />
    </>
  ),
  /* Salón — Condesa Vera Solís, anfitriona.
     Abanico: el candelabro era el menos evidente de los nueve y tenía cuatro
     trazos sueltos que a 12px se empastaban. */
  2: (
    <>
      <path d="M12 20a11 11 0 0 0 8-16 11 11 0 0 0-16 0 11 11 0 0 0 8 16z" />
      <path d="M12 20V4M6.5 6.5 12 20M17.5 6.5 12 20" />
    </>
  ),
  // Cocina — Nino Baralt, cocinero
  3: (
    <>
      <path d="M5 9h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      <path d="M3 9h18" />
      <path d="M12 4v3" />
    </>
  ),
  // Estudio — Cnel. Ígor Mena, militar retirado
  4: (
    <>
      <path d="M4 9h8v3a5 5 0 0 1-5 5 3 3 0 0 1-3-3z" />
      <path d="M12 9h4a4 4 0 0 1 0 8h-1" />
    </>
  ),
  /* Comedor — Ofelia Tinto, albacea.
     Campana de servir: los cubiertos eran dos rayas verticales, la silueta más
     débil del conjunto. Una campana se reconoce de un vistazo. */
  5: (
    <>
      <path d="M4 17a8 8 0 0 1 16 0z" />
      <path d="M2.5 17h19" />
      <path d="M12 6v3" />
      <circle cx="12" cy="5" r="1.4" />
    </>
  ),
  // Bodega — Rulo Andrade, sumiller
  6: (
    <>
      <path d="M7 3h10l-1 6a4 4 0 0 1-8 0z" />
      <path d="M12 13v7" />
      <path d="M8 20h8" />
    </>
  ),
  // Galería — Mireia Coll, restauradora
  7: (
    <>
      <rect x="3" y="4" width="18" height="15" rx="1" />
      <path d="M6 16l4-4 3 3 3-4 3 5" />
    </>
  ),
  // Vestíbulo — Damián Ruz, mayordomo
  8: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l9 9" />
      <path d="M17 17l2 2" />
      <path d="M14 14l2 2" />
    </>
  ),
};

export default function Emblema({ g }: { g: number }) {
  return (
    <svg className="emblema" viewBox="0 0 24 24" aria-hidden="true">
      {TRAZOS[g]}
    </svg>
  );
}
