import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yachay Ayacucho — Prototipo Navbar + Hero",
  description: "Prototipo aislado de NavegacionPrincipal y HeroInicio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
