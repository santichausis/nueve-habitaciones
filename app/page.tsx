"use client";

import { useEffect, useState } from "react";
import Board from "@/components/Board";
import SuspectList from "@/components/SuspectList";
import StartModal from "@/components/StartModal";
import VerdictModal from "@/components/VerdictModal";
import { LEVEL_LABEL, NIVELES, type Level } from "@/lib/engine";
import { PERSON, fmtTime } from "@/lib/game";
import { ROOMS, VICTIMA } from "@/lib/rooms";
import { loadLevel } from "@/lib/storage";
import { useGame } from "@/lib/useGame";

/** Al resolver, las fichas se encienden en secuencia antes de contar la historia. */
const ESPERA_VICTORIA = 1100;

export default function Page() {
  const g = useGame();
  const [inicioAbierto, setInicioAbierto] = useState(true);
  const [verdictoDescartado, setVerdictoDescartado] = useState(false);
  const [verdictoListo, setVerdictoListo] = useState(false);
  const [lit, setLit] = useState<number[]>([]);
  // null = seguir a la partida; true/false = el jugador lo abrió o cerró a mano
  const [casoAbierto, setCasoAbierto] = useState<boolean | null>(null);

  /* El nivel guardado sale de localStorage, que no existe durante el prerender:
     por eso el primer caso se carga al montar y no al construir el estado. */
  useEffect(() => {
    g.nuevoCaso(loadLevel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Al ganar, el modal espera a que termine la secuencia del tablero: si
     apareciera de inmediato taparía justo el momento que da la recompensa.
     Rendirse no tiene nada que celebrar, así que abre en el acto. */
  useEffect(() => {
    if (!g.solved) return;
    const t = window.setTimeout(() => setVerdictoListo(true), ESPERA_VICTORIA);
    return () => window.clearTimeout(t);
  }, [g.solved]);

  const verdictoAbierto =
    (verdictoListo || g.revealed) && !verdictoDescartado && !inicioAbierto;

  const empezar = (level: Level) => {
    g.nuevoCaso(level);
    setInicioAbierto(false);
    setVerdictoDescartado(false);
    setVerdictoListo(false);
    setCasoAbierto(null);
    setLit([]);
  };

  // La ambientación se pliega sola en cuanto empezás a jugar
  const caseOpen = casoAbierto ?? !g.jugo;

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
                <button key={n} type="button" aria-pressed={g.level === n} onClick={() => empezar(n)}>
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
          <div className="tablero-col">
            {g.caso && (
              <Board
                region={g.caso.region}
                marks={g.marks}
                bad={g.bad}
                deadCells={g.deadCells}
                flash={g.flash}
                lit={lit}
                hintUnit={g.hintUnit}
                cascada={g.cascada}
                celebrar={g.solved}
                bloqueado={g.solved || g.revealed}
                onCiclar={g.ciclar}
                onPintar={g.pintar}
              />
            )}
          </div>

          <div className="panel">
            {/* 1. Lo operativo primero: es lo que se mira en cada jugada */}
            <section className="block operativo" aria-labelledby="h-progreso">
              <h2 id="h-progreso" className="sr-only">
                Progreso
              </h2>

              <div className="status">
                <span className="big">
                  <span className="sr-only">Personas ubicadas: </span>
                  {g.placed}/9
                </span>
                <span className="chip">{LEVEL_LABEL[g.level]}</span>
                <span className="reloj" aria-label={`Tiempo: ${fmtTime(g.elapsed)}`}>
                  {fmtTime(g.elapsed)}
                </span>
              </div>

              {/* Un punto por habitación: el avance se ve de un vistazo */}
              <ol className="avance" aria-hidden="true">
                {ROOMS.map((room, gi) => {
                  const puesta = g.roomCells[gi]?.some((i) => g.marks[i] === PERSON);
                  return (
                    <li
                      key={room.name}
                      className={puesta ? "ok" : undefined}
                      style={{ "--h": `var(--h${gi + 1})`, "--dl": `var(--dl${gi + 1})` } as React.CSSProperties}
                      title={room.name}
                    />
                  );
                })}
              </ol>

              <div className="tools">
                <button className="action ghost" type="button" onClick={g.pedirPista}>
                  Pista
                </button>
                <button
                  className="action ghost"
                  type="button"
                  onClick={g.deshacer}
                  disabled={!g.puedeDeshacer}
                  title={g.puedeDeshacer ? "Deshacer la última jugada" : "Todavía no hay nada que deshacer"}
                >
                  Deshacer
                </button>
                <button className="action ghost" type="button" onClick={g.rendirse}>
                  Rendirse
                </button>
              </div>

              {/* La altura se anima en vez de saltar y empujar lo de abajo */}
              <div className="msg" data-abierto={g.aviso ? "" : undefined}>
                <div className="msg-in">
                  <p className="alert" role="status" aria-live="polite">
                    {g.aviso}
                  </p>
                </div>
              </div>
              <div className="msg" data-abierto={g.hint ? "" : undefined}>
                <div className="msg-in">
                  <p className="hintbox" role="status" aria-live="polite">
                    {g.hint}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. La lista que más se consulta, entera sobre el pliegue */}
            <section className="block destacado" aria-labelledby="h-sospechosos">
              <h2 id="h-sospechosos" className="fuerte">
                Sospechosos
              </h2>
              {g.caso && (
                <SuspectList
                  marks={g.marks}
                  roomCells={g.roomCells}
                  guilty={g.solved || g.revealed ? g.caso.guilty : null}
                  onResaltar={setLit}
                />
              )}
            </section>

            {/* 3. Ambientación: se lee una vez y se pliega sola */}
            <details
              className="block caso"
              open={caseOpen}
              onToggle={(e) => setCasoAbierto(e.currentTarget.open)}
            >
              <summary>
                <h2>El caso</h2>
              </summary>
              <p>
                Anoche mataron a <b>{VICTIMA}</b> en esta casa. Las nueve personas que estaban
                adentro se repartieron una por habitación, cuidando de no quedar pegadas entre sí.
                Sólo una falló en eso, y esa es la asesina: ubicá a las nueve y el caso se cierra
                solo.
              </p>
            </details>

            {/* 4. Referencia: se consulta al principio y casi nunca después */}
            <details className="block ref">
              <summary>
                <h2>Reglas y controles</h2>
              </summary>
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
              <p className="legend">
                Clic para descartar una casilla (✕), otro clic para ubicar a la persona, otro para
                limpiar. Clic derecho va al revés. <b>Arrastrá sin soltar para tachar varias de
                una</b>; si arrancás sobre una ✕, el arrastre borra. Con el teclado: flechas para
                moverte, <kbd>espacio</kbd> para ubicar, <kbd>x</kbd> para descartar.
              </p>
            </details>

            {/* 5. Récord: interesa entre partidas, no durante */}
            <section className="block record" aria-labelledby="h-record">
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

      <StartModal open={inicioAbierto} onElegir={empezar} onClose={() => setInicioAbierto(false)} />

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
