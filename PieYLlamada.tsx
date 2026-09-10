"use client";

/**
 * PieYLlamada — envoltorio de <FooterCta> para este prototipo.
 *
 * El componente de `components/footer/FooterCta.tsx` es autónomo: trae su
 * propio estilo, sus textos de ejemplo y genera el globo como SVG en un
 * `data:` URI, así que no hay imágenes que copiar ni hosts que declarar.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. El componente
 *   pinta su paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Datos: sin props usa `DEFAULT_FOOTER`. Cuando tengas las rutas reales,
 *   pasa `columns` y `socials` con sus `href` y sustituye `globeImageUrl`.
 * - Enlaces: todos son maqueta (`href="#"`). Ahí engancharás la navegación.
 */

import FooterCta from "@/components/footer/FooterCta";
import type { Tema } from "./tema";

interface PieYLlamadaProps {
  tema: Tema;
}

export function PieYLlamada({ tema }: PieYLlamadaProps) {
  return (
    <div className={tema === "oscuro" ? "dark" : undefined}>
      <FooterCta />
    </div>
  );
}

export default PieYLlamada;
