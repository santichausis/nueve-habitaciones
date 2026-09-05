#!/usr/bin/env node
/**
 * Arma un HTML autocontenido con todo adentro: sin pedidos de red salvo la
 * tipografía, sin carga de chunks, sin rutas que resolver en runtime.
 *
 * El juego se publica en dos lados —GitHub Pages, donde el export de Next sirve
 * tal cual, y un Artifact de Claude, que necesita un único archivo— y ambos
 * salen del MISMO código: `artifact/entry.tsx` monta el mismo componente que
 * usa `app/page.tsx`. Lo único propio de este build es el shell de abajo.
 *
 * (El export de Next no se puede inlinear sin más: su runtime deduce la ruta
 * base desde `document.currentScript.src`, que en un script inline está vacío.)
 *
 *   npm run artifact  ->  dist/nueve-habitaciones.html
 */
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const resultado = await build({
  entryPoints: [join(raiz, "artifact/entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2022"],
  platform: "browser",
  jsx: "automatic",
  tsconfig: join(raiz, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  logLevel: "warning",
});

const js = resultado.outputFiles[0].text;
const css = readFileSync(join(raiz, "app/globals.css"), "utf8");

/* Dentro de un <script> inline, "</script" cierra la etiqueta aunque esté en
   una cadena. Escaparlo no cambia lo que el código hace. */
const seguroJs = js.replace(/<\/(script)/gi, "<\\/$1");
const seguroCss = css.replace(/<\/(style)/gi, "<\\/$1");

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,600;0,6..96,700;1,6..96,600" +
  "&family=Libre+Franklin:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Nueve Habitaciones</title>
<meta name="description" content="Puzzle de deducción lógica: ubicá a nueve sospechosos, uno por fila, columna y habitación, sin que se toquen, y descubrí al asesino.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FUENTES}">
<style>*{box-sizing:border-box}body{margin:0}[hidden]{display:none!important}
${seguroCss}</style>
</head>
<body>
<div id="root"></div>
<script>${seguroJs}</script>
</body>
</html>
`;

const dist = join(raiz, "dist");
mkdirSync(dist, { recursive: true });
const destino = join(dist, "nueve-habitaciones.html");
writeFileSync(destino, html);

console.log(destino);
console.log(`  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB en un solo archivo`);
