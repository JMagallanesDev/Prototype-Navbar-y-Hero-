"use client";

/**
 * DemoInicio — SOLO para probar NavegacionPrincipal + HeroInicio en aislado.
 * No lo copies a tu proyecto real: allí, tú vas a montar ambos componentes
 * en tu propia página conectando `tema` a next-themes/Zustand.
 */

import { useState } from "react";
import { NavegacionPrincipal } from "./NavegacionPrincipal";
import { HeroInicio } from "./HeroInicio";
import type { Tema } from "./tema";

export default function DemoInicio() {
  const [tema, setTema] = useState<Tema>("oscuro");
  const alternarTema = () => setTema((t) => (t === "oscuro" ? "claro" : "oscuro"));

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${tema === "oscuro" ? "bg-neutral-950" : "bg-white"}`}>
      <NavegacionPrincipal tema={tema} alternarTema={alternarTema} />
      <HeroInicio tema={tema} imagenDia="/imagenes/plaza-de-armas-dia.png" imagenNoche="/imagenes/plaza-de-armas-noche.png" />

      {/* Contenido de ejemplo SOLO de esta demo, para poder probar el
          navbar volviéndose sólido al hacer scroll. */}
      <section
        className={`flex min-h-[60svh] items-center justify-center px-4 text-center ${
          tema === "oscuro" ? "bg-neutral-950 text-white/60" : "bg-white text-neutral-500"
        }`}
      >
        <p className="max-w-md text-sm">
          Contenido de ejemplo de esta demo. Sube el scroll para ver el navbar volverse sólido, y usa el
          interruptor de tema en la barra superior para alternar entre día y noche.
        </p>
      </section>
    </div>
  );
}
