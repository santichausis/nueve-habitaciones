/**
 * Punto de entrada del build de un solo archivo (el Artifact).
 *
 * Monta exactamente el mismo componente que usa Next: no hay una segunda
 * versión del juego, sólo un envoltorio distinto.
 */
import { createRoot } from "react-dom/client";
import Page from "@/app/page";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Page />);
