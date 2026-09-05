/** Las nueve habitaciones y quién ocupa cada una. */

export interface Room {
  /** Nombre de la habitación. */
  name: string;
  /** Artículo que le corresponde: "la Biblioteca", "el Salón". */
  art: "la" | "el";
  who: string;
  role: string;
  /** Por qué lo habría hecho. Aparece en la historia final. */
  motive: string;
}

export const ROOMS: Room[] = [
  {
    name: "Biblioteca",
    art: "la",
    who: "Dra. Alma Reyes",
    role: "archivista",
    motive:
      "Llevaba semanas peleando por unos papeles que sólo ella sabía leer, y esa mañana Vantt había pedido quemarlos.",
  },
  {
    name: "Invernadero",
    art: "el",
    who: "Elías Prat",
    role: "botánico",
    motive:
      "En el invernadero crecía algo que no figuraba en ningún catálogo, y Vantt había empezado a hacer preguntas.",
  },
  {
    name: "Salón",
    art: "el",
    who: "Condesa Vera Solís",
    role: "anfitriona",
    motive:
      "La casa había estado a su nombre durante treinta años. Dejó de estarlo un martes, sin que nadie le avisara.",
  },
  {
    name: "Cocina",
    art: "la",
    who: "Nino Baralt",
    role: "cocinero",
    motive:
      "Esa noche cocinó para diez y sirvió para nueve. Nadie notó el plato que faltaba hasta mucho después.",
  },
  {
    name: "Estudio",
    art: "el",
    who: "Cnel. Ígor Mena",
    role: "militar retirado",
    motive:
      "Había una deuda vieja entre ellos, de las que no se saldan con dinero. Vantt creyó que el tiempo la había borrado.",
  },
  {
    name: "Comedor",
    art: "el",
    who: "Ofelia Tinto",
    role: "albacea",
    motive:
      "El testamento se había corregido dos veces en un mes, y ella era la única que conocía las dos versiones.",
  },
  {
    name: "Bodega",
    art: "la",
    who: "Rulo Andrade",
    role: "sumiller",
    motive:
      "Faltaba una botella de la bodega. No era la más cara, pero era la única que Vantt tenía prohibido abrir.",
  },
  {
    name: "Galería",
    art: "la",
    who: "Mireia Coll",
    role: "restauradora",
    motive:
      "El cuadro que estaba restaurando ya había sido vendido dos veces, y ninguna de las dos era legal.",
  },
  {
    name: "Vestíbulo",
    art: "el",
    who: "Damián Ruz",
    role: "mayordomo",
    motive:
      "Cuarenta años abriendo esa puerta, y ni una sola línea a su nombre en el testamento nuevo.",
  },
];

export const VICTIMA = "Aurelio Vantt";

/** "la Biblioteca" / "el Salón" */
export const roomLabel = (g: number): string => `${ROOMS[g].art} ${ROOMS[g].name}`;
