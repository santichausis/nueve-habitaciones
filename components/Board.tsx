"use client";

import { useCallback, useRef, useState } from "react";
import { COLS, N, coord, idx, rc } from "@/lib/grid";
import { CROSS, PERSON, type Mark } from "@/lib/game";
import { ROOMS } from "@/lib/rooms";

interface Props {
  region: ArrayLike<number>;
  marks: Mark[];
  bad: Set<number>;
  deadCells: Set<number>;
  flash: number[];
  lit: number[];
  /** Fila/columna/habitación de la que habla la pista. */
  hintUnit: number[];
  /** Origen y casillas de la última tanda de tachados automáticos. */
  cascada: { origen: number; celdas: number[] } | null;
  /** Al resolver, las fichas se encienden en secuencia. */
  celebrar: boolean;
  bloqueado: boolean;
  onCiclar: (i: number, atras?: boolean) => void;
  onPintar: (celdas: number[], modo: "tachar" | "borrar") => void;
}

const Cruz = () => (
  <svg className="cross" viewBox="0 0 24 24" aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

/**
 * Los muros de las habitaciones. Se dibujan como un SVG encima de la grilla en
 * vez de con bordes de CSS: así la línea es de grosor parejo y no se duplica
 * entre casillas vecinas.
 */
function Muros({ region }: { region: ArrayLike<number> }) {
  let finas = "";
  for (let k = 1; k < N; k++) finas += `M ${k} 0 L ${k} ${N} M 0 ${k} L ${N} ${k} `;

  let muros = `M 0 0 L ${N} 0 L ${N} ${N} L 0 ${N} Z `;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const i = idx(r, c);
      if (c < N - 1 && region[i] !== region[i + 1]) muros += `M ${c + 1} ${r} L ${c + 1} ${r + 1} `;
      if (r < N - 1 && region[i] !== region[i + N]) muros += `M ${c} ${r + 1} L ${c + 1} ${r + 1} `;
    }
  }

  return (
    <svg className="walls" viewBox={`0 0 ${N} ${N}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="grid-line" fill="none" d={finas} />
      <path className="wall" fill="none" d={muros} />
    </svg>
  );
}

/** Casillas de la recta entre dos, para que un arrastre rápido no saltee ninguna. */
function recta(desde: number, hasta: number): number[] {
  let [r0, c0] = rc(desde);
  const [r1, c1] = rc(hasta);
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dc - dr;
  const out: number[] = [];
  for (let guard = 0; guard < 200; guard++) {
    out.push(idx(r0, c0));
    if (r0 === r1 && c0 === c1) break;
    const e2 = 2 * err;
    if (e2 > -dr) {
      err -= dr;
      c0 += sc;
    }
    if (e2 < dc) {
      err += dc;
      r0 += sr;
    }
  }
  return out;
}

export default function Board({
  region,
  marks,
  bad,
  deadCells,
  flash,
  lit,
  hintUnit,
  cascada,
  celebrar,
  bloqueado,
  onCiclar,
  onPintar,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [foco, setFoco] = useState(0);
  const pintando = useRef<{
    modo: "tachar" | "borrar";
    inicio: number;
    ultima: number;
    movio: boolean;
    tocadas: Set<number>;
  } | null>(null);
  const ignorarClick = useRef(false);

  const celdaEn = useCallback((x: number, y: number): number => {
    const el = document.elementFromPoint(x, y);
    const c = el?.closest<HTMLElement>(".cell");
    return c && boardRef.current?.contains(c) ? Number(c.dataset.i) : -1;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    ignorarClick.current = false;
    // En pantallas táctiles se mantiene el toque simple: pintar con el dedo
    // obligaría a bloquear el scroll de la página sobre el tablero.
    if (e.button !== 0 || e.pointerType === "touch" || bloqueado) return;
    const c = (e.target as HTMLElement).closest<HTMLElement>(".cell");
    if (!c) return;
    const i = Number(c.dataset.i);
    pintando.current = {
      modo: marks[i] === CROSS ? "borrar" : "tachar",
      inicio: i,
      ultima: i,
      movio: false,
      tocadas: new Set(),
    };
    try {
      boardRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores lo rechazan; el arrastre sigue funcionando dentro del tablero */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = pintando.current;
    if (!p) return;
    const i = celdaEn(e.clientX, e.clientY);
    if (i < 0 || (i === p.ultima && p.movio)) return;
    if (!p.movio) {
      p.movio = true;
      p.tocadas.add(p.inicio);
    }
    for (const x of recta(p.ultima, i)) p.tocadas.add(x);
    p.ultima = i;
    onPintar([...p.tocadas], p.modo);
  };

  /* Con setPointerCapture el pointerup y el click llegan al tablero, no a la
     casilla: por eso el clic simple se resuelve acá, con la casilla de inicio. */
  const terminar = (e: React.PointerEvent) => {
    const p = pintando.current;
    if (!p) return;
    pintando.current = null;
    try {
      boardRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
    ignorarClick.current = true;
    if (!p.movio) onCiclar(p.inicio, false);
  };

  const onClick = (e: React.MouseEvent) => {
    if (ignorarClick.current) {
      ignorarClick.current = false;
      return;
    }
    const c = (e.target as HTMLElement).closest<HTMLElement>(".cell");
    const i = c ? Number(c.dataset.i) : celdaEn(e.clientX, e.clientY);
    if (i >= 0) onCiclar(i, false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>(".cell");
    if (!c) return;
    const i = Number(c.dataset.i);
    let [r, col] = rc(i);
    let movido = true;
    if (e.key === "ArrowUp") r = Math.max(0, r - 1);
    else if (e.key === "ArrowDown") r = Math.min(N - 1, r + 1);
    else if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
    else if (e.key === "ArrowRight") col = Math.min(N - 1, col + 1);
    else if (e.key === "Home") col = 0;
    else if (e.key === "End") col = N - 1;
    else movido = false;

    if (movido) {
      e.preventDefault();
      const destino = idx(r, col);
      setFoco(destino);
      boardRef.current?.querySelector<HTMLButtonElement>(`[data-i="${destino}"]`)?.focus();
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onCiclar(i, marks[i] === PERSON);
    } else if (e.key.toLowerCase() === "x") {
      e.preventDefault();
      onPintar([i], marks[i] === CROSS ? "borrar" : "tachar");
    }
  };

  const litSet = new Set(lit);
  const flashSet = new Set(flash);
  const unitSet = new Set(hintUnit);
  const cascadaSet = new Set(cascada?.celdas ?? []);

  /* Los tachados automáticos aparecen en orden de distancia a la ficha que los
     provocó: se ve POR QUÉ quedaron prohibidos, en vez de aparecer todos de golpe. */
  const retraso = (i: number): string | undefined => {
    if (!cascada || !cascadaSet.has(i)) return undefined;
    const [r0, c0] = rc(cascada.origen);
    const [r1, c1] = rc(i);
    const pasos = Math.max(Math.abs(r0 - r1), Math.abs(c0 - c1));
    return `${Math.min(pasos, 9) * 26}ms`;
  };

  return (
    <div className="boardwrap">
      <div className="corner" />
      <div className="colhead" aria-hidden="true">
        {[...COLS].map((c, ci) => (
          <span key={c} className={hintUnit.some((i) => i % N === ci) ? "aqui" : undefined}>
            {c}
          </span>
        ))}
      </div>
      <div className="rowhead" aria-hidden="true">
        {Array.from({ length: N }, (_, r) => (
          <span key={r} className={hintUnit.some((i) => Math.floor(i / N) === r) ? "aqui" : undefined}>
            {r + 1}
          </span>
        ))}
      </div>

      <div
        className={celebrar ? "board celebra" : "board"}
        id="tablero"
        ref={boardRef}
        role="grid"
        aria-label="Plano de la casa, 9 por 9"
        aria-rowcount={N}
        aria-colcount={N}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => {
          const c = (e.target as HTMLElement).closest<HTMLElement>(".cell");
          if (c) {
            e.preventDefault();
            onCiclar(Number(c.dataset.i), true);
          }
        }}
      >
        {Array.from({ length: N }, (_, r) => (
          <div className="brow" role="row" aria-rowindex={r + 1} key={r}>
            {Array.from({ length: N }, (_, c) => {
              const i = idx(r, c);
              const g = region[i];
              const estado =
                marks[i] === PERSON ? "persona" : marks[i] === CROSS ? "descartada" : "vacía";
              const clases = [
                "cell",
                bad.has(i) ? "err" : "",
                deadCells.has(i) ? "dead" : "",
                litSet.has(i) ? "lit" : "",
                unitSet.has(i) ? "unit" : "",
                flashSet.has(i) ? "flash" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  aria-colindex={c + 1}
                  className={clases}
                  data-i={i}
                  tabIndex={i === foco ? 0 : -1}
                  onFocus={() => setFoco(i)}
                  data-mark={marks[i]}
                  style={
                    {
                      "--h": `var(--h${g + 1})`,
                      "--dl": `var(--dl${g + 1})`,
                      "--delay": retraso(i),
                      "--orden": marks[i] === PERSON ? `${idx(r, c) % N}` : undefined,
                    } as React.CSSProperties
                  }
                  aria-label={`${coord(i)}, ${ROOMS[g].name}, ${estado}`}
                >
                  {marks[i] === PERSON ? (
                    <span className="pin" />
                  ) : marks[i] === CROSS ? (
                    <Cruz />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
        <Muros region={region} />
      </div>
    </div>
  );
}
