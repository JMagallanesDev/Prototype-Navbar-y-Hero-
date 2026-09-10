"use client";

/**
 * MapaTresD — envoltorio de <MapHero> para este prototipo.
 *
 * El componente de `components/map/MapHero.tsx` se copió tal cual: es autónomo,
 * trae su propio estilo, sus textos y la captura del mapa. Aquí solo se le
 * traduce el tema y se le da sitio en la página.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. MapHero pinta su
 *   paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Ancla: la sección lleva `id="mapa-3d"`, que es justo a donde apunta el
 *   botón "Explorar mapa 3D" del hero. Hasta ahora ese enlace no tenía destino.
 * - Textos e imagen: viven en `DEFAULT_DATA` dentro del componente. Se pueden
 *   sobreescribir uno a uno por props (`title`, `subtitle`, `backgroundUrl`…);
 *   si le pasas una imagen remota, declara su host en `next.config.mjs`.
 * - Acción: `onExplore` está sin conectar a propósito. Ahí engancharás la
 *   apertura del mapa real.
 */

import MapHero from "@/components/map/MapHero";
import type { Tema } from "./tema";

interface MapaTresDProps {
  tema: Tema;
}

export function MapaTresD({ tema }: MapaTresDProps) {
  const oscuro = tema === "oscuro";

  return (
    <section
      id="mapa-3d"
      // `.dark` activa la paleta oscura del componente; el fondo lo pone esta
      // sección y es el mismo de la página, para que la tarjeta del mapa flote
      // sobre un lienzo continuo en vez de sobre una banda de otro tono.
      className={oscuro ? "dark bg-[#0e0d0c]" : "bg-[#faf8f5]"}
    >
      {/* `max-w-6xl` y no `7xl`: la captura está pensada para verse a unos
          1100 px, que es el ancho que declara su propio `sizes`. Más ancha, la
          tarjeta se estira y el mapa se recorta de más. */}
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {/* Sin `priority`: en esta página el LCP es la foto del hero. */}
        <MapHero />
      </div>
    </section>
  );
}

export default MapaTresD;
