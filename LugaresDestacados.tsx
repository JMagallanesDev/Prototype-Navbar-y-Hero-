"use client";

/**
 * LugaresDestacados — envoltorio de <FeaturedPlaces> para este prototipo.
 *
 * El componente de `components/places/FeaturedPlaces.tsx` se copió tal cual:
 * es autónomo, trae su propio estilo y sus propios lugares de ejemplo
 * (`DEFAULT_PLACES`). Aquí solo se le traduce el tema y se le dan las fotos.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. FeaturedPlaces
 *   pinta su paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Datos: los textos salen de `DEFAULT_PLACES`; lo único que se reemplaza es
 *   la foto (ver `LUGARES` más abajo). Cuando tengas los lugares reales,
 *   pásalos enteros por `places` y borra ese mapeo.
 * - Acciones: `onSeeAll` y `onToggleFavorite` están sin conectar a propósito.
 *   Ahí enganchas la navegación a /lugares y el guardado de favoritos.
 */

import { useMemo } from "react";
import FeaturedPlaces, {
  DEFAULT_PLACES,
  type Place,
} from "@/components/places/FeaturedPlaces";
import {
  type Tema,
  BANDA_GRADIENTE_TITULAR,
  BANDA_GRADIENTE_TITULAR_CLARO,
  COLOR_ACENTO,
  COLOR_ACENTO_FUERTE,
} from "./tema";

interface LugaresDestacadosProps {
  tema: Tema;
}

export function LugaresDestacados({ tema }: LugaresDestacadosProps) {
  const oscuro = tema === "oscuro";

  /**
   * Mismos lugares de ejemplo, pero con las fotos servidas desde
   * `public/places/`. Las URLs de Wikimedia que trae el componente por defecto
   * funcionan sueltas, pero al pedir las siete a la vez —que es lo que pasa en
   * cada carga— Wikimedia devuelve 429 en algunas y esas tarjetas salen vacías.
   * Las copias locales son las mismas fotos, en el mismo orden.
   */
  const lugares = useMemo<Place[]>(
    () =>
      DEFAULT_PLACES.map((lugar, i) => ({
        ...lugar,
        imageUrl: `/places/${i + 1}.jpg`,
      })),
    [],
  );

  // `.dark` es lo que activa la paleta oscura del componente. El fondo lo pone
  // él mismo (crema en claro, casi negro en oscuro), así que aquí no se toca.
  //
  // El barrido del título sí tiene que llegar por props: se dibuja en JS y no
  // ve la clase `.dark`. Va la misma banda cálida que el titular del hero, y
  // el color final es el que el componente ya usa en cada tema.
  return (
    <div className={oscuro ? "dark" : undefined}>
      <FeaturedPlaces
        places={lugares}
        titleSweepColors={oscuro ? BANDA_GRADIENTE_TITULAR : BANDA_GRADIENTE_TITULAR_CLARO}
        titleColor={oscuro ? "#FFFFFF" : "#111111"}
        // Acento de la cabecera: filetes y botón "Ver todos". Es el mismo
        // dorado de los filetes de Festividades y del botón primario del hero,
        // para que las tres piezas se lean como una sola. Sobre blanco el
        // acento normal se lava, así que en tema claro tira del tono fuerte.
        accentColor={oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE}
      />
    </div>
  );
}

export default LugaresDestacados;
