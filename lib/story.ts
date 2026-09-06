/**
 * La historia de cada caso.
 *
 * El punto: no es una plantilla con huecos. Los testimonios se DERIVAN de las
 * posiciones de la solución —quién quedó pegado a quién, quién quedó aislado,
 * quién compartía fila con el cuerpo— así que dos casos con el mismo culpable
 * cuentan cosas distintas, porque el tablero es distinto.
 *
 * Todo lo que dice el relato es verdadero sobre ese tablero.
 */

import { COLS, N, coord, rc } from "./grid";
import { ROOMS, VICTIMA, roomLabel } from "./rooms";
import { deOf } from "./engine";
import type { Caso } from "./puzzles";

export const INSPECTORA = "Inspectora Iris Bertoni";

/** Qué pasaba en la casa esa noche. Enmarca todo el caso, no es decoración. */
const OCASIONES = [
  {
    nombre: "la lectura del testamento",
    apertura:
      "El testamento se leía a las once. A las once y cuarto ya no había a quién leérselo.",
  },
  {
    nombre: "una cena de nueve cubiertos",
    apertura:
      "La mesa estaba puesta para diez. Nadie supo explicar por qué se sentaron nueve.",
  },
  {
    nombre: "la tormenta que cortó la luz",
    apertura:
      "La luz se fue a las once menos cuarto y volvió veinte minutos después. En esos veinte minutos pasó todo.",
  },
  {
    nombre: "el aniversario de la casa",
    apertura:
      "Se brindaba por los cuarenta años de la casa. El brindis quedó a la mitad.",
  },
  {
    nombre: "la última noche antes de la venta",
    apertura:
      "La casa se vendía el lunes. Alguien decidió que el dueño no llegara al lunes.",
  },
  {
    nombre: "una partida que nadie terminó",
    apertura:
      "Habían empezado a jugar después de la cena. Las cartas siguen sobre la mesa, boca abajo.",
  },
];

/** Tres móviles por sospechoso: el mismo culpable no repite excusa. */
const MOVILES: string[][] = [
  // 0 Biblioteca — Dra. Alma Reyes, archivista
  [
    "Llevaba semanas peleando por unos papeles que sólo ella sabía leer, y esa mañana Vantt había pedido quemarlos.",
    "Catalogó esta biblioteca durante nueve años. El miércoles se enteró de que la vendían entera, sin abrirla.",
    "Había una carta de 1931 que ella nunca fichó. Vantt la encontró igual.",
  ],
  // 1 Invernadero — Elías Prat, botánico
  [
    "En el invernadero crecía algo que no figuraba en ningún catálogo, y Vantt había empezado a hacer preguntas.",
    "Le prometieron el invernadero de por vida. La promesa era verbal y el testigo acababa de morirse.",
    "Vantt quiso arrancar el jazmín del fondo. Debajo del jazmín había algo más viejo que el jazmín.",
  ],
  // 2 Salón — Condesa Vera Solís, anfitriona
  [
    "La casa había estado a su nombre durante treinta años. Dejó de estarlo un martes, sin que nadie le avisara.",
    "Recibió en este salón a tres generaciones. Vantt la anotó en la lista de invitados como «la señora Solís».",
    "El título es lo único que le queda, y Vantt tenía la costumbre de repetir cómo lo había conseguido.",
  ],
  // 3 Cocina — Nino Baralt, cocinero
  [
    "Esa noche cocinó para diez y sirvió para nueve. Nadie notó el plato que faltaba hasta mucho después.",
    "Vantt le devolvió el plato principal delante de todos. Fue la tercera vez ese mes.",
    "Hay una receta que su madre le dejó escrita a mano. Vantt la publicó con su propio nombre.",
  ],
  // 4 Estudio — Cnel. Ígor Mena, militar retirado
  [
    "Había una deuda vieja entre ellos, de las que no se saldan con dinero. Vantt creyó que el tiempo la había borrado.",
    "Los dos volvieron de la misma campaña. Sólo uno volvió con una condecoración, y no fue el que la ganó.",
    "Vantt guardaba en este escritorio una foto de 1938. Mena aparece en el fondo, y no debería.",
  ],
  // 5 Comedor — Ofelia Tinto, albacea
  [
    "El testamento se había corregido dos veces en un mes, y ella era la única que conocía las dos versiones.",
    "Firmó como testigo algo que no leyó. Vantt se lo recordaba cada vez que necesitaba una firma más.",
    "La corrección de anoche la dejaba afuera. Todavía no la había firmado nadie.",
  ],
  // 6 Bodega — Rulo Andrade, sumiller
  [
    "Faltaba una botella de la bodega. No era la más cara, pero era la única que Vantt tenía prohibido abrir.",
    "Armó esta cava botella por botella durante veinte años. Vantt la remató por lotes, sin mirarla.",
    "En el fondo de la bodega hay una pared más nueva que las otras. Vantt preguntó por qué.",
  ],
  // 7 Galería — Mireia Coll, restauradora
  [
    "El cuadro que estaba restaurando ya había sido vendido dos veces, y ninguna de las dos era legal.",
    "Descubrió que el retrato del vestíbulo es una copia. La original la firmó ella, hace seis años, por encargo.",
    "Vantt le pidió que envejeciera una tela. Ella lo hizo. Después vio a quién se la vendían.",
  ],
  // 8 Vestíbulo — Damián Ruz, mayordomo
  [
    "Cuarenta años abriendo esa puerta, y ni una sola línea a su nombre en el testamento nuevo.",
    "Sabe cuál de los invitados llegó tarde y por qué. Lo sabe desde hace años, de todos.",
    "Vantt le pidió que no abriera la puerta a nadie después de las diez. Alguien entró igual.",
  ],
];

/** Un nombre para el expediente, en línea con el móvil que le tocó. */
const TITULOS: string[][] = [
  ["El caso de los papeles quemados", "El caso de la biblioteca vendida", "El caso de la carta sin fichar"],
  ["El caso de la planta sin nombre", "El caso de la promesa verbal", "El caso de lo que había bajo el jazmín"],
  ["El caso de la casa que cambió de nombre", "El caso de la señora Solís", "El caso del título repetido"],
  ["El caso del plato que faltaba", "El caso del plato devuelto", "El caso de la receta ajena"],
  ["El caso de la deuda vieja", "El caso de la condecoración prestada", "El caso de la foto del 38"],
  ["El caso de las dos versiones", "El caso de la firma de más", "El caso de la corrección sin firmar"],
  ["El caso de la botella prohibida", "El caso de la cava rematada", "El caso de la pared nueva"],
  ["El caso del cuadro vendido dos veces", "El caso del retrato copiado", "El caso de la tela envejecida"],
  ["El caso de la línea que faltaba", "El caso del que sabía las llegadas", "El caso de la puerta que se abrió"],
];

/** Cierres de la inspectora, según cómo quedó el tablero. */
const CIERRES = [
  "Nadie mintió. Es lo que hace que este caso sea limpio: alcanzaba con mirar dónde estaba cada uno.",
  "Ocho coartadas perfectas y una imposible. Con eso alcanza.",
  "La casa entera se cubría sola. Alguien se olvidó de correrse un paso.",
];

export interface Testimonio {
  quien: string;
  linea: string;
}

export interface Historia {
  titulo: string;
  ocasion: string;
  apertura: string;
  salaDelCuerpo: string;
  casillaDelCuerpo: string;
  victima: string;
  inspectora: string;
  testimonios: Testimonio[];
  culpable: string;
  rol: string;
  salaDelCulpable: string;
  casillaDelCulpable: string;
  movil: string;
  cierre: string;
}

/** Distancia de rey: cuántos pasos hay entre dos casillas contando diagonales. */
function pasos(a: number, b: number): number {
  const [ra, ca] = rc(a);
  const [rb, cb] = rc(b);
  return Math.max(Math.abs(ra - rb), Math.abs(ca - cb));
}

export function buildStory(P: Caso): Historia {
  // Semilla estable: el mismo caso cuenta siempre la misma historia
  const semilla = P.body * 31 + P.killer * 7;
  const g = P.guilty;
  const room = ROOMS[g];

  // Dónde terminó cada uno
  const posicion = new Map<number, number>();
  for (const i of P.stars) posicion.set(P.region[i], i);
  const celdaCulpable = posicion.get(g) as number;

  const otros = [...posicion.entries()].filter(([sala]) => sala !== g);
  const [rCuerpo, cCuerpo] = rc(P.body);

  /* Los testimonios salen de la geometría de ESTA solución. Por eso dos casos
     con el mismo culpable no cuentan lo mismo. */
  const testimonios: Testimonio[] = [];

  // 1. Quien quedó más cerca del culpable, sin llegar a tocarlo
  const vecino = otros
    .map(([sala, celda]) => ({ sala, celda, d: pasos(celda, celdaCulpable) }))
    .sort((a, b) => a.d - b.d)[0];
  if (vecino) {
    testimonios.push({
      quien: ROOMS[vecino.sala].who,
      linea:
        `estaba en ${roomLabel(vecino.sala)}, a ${vecino.d} ${vecino.d === 1 ? "casilla" : "casillas"} ` +
        `${deOf(roomLabel(g))}. Dice que oyó una silla moverse y nada más.`,
    });
  }

  // 2. Quien quedó más lejos de cualquier otro: el único sin nadie cerca
  const aislado = otros
    .map(([sala, celda]) => ({
      sala,
      celda,
      d: Math.min(...[...posicion.values()].filter((x) => x !== celda).map((x) => pasos(celda, x))),
    }))
    .sort((a, b) => b.d - a.d)[0];
  if (aislado && aislado.sala !== vecino?.sala) {
    testimonios.push({
      quien: ROOMS[aislado.sala].who,
      linea:
        `pasó la noche en ${roomLabel(aislado.sala)}, más lejos de todos que nadie: ` +
        `${aislado.d} casillas hasta la persona más próxima. No vio a nadie, y eso es todo lo que puede probar.`,
    });
  }

  // 3. Quien compartía fila o columna con el cuerpo y no se enteró
  const enLinea = otros.find(([, celda]) => {
    const [r, c] = rc(celda);
    return (r === rCuerpo || c === cCuerpo) && celda !== celdaCulpable;
  });
  if (enLinea && enLinea[0] !== vecino?.sala && enLinea[0] !== aislado?.sala) {
    const [r, c] = rc(enLinea[1]);
    const eje = r === rCuerpo ? `la fila ${r + 1}` : `la columna ${COLS[c]}`;
    testimonios.push({
      quien: ROOMS[enLinea[0]].who,
      linea: `estuvo toda la noche en ${eje}, la misma que el cuerpo, y jura que no oyó nada.`,
    });
  }

  const oc = OCASIONES[semilla % OCASIONES.length];
  const iMovil = semilla % MOVILES[g].length;

  return {
    titulo: TITULOS[g][iMovil],
    ocasion: oc.nombre,
    apertura: oc.apertura,
    salaDelCuerpo: roomLabel(P.region[P.body]),
    casillaDelCuerpo: coord(P.body),
    victima: VICTIMA,
    inspectora: INSPECTORA,
    testimonios,
    culpable: room.who,
    rol: room.role,
    salaDelCulpable: roomLabel(g),
    casillaDelCulpable: coord(celdaCulpable),
    movil: MOVILES[g][iMovil],
    cierre: CIERRES[semilla % CIERRES.length],
  };
}

/** La ocasión también enmarca la partida mientras se juega. */
export function ocasionDe(P: Caso): string {
  return OCASIONES[(P.body * 31 + P.killer * 7) % OCASIONES.length].nombre;
}

export { N };
