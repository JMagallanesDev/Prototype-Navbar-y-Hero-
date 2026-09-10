/**
 * FooterCta — banner CTA final + footer de Yachay Ayacucho.
 *
 * Autónomo: trae su propio estilo (utilidades Tailwind con valores literales,
 * sin tokens del proyecto), sus textos de ejemplo y su propio globo, generado
 * como SVG y servido en un `data:` URI, así que renderiza sin backend, sin
 * ficheros en `public/` y sin declarar hosts en next.config.
 *
 * No necesita 'use client': todo es estático. La paleta oscura se pinta con la
 * variante `dark:`, atada a la clase `.dark` (ver app/globals.css).
 */

import type { ComponentType } from "react";
import Image from "next/image";
import { ArrowRight, Facebook, Instagram, Landmark, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { z } from "zod";

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

/* --------------------------------------------------------------------- globo */

const RAD = Math.PI / 180;

// Contornos gruesos en (lon, lat). No buscan precisión cartográfica: a la
// resolución de puntos del globo solo tiene que leerse la silueta de América.
const TIERRA: readonly (readonly (readonly [number, number])[])[] = [
  // Norteamérica
  [
    [-168, 66], [-162, 58], [-153, 57], [-147, 60], [-138, 59], [-132, 53],
    [-125, 49], [-124, 42], [-121, 35], [-117, 32], [-114, 28], [-110, 23],
    [-106, 20], [-102, 17], [-97, 16], [-95, 19], [-91, 19], [-87, 21],
    [-90, 23], [-93, 26], [-97, 26], [-94, 29], [-89, 30], [-85, 30],
    [-83, 28], [-81, 25], [-81, 31], [-79, 33], [-76, 35], [-75, 38],
    [-72, 41], [-70, 43], [-67, 45], [-64, 45], [-60, 47], [-56, 50],
    [-55, 52], [-62, 55], [-64, 60], [-78, 63], [-80, 58], [-92, 57],
    [-94, 61], [-88, 64], [-82, 65], [-78, 68], [-85, 70], [-95, 73],
    [-105, 70], [-115, 70], [-125, 70], [-133, 69], [-141, 70], [-156, 71],
    [-165, 68],
  ],
  // Centroamérica
  [
    [-94, 16], [-92, 15], [-88, 16], [-88, 18], [-84, 16], [-83, 11],
    [-79, 9], [-77, 8], [-79, 7], [-83, 9], [-86, 11], [-90, 13], [-93, 15],
  ],
  // Sudamérica
  [
    [-79, 9], [-76, 11], [-71, 12], [-66, 11], [-62, 10], [-60, 8],
    [-55, 6], [-51, 4], [-50, 0], [-45, -1], [-38, -3], [-35, -6],
    [-37, -10], [-39, -14], [-41, -20], [-48, -25], [-52, -30], [-57, -34],
    [-62, -39], [-64, -42], [-66, -45], [-68, -50], [-70, -54], [-74, -52],
    [-73, -46], [-74, -40], [-72, -34], [-71, -25], [-70, -18], [-75, -14],
    [-79, -6], [-81, -4], [-80, 1], [-78, 6],
  ],
  // Groenlandia e Islandia
  [
    [-45, 60], [-42, 62], [-30, 68], [-22, 70], [-20, 74], [-25, 78],
    [-35, 82], [-50, 82], [-60, 78], [-62, 73], [-55, 68], [-50, 63],
  ],
  [[-24, 64], [-14, 64], [-14, 66], [-24, 66]],
  // Cuba y La Española
  [[-85, 22], [-77, 20], [-74, 20], [-77, 23], [-83, 23]],
  [[-74, 18], [-68, 18], [-68, 20], [-74, 20]],
  // Borde occidental de África e Iberia: asoman apagados en el limbo
  [
    [-17, 15], [-13, 22], [-5, 24], [5, 22], [14, 20], [14, 12], [10, 5],
    [3, 6], [-4, 5], [-8, 4], [-13, 9], [-17, 12],
  ],
  [[-10, 43], [-2, 44], [3, 43], [0, 40], [-6, 36], [-9, 37], [-9, 41]],
  // Península antártica
  [[-65, -63], [-57, -63], [-58, -70], [-68, -70]],
];

// Mares interiores que hay que vaciar para que la silueta se reconozca.
const AGUA: readonly (readonly (readonly [number, number])[])[] = [
  [[-95, 52], [-78, 52], [-77, 63], [-95, 64]], // bahía de Hudson
  [[-96, 20], [-84, 20], [-84, 29], [-96, 29]], // golfo de México
];

function dentro(poly: readonly (readonly [number, number])[], lon: number, lat: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const esTierra = (lon: number, lat: number): boolean =>
  lat <= -70 ||
  (TIERRA.some((p) => dentro(p, lon, lat)) && !AGUA.some((p) => dentro(p, lon, lat)));

/**
 * Globo punteado en proyección ortográfica sobre la cara americana. Los puntos
 * se emiten como subtrazos de longitud cero con `stroke-linecap="round"` en un
 * único <path>: cuesta ~16 bytes por punto en vez de los ~55 de un <circle>,
 * que es lo que mantiene el `data:` URI en torno a 20 KB.
 */
function construirGlobo(): string {
  const lat0 = 10;
  const lon0 = -80;
  const paso = 1.9;
  const R = 250;
  const tam = 620;
  const c = tam / 2;
  const sinLat0 = Math.sin(lat0 * RAD);
  const cosLat0 = Math.cos(lat0 * RAD);
  // Luz desde arriba a la derecha: da el borde encendido y la cara izquierda
  // apagada de la referencia.
  const luz = [0.55, 0.45, 0.7] as const;
  const nLuz = Math.hypot(...luz);

  const cubos: string[][] = [[], [], [], [], []];

  for (let lat = -88; lat <= 88; lat += paso) {
    const cosLat = Math.cos(lat * RAD);
    const pasoLon = paso / Math.max(cosLat, 0.08);
    for (let lon = -180; lon < 180; lon += pasoLon) {
      if (!esTierra(lon, lat)) continue;
      const dLon = (lon - lon0) * RAD;
      const z = sinLat0 * Math.sin(lat * RAD) + cosLat0 * cosLat * Math.cos(dLon);
      // Cerca del limbo los meridianos se comprimen y los puntos se funden en
      // rayas: se descartan y se atenúa la franja anterior.
      if (z <= 0.3) continue;
      const x = cosLat * Math.sin(dLon);
      const y = cosLat0 * Math.sin(lat * RAD) - sinLat0 * cosLat * Math.cos(dLon);
      const limbo = Math.min(1, (z - 0.3) / 0.3);
      const brillo = Math.max(0, (x * luz[0] + y * luz[1] + z * luz[2]) / nLuz) * limbo;
      cubos[Math.min(4, Math.floor(brillo * 5))]!.push(
        `M${(c + x * R).toFixed(1)} ${(c - y * R).toFixed(1)}h0`,
      );
    }
  }

  const opacidades = [0.16, 0.3, 0.5, 0.72, 1];
  const puntos = cubos
    .map((d, i) =>
      d.length
        ? `<path d="${d.join("")}" stroke="#F0A93E" stroke-width="3.1" stroke-linecap="round" fill="none" opacity="${opacidades[i]}"/>`
        : "",
    )
    .join("");

  // Pines sobre ciudades reales del recorrido; Ayacucho es el destacado.
  const pines = (
    [
      [-99.1, 19.4, 0.55], [-82.4, 23.1, 0.5], [-74.1, 4.7, 0.55],
      [-74.2, -13.2, 1], [-47.9, -15.8, 0.5], [-58.4, -34.6, 0.5],
      [-118.2, 34.1, 0.5], [-74.0, 40.7, 0.5],
    ] as const
  )
    .map(([lon, lat, s]) => {
      const dLon = (lon - lon0) * RAD;
      const z = sinLat0 * Math.sin(lat * RAD) + cosLat0 * Math.cos(lat * RAD) * Math.cos(dLon);
      if (z <= 0.05) return "";
      const x = c + Math.cos(lat * RAD) * Math.sin(dLon) * R;
      const y =
        c - (cosLat0 * Math.sin(lat * RAD) - sinLat0 * Math.cos(lat * RAD) * Math.cos(dLon)) * R;
      const halo =
        s === 1 ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="46" fill="url(#halo)"/>` : "";
      return `${halo}<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})" filter="url(#brillo)"><path d="M0 0C-3-8-10-13-10-19A10 10 0 1 1 10-19C10-13 3-8 0 0Z" fill="#FFC46B"/><circle cx="0" cy="-19" r="4" fill="#20160A"/></g>`;
    })
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tam} ${tam}" width="${tam}" height="${tam}">` +
    `<defs>` +
    // La esfera va casi transparente: si se rellena en opaco se recorta como un
    // disco marrón sobre la tarjeta en vez de fundirse con ella.
    `<radialGradient id="esfera" cx="0.7" cy="0.26" r="0.9"><stop offset="0" stop-color="#FFB347" stop-opacity="0.075"/><stop offset="0.55" stop-color="#A86A18" stop-opacity="0.03"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="borde" x1="1" y1="0" x2="0.1" y2="1"><stop offset="0" stop-color="#FFC46B"/><stop offset="0.35" stop-color="#C6821F" stop-opacity="0.5"/><stop offset="0.7" stop-color="#7A4C10" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="halo"><stop offset="0" stop-color="#FFB347" stop-opacity="0.55"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient>` +
    `<filter id="brillo" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` +
    `<filter id="resplandor" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="11"/></filter>` +
    `</defs>` +
    `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="url(#borde)" stroke-width="10" filter="url(#resplandor)" opacity="0.9"/>` +
    `<circle cx="${c}" cy="${c}" r="${R}" fill="url(#esfera)"/>` +
    puntos +
    `<circle cx="${c}" cy="${c}" r="${R}" fill="none" stroke="url(#borde)" stroke-width="1.6"/>` +
    pines +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const GLOBO_POR_DEFECTO = construirGlobo();

/* ------------------------------------------------------------------- defaults */

export const DEFAULT_FOOTER: FooterCtaData = {
  ctaTitle: "Descubre Ayacucho, lleva su historia contigo",
  ctaSubtitle: "Más de 30 lugares patrimoniales en la palma de tu mano",
  ctaLabel: "Explorar ahora",
  globeImageUrl: GLOBO_POR_DEFECTO,
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

const ENLACE =
  "text-[15px] text-[#4A423B] transition-colors hover:text-[#A9660F] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9660F] dark:text-white/65 dark:hover:text-white dark:focus-visible:outline-[#E7A94F]";

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
    <footer
      className={`w-full bg-[#faf8f5] pt-14 pb-8 md:pt-16 dark:bg-[#0e0d0c] ${className ?? ""}`}
    >
      <div className={CONTENEDOR}>
        {/* ---------------------------------------------------- banner CTA --- */}
        <section
          aria-labelledby="cta-final"
          // En claro la tarjeta cae de crema a marrón cálido hacia la derecha:
          // el globo necesita un fondo oscuro del que salir, y así se lee como
          // un degradado intencionado y no como una mancha bajo la esfera.
          className="relative isolate overflow-hidden rounded-[26px] border border-black/[0.06] bg-[linear-gradient(102deg,#FFFDF9_0%,#FFF8EC_30%,#EBD3A8_48%,#A97C3A_64%,#4E361A_80%,#241804_100%)] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_-30px_rgba(80,50,10,0.45)] sm:p-12 lg:rounded-[30px] lg:p-16 dark:border-white/[0.08] dark:bg-[linear-gradient(100deg,#0F0D0A_0%,#141009_45%,#1E1409_100%)] dark:shadow-none"
        >
          {/* Globo: más alto que la tarjeta y sangrando por la derecha, como en
              la referencia. En móvil se va al fondo, atenuado tras el velo. */}
          <div className="pointer-events-none absolute top-1/2 right-[-32%] -z-10 aspect-square w-[115%] -translate-y-1/2 opacity-30 md:right-[-6%] md:w-[52%] md:opacity-100 lg:right-[-8%] lg:w-[43%]">
            <Image
              src={data.globeImageUrl}
              alt="Globo terráqueo con los destinos patrimoniales de Ayacucho señalados sobre América"
              fill
              sizes="(min-width: 1024px) 43vw, (min-width: 768px) 52vw, 115vw"
              className="object-contain"
            />
          </div>

          {/* Velo desde la izquierda: mantiene el texto legible sobre el globo. */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 -z-10 w-[92%] bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9]/85 to-transparent md:w-3/5 dark:from-[#0F0D0A] dark:via-[#0F0D0A]/85"
          />

          <h2
            id="cta-final"
            className="text-[28px] leading-[1.14] font-bold tracking-tight text-[#111111] sm:text-4xl lg:text-[44px] dark:text-white"
          >
            {lineasTitulo.map((linea, i) => (
              <span key={linea} className="block">
                {linea}
                {i < lineasTitulo.length - 1 ? "," : ""}
              </span>
            ))}
          </h2>

          <p className="mt-5 max-w-[27ch] text-[15px] leading-[1.55] text-[#4A423B] sm:text-base lg:text-[19px] dark:text-white/55">
            {data.ctaSubtitle}
          </p>

          <a
            href="#"
            // En móvil el botón va a ancho completo; desde sm se ajusta al texto.
            className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#E7A94F] px-7 py-3.5 text-[15px] font-bold text-[#1A1206] transition-colors hover:bg-[#F2B968] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9660F] sm:w-auto dark:focus-visible:outline-[#E7A94F]"
          >
            {data.ctaLabel}
            <ArrowRight size={18} strokeWidth={2.25} />
          </a>
        </section>

        {/* ------------------------------------------------------- columnas --- */}
        {/* Marca primero y a doble ancho; las listas se apilan en móvil, van a
            dos columnas en tablet y a cuatro en escritorio como la referencia. */}
        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-12 lg:mt-20 lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:gap-8">
          <div>
            <div className="flex items-center gap-4">
              <Landmark
                aria-hidden="true"
                size={38}
                strokeWidth={1.5}
                className="text-[#A9660F] dark:text-[#E7A94F]"
              />
              <p className="text-[26px] font-bold tracking-tight text-[#111111] dark:text-white">
                {data.brandName}
              </p>
            </div>

            <p className="mt-4 flex items-center gap-2.5 text-[15px] text-[#4A423B] dark:text-white/60">
              <MapPin aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
              {data.address}
            </p>

            <h3 className="mt-7 text-[15px] font-bold text-[#111111] dark:text-white">Contacto</h3>
            <p className="mt-3 flex items-center gap-2.5 text-[15px] text-[#4A423B] dark:text-white/60">
              <Phone aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
              {data.phone}
            </p>
            <p className="mt-2.5 flex items-center gap-2.5 text-[15px] text-[#4A423B] dark:text-white/60">
              <Mail aria-hidden="true" size={17} strokeWidth={1.75} className="shrink-0" />
              {data.email}
            </p>

            <ul className="mt-6 flex items-center gap-5">
              {data.socials.map((social) => {
                const Icono = ICONO_SOCIAL[social.platform];
                return (
                  <li key={social.platform}>
                    <a
                      href={social.href}
                      aria-label={NOMBRE_SOCIAL[social.platform]}
                      className="inline-flex text-[#4A423B] transition-colors hover:text-[#A9660F] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9660F] dark:text-white/55 dark:hover:text-white dark:focus-visible:outline-[#E7A94F]"
                    >
                      <Icono className="size-[22px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {data.columns.map((columna) => {
            const id = `col-${columna.title.replace(/\s+/g, "-").toLowerCase()}`;
            return (
              <nav key={columna.title} aria-labelledby={id}>
                <h3 id={id} className="text-[15px] font-semibold text-[#8A7F74] dark:text-white/45">
                  {columna.title}
                </h3>
                <ul className="mt-5 space-y-3.5">
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

        <div className="mt-12 border-t border-black/[0.08] pt-7 lg:mt-16 dark:border-white/[0.08]">
          <p className="text-center text-[13px] text-[#8A7F74] dark:text-white/40">
            {data.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default FooterCta;
