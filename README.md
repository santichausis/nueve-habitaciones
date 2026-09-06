# Nueve Habitaciones

Un puzzle de deducción lógica con forma de caso policial. Anoche mataron a Aurelio Vantt
en su casa. Las nueve personas que estaban adentro se repartieron una por habitación,
cuidando de no quedar pegadas entre sí. Sólo una falló en eso, y esa es la asesina.

Es una variante de **Star Battle** (una estrella por fila, por columna y por región, sin
que dos se toquen ni en diagonal), donde las regiones son las habitaciones de una casa y
cada una tiene su ocupante. Ubicá a las nueve y el caso se cierra solo.

**Jugar online:** https://santichausis.github.io/nueve-habitaciones/

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # export estático en out/
npm run artifact   # dist/nueve-habitaciones.html, todo en un solo archivo
npm test           # verifica los casos y el motor de deducción
```

## Reglas

1. Hay exactamente una persona por fila.
2. Hay exactamente una persona por columna.
3. Hay exactamente una persona en cada habitación.
4. Nadie puede estar en una casilla que toque a otra persona, ni siquiera en diagonal.

Todo caso se resuelve **sólo por deducción**. Nunca hace falta adivinar.

## Cómo se juega

- **Clic** en una casilla: descartar (✕) → ubicar persona → limpiar. **Clic derecho** va al revés.
- **Arrastrar sin soltar**: tacha varias casillas de una. Si arrancás sobre una ✕, borra.
- **Teclado**: flechas para moverte, `espacio` para ubicar, `x` para descartar.
- Al ubicar a alguien se descartan solas las casillas que quedan prohibidas, y su nombre
  se tacha en la lista de sospechosos.
- **Pista** no te da la casilla: te explica en palabras la deducción que sigue.
- Si una fila, columna o habitación se queda sin casillas posibles, el juego te avisa y
  raya la zona: hay algo mal marcado.

## Las tres dificultades

El nivel de un caso es la técnica más avanzada que hace falta para resolverlo sin adivinar.

| Nivel | Casos | Qué exige |
|---|---:|---|
| Fácil | 800 | Sólo casillas obligadas y la regla de intersección |
| Normal | 800 | Además, que nadie pueda estar pegado a otra persona |
| Difícil | 800 | Además, razonamiento por conjuntos de filas, columnas y habitaciones |
| **Total** | **2400** | |

## Cómo se generan los casos

Generar Star Battle es más difícil de lo que parece: **repartir habitaciones al azar casi
nunca da solución única** (en la práctica, nunca: siempre quedan cinco o más soluciones).
Y aun con solución única, la mayoría de los tableros exige adivinar en algún punto.

El generador (`tools/generate.js`) resuelve las dos cosas:

1. **Solución primero.** Se sortea una ubicación válida de las nueve personas.
2. **Tallado de habitaciones.** Se hacen crecer las habitaciones desde cada persona y
   después se *tallan*: se buscan soluciones falsas y se mueve de habitación una casilla
   que aparezca en ellas. Mover una casilla de una solución falsa la invalida —deja dos
   personas en la misma habitación— y nunca toca la solución verdadera. Se repite hasta
   que sólo sobreviva una solución.
3. **Filtro por resolubilidad.** Un solver que imita el razonamiento humano intenta el
   caso con tres repertorios de técnicas. Si necesita adivinar, el caso se descarta.
   El repertorio que lo resuelve define la dificultad.

Los casos se precalculan y se embeben en el HTML: el juego abre instantáneo y la
dificultad elegida es la que se recibe.


## Cómo está armado

Next.js (App Router) con export estático y TypeScript. La lógica del juego no
depende de React ni del navegador, así que las herramientas de Node usan
exactamente el mismo código que corre en la página: no hay dos versiones del
motor que puedan divergir.

```
app/          layout y página
components/   tablero, lista de sospechosos, modales
lib/          lógica pura: geometría, motor de deducción, reglas, estado
data/         los 2400 casos precalculados
artifact/     punto de entrada del build de un solo archivo
tools/        generador, verificación y empaquetado
```

El juego se publica en dos formatos desde la misma fuente: el export estático
para GitHub Pages y un HTML autocontenido (`npm run artifact`) que empaqueta
todo con esbuild, sin pedidos de red más allá de la tipografía.

## Verificación

Cada uno de los 1373 casos pasa siete chequeos antes de entrar, con un contador de
soluciones escrito aparte que no comparte código con el juego:

- solución única;
- el solver llega exactamente a *esa* solución, sin adivinar;
- el nivel declarado es el mínimo que la resuelve (no está sobrecalificado);
- las habitaciones son conexas y de al menos dos casillas;
- ninguna persona toca a otra;
- nadie queda sobre el cuerpo;
- el cuerpo tiene exactamente una persona pegada — si tuviera dos, el asesino sería ambiguo.

```bash
npm test                              # los 2400 casos y el motor, con node:test
node tools/generate.mjs 60 > nuevos.txt   # 60 segundos de generación
```

El contador de soluciones del verificador está escrito aparte a propósito: no
comparte código con el motor del juego, así un error en el motor no se valida a
sí mismo.

`tools/puzzles.txt` es la fuente: una línea por caso, con el nivel y 92 caracteres
(81 dígitos de habitación, 9 columnas —una por fila— y la casilla del cuerpo).

## Diseño

- **Escala de espaciado de 8 pasos** (`--sp-1`…`--sp-8`): todas las medidas salen de ahí.
- **El panel se ordena por frecuencia de uso**, no por narrativa: controles, sospechosos,
  ambientación (plegable), referencia (plegable), récord. En 1440×900 el tablero y los
  nueve sospechosos entran completos sobre el pliegue.
- **El movimiento explica en vez de decorar**: los tachados automáticos entran en cascada
  desde la ficha que los provocó, así se ve *por qué* quedaron prohibidos.
- **El rojo significa error y nada más.** Las pistas señalan con un color propio
  (`--spot`) para no confundir "mirá acá" con "esto está mal".
- En móvil los controles son una barra fija: pedir una pista no obliga a perder de vista
  el tablero.
- Toda animación respeta `prefers-reduced-motion`.
- **El tablero es un plano, no una grilla**: cada habitación lleva su nombre y los
  muros tienen una puerta por cada par de cuartos vecinos.
- **Tipografías auto-hospedadas** (subconjunto latin, ~93 KB): sin pedidos a
  terceros y sin el salto de texto al cargar. En el artifact van incrustadas, así
  que ese archivo no toca la red en ningún momento.

## Accesibilidad

- Todo el texto cumple contraste **WCAG AA** (4.5:1) en ambos temas, incluido el
  texto chico de 11px.
- El tablero es una grilla ARIA real (`grid` › `row` › `gridcell`) y cada casilla
  anuncia su coordenada, su habitación y su estado.
- Los avisos de error y las pistas son regiones `aria-live`, así que se anuncian
  al aparecer en vez de pasar desapercibidos.
- El teclado alcanza para jugar entero: flechas, `espacio` y `x`. Los modales
  atrapan el foco y lo devuelven al cerrarse.
- Se respeta `prefers-reduced-motion` en todas las animaciones.

## Seguridad

El juego no hace pedidos de red salvo la tipografía, y `index.html` declara una
CSP con `default-src 'none'` y sin `connect-src`: aunque se lograra inyectar algo,
no tendría por dónde sacar datos.

La única entrada que no controla el juego es `localStorage` (dificultad, bolsa de
casos y estadísticas). Puede estar corrupta o editada a mano, así que se valida y
se normaliza antes de usarla en lugar de confiar en su forma.

## Licencia

MIT. Ver [LICENSE](LICENSE).
