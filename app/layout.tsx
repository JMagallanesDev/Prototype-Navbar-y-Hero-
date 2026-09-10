import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Tipografía del sistema.
 *
 * Las dos son fuentes variables, así que NO se les pasa `weight`: se descarga
 * un solo archivo con todo el rango de pesos y se piden con `font-bold`,
 * `font-light`, etc. desde las clases.
 *
 * `variable` publica cada familia como una variable CSS en <html>, y
 * `app/globals.css` las mapea a los tokens de Tailwind (`font-display` y
 * `font-sans`). Ese es el único punto donde hay que tocar si algún día se
 * cambian las familias.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Yachay Ayacucho — Prototipo Navbar + Hero",
  description: "Prototipo aislado de NavegacionPrincipal y HeroInicio.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
