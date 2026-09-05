"use client";

import Modal from "./Modal";
import { LEVEL_LABEL, NIVELES, type Level } from "@/lib/engine";
import { fmtTime } from "@/lib/game";
import { buildStory } from "@/lib/story";
import type { Caso } from "@/lib/puzzles";

interface Props {
  open: boolean;
  caso: Caso;
  gano: boolean;
  elapsed: number;
  level: Level;
  onClose: () => void;
  onOtroCaso: (level: Level) => void;
}

export default function VerdictModal({
  open,
  caso,
  gano,
  elapsed,
  level,
  onClose,
  onOtroCaso,
}: Props) {
  const h = buildStory(caso);

  return (
    <Modal open={open} onClose={onClose} labelledBy="verdicto-titulo" describedBy="verdicto-historia">
      <button className="sheet-close" onClick={onClose} aria-label="Cerrar y ver el tablero">
        ✕
      </button>

      <span className="kicker">
        {gano ? `Caso cerrado · ${LEVEL_LABEL[level]} · ${fmtTime(elapsed)}` : `Resuelto por la casa · ${LEVEL_LABEL[level]}`}
      </span>

      <h2 id="verdicto-titulo">
        <span className="sr-only">{gano ? "Caso resuelto. El asesino es " : "El asesino era "}</span>
        {h.culpable}
      </h2>

      <div className="story" id="verdicto-historia">
        <p>
          {h.apertura} Encontraron a <b>{h.victima}</b> en {h.cuartoDelCuerpo}, en la casilla{" "}
          <span className="coord">{h.casillaDelCuerpo}</span>.
        </p>
        <p>{h.coartada}</p>
        <p>
          Todas menos una. <b>{h.culpable}</b>, {h.rol}, estaba en {h.cuartoDelCulpable}, en{" "}
          <span className="coord">{h.casillaDelCulpable}</span> — la única casilla pegada al cuerpo.
        </p>
        <p>{h.movil}</p>
      </div>

      <div className="sheet-actions">
        <button className="action" onClick={() => onOtroCaso(level)}>
          Jugar otro caso
        </button>
        <button className="action ghost" onClick={onClose}>
          Ver el tablero
        </button>
      </div>

      {/* Antes se ocultaba la dificultad actual, así que no se veía en cuál estabas */}
      <div className="again">
        <span id="dif-label">Dificultad:</span>
        {NIVELES.map((n) =>
          n === level ? (
            <button key={n} className="actual" aria-current="true" disabled aria-describedby="dif-label">
              {LEVEL_LABEL[n]}
              <span className="sr-only"> (la que estás jugando)</span>
            </button>
          ) : (
            <button
              key={n}
              onClick={() => onOtroCaso(n)}
              aria-label={`Jugar un caso de dificultad ${LEVEL_LABEL[n]}`}
            >
              {LEVEL_LABEL[n]}
            </button>
          ),
        )}
      </div>

      <p className="esc">
        <kbd>Esc</kbd> cierra y te deja mirando el tablero resuelto.
      </p>
    </Modal>
  );
}
