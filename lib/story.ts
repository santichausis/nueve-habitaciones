/** La historia final se arma con los datos reales del caso resuelto. */

import { coord } from "./grid";
import { ROOMS, VICTIMA, roomLabel } from "./rooms";
import type { Caso } from "./puzzles";

const APERTURAS = [
  "La casa se quedó en silencio pasadas las once.",
  "Nadie oyó nada esa noche. O eso dijeron todos, después.",
  "El reloj del vestíbulo marcaba las once y veinte cuando alguien gritó.",
  "Fue el perro el que empezó a ladrar, mucho antes que las personas.",
  "La tormenta tapó cualquier ruido que hubiera habido.",
];

export interface Historia {
  apertura: string;
  victima: string;
  cuartoDelCuerpo: string;
  casillaDelCuerpo: string;
  coartada: string;
  culpable: string;
  rol: string;
  cuartoDelCulpable: string;
  casillaDelCulpable: string;
  movil: string;
}

export function buildStory(P: Caso): Historia {
  const room = ROOMS[P.guilty];
  const cel = P.stars.find((i) => P.region[i] === P.guilty) as number;
  const semilla = (P.body * 7 + P.killer * 13) % APERTURAS.length;

  return {
    apertura: APERTURAS[semilla],
    victima: VICTIMA,
    cuartoDelCuerpo: roomLabel(P.region[P.body]),
    casillaDelCuerpo: coord(P.body),
    coartada:
      "Las nueve personas de la casa estaban repartidas, una en cada habitación, y ninguna lo " +
      "bastante cerca de otra como para tocarse: todas se cubrían entre sí.",
    culpable: room.who,
    rol: room.role,
    cuartoDelCulpable: roomLabel(P.guilty),
    casillaDelCulpable: coord(cel),
    movil: room.motive,
  };
}
