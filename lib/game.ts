/** Reglas del tablero durante la partida: marcado, errores y callejones sin salida. */

import { N, NB8, idx } from "./grid";
import { famLabel, capFirst, type Family, type Unit } from "./engine";
import type { Caso } from "./puzzles";

export const EMPTY = 0;
export const CROSS = 1;
export const PERSON = 2;
export type Mark = 0 | 1 | 2;

export interface Cambio {
  i: number;
  prev: Mark;
}

/** Las unidades y las casillas de cada habitación sólo cambian al empezar un caso. */
export interface CaseIndex {
  units: Unit[];
  roomCells: number[][];
}

export function buildIndex(region: ArrayLike<number>): CaseIndex {
  const roomCells: number[][] = Array.from({ length: N }, () => []);
  for (let i = 0; i < N * N; i++) roomCells[region[i]].push(i);

  const units: Unit[] = [];
  for (let u = 0; u < N; u++) {
    units.push({ f: 0, u, cells: Array.from({ length: N }, (_, c) => idx(u, c)) });
    units.push({ f: 1, u, cells: Array.from({ length: N }, (_, r) => idx(r, u)) });
  }
  for (let g = 0; g < N; g++) units.push({ f: 2, u: g, cells: roomCells[g] });

  return { units, roomCells };
}

export interface Analisis {
  /** Casillas que rompen una regla. */
  bad: Set<number>;
  /** Unidades que se quedaron sin ninguna casilla posible. */
  dead: Unit[];
  deadCells: Set<number>;
  placed: number;
}

export function analyze(marks: Mark[], index: CaseIndex): Analisis {
  const bad = new Set<number>();
  const dead: Unit[] = [];
  const stars: number[] = [];

  for (let i = 0; i < N * N; i++) if (marks[i] === PERSON) stars.push(i);
  for (const i of stars) {
    for (const x of NB8[i]) if (marks[x] === PERSON) {
      bad.add(i);
      bad.add(x);
    }
  }

  for (const un of index.units) {
    const here = un.cells.filter((i) => marks[i] === PERSON);
    if (here.length > 1) {
      here.forEach((i) => bad.add(i));
      continue;
    }
    if (here.length === 1) continue;
    if (!un.cells.some((i) => marks[i] !== CROSS)) dead.push(un);
  }

  const deadCells = new Set<number>();
  dead.forEach((un) => un.cells.forEach((i) => deadCells.add(i)));

  return { bad, dead, deadCells, placed: stars.length };
}

export function mensajeDeAviso(a: Analisis): string {
  if (a.dead.length) {
    const nombres = a.dead.slice(0, 2).map((un) => famLabel(un.f as Family, un.u));
    return (
      capFirst(nombres[0]) +
      (nombres[1] ? ` y ${nombres[1]}` : "") +
      (a.dead.length > 2 ? ` (y ${a.dead.length - 2} más)` : "") +
      (a.dead.length > 1 ? " se quedaron" : " se quedó") +
      " sin casillas posibles, así que ahí ya no puede ir nadie. " +
      "Algo de lo que marcaste no puede ser: probá deshacer."
    );
  }
  if (a.bad.size) {
    return "Hay personas que rompen una regla: dos en la misma fila, columna o habitación, o dos que se tocan.";
  }
  return "";
}

/** Casillas que quedan prohibidas al ubicar a alguien en `i`. */
export function prohibidasPor(i: number, index: CaseIndex, region: ArrayLike<number>): number[] {
  const objetivo = new Set<number>();
  const [r, c] = [Math.floor(i / N), i % N];
  for (let k = 0; k < N; k++) {
    objetivo.add(idx(r, k));
    objetivo.add(idx(k, c));
  }
  for (const x of index.roomCells[region[i]]) objetivo.add(x);
  for (const x of NB8[i]) objetivo.add(x);
  objetivo.delete(i);
  return [...objetivo];
}

export function esVictoria(marks: Mark[], P: Caso): boolean {
  const stars: number[] = [];
  for (let i = 0; i < N * N; i++) if (marks[i] === PERSON) stars.push(i);
  if (stars.length !== N) return false;
  const sol = new Set(P.stars);
  return stars.every((i) => sol.has(i));
}

export const fmtTime = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
