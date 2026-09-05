"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { N } from "./grid";
import { Engine, LEVELS, type Deduction, type Level } from "./engine";
import { pickCase, type Caso } from "./puzzles";
import { LIB } from "./library";
import {
  CROSS,
  EMPTY,
  PERSON,
  analyze,
  buildIndex,
  esVictoria,
  mensajeDeAviso,
  prohibidasPor,
  type Cambio,
  type Mark,
} from "./game";
import { bagKey, load, loadStats, save, statFor, type Stat } from "./storage";

const vacio = (): Mark[] => new Array(N * N).fill(EMPTY) as Mark[];

export interface Game {
  caso: Caso | null;
  marks: Mark[];
  level: Level;
  solved: boolean;
  revealed: boolean;
  elapsed: number;
  hint: string;
  aviso: string;
  flash: number[];
  stat: Stat;
  bad: Set<number>;
  deadCells: Set<number>;
  placed: number;
  roomCells: number[][];
  puedeDeshacer: boolean;
  nuevoCaso: (level: Level) => void;
  ciclar: (i: number, atras?: boolean) => void;
  pintar: (celdas: number[], modo: "tachar" | "borrar") => void;
  deshacer: () => void;
  pedirPista: () => void;
  rendirse: () => void;
  arrancarReloj: () => void;
}

export function useGame(): Game {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [level, setLevel] = useState<Level>("normal");
  /* Los handlers cierran sobre el estado de su render. Si dos llegan en el
     mismo tick (clics rápidos en Pista, o un arrastre), el segundo partiría del
     estado viejo y pisaría al primero. La ref siempre tiene lo último. */
  const [marks, setMarks] = useState<Mark[]>(vacio);
  const marksRef = useRef<Mark[]>(marks);
  const escribirMarks = useCallback((m: Mark[]) => {
    marksRef.current = m;
    setMarks(m);
  }, []);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState("");
  const [flash, setFlash] = useState<number[]>([]);
  const [stat, setStat] = useState<Stat>({ played: 0, won: 0, best: null });

  const historial = useRef<Cambio[][]>([]);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const inicio = useRef<number | null>(null);

  const index = useMemo(() => (caso ? buildIndex(caso.region) : null), [caso]);

  const analisis = useMemo(
    () =>
      index
        ? analyze(marks, index)
        : { bad: new Set<number>(), dead: [], deadCells: new Set<number>(), placed: 0 },
    [marks, index],
  );

  const aviso = solved || revealed ? "" : mensajeDeAviso(analisis);

  /* ---------- reloj ---------- */
  useEffect(() => {
    if (inicio.current === null || solved || revealed) return;
    const t = window.setInterval(() => {
      if (inicio.current !== null) setElapsed(Math.floor((Date.now() - inicio.current) / 1000));
    }, 500);
    return () => window.clearInterval(t);
  }, [solved, revealed, caso]);

  /* El destello de una pista dura un momento y se apaga solo. Vive acá y no en
     el tablero para que el componente no tenga que duplicar este estado. */
  const temporizador = useRef<number | null>(null);
  const destellar = useCallback((celdas: number[]) => {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    setFlash(celdas);
    temporizador.current = window.setTimeout(() => setFlash([]), 1100);
  }, []);
  useEffect(() => () => {
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
  }, []);

  const arrancarReloj = useCallback(() => {
    if (inicio.current === null) inicio.current = Date.now();
  }, []);

  /* ---------- caso nuevo ---------- */
  const nuevoCaso = useCallback((nivel: Level) => {
    const guardado = load<unknown>(bagKey(nivel), []);
    const r = pickCase(LIB[nivel] ?? LIB.normal, nivel, guardado);
    if (!r) return;
    save(bagKey(nivel), r.bag);
    save("nh-diff", nivel);

    const st = loadStats();
    const s = statFor(st, nivel);
    s.played++;
    st[nivel] = s;
    save("nh-stats", st);

    historial.current = [];
    inicio.current = null;
    setPuedeDeshacer(false);
    setCaso(r.caso);
    setLevel(nivel);
    escribirMarks(vacio());
    setSolved(false);
    setRevealed(false);
    setElapsed(0);
    setHint("");
    setFlash([]);
    setStat(s);
  }, [escribirMarks]);

  /* ---------- aplicar cambios ---------- */
  const aplicar = useCallback(
    (cambios: Cambio[], next: Mark[]) => {
      if (!cambios.length) return;
      historial.current.push(cambios);
      setPuedeDeshacer(true);
      escribirMarks(next);

      // La victoria es consecuencia de esta jugada, no un estado a vigilar
      if (caso && !solved && !revealed && esVictoria(next, caso)) {
        const segundos =
          inicio.current === null ? 0 : Math.floor((Date.now() - inicio.current) / 1000);
        setElapsed(segundos);
        setSolved(true);
        const st = loadStats();
        const s = statFor(st, caso.level);
        s.won++;
        if (s.best === null || segundos < s.best) s.best = segundos;
        st[caso.level] = s;
        save("nh-stats", st);
        setStat(s);
      }
    },
    [escribirMarks, caso, solved, revealed],
  );

  const ciclar = useCallback(
    (i: number, atras = false) => {
      if (!caso || !index || solved || revealed) return;
      arrancarReloj();
      const orden: Mark[] = [EMPTY, CROSS, PERSON];
      const actuales = marksRef.current;
      const actual = orden.indexOf(actuales[i]);
      const siguiente = orden[(actual + (atras ? 2 : 1)) % 3];

      const next = actuales.slice();
      const cambios: Cambio[] = [{ i, prev: actuales[i] }];
      next[i] = siguiente;
      if (siguiente === PERSON) {
        for (const x of prohibidasPor(i, index, caso.region)) {
          if (next[x] === EMPTY) {
            cambios.push({ i: x, prev: next[x] });
            next[x] = CROSS;
          }
        }
      }
      setHint("");
      aplicar(cambios, next);
    },
    [caso, index, solved, revealed, aplicar, arrancarReloj],
  );

  /** Pintado por arrastre: nunca pisa a una persona ya ubicada. */
  const pintar = useCallback(
    (celdas: number[], modo: "tachar" | "borrar") => {
      if (solved || revealed) return;
      arrancarReloj();
      const destino: Mark = modo === "borrar" ? EMPTY : CROSS;
      const next = marksRef.current.slice();
      const cambios: Cambio[] = [];
      for (const i of celdas) {
        if (next[i] === PERSON || next[i] === destino) continue;
        cambios.push({ i, prev: next[i] });
        next[i] = destino;
      }
      setHint("");
      aplicar(cambios, next);
    },
    [solved, revealed, aplicar, arrancarReloj],
  );

  const deshacer = useCallback(() => {
    if (solved || revealed) return;
    const lote = historial.current.pop();
    if (!lote) return;
    const next = marksRef.current.slice();
    for (let k = lote.length - 1; k >= 0; k--) next[lote[k].i] = lote[k].prev;
    setPuedeDeshacer(historial.current.length > 0);
    setHint("");
    escribirMarks(next);
  }, [solved, revealed, escribirMarks]);

  /* ---------- pistas ---------- */
  const pedirPista = useCallback(() => {
    if (!caso || solved || revealed) return;
    arrancarReloj();

    const actuales = marksRef.current;
    const puestas: number[] = [];
    for (let i = 0; i < N * N; i++) if (actuales[i] === PERSON) puestas.push(i);
    const sol = new Set(caso.stars);
    const mal = puestas.filter((i) => !sol.has(i));
    if (mal.length) {
      setHint("Hay una persona mal ubicada. Sacala y volvé a pedir la pista.");
      destellar(mal);
      return;
    }

    const e = new Engine(caso.region, puestas);
    let paso: Deduction | null = null;
    let guard = 0;
    while (guard++ < 400) {
      paso = e.step(LEVELS.dificil);
      if (!paso) break;
      const nuevo =
        paso.kind === "single"
          ? actuales[paso.cells[0]] !== PERSON
          : paso.cells.some((i) => actuales[i] === EMPTY);
      if (nuevo) break;
    }
    if (!paso) {
      setHint("No encuentro nada nuevo que deducir con lo que hay marcado. Probá completar las casillas descartadas.");
      return;
    }

    const next = actuales.slice();
    const cambios: Cambio[] = [];
    if (paso.kind === "single" && index) {
      const i = paso.cells[0];
      cambios.push({ i, prev: next[i] });
      next[i] = PERSON;
      for (const x of prohibidasPor(i, index, caso.region)) {
        if (next[x] === EMPTY) {
          cambios.push({ i: x, prev: next[x] });
          next[x] = CROSS;
        }
      }
    } else {
      for (const i of paso.cells) {
        if (next[i] === EMPTY) {
          cambios.push({ i, prev: next[i] });
          next[i] = CROSS;
        }
      }
    }
    setHint(paso.text);
    destellar(paso.cells);
    aplicar(cambios, next);
  }, [caso, index, solved, revealed, aplicar, arrancarReloj, destellar]);

  const rendirse = useCallback(() => {
    if (!caso || solved) return;
    const next = vacio();
    for (const i of caso.stars) next[i] = PERSON;
    escribirMarks(next);
    setRevealed(true);
    setHint("");
  }, [caso, solved, escribirMarks]);

  return {
    caso,
    marks,
    level,
    solved,
    revealed,
    elapsed,
    hint,
    aviso,
    flash,
    stat,
    bad: analisis.bad,
    deadCells: analisis.deadCells,
    placed: analisis.placed,
    roomCells: index?.roomCells ?? [],
    puedeDeshacer,
    nuevoCaso,
    ciclar,
    pintar,
    deshacer,
    pedirPista,
    rendirse,
    arrancarReloj,
  };
}
