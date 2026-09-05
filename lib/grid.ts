/** Geometría del tablero. Las casillas se numeran 0..80, por filas. */

export const N = 9;
export const COLS = "ABCDEFGHI";

export const rc = (i: number): [number, number] => [Math.floor(i / N), i % N];
export const idx = (r: number, c: number): number => r * N + c;
export const coord = (i: number): string => COLS[i % N] + (Math.floor(i / N) + 1);

function vecinos8(i: number): number[] {
  const [r, c] = rc(i);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(idx(nr, nc));
    }
  }
  return out;
}

export function nb4(i: number): number[] {
  const [r, c] = rc(i);
  const out: number[] = [];
  if (r > 0) out.push(i - N);
  if (r < N - 1) out.push(i + N);
  if (c > 0) out.push(i - 1);
  if (c < N - 1) out.push(i + 1);
  return out;
}

/** Vecinos en las 8 direcciones, precalculados: se consultan en cada deducción. */
export const NB8: number[][] = Array.from({ length: N * N }, (_, i) => vecinos8(i));
export const NB8SET: Set<number>[] = NB8.map((a) => new Set(a));
