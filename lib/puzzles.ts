/**
 * Formato de un caso: 92 caracteres.
 *   0..80  habitación de cada casilla (dígito 0-8)
 *   81..89 columna de la persona de cada fila (dígito 0-8)
 *   90..91 casilla donde apareció el cuerpo (dos dígitos)
 *
 * Los casos vienen precalculados y verificados (ver tools/). Aun así se
 * validan al decodificar: el archivo podría venir truncado o alterado.
 */

import { N, NB8, idx } from "./grid";
import type { Level } from "./engine";

export const BODY_AT = N * N + N;
export const CASE_LEN = BODY_AT + 2;

export interface Caso {
  region: Int8Array;
  stars: number[];
  body: number;
  killer: number;
  guilty: number;
  level: Level;
}

export function decodeCase(str: string | undefined, level: Level): Caso | null {
  if (typeof str !== "string" || str.length !== CASE_LEN) return null;

  const region = new Int8Array(N * N);
  for (let i = 0; i < N * N; i++) {
    const g = str.charCodeAt(i) - 48;
    if (g < 0 || g >= N) return null;
    region[i] = g;
  }

  const stars: number[] = [];
  for (let r = 0; r < N; r++) {
    const c = str.charCodeAt(N * N + r) - 48;
    if (c < 0 || c >= N) return null;
    stars.push(idx(r, c));
  }

  const body = parseInt(str.slice(BODY_AT, CASE_LEN), 10);
  if (!(body >= 0 && body < N * N)) return null;

  const starSet = new Set(stars);
  const killer = NB8[body].find((x) => starSet.has(x));
  if (killer === undefined) return null; // sin asesino no hay caso

  return { region, stars, body, killer, guilty: region[killer], level };
}

function barajar(n: number): number[] {
  const bag = Array.from({ length: n }, (_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

/**
 * Bolsa barajada: no repite un caso hasta agotar los de esa dificultad.
 * `saved` viene de localStorage, así que no es confiable: se filtra a índices
 * válidos antes de usarla.
 */
export function pickCase(
  list: string[],
  level: Level,
  saved: unknown,
): { caso: Caso; bag: number[] } | null {
  let bag = Array.isArray(saved)
    ? saved.filter((i): i is number => Number.isInteger(i) && i >= 0 && i < list.length)
    : [];

  for (let intento = 0; intento < 3; intento++) {
    if (!bag.length) bag = barajar(list.length);
    const i = bag.pop() as number;
    const caso = decodeCase(list[i], level);
    if (caso) return { caso, bag };
  }
  return null;
}
