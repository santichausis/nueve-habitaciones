/**
 * Verificación de la biblioteca de casos y del motor de deducción.
 *   node --test tools/
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  Engine,
  LEVELS,
  NIVELES,
  N,
  NB8,
  nb4,
  coord,
  decodeCase,
  CASE_LEN,
  cuentaSoluciones,
  leerCasos,
  partes,
} from "./shared.mjs";

const casos = leerCasos();

test("la biblioteca tiene casos de las tres dificultades", () => {
  const porNivel = {};
  for (const { level } of casos) porNivel[level] = (porNivel[level] ?? 0) + 1;
  for (const n of NIVELES) assert.ok(porNivel[n] > 100, `pocos casos ${n}: ${porNivel[n]}`);
});

test("cada caso tiene solución única y se resuelve sin adivinar", () => {
  const problemas = [];
  for (const { level, code } of casos) {
    const { region, stars, body } = partes(code);
    const ss = new Set(stars);

    if (new Set(stars.map((i) => i % 9)).size !== 9) problemas.push(`${code}: columnas repetidas`);
    if (new Set(stars.map((i) => region[i])).size !== 9)
      problemas.push(`${code}: habitaciones repetidas`);
    if (stars.some((i) => NB8[i].some((x) => ss.has(x)))) problemas.push(`${code}: se tocan`);

    // habitaciones conexas y de al menos dos casillas
    for (let g = 0; g < 9; g++) {
      const cells = [];
      for (let i = 0; i < 81; i++) if (region[i] === g) cells.push(i);
      if (cells.length < 2) {
        problemas.push(`${code}: habitación de ${cells.length}`);
        break;
      }
      const vistas = new Set([cells[0]]);
      const q = [cells[0]];
      while (q.length) {
        const c = q.pop();
        for (const x of nb4(c)) if (region[x] === g && !vistas.has(x)) {
          vistas.add(x);
          q.push(x);
        }
      }
      if (vistas.size !== cells.length) {
        problemas.push(`${code}: habitación partida`);
        break;
      }
    }

    if (cuentaSoluciones(region, 3) !== 1) problemas.push(`${code}: no única`);

    const e = new Engine(region);
    if (!e.run(LEVELS[level])) problemas.push(`${code}: hace falta adivinar`);
    else if (!stars.every((i) => e.star[i])) problemas.push(`${code}: llega a otra solución`);

    // el nivel es el mínimo que lo resuelve, no está sobrecalificado
    const min = NIVELES.find((l) => new Engine(region).run(LEVELS[l]));
    if (min !== level) problemas.push(`${code}: nivel ${level} pero alcanza ${min}`);

    if (ss.has(body)) problemas.push(`${code}: cuerpo sobre persona`);
    if (NB8[body].filter((x) => ss.has(x)).length !== 1)
      problemas.push(`${code}: asesino ambiguo`);
  }
  assert.deepEqual(problemas.slice(0, 5), [], `${problemas.length} casos con problemas`);
});

test("decodeCase rechaza entradas inválidas", () => {
  const bueno = casos[0].code;
  assert.ok(decodeCase(bueno, "normal"), "un caso válido debería decodificar");
  assert.equal(decodeCase(undefined, "normal"), null);
  assert.equal(decodeCase("", "normal"), null);
  assert.equal(decodeCase(bueno.slice(0, 10), "normal"), null, "largo incorrecto");
  assert.equal(decodeCase("9" + bueno.slice(1), "normal"), null, "habitación fuera de rango");
  assert.equal(decodeCase(bueno.slice(0, 81) + "9" + bueno.slice(82), "normal"), null, "columna fuera de rango");
  assert.equal(decodeCase(bueno.slice(0, 90) + "99", "normal"), null, "casilla del cuerpo fuera de rango");
  assert.equal(CASE_LEN, 92);
});

test("las pistas resuelven cualquier caso y llegan a la solución verdadera", () => {
  const muestra = [];
  for (const n of NIVELES) {
    const delNivel = casos.filter((c) => c.level === n).slice(0, 25);
    muestra.push(...delNivel);
  }
  for (const { level, code } of muestra) {
    const P = decodeCase(code, level);
    assert.ok(P, `no decodifica ${code}`);
    const e = new Engine(P.region);
    let pasos = 0;
    while (e.count < N && e.ok && pasos < 300) {
      if (!e.step(LEVELS.dificil)) break;
      pasos++;
    }
    assert.equal(e.count, N, `las pistas no completan ${code}`);
    for (const i of P.stars) assert.equal(e.star[i], 1, `las pistas llevan a otra solución en ${code}`);
    assert.ok(pasos >= 5 && pasos <= 60, `cantidad de pasos rara (${pasos}) en ${code}`);
  }
});

test("el asesino es siempre la única persona pegada al cuerpo", () => {
  for (const { level, code } of casos.slice(0, 300)) {
    const P = decodeCase(code, level);
    const ss = new Set(P.stars);
    const pegadas = NB8[P.body].filter((x) => ss.has(x));
    assert.equal(pegadas.length, 1, `asesino ambiguo en ${code}`);
    assert.equal(pegadas[0], P.killer);
    assert.equal(P.region[P.killer], P.guilty);
    assert.ok(coord(P.body).length >= 2);
  }
});
