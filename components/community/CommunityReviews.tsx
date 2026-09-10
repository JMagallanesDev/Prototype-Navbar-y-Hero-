"use client";

/**
 * CommunityReviews — sección "Comunidad y reseñas" de Yachay Ayacucho.
 *
 * Autónoma: trae su propio estilo (utilidades Tailwind con valores literales,
 * sin tokens del proyecto), sus reseñas de ejemplo y sus avatares embebidos
 * como `data:` URI, así que renderiza sin backend y sin tocar next.config.
 *
 * La paleta oscura se pinta con la variante `dark:`, atada a la clase `.dark`
 * (ver `@custom-variant dark` en app/globals.css).
 */

import { useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { z } from "zod";

/* ------------------------------------------------------------------ datos */

export const ReviewSchema = z.object({
  id: z.string(),
  text: z.string(),
  authorName: z.string(),
  place: z.string(),
  avatarUrl: z.string().url(),
  rating: z.number().min(0).max(5),
});

export const CommunityReviewsSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  globalRating: z.number().min(0).max(5),
  reviews: z.array(ReviewSchema).min(1),
});

export type Review = z.infer<typeof ReviewSchema>;
export type CommunityReviewsData = z.infer<typeof CommunityReviewsSchema>;

export type CommunityReviewsProps = Partial<CommunityReviewsData> & {
  className?: string;
};

/**
 * Retrato de marcador de posición: gradiente + silueta, serializado como
 * `data:` URI. Evita depender de un CDN (y de declararlo en next.config);
 * cuando tengas las fotos reales, pásalas por `reviews[].avatarUrl`.
 */
function avatarUri(bgFrom: string, bgTo: string, skin: string, hair: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgFrom}"/><stop offset="1" stop-color="${bgTo}"/></linearGradient></defs>
<rect width="96" height="96" fill="url(#g)"/>
<circle cx="48" cy="88" r="31" fill="${hair}" opacity="0.55"/>
<rect x="42" y="56" width="12" height="16" rx="6" fill="${skin}"/>
<circle cx="48" cy="43" r="18" fill="${skin}"/>
<path d="M30 45c0-13 8-19 18-19s18 6 18 19c0-6-6-9-18-9s-18 3-18 9Z" fill="${hair}"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_REVIEWS: readonly Review[] = [
  {
    id: "valeria-torres",
    text: "Explorar la Catedral de noche fue mágico, la app me guió a cada detalle.",
    authorName: "Valeria Torres",
    place: "Catedral de Ayacucho",
    avatarUrl: avatarUri("#8C6A46", "#4A3520", "#D8A87C", "#2C1C10"),
    rating: 5,
  },
  {
    id: "carlos-mendoza",
    text: "Gracias a Yachay descubrí miradores que ni sabía que existían.",
    authorName: "Carlos Mendoza",
    place: "Mirador de Acuchimay",
    avatarUrl: avatarUri("#5A6B7A", "#27333D", "#C99A6E", "#1B1410"),
    rating: 5,
  },
  {
    id: "lucia-fernandez",
    text: "Me encanta ganar sellos cada vez que visito un templo. ¡Muy adictivo!",
    authorName: "Lucía Fernández",
    place: "Templo de San Francisco",
    avatarUrl: avatarUri("#B98A55", "#6B4A28", "#E0B48A", "#3A2414"),
    rating: 5,
  },
  {
    id: "diego-quispe",
    text: "La mejor forma de conocer la ciudad y su gente sin perderse nada.",
    authorName: "Diego Quispe",
    place: "Complejo arqueológico Wari",
    avatarUrl: avatarUri("#6F7F5C", "#2F3A26", "#C08F63", "#20160D"),
    rating: 5,
  },
  {
    id: "rosa-huaman",
    text: "Las rutas por Santa Ana me llevaron a talleres de retablo increíbles.",
    authorName: "Rosa Huamán",
    place: "Barrio de Santa Ana",
    avatarUrl: avatarUri("#A6613F", "#5B2E1B", "#DCA97E", "#241309"),
    rating: 5,
  },
  {
    id: "andres-palomino",
    text: "Seguí las procesiones con horarios exactos. No me perdí ni una.",
    authorName: "Andrés Palomino",
    place: "Semana Santa de Huamanga",
    avatarUrl: avatarUri("#7C6A8C", "#372C42", "#C4906A", "#1E1512"),
    rating: 5,
  },
];

export const DEFAULT_DATA: CommunityReviewsData = {
  eyebrow: "LA COMUNIDAD NOS QUIERE",
  title: "Preferido por quienes aman Ayacucho",
  globalRating: 4.8,
  reviews: [...DEFAULT_REVIEWS],
};

/* --------------------------------------------------------------- estrellas */

/**
 * Estrellas con media: 4.8 → 4 llenas + 1 media. Se toma la parte entera como
 * llenas y el resto se dibuja como media en cuanto pasa de un cuarto de punto,
 * que es la lectura que espera la sección para su 4.8.
 */
function StarRating({ rating, size }: { rating: number; size: number }) {
  const full = Math.floor(rating);
  const hasHalf = full < 5 && rating - full >= 0.25;

  const lit = "text-[#B26A12] dark:text-[#DFA55C]";
  const dim = "text-[#B26A12]/20 dark:text-[#DFA55C]/20";

  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-[3px]">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) {
          return <Star key={i} size={size} strokeWidth={0} className={`fill-current ${lit}`} />;
        }
        if (i === full && hasHalf) {
          // Media: estrella apagada de fondo y la encendida recortada al 50%.
          return (
            <span key={i} className="relative inline-flex" style={{ width: size, height: size }}>
              <Star size={size} strokeWidth={0} className={`fill-current ${dim}`} />
              <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                <Star size={size} strokeWidth={0} className={`fill-current ${lit}`} />
              </span>
            </span>
          );
        }
        return <Star key={i} size={size} strokeWidth={0} className={`fill-current ${dim}`} />;
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ tarjeta */

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className="flex h-full min-h-[272px] flex-col rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_30px_-18px_rgba(0,0,0,0.35)] md:min-h-[300px] md:p-7 lg:min-h-[360px] lg:p-9 dark:border-white/[0.08] dark:bg-[#16130F] dark:shadow-none"
    >
      <p className="text-[16px] leading-[1.6] text-[#1A1614] md:text-[17px] lg:text-[21px] lg:leading-[1.55] dark:text-white">
        {review.text}
      </p>

      {/* `mt-auto` fija el bloque de autor al pie: los filetes quedan alineados
          entre tarjetas aunque los textos tengan distinto largo. */}
      <div className="mt-auto pt-7">
        <div className="h-px w-full bg-black/[0.08] dark:bg-white/[0.09]" />
        <div className="mt-5 flex items-center gap-3.5">
          <Image
            src={review.avatarUrl}
            alt={`Foto de ${review.authorName}`}
            width={64}
            height={64}
            className="size-12 shrink-0 rounded-full object-cover ring-1 ring-black/10 lg:size-[60px] dark:ring-white/15"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-tight font-semibold text-[#1A1614] dark:text-white">
              {review.authorName}
            </p>
            <p className="mt-1 text-[13px] leading-[1.35] text-[#B26A12] dark:text-[#DFA55C]">
              {review.place}
            </p>
          </div>
          <StarRating rating={review.rating} size={13} />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ sección */

// Mismo inset horizontal para cabecera y flechas.
const INSET = "px-5 sm:px-8 lg:px-12 xl:px-24";
// El carrusel solo lo lleva a la izquierda: así sangra hasta el borde derecho.
const INSET_LEFT = "pl-5 sm:pl-8 lg:pl-12 xl:pl-24";

export function CommunityReviews({
  eyebrow,
  title,
  globalRating,
  reviews,
  className,
}: CommunityReviewsProps = {}) {
  const data = useMemo(
    () =>
      CommunityReviewsSchema.parse({
        eyebrow: eyebrow ?? DEFAULT_DATA.eyebrow,
        title: title ?? DEFAULT_DATA.title,
        globalRating: globalRating ?? DEFAULT_DATA.globalRating,
        reviews: reviews ?? DEFAULT_DATA.reviews,
      }),
    [eyebrow, title, globalRating, reviews],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    // `dragFree` + `loop` son lo que convierte el carrusel en marquesina:
    // desplazamiento continuo en vez de saltar de slide en slide.
    { loop: true, align: "start", dragFree: true, containScroll: false },
    [
      AutoScroll({
        speed: 0.6, // px por frame: lento y constante
        startDelay: 0,
        playOnInit: false, // lo arranca el efecto, según prefers-reduced-motion
        stopOnInteraction: false, // reanuda solo tras arrastrar o al salir el ratón
        stopOnMouseEnter: true, // pausa al pasar el ratón
        stopOnFocusIn: true,
      }),
    ],
  );

  // La lista se duplica para que siempre haya slides de sobra a ambos lados y
  // el bucle no dé el salto que se ve cuando las tarjetas no llenan el ancho.
  const slides = useMemo(
    () => [...data.reviews, ...data.reviews].map((review, i) => ({ review, i })),
    [data.reviews],
  );

  useEffect(() => {
    if (!emblaApi) return;

    // prefers-reduced-motion: sin marquesina; la sección queda navegable a
    // flechas y gesto. Se escucha el cambio para no exigir recarga.
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      // El plugin se recrea en cada `reInit`, así que se lee aquí y no fuera.
      const autoScroll = emblaApi.plugins().autoScroll;
      if (!autoScroll) return;
      if (media.matches) autoScroll.stop();
      else if (!autoScroll.isPlaying()) autoScroll.play();
    };

    sync();
    media.addEventListener("change", sync);
    // Sin esto, al redimensionar (o girar el móvil) Embla reinicializa el
    // plugin con `playOnInit: false` y la marquesina se queda parada.
    emblaApi.on("reInit", sync);
    return () => {
      media.removeEventListener("change", sync);
      emblaApi.off("reInit", sync);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const arrow =
    "inline-flex size-11 items-center justify-center rounded-full border border-black/15 text-[#1A1614]/70 transition-colors hover:border-[#B26A12] hover:text-[#B26A12] focus-visible:ring-2 focus-visible:ring-[#B26A12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] focus-visible:outline-none dark:border-white/15 dark:text-white/70 dark:hover:border-[#DFA55C] dark:hover:text-[#DFA55C] dark:focus-visible:ring-[#DFA55C] dark:focus-visible:ring-offset-[#0B0A09]";

  return (
    <section
      className={`w-full overflow-hidden bg-[#FAF7F2] py-16 md:py-20 lg:py-24 dark:bg-[#0B0A09] ${className ?? ""}`}
    >
      {/* Cabecera: columna en móvil, extremos en ≥md como la referencia. */}
      <div
        className={`flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10 ${INSET}`}
      >
        <div>
          <div className="flex items-center gap-4">
            <span className="h-px w-11 bg-[#B26A12] dark:bg-[#DFA55C]" />
            <span className="text-[11px] font-medium tracking-[0.22em] text-[#B26A12] uppercase sm:text-xs dark:text-[#DFA55C]">
              {data.eyebrow}
            </span>
          </div>
          <h2 className="mt-5 max-w-[17ch] text-[32px] leading-[1.06] font-bold tracking-tight text-[#111111] sm:text-5xl lg:text-6xl dark:text-white">
            {data.title}
          </h2>
        </div>

        <div
          role="img"
          aria-label={`${data.globalRating} de 5`}
          className="flex shrink-0 items-center gap-3 md:pt-2"
        >
          <StarRating rating={data.globalRating} size={22} />
          <span className="text-base text-[#1A1614]/60 dark:text-white/70">
            {data.globalRating}/5
          </span>
        </div>
      </div>

      {/* El viewport recorta en su caja de relleno: con relleno solo a la
          izquierda, la última tarjeta queda cortada contra el borde derecho. */}
      <div
        ref={emblaRef}
        role="region"
        aria-label="Reseñas de la comunidad"
        className={`mt-10 cursor-grab overflow-hidden active:cursor-grabbing md:mt-14 ${INSET_LEFT}`}
      >
        <div className="-ml-4 flex touch-pan-y items-stretch md:-ml-5">
          {slides.map(({ review, i }) => (
            <div
              key={`${review.id}-${i}`}
              // La segunda copia solo existe para el bucle: se oculta a lectores.
              aria-hidden={i >= data.reviews.length}
              className="min-w-0 shrink-0 grow-0 basis-[85%] pl-4 md:basis-[43.5%] md:pl-5 lg:basis-[28.5%]"
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-8 flex items-center gap-3 md:mt-10 ${INSET}`}>
        <button type="button" onClick={scrollPrev} aria-label="Reseña anterior" className={arrow}>
          <ChevronLeft size={20} strokeWidth={1.75} />
        </button>
        <button type="button" onClick={scrollNext} aria-label="Reseña siguiente" className={arrow}>
          <ChevronRight size={20} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}

export default CommunityReviews;
