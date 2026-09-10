"use client";

/**
 * ComunidadYResenas — envoltorio de <CommunityReviews> para este prototipo.
 *
 * El componente de `components/community/CommunityReviews.tsx` es autónomo:
 * trae su propio estilo, sus reseñas de ejemplo y sus avatares embebidos como
 * `data:` URI, así que no hay archivos que copiar ni hosts que declarar.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props como el resto de secciones. El componente
 *   pinta su paleta con la variante `dark:`, atada a la clase `.dark` en
 *   `app/globals.css`, así que este envoltorio solo tiene que aplicarla.
 * - Datos: sin props usa `DEFAULT_DATA` (seis reseñas y un 4.8 global). Cuando
 *   tengas las reseñas reales, pásalas por `reviews` y `globalRating`; los
 *   avatares de marcador de posición se sustituyen por `avatarUrl`.
 */

import CommunityReviews from "@/components/community/CommunityReviews";
import type { Tema } from "./tema";

interface ComunidadYResenasProps {
  tema: Tema;
}

export function ComunidadYResenas({ tema }: ComunidadYResenasProps) {
  return (
    <div id="comunidad" className={tema === "oscuro" ? "dark" : undefined}>
      <CommunityReviews />
    </div>
  );
}

export default ComunidadYResenas;
