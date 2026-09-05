"use client";

import Modal from "./Modal";
import { LEVEL_HINT, LEVEL_LABEL, NIVELES, type Level } from "@/lib/engine";
import { countCases } from "@/lib/library";
import { VICTIMA } from "@/lib/rooms";

interface Props {
  open: boolean;
  onElegir: (level: Level) => void;
  onClose: () => void;
}

export default function StartModal({ open, onElegir, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="inicio-titulo" describedBy="inicio-premisa">
      <span className="kicker">Un caso de lógica pura</span>
      <h2 id="inicio-titulo">Nueve Habitaciones</h2>
      <p className="lede" id="inicio-premisa">
        Anoche mataron a {VICTIMA} en su casa. Las nueve personas que estaban adentro se
        repartieron una por habitación, sin que ninguna quedara pegada a otra. Ubicalas a todas y
        vas a descubrir quién no pudo mantener la distancia.
      </p>

      <div className="picker" role="group" aria-label="Elegí la dificultad">
        {NIVELES.map((n) => (
          <button
            key={n}
            onClick={() => onElegir(n)}
            aria-label={`${LEVEL_LABEL[n]}: ${LEVEL_HINT[n]} ${countCases(n)} casos disponibles`}
          >
            <span className="txt">
              <b>{LEVEL_LABEL[n]}</b>
              <i>{LEVEL_HINT[n]}</i>
            </span>
            <span className="count" aria-hidden="true">
              {countCases(n)} casos
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
