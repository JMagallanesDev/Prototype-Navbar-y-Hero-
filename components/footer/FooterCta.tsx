/**
 * FooterCta — banner CTA final + footer de Yachay Ayacucho.
 *
 * Autónomo: trae su propio estilo (utilidades Tailwind con valores literales,
 * sin tokens del proyecto), sus textos de ejemplo y su propio mapa punteado de las provincias de
 * Ayacucho (datos en `provincias-ayacucho.ts`, sin fetch), generado
 * como SVG y servido en un `data:` URI, así que renderiza sin backend, sin
 * ficheros en `public/` y sin declarar hosts en next.config.
 *
 * Estructura: la tarjeta CTA flota sobre el borde superior de un bloque de
 * footer con degradado dorado profundo (ver "MECANISMO DEL SOLAPE").
 *
 * No necesita 'use client': todo es estático. La paleta oscura se pinta con la
 * variante `dark:`, atada a la clase `.dark` (ver app/globals.css).
 */

import type { ComponentType } from "react";
import Image from "next/image";
import { ArrowRight, Facebook, Instagram, Landmark, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { z } from "zod";
import { normalizarNombreProvincia } from "@/lib/provincias";
import { PROVINCIAS_AYACUCHO, type LonLat } from "./provincias-ayacucho";

/* ------------------------------------------------------------------ esquemas */

export const FooterLinkSchema = z.object({ label: z.string(), href: z.string() });

export const FooterColumnSchema = z.object({
  title: z.string(),
  links: z.array(FooterLinkSchema),
});

export const SocialSchema = z.object({
  platform: z.enum(["facebook", "instagram", "x", "youtube"]),
  href: z.string(),
});

export const FooterCtaSchema = z.object({
  ctaTitle: z.string(),
  ctaSubtitle: z.string(),
  ctaLabel: z.string(),
  globeImageUrl: z.string().url(),
  brandName: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  socials: z.array(SocialSchema),
  columns: z.array(FooterColumnSchema),
  copyright: z.string(),
});

export type FooterLink = z.infer<typeof FooterLinkSchema>;
export type FooterColumn = z.infer<typeof FooterColumnSchema>;
export type Social = z.infer<typeof SocialSchema>;
export type FooterCtaData = z.infer<typeof FooterCtaSchema>;

export type FooterCtaProps = Partial<FooterCtaData> & { className?: string };

/* ------------------------------------------------------------ mapa Ayacucho */

type Punto = readonly [number, number];
type Anillo = readonly Punto[];

/** Punto dentro de un polígono con huecos: regla par-impar sobre TODOS sus anillos. */
function dentro(anillos: readonly Anillo[], x: number, y: number): boolean {
  let hit = false;
  for (const poly of anillos) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}

/** Distancia del punto al borde más cercano (cualquier anillo). */
function distanciaAlBorde(anillos: readonly Anillo[], x: number, y: number): number {
  let min = Infinity;
  for (const poly of anillos) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, ay] = poly[j]!;
      const [bx, by] = poly[i]!;
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
      min = Math.min(min, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
    }
  }
  return min;
}

/**
 * Mapa punteado del departamento de Ayacucho dividido en sus 11 provincias.
 *
 * Técnica de siempre: cada punto es un subtrazo de longitud cero (`M x y h0`)
 * con `stroke-linecap="round"`, y los puntos de un mismo nivel de opacidad van
 * en un único <path>. Las coordenadas se redondean a enteros: en un viewBox de
 * ~1000 unidades pintado a ~380 px, una unidad es un tercio de píxel.
 */
function construirMapaAyacucho(): string {
  /* ── PARÁMETROS AJUSTABLES ─────────────────────────────────────────────── */
  const alto = 1000; // alto del mapa en unidades del viewBox (el ancho sale solo)
  const margen = 26; // aire para el resplandor: pequeño, para que el mapa llene la caja
  const paso = 14; // densidad: separación entre puntos (menor = malla más densa)
  const grosor = 5.2; // diámetro de cada punto
  const colorPuntos = "#F0A93E";
  const colorFronteras = "#FFD28C"; // un punto más claro que los puntos
  const grosorFrontera = 2.6; // divisiones entre provincias
  const grosorBordeExterior = 9; // se ve la mitad exterior: ~4,5 unidades
  const escala = 1; // tamaño del mapa dentro del viewBox (>1 exige más margen)
  const desplazamiento: Punto = [0, 0]; // posición del mapa dentro del viewBox
  const escalaPin = 1.25; // pin normal
  const escalaPinPrincipal = 1.9; // pin con halo
  const provinciaConHalo = "HUAMANGA"; // NOMBPROV que lleva el pin grande
  /* ──────────────────────────────────────────────────────────────────────── */

  // PROYECCIÓN: equirectangular local. Un grado de longitud mide cos(lat)
  // veces un grado de latitud, así que con x ∝ lon·cos(latMedia) e y ∝ −lat
  // el departamento conserva su forma. La caja de las 11 provincias se escala
  // a `alto` unidades y se desplaza al origen.
  const todos = PROVINCIAS_AYACUCHO.flatMap((p) => p.anillos[0]!);
  const minLon = Math.min(...todos.map(([lon]) => lon));
  const maxLon = Math.max(...todos.map(([lon]) => lon));
  const minLat = Math.min(...todos.map(([, lat]) => lat));
  const maxLat = Math.max(...todos.map(([, lat]) => lat));
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const unidad = alto / (maxLat - minLat);
  const ancho = (maxLon - minLon) * k * unidad;
  const proyectar = ([lon, lat]: LonLat): Punto => [(lon - minLon) * k * unidad, (maxLat - lat) * unidad];

  // Cada provincia guarda su caja envolvente: descarta de un vistazo casi
  // todas las pruebas de punto-en-polígono, que son las que cuestan.
  const provincias = PROVINCIAS_AYACUCHO.map((p) => {
    const anillos = p.anillos.map((anillo) => anillo.map(proyectar));
    const ext = anillos[0]!;
    return {
      provincia: p.provincia,
      anillos,
      x0: Math.min(...ext.map(([x]) => x)),
      x1: Math.max(...ext.map(([x]) => x)),
      y0: Math.min(...ext.map(([, y]) => y)),
      y1: Math.max(...ext.map(([, y]) => y)),
    };
  });

  // RELLENO: rejilla al tresbolillo sobre la caja completa. Cada punto se
  // prueba contra las provincias y se queda en la primera que lo contiene; si
  // cae a menos de `holgura` de su frontera se descarta, lo que abre un pasillo
  // fino a lo largo de cada división y las hace legibles sin engordar la línea.
  //
  // ILUMINACIÓN: igual en todas las provincias, luz desde arriba a la derecha
  // en 5 niveles de opacidad. El ruido es un hash entero (no Math.sin) para dar
  // exactamente el mismo resultado en servidor y en cualquier navegador.
  const holgura = paso * 0.32;
  const cubos: string[][] = [[], [], [], [], []];
  let fila = 0;
  for (let y = paso / 2; y < alto; y += paso * 0.866, fila++) {
    for (let x = fila % 2 ? paso : paso / 2; x < ancho; x += paso) {
      const prov = provincias.find((p) => x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1 && dentro(p.anillos, x, y));
      if (!prov || distanciaAlBorde(prov.anillos, x, y) < holgura) continue;
      const xi = Math.round(x);
      const yi = Math.round(y);
      const ruido = ((((xi * 73856093) ^ (yi * 19349663)) >>> 0) % 1000) / 1000 - 0.5;
      const luz = 0.18 + 0.82 * (0.55 * (x / ancho) + 0.45 * (1 - y / alto)) + ruido * 0.2;
      cubos[Math.max(0, Math.min(4, Math.floor(luz * 5)))]!.push(`M${xi} ${yi}h0`);
    }
  }
  const opacidades = [0.16, 0.3, 0.5, 0.72, 1];
  const puntos = cubos
    .map((d, i) =>
      d.length
        ? `<path d="${d.join("")}" stroke="${colorPuntos}" stroke-width="${grosor}" stroke-linecap="round" fill="none" opacity="${opacidades[i]}"/>`
        : "",
    )
    .join("");

  // FRONTERAS: cada provincia es un subtrazo cerrado por anillo. `todas` junta
  // las 11 en un solo `d`, que sirve a la vez para las divisiones (trazo fino
  // encima de los puntos) y como forma del departamento.
  const aD = (anillos: readonly Anillo[]) =>
    anillos.map((a) => `M${a.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join("L")}Z`).join("");
  const todas = provincias.map((p) => aD(p.anillos)).join("");

  // PINES: el centroide no sirve en provincias cóncavas (puede caer fuera),
  // así que se busca el "polo de inaccesibilidad": el punto interior más
  // alejado de la frontera, muestreando una rejilla dentro de la provincia.
  // La punta de la gota se baja un poco para que el CUERPO quede centrado ahí.
  const pines = provincias
    .map((p) => {
      const { x0, x1, y0, y1 } = p;
      const muestra = Math.max(4, Math.min(x1 - x0, y1 - y0) / 16);
      let mejor: Punto = [(x0 + x1) / 2, (y0 + y1) / 2];
      let mejorDist = -1;
      for (let y = y0; y <= y1; y += muestra) {
        for (let x = x0; x <= x1; x += muestra) {
          if (!dentro(p.anillos, x, y)) continue;
          const d = distanciaAlBorde(p.anillos, x, y);
          if (d > mejorDist) [mejor, mejorDist] = [[x, y], d];
        }
      }
      const principal = p.provincia === provinciaConHalo;
      const s = principal ? escalaPinPrincipal : escalaPin;
      const [px, py] = [Math.round(mejor[0]), Math.round(mejor[1] + 12 * s)];
      const halo = principal ? `<circle cx="${px}" cy="${py - 19 * s}" r="${Math.round(48 * s)}" fill="url(#halo)"/>` : "";
      // El principal se pinta al final para quedar encima de sus vecinos.
      return {
        principal,
        svg: `${halo}<g transform="translate(${px} ${py}) scale(${s})" filter="url(#brillo)"><path d="M0 0C-3-8-10-13-10-19A10 10 0 1 1 10-19C10-13 3-8 0 0Z" fill="#FFC46B"/><circle cx="0" cy="-19" r="4" fill="#20160A"/></g>`,
      };
    })
    .sort((a, b) => Number(a.principal) - Number(b.principal))
    .map((p) => p.svg)
    .join("");

  const w = Math.ceil(ancho);
  const vb = `${-margen} ${-margen} ${w + margen * 2} ${alto + margen * 2}`;
  const [dx, dy] = desplazamiento;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w + margen * 2}" height="${alto + margen * 2}">` +
    `<defs>` +
    `<linearGradient id="borde" gradientUnits="userSpaceOnUse" x1="${w}" y1="0" x2="0" y2="${alto}"><stop offset="0" stop-color="#FFC46B"/><stop offset="0.45" stop-color="#E0A04A" stop-opacity="0.75"/><stop offset="1" stop-color="#9A6418" stop-opacity="0.45"/></linearGradient>` +
    `<radialGradient id="halo"><stop offset="0" stop-color="#FFB347" stop-opacity="0.6"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient>` +
    `<filter id="brillo" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<filter id="resplandor" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="12"/></filter>` +
    // Máscara que solo deja ver lo que queda FUERA del departamento: un trazo
    // grueso de todas las provincias, pasado por ella, conserva únicamente la
    // mitad exterior del borde. Las fronteras internas quedan tapadas por las
    // provincias de ambos lados, así que no hace falta disolver la geometría.
    `<mask id="fuera" maskUnits="userSpaceOnUse" x="${-margen}" y="${-margen}" width="${w + margen * 2}" height="${alto + margen * 2}"><rect x="${-margen}" y="${-margen}" width="${w + margen * 2}" height="${alto + margen * 2}" fill="#fff"/><path d="${todas}" fill="#000" fill-rule="evenodd"/></mask>` +
    `</defs>` +
    `<g transform="translate(${w / 2 + dx} ${alto / 2 + dy}) scale(${escala}) translate(${-w / 2} ${-alto / 2})">` +
    // RESPLANDOR alrededor del departamento.
    `<path d="${todas}" fill="${colorPuntos}" fill-rule="evenodd" opacity="0.07" filter="url(#resplandor)"/>` +
    `<path d="${todas}" fill="none" stroke="url(#borde)" stroke-width="${grosorBordeExterior * 1.6}" stroke-linejoin="round" mask="url(#fuera)" filter="url(#resplandor)" opacity="0.6"/>` +
    puntos +
    // Divisiones entre provincias, finas y más claras que los puntos.
    `<path d="${todas}" fill="none" stroke="${colorFronteras}" stroke-width="${grosorFrontera}" stroke-linejoin="round" opacity="0.7"/>` +
    // Borde exterior del departamento, más marcado.
    `<path d="${todas}" fill="none" stroke="url(#borde)" stroke-width="${grosorBordeExterior}" stroke-linejoin="round" mask="url(#fuera)"/>` +
    pines +
    `</g></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MAPA_POR_DEFECTO = construirMapaAyacucho();

/** Nombres de las provincias ya normalizados, en el orden del GeoJSON. */
export const PROVINCIAS_NOMBRES = PROVINCIAS_AYACUCHO.map((p) => normalizarNombreProvincia(p.provincia));

/* ------------------------------------------------------------------- defaults */

export const DEFAULT_FOOTER: FooterCtaData = {
  ctaTitle: "Descubre Ayacucho, lleva su historia contigo",
  ctaSubtitle: "Más de 30 lugares patrimoniales en la palma de tu mano",
  ctaLabel: "Explorar ahora",
  globeImageUrl: MAPA_POR_DEFECTO,
  brandName: "Yachay Ayacucho",
  address: "Huamanga, Ayacucho, Perú",
  phone: "+51 966 123 456",
  email: "hola@yachayayacucho.pe",
  socials: [
    { platform: "facebook", href: "#" },
    { platform: "instagram", href: "#" },
    { platform: "x", href: "#" },
    { platform: "youtube", href: "#" },
  ],
  columns: [
    {
      title: "Enlaces rápidos",
      links: [
        { label: "Lugares", href: "#" },
        { label: "Mapa 3D", href: "#" },
        { label: "Agenda", href: "#" },
        { label: "Negocios", href: "#" },
        { label: "Reportar", href: "#" },
      ],
    },
    {
      title: "Comunidad",
      links: [
        { label: "Reseñas", href: "#" },
        { label: "Pasaporte", href: "#" },
        { label: "Insignias", href: "#" },
        { label: "Registrarse", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Términos de servicio", href: "#" },
        { label: "Política de privacidad", href: "#" },
        { label: "Cookies", href: "#" },
      ],
    },
  ],
  copyright: "© 2026 Yachay Ayacucho. Todos los derechos reservados.",
};

/* -------------------------------------------------------------------- iconos */

// lucide 0.475 no trae el logotipo de X (solo el pájaro de Twitter), así que
// este va como glifo suelto para que la fila de redes case con la referencia.
function IconoX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const ICONO_SOCIAL: Record<Social["platform"], ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  x: IconoX,
  youtube: Youtube,
};

const NOMBRE_SOCIAL: Record<Social["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
};

/* ---------------------------------------------------------------- componente */

const CONTENEDOR = "mx-auto w-full max-w-[1560px] px-5 sm:px-8 lg:px-16";

/*
 * Contraste sobre el dorado, calculado contra el PEOR punto de cada degradado
 * (WCAG AA pide 4,5:1 para texto normal):
 *
 * Claro: #D9A85A → #C48E44, con la sombra de la esquina inferior derecha como
 * peor caso para texto oscuro. Marca y títulos #1A1106: 5,5:1. Texto, enlaces
 * y copyright #24170A: 5,2:1.
 *
 * Oscuro: un bronce lo bastante profundo para integrarse en la página negra
 * deja el texto oscuro por debajo de 3:1, así que ahí el texto pasa a crema.
 * #684520 → #3A250F, con el brillo de la esquina superior izquierda como peor
 * caso. Marca #FFF1DB: 6,6:1; títulos #FFE2B0: 6,0:1; texto y enlaces al
 * 85 %: 5,4:1; copyright al 80 %: 5,0:1.
 */
const ENLACE =
  "inline-flex min-h-11 items-center text-[15px] text-[#24170A] underline-offset-4 transition-colors hover:text-[#0D0802] hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1106] lg:min-h-0 lg:py-1 dark:text-[#FFF1DB]/85 dark:hover:text-white dark:focus-visible:outline-[#FFF1DB]";

const TEXTO_SECUNDARIO = "text-[#24170A] dark:text-[#FFF1DB]/85";

export function FooterCta({
  className,
  ctaTitle,
  ctaSubtitle,
  ctaLabel,
  globeImageUrl,
  brandName,
  address,
  phone,
  email,
  socials,
  columns,
  copyright,
}: FooterCtaProps = {}) {
  const data = FooterCtaSchema.parse({
    ctaTitle: ctaTitle ?? DEFAULT_FOOTER.ctaTitle,
    ctaSubtitle: ctaSubtitle ?? DEFAULT_FOOTER.ctaSubtitle,
    ctaLabel: ctaLabel ?? DEFAULT_FOOTER.ctaLabel,
    globeImageUrl: globeImageUrl ?? DEFAULT_FOOTER.globeImageUrl,
    brandName: brandName ?? DEFAULT_FOOTER.brandName,
    address: address ?? DEFAULT_FOOTER.address,
    phone: phone ?? DEFAULT_FOOTER.phone,
    email: email ?? DEFAULT_FOOTER.email,
    socials: socials ?? DEFAULT_FOOTER.socials,
    columns: columns ?? DEFAULT_FOOTER.columns,
    copyright: copyright ?? DEFAULT_FOOTER.copyright,
  });

  // La referencia parte el titular justo en la coma, y la segunda línea es más
  // larga que la primera: no sale de un ajuste natural, hay que forzarlo.
  const lineasTitulo = data.ctaTitle.split(/,\s+/);

  return (
    /*
     * MECANISMO DEL SOLAPE
     * La tarjeta CTA y el bloque dorado son hermanos en flujo normal:
     *   1. El envoltorio de la tarjeta lleva un margin-bottom NEGATIVO
     *      (`-mb-*`): el bloque dorado sube y arranca a media tarjeta, POR
     *      DETRÁS de ella.
     *   2. El bloque dorado lleva un padding-top = ese mismo solape + el aire
     *      que va encima de las columnas, así la mitad inferior de la tarjeta
     *      nunca tapa su contenido.
     *   3. `relative z-10` en la tarjeta y `relative z-0` en el dorado: la
     *      tarjeta se pinta encima aunque el bloque venga después en el DOM.
     * El solape crece con el ancho. En escritorio es la mitad exacta de la
     * tarjeta (392 px de alto), como en la referencia; en tablet un tercio y
     * en móvil un cuarto, para no alargar de más una pantalla ya estrecha:
     *   móvil 5rem · sm 6rem · md 7rem · lg 12,25rem
     * y el aire que se suma encima de las columnas va de 3,5rem a 5rem.
     */
    <footer className={`w-full bg-[#faf8f5] pt-14 md:pt-16 dark:bg-[#0e0d0c] ${className ?? ""}`}>
      {/* ---------------------------------------------------- tarjeta CTA --- */}
      <div className={`${CONTENEDOR} relative z-10 -mb-20 sm:-mb-24 md:-mb-28 lg:-mb-[12.25rem]`}>
        <section
          aria-labelledby="cta-final"
          // En claro la tarjeta cae de crema a marrón cálido hacia la derecha:
          // el mapa necesita un fondo oscuro del que salir. En móvil el texto
          // llega casi al borde derecho, así que el tramo oscuro se aprieta
          // contra ese borde para que el final del subtítulo no caiga en él.
          // La sombra es más
          // profunda que antes: es lo que hace que la tarjeta "flote".
          className="relative isolate overflow-hidden rounded-[26px] border border-black/[0.06] bg-[linear-gradient(102deg,#FFFDF9_0%,#FFF8EC_55%,#EBD3A8_80%,#A97C3A_93%,#4E361A_100%)] md:bg-[linear-gradient(102deg,#FFFDF9_0%,#FFF8EC_30%,#EBD3A8_48%,#A97C3A_64%,#4E361A_80%,#241804_100%)] p-7 shadow-[0_2px_4px_rgba(0,0,0,0.05),0_30px_70px_-28px_rgba(60,36,6,0.55)] sm:p-12 lg:rounded-[30px] lg:p-16 dark:border-white/[0.08] dark:bg-[linear-gradient(100deg,#0F0D0A_0%,#141009_45%,#1E1409_100%)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_34px_80px_-26px_rgba(0,0,0,0.85)]"
        >
          {/* Mapa de Ayacucho. Es alto y estrecho y debe verse ENTERO: la caja
              ocupa casi todo el alto de la tarjeta y `object-contain` lo
              encaja sin deformarlo. El margen del propio SVG ya deja sitio al
              resplandor, así que la caja apenas se separa del borde. En móvil
              se va al fondo, a la derecha y atenuado tras el velo. */}
          <div className="pointer-events-none absolute inset-y-2 right-[-6%] -z-10 w-[72%] opacity-30 md:inset-y-2 md:right-[3%] md:w-[42%] md:opacity-100 lg:inset-y-2 lg:right-[5%] lg:w-[36%]">
            <Image
              src={data.globeImageUrl}
              alt={`Mapa del departamento de Ayacucho con sus 11 provincias: ${PROVINCIAS_NOMBRES.join(", ")}`}
              fill
              sizes="(min-width: 1024px) 36vw, (min-width: 768px) 42vw, 72vw"
              className="object-contain"
            />
          </div>

          {/* Velo desde la izquierda: mantiene el texto legible sobre el mapa. */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9]/85 via-70% to-transparent md:w-3/5 md:via-50% dark:from-[#0F0D0A] dark:via-[#0F0D0A]/85"
          />

          <h2
            id="cta-final"
            className="text-[26px] leading-[1.14] font-bold tracking-tight text-[#111111] min-[375px]:text-[28px] sm:text-4xl lg:text-[44px] dark:text-white"
          >
            {lineasTitulo.map((linea, i) => (
              <span key={linea} className="block">
                {linea}
                {i < lineasTitulo.length - 1 ? "," : ""}
              </span>
            ))}
          </h2>

          <p className="mt-4 max-w-[27ch] text-[15px] leading-[1.55] text-[#4A423B] sm:mt-5 sm:text-base lg:text-[19px] dark:text-white/55">
            {data.ctaSubtitle}
          </p>

          <a
            href="#"
            aria-label={`${data.ctaLabel}: ${data.ctaTitle}`}
            // En móvil el botón va a ancho completo; desde sm se ajusta al texto.
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#E7A94F] px-7 py-3.5 text-[15px] font-bold text-[#1A1206] transition-colors hover:bg-[#F2B968] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9660F] sm:mt-8 sm:w-auto dark:focus-visible:outline-[#E7A94F]"
          >
            {data.ctaLabel}
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.25} />
          </a>
        </section>
      </div>

      {/* ---------------------------------------------------- bloque dorado --- */}
      {/*
        DEGRADADO DORADO PROFUNDO: tres capas en un solo `background`.
          - Brillo radial suave arriba a la izquierda: da volumen sin abrir una
            zona clara bajo el texto.
          - Sombra radial abajo a la derecha: hunde la esquina.
          - Base diagonal. Claro: oro viejo → bronce cálido. Oscuro: bronce →
            ámbar quemado, bastante más profundo para convivir con la página
            negra.
        Esquinas superiores redondeadas: rematan el bloque bajo la tarjeta.
      */}
      <div className="relative z-0 w-full rounded-t-[28px] bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,226,160,0.22)_0%,rgba(255,226,160,0)_55%),radial-gradient(90%_90%_at_100%_100%,rgba(70,40,8,0.12)_0%,rgba(70,40,8,0)_60%),linear-gradient(135deg,#D9A85A_0%,#CF9C50_45%,#C48E44_100%)] pt-[8.5rem] pb-[calc(1.75rem+env(safe-area-inset-bottom))] sm:pt-[10rem] md:pt-[11rem] lg:rounded-t-[40px] lg:pt-[17.25rem] dark:bg-[radial-gradient(120%_80%_at_0%_0%,rgba(255,200,120,0.06)_0%,rgba(255,200,120,0)_55%),radial-gradient(90%_90%_at_100%_100%,rgba(20,10,0,0.35)_0%,rgba(20,10,0,0)_60%),linear-gradient(135deg,#684520_0%,#523617_50%,#3A250F_100%)]">
        {/* pt = solape + aire: 5+3,5 · 6+4 · 7+4 · 12,25+5 (rem). */}
        <div className={CONTENEDOR}>
          {/* ----------------------------------------------------- columnas --- */}
          {/* Móvil: marca a ancho completo y las tres listas en dos columnas.
              Tablet: rejilla de 2×2. Escritorio: cuatro columnas. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:gap-x-12 md:gap-y-12 lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:gap-8">
            <div className="col-span-2 min-w-0 md:col-span-1">
              <div className="flex items-center gap-3.5">
                <Landmark
                  aria-hidden="true"
                  size={36}
                  strokeWidth={1.5}
                  className="shrink-0 text-[#1A1106] dark:text-[#FFE2B0]"
                />
                <p className="text-[24px] font-bold tracking-tight text-[#1A1106] sm:text-[26px] dark:text-[#FFF1DB]">
                  {data.brandName}
                </p>
              </div>

              <p className={`mt-4 flex items-center gap-2.5 text-[15px] ${TEXTO_SECUNDARIO}`}>
                <MapPin aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
                {data.address}
              </p>

              <h3 className="mt-7 text-[15px] font-bold text-[#1A1106] dark:text-[#FFF1DB]">Contacto</h3>
              <p className={`mt-3 flex items-center gap-2.5 text-[15px] ${TEXTO_SECUNDARIO}`}>
                <Phone aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
                {data.phone}
              </p>
              <p className={`mt-2.5 flex min-w-0 items-center gap-2.5 text-[15px] ${TEXTO_SECUNDARIO}`}>
                <Mail aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
                <span className="min-w-0 break-words">{data.email}</span>
              </p>

              {/* Redes: círculos de 44 px con velo oscuro translúcido; se leen
                  hundidos en el dorado y dan un área táctil cómoda. */}
              <ul className="mt-6 flex flex-wrap items-center gap-3">
                {data.socials.map((social) => {
                  const Icono = ICONO_SOCIAL[social.platform];
                  return (
                    <li key={social.platform}>
                      <a
                        href={social.href}
                        aria-label={NOMBRE_SOCIAL[social.platform]}
                        className="grid size-11 place-items-center rounded-full bg-[#1A1106]/10 text-[#1A1106] ring-1 ring-[#1A1106]/15 transition-colors hover:bg-[#1A1106] hover:text-[#E7B866] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1106] dark:bg-[#FFF1DB]/10 dark:text-[#FFF1DB] dark:ring-[#FFF1DB]/15 dark:hover:bg-[#FFF1DB] dark:hover:text-[#3A250F] dark:focus-visible:outline-[#FFF1DB]"
                      >
                        <Icono className="size-5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {data.columns.map((columna) => {
              const id = `col-${columna.title.replace(/\s+/g, "-").toLowerCase()}`;
              return (
                <nav key={columna.title} aria-labelledby={id} className="min-w-0">
                  <h3
                    id={id}
                    className="text-[12px] font-bold tracking-[0.14em] text-[#24170A] uppercase dark:text-[#FFE2B0]"
                  >
                    {columna.title}
                  </h3>
                  {/* En móvil cada enlace mide 44 px de alto (área táctil), así
                      que no necesita espaciado extra; desde lg recupera el
                      ritmo compacto del escritorio. */}
                  <ul className="mt-2 lg:mt-5 lg:space-y-2.5">
                    {columna.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} className={ENLACE}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              );
            })}
          </div>

          {/* Divisor y copyright en oscuro translúcido (crema en tema oscuro). */}
          <div className="mt-12 border-t border-[#1A1106]/20 pt-6 lg:mt-16 dark:border-[#FFF1DB]/15">
            <p className="text-center text-[13px] text-[#24170A] dark:text-[#FFF1DB]/80">{data.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterCta;
