/**
 * localStorage es la única entrada que el juego no controla: puede estar
 * corrupta, editada a mano o directamente no existir (modo privado, cuota
 * llena). Todo lo que sale de acá se valida antes de usarse.
 */

import { NIVELES, type Level } from "./engine";

export function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin espacio o sin permiso: el juego sigue andando sin persistir */
  }
}

export function loadLevel(): Level {
  const d = load<unknown>("nh-diff", "normal");
  return NIVELES.includes(d as Level) ? (d as Level) : "normal";
}

export interface Stat {
  played: number;
  won: number;
  best: number | null;
}

export type Stats = Partial<Record<Level, Stat>>;

export function loadStats(): Stats {
  const st = load<unknown>("nh-stats", {});
  return st && typeof st === "object" && !Array.isArray(st) ? (st as Stats) : {};
}

/** Normaliza una entrada guardada a la forma esperada. */
export function statFor(st: Stats, level: Level): Stat {
  const s = st[level] as unknown;
  if (!s || typeof s !== "object") return { played: 0, won: 0, best: null };
  const raw = s as Record<string, unknown>;
  const best =
    typeof raw.best === "number" && Number.isFinite(raw.best) && raw.best >= 0 ? raw.best : null;
  return { played: Number(raw.played) || 0, won: Number(raw.won) || 0, best };
}

export const bagKey = (level: Level) => `nh-bag-${level}`;
