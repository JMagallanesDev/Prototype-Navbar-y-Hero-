"use client";

/**
 * ClimaYRecomendaciones — envoltorio de <WeatherRecommendations>.
 *
 * El componente de `components/weather/WeatherRecommendations.tsx` es autónomo:
 * trae su propio estilo, sus propios datos de ejemplo y su SVG del sol. Aquí
 * solo se le traduce el tema y se le da la paleta de la cabecera.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. El componente
 *   pinta su paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Datos: sin props, cae en `SAMPLE_WEATHER` y `SAMPLE_RECOMMENDATIONS`, que
 *   están quemados en el componente. Cuando conectes la API del clima, pásale
 *   `weather` y `recommendations` — los dos van validados con Zod.
 * - Acciones: `onRefresh` y `onSelectRecommendation` están sin conectar a
 *   propósito. Ahí enganchas el refresco real y la navegación al lugar.
 */

import WeatherRecommendations from "@/components/weather/WeatherRecommendations";
import {
  type Tema,
  BANDA_GRADIENTE_TITULAR,
  BANDA_GRADIENTE_TITULAR_CLARO,
  COLOR_ACENTO,
  COLOR_ACENTO_FUERTE,
} from "./tema";

interface ClimaYRecomendacionesProps {
  tema: Tema;
}

export function ClimaYRecomendaciones({ tema }: ClimaYRecomendacionesProps) {
  const oscuro = tema === "oscuro";

  // `.dark` es lo que activa la paleta oscura del componente. El fondo lo pone
  // él mismo (crema en claro, casi negro en oscuro), así que aquí no se toca.
  //
  // La paleta de la cabecera sí tiene que llegar por props: barrido y filetes
  // se dibujan en JS y no ven la clase. Van los mismos valores que en las otras
  // dos secciones; el color final del título es el que el propio componente usa
  // en cada tema (#17150f en claro, blanco en oscuro).
  return (
    <div className={oscuro ? "dark" : undefined}>
      <WeatherRecommendations
        titleSweepColors={oscuro ? BANDA_GRADIENTE_TITULAR : BANDA_GRADIENTE_TITULAR_CLARO}
        titleColor={oscuro ? "#FFFFFF" : "#17150f"}
        accentColor={oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE}
      />
    </div>
  );
}

export default ClimaYRecomendaciones;
