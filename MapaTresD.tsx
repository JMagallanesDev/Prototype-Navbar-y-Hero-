"use client";

/**
 * MapaTresD — envoltorio de <MapHero> para este prototipo.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. MapHero pinta su
 *   paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Ancla: la sección de MapHero lleva `id="mapa-3d"`, que es a donde apunta el
 *   botón "Explorar mapa 3D" del hero.
 * - Acciones: `onExplore` y `onSelectProvince` están sin conectar a propósito.
 *   Ahí engancharás la apertura del mapa 3D completo.
 */

import MapHero from "@/components/map/MapHero";
import type { Tema } from "./tema";

interface MapaTresDProps {
  tema: Tema;
}

export function MapaTresD({ tema }: MapaTresDProps) {
  return (
    <div className={tema === "oscuro" ? "dark" : undefined}>
      <MapHero />
    </div>
  );
}

export default MapaTresD;
