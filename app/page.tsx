"use client";

import { useEffect, useState } from "react";
import Board from "@/components/Board";
import SuspectList from "@/components/SuspectList";
import StartModal from "@/components/StartModal";
import VerdictModal from "@/components/VerdictModal";
import { LEVEL_LABEL, NIVELES, type Level } from "@/lib/engine";
import { fmtTime } from "@/lib/game";
import { VICTIMA } from "@/lib/rooms";
import { loadLevel } from "@/lib/storage";
import { useGame } from "@/lib/useGame";

export default function Page() {
  const g = useGame();
  const [inicioAbierto, setInicioAbierto] = useState(true);
  // El veredicto no es un estado que sincronizar: se deduce de la partida.
  const [verdictoDescartado, setVerdictoDescartado] = useState(false);
  const [lit, setLit] = useState<number[]>([]);

  /* El nivel guardado sale de localStorage, que no existe durante el prerender:
     por eso el primer caso se carga al montar y no al construir el estado. */
  useEffect(() => {
    g.nuevoCaso(loadLevel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verdictoAbierto = (g.solved || g.revealed) && !verdictoDescartado && !inicioAbierto;

  const empezar = (level: Level) => {
    g.nuevoCaso(level);
    setInicioAbierto(false);
    setVerdictoDescartado(false);
    setLit([]);
  };

  return (
    <>
      <a className="skip" href="#tablero">
        Saltar al tablero
      </a>

      <div className="wrap">
        <header className="masthead">
          <div className="brand">
            <span className="tagline">Un caso de lógica pura</span>
            <h1>Nueve Habitaciones</h1>
          </div>
          <div className="setup">
            <div className="seg" role="group" aria-label="Dificultad">
              {NIVELES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={g.level === n}
                  onClick={() => empezar(n)}
                >
                  {LEVEL_LABEL[n]}
                </button>
              ))}
            </div>
            <button className="action" type="button" onClick={() => empezar(g.level)}>
              Caso nuevo
            </button>
          </div>
        </header>

        <div className="stage">
          <div>
            {g.caso && (
              <Board
                region={g.caso.region}
                marks={g.marks}
                bad={g.bad}
                deadCells={g.deadCells}
                flash={g.flash}
                lit={lit}
                bloqueado={g.solved || g.revealed}
                onCiclar={g.ciclar}
                onPintar={g.pintar}
              />
            )}
          </div>

          <div className="panel">
            <section className="block case" aria-labelledby="h-caso">
              <h2 id="h-caso">El caso</h2>
              <p>
                Anoche mataron a <b>{VICTIMA}</b> en esta casa. Las nueve personas que estaban
                adentro se repartieron una por habitación, cuidando de no quedar pegadas entre sí.
                Sólo una falló en eso, y esa es la asesina: ubicá a las nueve y el caso se cierra
                solo.
              </p>
            </section>

            <section className="block" aria-labelledby="h-progreso">
              <h2 id="h-progreso" className="sr-only">
                Progreso
              </h2>
              <div className="status">
                <span className="big">
                  <span className="sr-only">Personas ubicadas: </span>
                  {g.placed}/9
                </span>
                <span aria-label={`Tiempo: ${fmtTime(g.elapsed)}`}>{fmtTime(g.elapsed)}</span>
              </div>
              <div className="tools">
                <button className="action ghost" type="button" onClick={g.pedirPista}>
                  Pista
                </button>
                <button
                  className="action ghost"
                  type="button"
                  onClick={g.deshacer}
                  disabled={!g.puedeDeshacer}
                >
                  Deshacer
                </button>
                <button className="action ghost" type="button" onClick={g.rendirse}>
                  Rendirse
                </button>
              </div>
              <div className="alert" role="status" aria-live="polite">
                {g.aviso}
              </div>
              <div className="hintbox" role="status" aria-live="polite">
                {g.hint}
              </div>
            </section>

            <section className="block" aria-labelledby="h-sospechosos">
              <h2 id="h-sospechosos">Sospechosos</h2>
              {g.caso && (
                <SuspectList
                  marks={g.marks}
                  roomCells={g.roomCells}
                  guilty={g.solved || g.revealed ? g.caso.guilty : null}
                  onResaltar={setLit}
                />
              )}
            </section>

            <section className="block" aria-labelledby="h-reglas">
              <h2 id="h-reglas">Reglas</h2>
              <ul className="rules">
                <li>
                  <span aria-hidden="true">01</span>Hay exactamente una persona por fila.
                </li>
                <li>
                  <span aria-hidden="true">02</span>Hay exactamente una persona por columna.
                </li>
                <li>
                  <span aria-hidden="true">03</span>Hay exactamente una persona en cada habitación.
                </li>
                <li>
                  <span aria-hidden="true">04</span>Nadie puede estar en una casilla que toque a
                  otra persona, ni siquiera en diagonal.
                </li>
              </ul>
            </section>

            <section className="block" aria-labelledby="h-como">
              <h2 id="h-como">Cómo se juega</h2>
              <p className="legend">
                Clic para descartar una casilla (✕), otro clic para ubicar a la persona, otro para
                limpiar. Clic derecho va al revés. <b>Arrastrá sin soltar para tachar varias de
                una</b>; si arrancás sobre una ✕, el arrastre borra. Con el teclado: flechas para
                moverte, <kbd>espacio</kbd> para ubicar, <kbd>x</kbd> para descartar.
              </p>
            </section>

            <section className="block" aria-labelledby="h-record">
              <h2 id="h-record">Tu récord en {LEVEL_LABEL[g.level]}</h2>
              <div className="stats">
                <div>
                  <b>{g.stat.played}</b>
                  <i>casos</i>
                </div>
                <div>
                  <b>{g.stat.won}</b>
                  <i>resueltos</i>
                </div>
                <div>
                  <b>{g.stat.best === null ? "—" : fmtTime(g.stat.best)}</b>
                  <i>mejor</i>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer>
          Cada caso está verificado: la solución es única y se llega a ella sólo por deducción,
          nunca adivinando.
        </footer>
      </div>

      <StartModal
        open={inicioAbierto}
        onElegir={empezar}
        onClose={() => setInicioAbierto(false)}
      />

      {g.caso && (
        <VerdictModal
          open={verdictoAbierto}
          caso={g.caso}
          gano={g.solved}
          elapsed={g.elapsed}
          level={g.level}
          onClose={() => setVerdictoDescartado(true)}
          onOtroCaso={empezar}
        />
      )}
    </>
  );
}
