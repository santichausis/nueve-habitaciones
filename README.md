# Nueve Habitaciones

Un puzzle de deducción lógica con forma de caso policial. Anoche mataron a Aurelio Vantt
en su casa. Las nueve personas que estaban adentro se repartieron una por habitación,
cuidando de no quedar pegadas entre sí. Sólo una falló en eso, y esa es la asesina.

Es una variante de **Star Battle** (una estrella por fila, por columna y por región, sin
que dos se toquen ni en diagonal), donde las regiones son las habitaciones de una casa y
cada una tiene su ocupante. Ubicá a las nueve y el caso se cierra solo.

**Jugar:** abrí `index.html` en cualquier navegador. Es un único archivo, sin dependencias
ni build. No necesita servidor.

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
| Fácil | 333 | Sólo casillas obligadas y la regla de intersección |
| Normal | 360 | Además, que nadie pueda estar pegado a otra persona |
| Difícil | 680 | Además, razonamiento por conjuntos de filas, columnas y habitaciones |
| **Total** | **1373** | |

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
node tools/validate.js index.html tools/puzzles.txt /tmp/out.json  # revalida los 1373
node tools/integration-test.js index.html                          # juega 120 casos enteros
node tools/regression-test.js index.html tools/puzzles.txt         # detección de errores
```

Para generar casos nuevos (los escribe en stdout, en el mismo formato):

```bash
node tools/generate.js index.html 60 > nuevos.txt   # 60 segundos de generación
node tools/validate.js index.html nuevos.txt /tmp/nuevos.json
```

Un caso tarda alrededor de un segundo en tallarse, y sólo entra si el solver del juego
puede resolverlo sin adivinar; en la práctica salen unos tres casos por segundo.

`tools/puzzles.txt` es la fuente: una línea por caso, con el nivel y 92 caracteres
(81 dígitos de habitación, 9 columnas —una por fila— y la casilla del cuerpo).

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
