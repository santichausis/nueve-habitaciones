"use client";

import { useState } from "react";
import Modal from "./Modal";
import Emblema from "./Emblema";
import { LEVEL_HINT, LEVEL_LABEL, NIVELES, type Level } from "@/lib/engine";
import { countCases } from "@/lib/library";
import { INSPECTORA } from "@/lib/story";
import { VICTIMA } from "@/lib/rooms";

interface Props {
  open: boolean;
  /** La primera vez se explican las reglas antes de elegir dificultad. */
  primeraVez: boolean;
  onElegir: (level: Level) => void;
  onClose: () => void;
}

/**
 * La regla que más cuesta entender es la cuarta —que nadie puede tocar a otro,
 * ni en diagonal—, así que se muestra dibujada en vez de sólo escrita.
 */
function DiagramaContacto() {
  return (
    <div className="diagrama" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={i === 4 ? "centro" : "vecina"}>
          {i === 4 ? (
            <span className="pin" style={{ "--h": "var(--h7)", "--dl": "var(--dl7)" } as React.CSSProperties}>
              <Emblema g={6} />
            </span>
          ) : (
            <svg viewBox="0 0 24 24" className="cross">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}

export default function StartModal({ open, primeraVez, onElegir, onClose }: Props) {
  /* `primeraVez` llega después del primer render (sale de localStorage, que no
     existe en el prerender). Si el paso se inicializara con useState quedaría
     congelado en el valor viejo: por eso se deriva. */
  const [pasoElegido, setPasoElegido] = useState<"reglas" | "dificultad" | null>(null);
  const paso = pasoElegido ?? (primeraVez ? "reglas" : "dificultad");
  const setPaso = setPasoElegido;

  if (paso === "reglas") {
    return (
      <Modal open={open} onClose={onClose} labelledBy="bienvenida-titulo" describedBy="bienvenida-texto">
        <span className="kicker">Expediente abierto · {INSPECTORA}</span>
        <h2 id="bienvenida-titulo">Nueve personas, nueve habitaciones</h2>

        <div id="bienvenida-texto">
          <p className="lede">
            Anoche mataron a {VICTIMA} en su casa. Las nueve personas que estaban adentro se
            repartieron una por habitación y ninguna quedó pegada a otra: se cubrían entre sí. Sólo
            una falló en eso, y ésa es la asesina.
          </p>

          <p className="lede">
            Su trabajo es ubicar a las nueve. El caso se cierra solo cuando lo consiga.
          </p>

          <ol className="reglas-num">
            <li>Hay exactamente <b>una persona por fila</b>.</li>
            <li>Hay exactamente <b>una persona por columna</b>.</li>
            <li>Hay exactamente <b>una persona en cada habitación</b>.</li>
            <li>
              <b>Nadie puede tocar a nadie</b>, ni siquiera en diagonal.
              <DiagramaContacto />
              <small>
                Al ubicar a alguien, las ocho casillas de alrededor quedan descartadas.
              </small>
            </li>
          </ol>

          <p className="lede">
            No hace falta adivinar nunca: todo caso se resuelve por deducción. Si se traba, el botón{" "}
            <b>Pista</b> le explica el próximo paso con palabras.
          </p>
        </div>

        <div className="sheet-actions">
          <button className="action" onClick={() => setPaso("dificultad")}>
            Entendido, elegir caso
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} labelledBy="inicio-titulo" describedBy="inicio-premisa">
      <span className="kicker">Un caso de lógica pura</span>
      <h2 id="inicio-titulo">Elegí el caso</h2>
      <p className="lede" id="inicio-premisa">
        La dificultad no cambia el tamaño del tablero: cambia qué tan lejos hay que llevar la
        deducción. Todos se resuelven sin adivinar.
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

      {primeraVez && (
        <div className="again">
          <button onClick={() => setPaso("reglas")}>Volver a las reglas</button>
        </div>
      )}
    </Modal>
  );
}
