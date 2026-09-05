/**
 * Las herramientas usan la MISMA lógica que el juego, no una copia.
 * `lib/` está en TypeScript, así que se compila antes con `npm run build:tools`.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const compilado = join(raiz, ".tools-build/lib");
if (!existsSync(compilado)) {
  console.error("Falta compilar lib/. Corré:  npm run build:tools");
  process.exit(1);
}

export const { Engine, grade, LEVELS, NIVELES } = await import(join(compilado, "engine.js"));
export const { decodeCase, CASE_LEN, BODY_AT } = await import(join(compilado, "puzzles.js"));
export const { N, NB8, nb4, idx, rc, coord } = await import(join(compilado, "grid.js"));
export const { ROOMS } = await import(join(compilado, "rooms.js"));

/** Un caso codificado -> sus partes, sin pasar por decodeCase (para poder testearlo). */
export function partes(code) {
  const region = new Int8Array(81);
  for (let i = 0; i < 81; i++) region[i] = code.charCodeAt(i) - 48;
  const stars = [];
  for (let r = 0; r < 9; r++) stars.push(r * 9 + (code.charCodeAt(81 + r) - 48));
  return { region, stars, body: parseInt(code.slice(90, 92), 10) };
}

export function leerCasos(ruta = join(raiz, "tools/puzzles.txt")) {
  return readFileSync(ruta, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [level, code] = l.split(" ");
      return { level, code };
    });
}

/**
 * Contador de soluciones propio del verificador: a propósito NO comparte código
 * con el juego, así un error en el motor no se valida a sí mismo.
 */
export function cuentaSoluciones(region, tope) {
  let n = 0;
  const uc = new Array(9).fill(false);
  const ur = new Array(9).fill(false);
  (function rec(r, prev) {
    if (n >= tope) return;
    if (r === 9) {
      n++;
      return;
    }
    for (let c = 0; c < 9; c++) {
      if (uc[c]) continue;
      if (prev >= 0 && Math.abs(c - prev) <= 1) continue;
      const g = region[r * 9 + c];
      if (ur[g]) continue;
      uc[c] = true;
      ur[g] = true;
      rec(r + 1, c);
      uc[c] = false;
      ur[g] = false;
      if (n >= tope) return;
    }
  })(0, -1);
  return n;
}
