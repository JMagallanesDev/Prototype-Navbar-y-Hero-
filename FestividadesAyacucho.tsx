"use client";

/**
 * FestividadesAyacucho — carrusel de las principales festividades y
 * conmemoraciones de Ayacucho.
 *
 * Es el envoltorio de dominio de <PlaceGallery>: aquí viven los datos de las
 * festividades y la conexión con el resto del prototipo. La galería y el
 * carrusel (`components/places/PlaceGallery.tsx`, `components/ui/carousel.tsx`)
 * se copiaron tal cual del componente original, sin tocar una línea.
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props, igual que NavegacionPrincipal y HeroInicio.
 *   El carrusel pinta su paleta con la variante `dark:`, así que este
 *   envoltorio traduce el tema a la clase `.dark` sobre su propia sección
 *   (la variante está atada a esa clase en `app/globals.css`).
 * - Traducciones: el copy vive en `mensajes/es.json` bajo las claves
 *   `Gallery.*` y `Festividades.*`. Aquí se inyecta con un
 *   <NextIntlClientProvider> local porque el prototipo todavía no tiene i18n
 *   montada; en tu app real ese provider ya existe en el layout y este
 *   componente solo tiene que borrarlo y quedarse con <Galeria />.
 * - Imágenes: están en `public/festividades/`. En producción, cámbialas por
 *   las URLs de Cloudinary — la galería acepta ambas formas.
 */

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { MapPin, CalendarDays } from "lucide-react";

import { PlaceGallery, type GalleryImage } from "@/components/places/PlaceGallery";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { FileteOrnamental } from "@/components/ui/filete-ornamental";
import { TypingAnimation } from "@/components/ui/typing-animation";
import {
  type Tema,
  BANDA_GRADIENTE_TITULAR,
  BANDA_GRADIENTE_TITULAR_CLARO,
  COLOR_TITULAR_LINEA_1,
  COLOR_TITULAR_LINEA_1_CLARO,
  COLOR_ACENTO,
  COLOR_ACENTO_FUERTE,
} from "./tema";
import es from "@/mensajes/es.json";

interface FestividadesAyacuchoProps {
  tema: Tema;
}

/**
 * Iconos de los datos de cada festividad. La galería los resuelve por clave,
 * así que basta con que coincidan con el campo `icon` de `datos()`.
 */
const ICONOS = {
  ubicacion: <MapPin />,
  fechas: <CalendarDays />,
};

/* Las dos etiquetas son comunes; solo cambian los valores de cada festividad. */
const datos = (clave: string) => [
  {
    icon: "ubicacion",
    labelKey: "Festividades.ubicacionLabel",
    valueKey: `Festividades.${clave}.ubicacion`,
  },
  {
    icon: "fechas",
    labelKey: "Festividades.fechasLabel",
    valueKey: `Festividades.${clave}.fechas`,
  },
];

/**
 * Orden cronológico dentro del año. Reordenar la galería es mover una línea:
 * la clave viaja con la festividad, no con su posición.
 *
 * `foco` solo hace falta cuando la foto no comparte proporción con el marco:
 * la de Todos los Santos es cuadrada y el recorte centrado se comía el gorro.
 */
const FESTIVIDADES = [
  { clave: "carnaval", archivo: "carnaval.png" }, // febrero / marzo
  { clave: "semanaSanta", archivo: "semana-santa.png" }, // marzo / abril
  { clave: "fiestaCruces", archivo: "fiesta-cruces.png" }, // 3 de mayo
  { clave: "yakuRaymi", archivo: "yaku-raymi.png" }, // 24 y 25 de agosto
  { clave: "todosLosSantos", archivo: "todos-los-santos.png", foco: "top" }, // 1 y 2 de noviembre
  { clave: "batallaAyacucho", archivo: "batalla-ayacucho.png" }, // 9 de diciembre
];

const IMAGENES: GalleryImage[] = FESTIVIDADES.map(({ clave, archivo, foco }) => {
  const src = `/festividades/${archivo}`;
  return {
    url: src,
    thumbnailUrl: src,
    objectPosition: foco,
    altKey: `Festividades.${clave}.alt`,
    titleKey: `Festividades.${clave}.titulo`,
    bodyKey: `Festividades.${clave}.texto`,
    facts: datos(clave),
  };
});

/**
 * Cabecera de la sección. Centrada y flanqueada por los dos filetes, con el
 * mismo par de animaciones que <LugaresDestacados>: barrido de
 * <DiaTextReveal> en el título y tecleado de <TypingAnimation> en el párrafo,
 * los dos disparados al entrar en pantalla.
 */
function Cabecera({ oscuro }: { oscuro: boolean }) {
  const t = useTranslations("Festividades");
  // Sobre blanco el dorado de marca se lava; el ornamento tira del tono fuerte.
  const colorFilete = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;
  const quieto = useReducedMotion() ?? false;

  /**
   * Apertura de la ventana del titular. Se vigila desde el <h2> porque el
   * recorte va por dentro y no queremos que un elemento a medio abrir decida
   * si está o no en pantalla.
   */
  const refTitulo = useRef<HTMLHeadingElement>(null);
  const tituloEnVista = useInView(refTitulo, { once: true, amount: 0.6 });
  const abierto = quieto || tituloEnVista;

  return (
    <header className="mb-10 md:mb-12">
      <div className="flex items-center justify-center gap-5 sm:gap-6">
        <FileteOrnamental color={colorFilete} invertido quieto={quieto} />

        {/* `whitespace-nowrap` solo a partir de `sm`: "Festividades de Ayacucho"
            son 24 caracteres y a 320 px de ancho no entran en una línea. Por
            encima de eso cabe de sobra y nunca llega a partirse.

            El `pb` deja sitio a la panza de la "y": el texto se pinta con
            `background-clip: text` y sin ese respiro el descendente se corta. */}
        <h2
          ref={refTitulo}
          className="text-center text-[26px] font-bold leading-[1.08] tracking-[-0.02em] sm:shrink-0 sm:text-[34px] sm:whitespace-nowrap lg:text-[42px]"
        >
          {/* El título se abre desde el centro hacia los dos lados. Va con
              `clip-path` y no con una escala: escalando, las letras entrarían
              deformadas y estirándose; recortando, cada letra aparece ya a su
              tamaño final y lo que se mueve es la ventana que las descubre.

              El recorte va en el PROPIO <DiaTextReveal>, no en un envoltorio
              que lo contenga, y por transición CSS en vez de por `motion`. Las
              dos cosas son a propósito:

              · Envuelto, el componente quedaba dentro de un ancestro recortado
                a cero de ancho y su detector de "entró en pantalla" no se
                disparaba nunca. Como el texto se pinta con un degradado que
                arranca fuera del cuadro y solo entra con el barrido, el
                titular se quedaba permanentemente invisible. Recortando el
                elemento en sí, el detector sigue viendo su caja intacta.
              · Y el recorte no puede ir por `motion` porque el componente no
                acepta `style` ni `animate` desde fuera: se pisarían con los
                suyos, que son los que pintan el degradado. Por eso viaja como
                clase, que es lo único que sí acepta. */}
          <DiaTextReveal
            text={t("titulo")}
            colors={oscuro ? BANDA_GRADIENTE_TITULAR : BANDA_GRADIENTE_TITULAR_CLARO}
            textColor={oscuro ? COLOR_TITULAR_LINEA_1 : COLOR_TITULAR_LINEA_1_CLARO}
            duration={1.7}
            delay={0.15}
            once
            className={`block pb-[0.16em] transition-[clip-path] duration-850 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              abierto ? "[clip-path:inset(0%_0%_0%_0%)]" : "[clip-path:inset(0%_50%_0%_50%)]"
            }`}
          />
        </h2>

        <FileteOrnamental color={colorFilete} quieto={quieto} />
      </div>

      {/* Lo que se centra es la CAJA (`mx-auto w-fit`), no el texto: con
          `text-center` el tecleado crecería hacia los dos lados a la vez y la
          frase se vería deslizar. Dentro va alineado a la izquierda, así que
          se escribe de izquierda a derecha y, al caber en una línea, el
          resultado final queda centrado igual. */}
      <TypingAnimation
        as="p"
        typeSpeed={19}
        delay={600}
        reserveSpace
        hideCursorOnFinish
        className="mx-auto mt-3 w-fit max-w-full text-[14px] leading-snug text-[#8B8B8B] sm:text-[15px] dark:text-[#8F8F8F]"
      >
        {t("subtitulo")}
      </TypingAnimation>
    </header>
  );
}

function Galeria({ oscuro }: { oscuro: boolean }) {
  const t = useTranslations("Festividades");

  return (
    <div className="w-full">
      <Cabecera oscuro={oscuro} />
      {/* Sin `priority`: en esta página el LCP es la foto del hero, no la galería.
          El radio va por token para que la foto tome esquinas de 1rem sin tocar
          las miniaturas, que traen el suyo propio más cerrado. El título de
          cada festividad hereda el dorado de `--gallery-accent`. */}
      <PlaceGallery
        images={IMAGENES}
        placeName={t("titulo")}
        icons={ICONOS}
        aspectRatio="7 / 5"
        className="[--carousel-radius:1rem]"
      />
    </div>
  );
}

export function FestividadesAyacucho({ tema }: FestividadesAyacuchoProps) {
  const oscuro = tema === "oscuro";

  return (
    <NextIntlClientProvider locale="es" messages={es} timeZone="America/Lima">
      <section
        id="festividades"
        // `.dark` es lo que activa la paleta oscura del carrusel; el resto de
        // clases solo alinean la sección con el fondo del prototipo.
        className={
          oscuro
            ? "dark bg-[#0e0d0c] text-neutral-100"
            : "bg-[#faf8f5] text-neutral-900"
        }
      >
        {/* En móvil el bloque se ancla arriba: con `items-center`, cualquier
            cambio de alto del texto recoloca todo y la foto da un salto. */}
        <div className="mx-auto flex w-full max-w-7xl items-start px-4 py-16 sm:px-6 md:items-center md:py-24 lg:px-8">
          <Galeria oscuro={oscuro} />
        </div>
      </section>
    </NextIntlClientProvider>
  );
}

export default FestividadesAyacucho;
