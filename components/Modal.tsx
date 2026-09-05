"use client";

import { useEffect, useRef } from "react";

const FOCUSABLES = "button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])";

interface Props {
  open: boolean;
  onClose: () => void;
  /** id del elemento que da nombre al diálogo */
  labelledBy: string;
  /** id del texto que lo describe: sin esto el lector sólo anuncia el título */
  describedBy?: string;
  /** Un modal de arranque no se puede cerrar sin elegir. */
  dismissible?: boolean;
  children: React.ReactNode;
}

export default function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  dismissible = true,
  children,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    focoPrevio.current = document.activeElement as HTMLElement | null;
    sheetRef.current?.querySelector<HTMLElement>(FOCUSABLES)?.focus();

    // Devolver el foco a donde estaba, si ese elemento sigue en la página
    return () => {
      const prev = focoPrevio.current;
      if (prev && document.contains(prev)) prev.focus();
    };
  }, [open]);

  /* Con el modal abierto el foco se queda adentro: si no, se tabula al tablero
     de atrás y el lector de pantalla recorre una página que no se puede usar. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const f = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLES);
      if (!f?.length) return;
      const primero = f[0];
      const ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" ref={sheetRef}>
        {children}
      </div>
    </div>
  );
}
