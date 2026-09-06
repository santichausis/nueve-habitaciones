import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nueve Habitaciones",
  description:
    "Puzzle de deducción lógica: ubicá a nueve sospechosos, uno por fila, columna y habitación, sin que se toquen, y descubrí al asesino.",
  icons: {
    icon:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="4" fill="#191D19"/><circle cx="11" cy="11" r="4" fill="#C8A03C"/><circle cx="22" cy="21" r="4" fill="#8E2B2B"/></svg>`,
      ),
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
