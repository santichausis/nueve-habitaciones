/**
 * Motor de deducción. Es el mismo que decide la dificultad de un caso y el que
 * da las pistas, así que una pista nunca puede pedir algo que el juego no
 * considere deducible.
 *
 * Trabaja con "unidades": las 9 filas, las 9 columnas y las 9 habitaciones.
 * En cada una va exactamente una persona.
 */

import { N, NB8, NB8SET, coord, idx } from "./grid";
import { ROOMS, roomLabel } from "./rooms";

/** 0 = filas, 1 = columnas, 2 = habitaciones. */
export type Family = 0 | 1 | 2;

export interface Unit {
  f: Family;
  u: number;
  cells: number[];
}

export interface Deduction {
  kind: "single" | "squeeze" | "sets";
  /** Casillas afectadas por la deducción. */
  cells: number[];
  /** Casillas de la fila/columna/habitación de la que habla el texto: sirve
   *  para resaltarla en el tablero mientras se lee la pista. */
  unitCells: number[];
  text: string;
  k?: number;
}

export interface Techniques {
  /** "Nadie puede estar pegado a otra persona". */
  squeeze: boolean;
  /** Tamaño máximo de conjunto en la regla de conjuntos (1 = sólo intersección). */
  maxK: number;
}

export const LEVELS: Record<Level, Techniques> = {
  facil: { squeeze: false, maxK: 1 },
  normal: { squeeze: true, maxK: 1 },
  dificil: { squeeze: true, maxK: 3 },
};

export type Level = "facil" | "normal" | "dificil";
export const NIVELES: Level[] = ["facil", "normal", "dificil"];

export const LEVEL_LABEL: Record<Level, string> = {
  facil: "Fácil",
  normal: "Normal",
  dificil: "Difícil",
};

export const LEVEL_HINT: Record<Level, string> = {
  facil: "Deducciones directas: siempre queda una casilla obligada.",
  normal: "Hay que usar que nadie puede estar pegado a otra persona.",
  dificil: "Pide razonar por conjuntos de filas y habitaciones.",
};

export function famLabel(f: Family, u: number): string {
  if (f === 0) return `la fila ${u + 1}`;
  if (f === 1) return `la columna ${"ABCDEFGHI"[u]}`;
  return roomLabel(u);
}

/** "de" + "el Estudio" = "del Estudio" */
export const deOf = (t: string): string => (t.startsWith("el ") ? `del ${t.slice(3)}` : `de ${t}`);
export const capFirst = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

export function listEs(arr: string[]): string {
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, -1).join(", ")} y ${arr[arr.length - 1]}`;
}

function combos<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, cur: T[]) => {
    if (cur.length === k) {
      out.push(cur.slice());
      return;
    }
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      rec(i + 1, cur);
      cur.pop();
    }
  };
  rec(0, []);
  return out;
}

export class Engine {
  readonly region: ArrayLike<number>;
  readonly fam: number[][][];
  cand: Uint8Array;
  star: Uint8Array;
  count = 0;
  ok = true;

  constructor(region: ArrayLike<number>, seeds: number[] = []) {
    this.region = region;
    this.cand = new Uint8Array(N * N).fill(1);
    this.star = new Uint8Array(N * N);
    this.fam = [[], [], []];
    for (let u = 0; u < N; u++) {
      this.fam[0].push(Array.from({ length: N }, (_, c) => idx(u, c)));
      this.fam[1].push(Array.from({ length: N }, (_, r) => idx(r, u)));
      this.fam[2].push([]);
    }
    for (let i = 0; i < N * N; i++) this.fam[2][region[i]].push(i);
    for (const s of seeds) this.place(s);
  }

  memberOf(f: Family, i: number): number {
    return f === 0 ? Math.floor(i / N) : f === 1 ? i % N : this.region[i];
  }

  elim(j: number, keep: number): boolean {
    if (j === keep) return false;
    if (this.star[j]) {
      this.ok = false;
      return false;
    }
    if (!this.cand[j]) return false;
    this.cand[j] = 0;
    return true;
  }

  place(i: number): void {
    if (this.star[i]) return;
    this.star[i] = 1;
    this.cand[i] = 1;
    this.count++;
    for (let f = 0 as Family; f < 3; f = (f + 1) as Family) {
      for (const j of this.fam[f][this.memberOf(f, i)]) this.elim(j, i);
    }
    for (const x of NB8[i]) this.elim(x, i);
  }

  openUnits(): { f: Family; u: number; cs: number[] }[] {
    const out: { f: Family; u: number; cs: number[] }[] = [];
    for (let f = 0 as Family; f < 3; f = (f + 1) as Family) {
      for (let u = 0; u < N; u++) {
        const cells = this.fam[f][u];
        if (cells.some((i) => this.star[i])) continue;
        const cs = cells.filter((i) => this.cand[i]);
        if (!cs.length) {
          this.ok = false;
          return out;
        }
        out.push({ f, u, cs });
      }
    }
    return out;
  }

  /** Una sola casilla posible en una fila, columna o habitación. */
  single(): Deduction | null {
    for (const o of this.openUnits()) {
      if (!this.ok) return null;
      if (o.cs.length === 1) {
        this.place(o.cs[0]);
        return {
          kind: "single",
          cells: [o.cs[0]],
          unitCells: this.fam[o.f][o.u].slice(),
          text: `En ${famLabel(o.f, o.u)} ya sólo queda una casilla posible: ${coord(o.cs[0])}. Ahí va una persona.`,
        };
      }
    }
    return null;
  }

  /** Ninguna persona puede estar pegada a otra. */
  squeeze(): Deduction | null {
    for (const o of this.openUnits()) {
      if (o.cs.length < 2) continue;
      // casillas que tocan a TODAS las posibles de esta unidad
      let comunes: number[] = [...NB8SET[o.cs[0]]];
      for (const i of o.cs.slice(1)) {
        const s = NB8SET[i];
        comunes = comunes.filter((x) => s.has(x));
        if (!comunes.length) break;
      }
      const hit = comunes.filter((i) => this.cand[i] && !this.star[i]);
      if (hit.length) {
        hit.forEach((i) => this.elim(i, -1));
        return {
          kind: "squeeze",
          cells: hit,
          unitCells: this.fam[o.f][o.u].slice(),
          text:
            `Esté donde esté la persona ${deOf(famLabel(o.f, o.u))}, va a tocar ${listEs(hit.map(coord))}. ` +
            `Como nadie puede estar pegado a otra persona, ${hit.length > 1 ? "esas casillas quedan descartadas" : "esa casilla queda descartada"}.`,
        };
      }
    }
    return null;
  }

  /**
   * Regla de conjuntos: si k filas sólo pueden ubicar a su gente dentro de k
   * habitaciones, esas k habitaciones ya están ocupadas por ellas. Vale para
   * cualquier par de familias.
   */
  sets(k: number): Deduction | null {
    for (let A = 0 as Family; A < 3; A = (A + 1) as Family) {
      for (let B = 0 as Family; B < 3; B = (B + 1) as Family) {
        if (A === B) continue;
        const open: number[] = [];
        for (let u = 0; u < N; u++) if (!this.fam[A][u].some((i) => this.star[i])) open.push(u);
        if (open.length < k) continue;
        for (const S of combos(open, k)) {
          const U = new Set<number>();
          for (const u of S) {
            for (const i of this.fam[A][u]) if (this.cand[i] && !this.star[i]) U.add(i);
          }
          const bs = new Set<number>();
          U.forEach((i) => bs.add(this.memberOf(B, i)));
          if (bs.size !== k) continue;
          const hit: number[] = [];
          bs.forEach((b) => {
            for (const i of this.fam[B][b]) if (this.cand[i] && !this.star[i] && !U.has(i)) hit.push(i);
          });
          if (hit.length) {
            hit.forEach((i) => this.elim(i, -1));
            const as = listEs(S.map((u) => famLabel(A, u)));
            const bl = listEs([...bs].map((b) => famLabel(B, b)));
            return {
              kind: "sets",
              k,
              cells: hit,
              unitCells: S.flatMap((u) => this.fam[A][u]),
              text:
                k === 1
                  ? `Todas las casillas posibles ${deOf(as)} caen dentro ${deOf(bl)}. Como ahí va una sola persona, el resto ${deOf(bl)} queda descartado.`
                  : `${capFirst(as)} sólo pueden ubicar a su gente dentro ${deOf(bl)}. Esas ${k} quedan ocupadas por ellas, así que todo lo demás ahí queda descartado.`,
            };
          }
        }
      }
    }
    return null;
  }

  /** Un paso de deducción, de la técnica más simple a la más compleja. */
  step(o: Techniques): Deduction | null {
    let s = this.single();
    if (s) return s;
    s = this.sets(1);
    if (s) return s;
    if (o.squeeze) {
      s = this.squeeze();
      if (s) return s;
    }
    for (let k = 2; k <= o.maxK; k++) {
      s = this.sets(k);
      if (s) return s;
    }
    return null;
  }

  run(o: Techniques): boolean {
    let guard = 0;
    while (this.count < N && this.ok && guard++ < 800) {
      if (!this.step(o)) break;
    }
    return this.count === N && this.ok;
  }
}

/** El nivel de un caso es el repertorio mínimo que lo resuelve sin adivinar. */
export function grade(region: ArrayLike<number>): Level | null {
  for (const nivel of NIVELES) if (new Engine(region).run(LEVELS[nivel])) return nivel;
  return null;
}

export { ROOMS };
