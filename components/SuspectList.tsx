"use client";

import { coord } from "@/lib/grid";
import { PERSON, type Mark } from "@/lib/game";
import { ROOMS } from "@/lib/rooms";
import Emblema from "./Emblema";

interface Props {
  marks: Mark[];
  roomCells: number[][];
  guilty: number | null;
  /** Habitación bajo el cursor en el tablero: el vínculo también va en ese sentido. */
  apuntada: number | null;
  /** Resalta la habitación de ese sospechoso en el tablero. */
  onResaltar: (celdas: number[]) => void;
}

export default function SuspectList({ marks, roomCells, guilty, apuntada, onResaltar }: Props) {
  return (
    <ul className="suspects">
      {ROOMS.map((room, g) => {
        const cel = roomCells[g]?.find((i) => marks[i] === PERSON) ?? -1;
        const ubicado = cel >= 0;
        const culpable = guilty === g;
        return (
          <li
            key={room.name}
            className={[ubicado ? "done" : "", culpable ? "guilty" : "", apuntada === g ? "lit" : ""]
              .filter(Boolean)
              .join(" ")}
            style={{ "--h": `var(--h${g + 1})`, "--dl": `var(--dl${g + 1})` } as React.CSSProperties}
            /* El resaltado también responde al teclado, no sólo al mouse */
            tabIndex={0}
            onMouseEnter={() => onResaltar(roomCells[g] ?? [])}
            onMouseLeave={() => onResaltar([])}
            onFocus={() => onResaltar(roomCells[g] ?? [])}
            onBlur={() => onResaltar([])}
            aria-label={
              `${room.who}, ${room.role}, ${room.name}. ` +
              (culpable ? "El asesino. " : "") +
              (ubicado ? `Ubicado en ${coord(cel)}.` : "Sin ubicar.")
            }
          >
            {/* El mismo sello que en el tablero: así la relación
                emblema-persona se aprende sola en la primera partida. */}
            <span className="swatch" aria-hidden="true">
              <Emblema g={g} />
            </span>
            <span className="who" aria-hidden="true">
              <b>{room.who}</b>
              <i>
                {room.role} · {room.name}
              </i>
            </span>
            <span className="at" aria-hidden="true">
              {ubicado ? coord(cel) : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
