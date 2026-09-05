/**
 * La biblioteca de casos precalculados. Es el único módulo que conoce de dónde
 * salen los datos; la lógica de `puzzles.ts` no depende de esto, así que las
 * herramientas de Node pueden usarla leyendo el JSON por su cuenta.
 */
import datos from "../data/puzzles.json";
import type { Level } from "./engine";

export const LIB = datos as Record<Level, string[]>;

export function countCases(level: Level): number {
  return LIB[level]?.length ?? 0;
}
