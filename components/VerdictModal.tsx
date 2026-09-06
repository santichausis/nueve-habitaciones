"use client";

import Modal from "./Modal";
import Emblema from "./Emblema";
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
        {gano
          ? `Caso cerrado · ${LEVEL_LABEL[level]} · ${fmtTime(elapsed)}`
          : `Resuelto por la casa · ${LEVEL_LABEL[level]}`}
      </span>

      <h2 id="verdicto-titulo">
        <span className="sr-only">{gano ? "Caso resuelto. " : "Caso cerrado por la casa. "}</span>
        {h.titulo}
      </h2>

      <div className="story" id="verdicto-historia">
        <p>
          {h.apertura} Era {h.ocasion}. Encontraron a <b>{h.victima}</b> en {h.salaDelCuerpo}, en la
          casilla <span className="coord">{h.casillaDelCuerpo}</span>.
        </p>

        {/* Estos testimonios salen de las posiciones reales de este tablero:
            por eso cambian aunque el culpable sea el mismo. */}
        {h.testimonios.length > 0 && (
          <ul className="testimonios">
            {h.testimonios.map((t) => (
              <li key={t.quien}>
                <b>{t.quien}</b> {t.linea}
              </li>
            ))}
          </ul>
        )}

        <p className="acusacion">
          <span className="sello-grande" aria-hidden="true">
            <span className="pin" style={{ "--h": `var(--h${caso.guilty + 1})`, "--dl": `var(--dl${caso.guilty + 1})` } as React.CSSProperties}>
              <Emblema g={caso.guilty} />
            </span>
          </span>
          <span>
            Todas las coartadas se sostenían menos una. <b>{h.culpable}</b>, {h.rol}, estaba en{" "}
            {h.salaDelCulpable}, en <span className="coord">{h.casillaDelCulpable}</span>: la única
            casilla pegada al cuerpo.
          </span>
        </p>

        <p>{h.movil}</p>

        <p className="firma">
          «{h.cierre}»<br />
          <span>— {h.inspectora}</span>
        </p>
      </div>

      <div className="sheet-actions">
        <button className="action" onClick={() => onOtroCaso(level)}>
          Jugar otro caso
        </button>
        <button className="action ghost" onClick={onClose}>
          Ver el tablero
        </button>
      </div>

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
