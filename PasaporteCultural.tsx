"use client";

/**
 * PasaporteCultural — envoltorio de <CulturalPassport> para este prototipo.
 *
 * El componente de `components/passport/CulturalPassport.tsx` se copió tal cual:
 * es autónomo, trae su propio estilo, sus textos y hasta sus imágenes, que son
 * SVG embebidos como `data:` URI (el pasaporte abierto y las tres medallas), así
 * que no hay archivos que copiar ni hosts que declarar.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. El componente
 *   pinta su paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Datos: sin props usa su contenido de ejemplo (3 de 25 lugares y tres
 *   insignias, dos desbloqueadas). Todo es sobreescribible uno a uno —
 *   `visitedCount`, `totalCount`, `badges`…— cuando tengas el progreso real
 *   del usuario.
 * - Acción: `onStart` está sin conectar a propósito. Ahí engancharás el alta
 *   del pasaporte.
 */

import CulturalPassport from "@/components/passport/CulturalPassport";
import type { Tema } from "./tema";

interface PasaporteCulturalProps {
  tema: Tema;
}

export function PasaporteCultural({ tema }: PasaporteCulturalProps) {
  const oscuro = tema === "oscuro";

  return (
    <section
      id="pasaporte"
      // `.dark` activa la paleta oscura del componente. El fondo lo pone esta
      // sección y es el mismo de la página, para que la tarjeta del pasaporte
      // se recorte sobre un lienzo continuo y no sobre una banda de otro tono.
      className={oscuro ? "dark bg-[#0e0d0c]" : "bg-[#faf8f5]"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <CulturalPassport />
      </div>
    </section>
  );
}

export default PasaporteCultural;
