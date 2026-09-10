"use client";

/**
 * DemoInicio — SOLO para probar NavegacionPrincipal + HeroInicio en aislado.
 * No lo copies a tu proyecto real: allí, tú vas a montar ambos componentes
 * en tu propia página conectando `tema` a next-themes/Zustand.
 */

import { useState } from "react";
import { NavegacionPrincipal } from "./NavegacionPrincipal";
import { HeroInicio } from "./HeroInicio";
import { FestividadesAyacucho } from "./FestividadesAyacucho";
import { LugaresDestacados } from "./LugaresDestacados";
import { ClimaYRecomendaciones } from "./ClimaYRecomendaciones";
import { MapaTresD } from "./MapaTresD";
import { PasaporteCultural } from "./PasaporteCultural";
import { ComunidadYResenas } from "./ComunidadYResenas";
import { PieYLlamada } from "./PieYLlamada";
import type { Tema } from "./tema";

export default function DemoInicio() {
  const [tema, setTema] = useState<Tema>("oscuro");
  const alternarTema = () => setTema((t) => (t === "oscuro" ? "claro" : "oscuro"));

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${tema === "oscuro" ? "bg-neutral-950" : "bg-white"}`}>
      <NavegacionPrincipal tema={tema} alternarTema={alternarTema} />
      {/* Los espacios del nombre van codificados como %20 a propósito: así la
          ruta es válida tal cual, sin depender de que el navegador la arregle. */}
      <HeroInicio
        tema={tema}
        imagenDia="/imagenes/IMAGEN%20DE%20DIA.png"
        imagenNoche="/imagenes/IMAGEN%20DE%20NOCHE.png"
      />

      <FestividadesAyacucho tema={tema} />

      <LugaresDestacados tema={tema} />

      <ClimaYRecomendaciones tema={tema} />

      <MapaTresD tema={tema} />

      <PasaporteCultural tema={tema} />

      <ComunidadYResenas tema={tema} />

      <PieYLlamada tema={tema} />
    </div>
  );
}
