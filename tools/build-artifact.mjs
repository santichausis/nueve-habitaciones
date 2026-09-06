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

/* Las tipografías se incrustan en el CSS: el artifact tiene que funcionar como
   un archivo suelto, sin pedir nada a la red. */
let css = readFileSync(join(raiz, "app/globals.css"), "utf8");
let fuentes = 0;
css = css.replace(/url\("\.\/fonts\/([^"]+)"\)/g, (_m, archivo) => {
  const datos = readFileSync(join(raiz, "app/fonts", archivo));
  fuentes++;
  return `url("data:font/woff2;base64,${datos.toString("base64")}")`;
});
if (!fuentes) {
  console.error("No se incrustó ninguna tipografía: ¿cambió la ruta en globals.css?");
  process.exit(1);
}

/* Dentro de un <script> inline, "</script" cierra la etiqueta aunque esté en
   una cadena. Escaparlo no cambia lo que el código hace. */
const seguroJs = js.replace(/<\/(script)/gi, "<\\/$1");
const seguroCss = css.replace(/<\/(style)/gi, "<\\/$1");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Nueve Habitaciones</title>
<meta name="description" content="Puzzle de deducción lógica: ubicá a nueve sospechosos, uno por fila, columna y habitación, sin que se toquen, y descubrí al asesino.">
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
console.log(`  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB en un solo archivo, ${fuentes} tipografías incrustadas`);
