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
  // Biblioteca — Dra. Alma Reyes, archivista
  0: (
    <>
      <path d="M6 3h11v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M9 3v18" />
    </>
  ),
  // Invernadero — Elías Prat, botánico
  1: (
    <>
      <path d="M20 3C10 4 4 9 4 17c0 2 1 3 3 3 8 0 13-6 13-17z" />
      <path d="M7 20 17 7" />
    </>
  ),
  // Salón — Condesa Vera Solís, anfitriona
  2: (
    <>
      <path d="M12 4v4M7 7v3M17 7v3" />
      <path d="M6 10h12" />
      <path d="M12 10v8" />
      <path d="M8 20h8" />
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
  // Comedor — Ofelia Tinto, albacea
  5: (
    <>
      <path d="M7 3v6a2 2 0 0 0 4 0V3" />
      <path d="M9 9v12" />
      <path d="M17 3c1.6 2 1.6 5 0 7v11" />
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
