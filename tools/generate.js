#!/usr/bin/env node
/*
 * Generador de casos de Nueve Habitaciones.
 *
 *   node tools/generate.js index.html 60 > nuevos.txt
 *
 * Reutiliza el motor de deducción del propio juego (index.html), así que un caso
 * sólo se acepta si el solver que da las pistas puede resolverlo sin adivinar.
 *
 * El punto no obvio: repartir habitaciones al azar prácticamente nunca da
 * solución única. Por eso las habitaciones se *tallan* — ver carve().
 */
const fs = require("fs");
const [,, htmlPath, segundosArg] = process.argv;
if (!htmlPath) { console.error("uso: node tools/generate.js <index.html> [segundos]"); process.exit(1); }
const SEGUNDOS = Number(segundosArg || 30);

// el motor del juego: Engine, LEVELS, nb4, NB8, idx, rc, coord
const html = fs.readFileSync(htmlPath, "utf8");
const src = html.slice(html.indexOf("const N = 9;"), html.indexOf("/* ---------- estado ---------- */"));
eval(src.replace(/^(const|let) /gm, "var "));

// 1. una ubicación válida: una por fila y columna, sin tocarse
function genSolution() {
  for (let intento = 0; intento < 3000; intento++) {
    const cols = [...Array(9).keys()];
    for (let i = cols.length - 1; i > 0; i--) { const j = (Math.random()*(i+1))|0; [cols[i],cols[j]] = [cols[j],cols[i]]; }
    let ok = true;
    for (let r = 1; r < 9; r++) if (Math.abs(cols[r]-cols[r-1]) <= 1) { ok = false; break; }
    if (ok) return cols.map((c, r) => r*9 + c);
  }
  return null;
}

// 2. habitaciones: crecen desde cada persona, siempre conexas
function makeRegions(stars) {
  const region = new Int8Array(81).fill(-1), frontier = [], size = new Array(9).fill(0);
  stars.forEach((cell, g) => { region[cell] = g; size[g] = 1; frontier[g] = nb4(cell).slice(); });
  let asignadas = 9;
  while (asignadas < 81) {
    const opts = [];
    for (let g = 0; g < 9; g++) { frontier[g] = frontier[g].filter(x => region[x] === -1); if (frontier[g].length) opts.push(g); }
    if (!opts.length) return null;
    opts.sort((a, b) => size[a] - size[b]);
    const pool = opts.slice(0, Math.min(opts.length, 1 + ((Math.random()*3)|0)));
    const g = pool[(Math.random()*pool.length)|0], f = frontier[g];
    const cell = f.splice((Math.random()*f.length)|0, 1)[0];
    region[cell] = g; size[g]++; asignadas++;
    for (const x of nb4(cell)) if (region[x] === -1) f.push(x);
  }
  return region;
}

// hasta `tope` soluciones distintas de la verdadera
function altSolutions(region, key, tope) {
  const uc = new Array(9).fill(false), ur = new Array(9).fill(false), cur = new Array(9), out = [];
  (function rec(r, prev) {
    if (out.length >= tope) return;
    if (r === 9) { if (cur.join(",") !== key) out.push(cur.slice()); return; }
    for (let c = 0; c < 9; c++) {
      if (uc[c]) continue;
      if (prev >= 0 && Math.abs(c - prev) <= 1) continue;
      const g = region[r*9 + c]; if (ur[g]) continue;
      uc[c] = true; ur[g] = true; cur[r] = r*9 + c;
      rec(r + 1, c);
      uc[c] = false; ur[g] = false;
      if (out.length >= tope) return;
    }
  })(0, -1);
  return out;
}
function cuentaSoluciones(region, tope) { return altSolutions(region, "", tope).length; }

function sigueConexa(region, g, sin) {
  const cells = []; for (let i = 0; i < 81; i++) if (region[i] === g && i !== sin) cells.push(i);
  if (cells.length < 2) return false;
  const vistas = new Set([cells[0]]), q = [cells[0]];
  while (q.length) { const c = q.pop(); for (const x of nb4(c)) if (region[x] === g && x !== sin && !vistas.has(x)) { vistas.add(x); q.push(x); } }
  return vistas.size === cells.length;
}
function tamaños(region) { const s = new Array(9).fill(0); for (let i = 0; i < 81; i++) s[region[i]]++; return s; }
function movimientos(region, esPersona, size, i) {
  if (esPersona.has(i)) return [];
  const g = region[i];
  if (size[g] - 1 < 2 || !sigueConexa(region, g, i)) return [];
  const out = [], vistas = new Set();
  for (const x of nb4(i)) { const g2 = region[x]; if (g2 !== g && !vistas.has(g2)) { vistas.add(g2); out.push([i, g2]); } }
  return out;
}

/* 3. Tallado. Mientras haya soluciones falsas, movemos de habitación una casilla
 * que aparezca en ellas, eligiendo con probabilidad proporcional a en cuántas
 * aparece. Mover una casilla de una solución falsa la invalida (deja dos personas
 * en la misma habitación) y nunca afecta a la solución verdadera. */
function carve(stars) {
  const region = makeRegions(stars);
  if (!region) return null;
  const key = stars.join(","), esPersona = new Set(stars);
  let alts = [];
  for (let paso = 0; paso < 400; paso++) {
    if (!alts.length) { alts = altSolutions(region, key, 24); if (!alts.length) return region; }
    const size = tamaños(region), freq = new Map();
    for (const a of alts) for (const i of a) if (!esPersona.has(i)) freq.set(i, (freq.get(i) || 0) + 1);
    const pool = [];
    for (const [i, f] of freq) { const m = movimientos(region, esPersona, size, i); if (m.length) pool.push([m, f]); }
    let mv = null;
    if (pool.length) {
      let x = Math.random() * pool.reduce((a, p) => a + p[1], 0);
      for (const p of pool) { x -= p[1]; if (x <= 0) { mv = p[0][(Math.random()*p[0].length)|0]; break; } }
      if (!mv) { const m = pool[pool.length-1][0]; mv = m[(Math.random()*m.length)|0]; }
    } else {
      const todos = [];
      for (let i = 0; i < 81; i++) todos.push(...movimientos(region, esPersona, size, i));
      if (!todos.length) return null;
      mv = todos[(Math.random()*todos.length)|0];
      alts = [];
    }
    region[mv[0]] = mv[1];
    const movida = mv[0];
    alts = alts.filter(a => a.indexOf(movida) === -1);   // las que la contenían ya no son solución
  }
  return null;
}

// 4. dificultad = el repertorio mínimo que lo resuelve; null si hace falta adivinar
function grade(region) {
  for (const nivel of ["facil", "normal", "dificil"])
    if (new Engine(region).run(LEVELS[nivel])) return nivel;
  return null;
}

const salida = [], t0 = Date.now();
const cuenta = { facil: 0, normal: 0, dificil: 0 };
while ((Date.now() - t0) / 1000 < SEGUNDOS) {
  const stars = genSolution(); if (!stars) continue;
  const region = carve(stars); if (!region) continue;
  const nivel = grade(region); if (!nivel) continue;
  if (cuentaSoluciones(region, 3) !== 1) continue;
  const e = new Engine(region);
  if (!e.run(LEVELS[nivel])) continue;
  if (!stars.every(i => e.star[i])) continue;          // el solver llega a ESTA solución
  const esPersona = new Set(stars), candidatos = [];
  for (let i = 0; i < 81; i++) {
    if (esPersona.has(i)) continue;
    if (NB8[i].filter(x => esPersona.has(x)).length === 1) candidatos.push(i);  // asesino inequívoco
  }
  if (!candidatos.length) continue;
  const cuerpo = candidatos[(Math.random()*candidatos.length)|0];
  let s = ""; for (let i = 0; i < 81; i++) s += region[i];
  s += stars.map(i => i % 9).join("") + String(cuerpo).padStart(2, "0");
  salida.push(nivel + " " + s);
  cuenta[nivel]++;
}
process.stdout.write(salida.join("\n") + (salida.length ? "\n" : ""));
console.error(`generados ${salida.length} casos en ${SEGUNDOS}s:`, cuenta);
