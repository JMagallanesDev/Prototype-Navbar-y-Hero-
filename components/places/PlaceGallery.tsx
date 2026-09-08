'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { EmblaOptionsType } from 'embla-carousel';
import { z } from 'zod';

import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react';

import {
  Carousel,
  Slider,
  SliderContainer,
  SliderDotButton,
  ThumbSlide,
  ThumbsSlider,
  useCarousel,
  type CarouselLabels,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                                   Esquema                                  */
/* -------------------------------------------------------------------------- */

/**
 * Origen de una imagen: URL absoluta (Cloudinary en producción) o ruta desde la
 * raíz del sitio (`/festividades/foo.png`), que es lo que sirve `next/image`
 * para los archivos de `public/`. Ambas son `src` válidos.
 */
const ImageSrcSchema = z.string().refine(
  (value) => /^https?:\/\/\S+$/.test(value) || /^\/[^/\s]/.test(value),
  { message: 'Debe ser una URL https absoluta o una ruta como /carpeta/foto.jpg' },
);

/** Dato de una imagen concreta. El icono se resuelve con la prop `icons`. */
export const GalleryFactSchema = z.object({
  labelKey: z.string(),
  valueKey: z.string(),
  icon: z.string().optional(),
});

export const GalleryImageSchema = z.object({
  url: ImageSrcSchema,
  thumbnailUrl: ImageSrcSchema,
  altKey: z.string(), // clave next-intl
  /** Título propio de esta imagen. Sin él manda `placeName`. */
  titleKey: z.string().optional(),
  /** Clave del párrafo que se muestra al costado cuando esta imagen está activa. */
  bodyKey: z.string().optional(),
  /**
   * Punto focal del recorte, en la sintaxis de `object-position` de CSS
   * (`'top'`, `'50% 20%'`…). Por defecto se recorta desde el centro, que pierde
   * los extremos cuando la foto y el marco no comparten proporción.
   */
  objectPosition: z.string().optional(),
  /** Datos propios de esta imagen. Sin ellos manda la prop `facts`. */
  facts: z.array(GalleryFactSchema).optional(),
});

export const GalleryImagesSchema = z.array(GalleryImageSchema).min(1);

export type GalleryImage = z.infer<typeof GalleryImageSchema>;

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

/**
 * Dato suelto del lugar (ubicación, altitud…). Como `placeName`, llega ya
 * traducido: son datos del lugar, no de la foto, y no cambian al pasar imagen.
 */
export type PlaceFact = {
  /** Icono opcional. Se pinta con el color de `--gallery-accent`. */
  icon?: React.ReactNode;
  label: string;
  value: string;
};

export type PlaceGalleryProps = {
  /** Imágenes del lugar. Validadas con Zod en runtime. */
  images: GalleryImage[];
  /** Nombre del lugar, ya traducido, para la etiqueta de la región. */
  placeName: string;
  /** Fila de datos bajo el párrafo, común a todas las imágenes. */
  facts?: PlaceFact[];
  /** Iconos a los que apunta el campo `icon` de los datos por imagen. */
  icons?: Record<string, React.ReactNode>;
  /** Milisegundos que cada foto permanece quieta antes de pasar a la siguiente. */
  autoplayDelay?: number;
  /**
   * Duración del propio deslizamiento. Es el valor sin unidad de Embla, no
   * milisegundos: más alto, más lento y más suave. 25 es el defecto de Embla,
   * 45 da un desplazamiento pausado que acompaña bien a una galería de fotos.
   */
  transitionDuration?: number;
  /**
   * Detiene el avance mientras el cursor está sobre la galería. Desactivado:
   * por defecto el carrusel corre siempre.
   */
  pauseOnHover?: boolean;
  /** Proporción del marco principal. */
  aspectRatio?: string;
  /** Muestra puntos de posición bajo la foto. */
  showDots?: boolean;
  /** Marca la primera imagen como LCP. */
  priority?: boolean;
  className?: string;
};

/**
 * Eje vertical en tablet/escritorio; horizontal por debajo de `md` para no
 * secuestrar el scroll de la página en móvil. El carril de miniaturas se queda
 * siempre vertical, así que el aspecto no cambia entre tamaños.
 */
const MOBILE_BREAKPOINT = '(max-width: 767px)';

const MAIN_OPTIONS: EmblaOptionsType = {
  loop: true, // bucle infinito real: del último slide vuelve al primero sin salto
  axis: 'y',
  align: 'center',
  duration: 30,
  breakpoints: {
    [MOBILE_BREAKPOINT]: { axis: 'x' },
  },
};

const THUMBS_OPTIONS: EmblaOptionsType = {
  // Horizontal en todos los tamaños: el carril ya no va superpuesto sobre el
  // borde de la foto, sino como una fila bajo el texto.
  axis: 'x',
  align: 'center',
  // El carril también gira en bucle: al llegar a la última miniatura, la
  // primera vuelve a entrar por el otro lado en lugar de rebobinar. Embla solo
  // puede enlazar los extremos si las miniaturas desbordan el carril; con seis
  // festividades y cuatro a la vista sobran dos, así que el bucle entra en
  // juego y `containScroll` queda ignorado (que es lo que hace Embla en ese
  // caso).
  loop: true,
  containScroll: 'trimSnaps',
  // Ahora sí se puede arrastrar: el gesto es horizontal y no compite con el
  // scroll vertical de la página, que es lo que lo desaconsejaba cuando el
  // carril era vertical.
  watchDrag: true,
};

const MAIN_SIZES = '(max-width: 1200px) 100vw, 1100px';
// Cuatro miniaturas por fila: una cuarta parte del ancho de su columna.
const THUMB_SIZES = '(max-width: 767px) 25vw, 170px';

/**
 * Tokens propios de la galería, encima de los del carrusel. Como aquéllos, van
 * como utilidades para poder seguir el tema claro/oscuro; se sobreescriben con
 * una clase propia o con `style`.
 *
 * El ámbar se oscurece en claro: el tono del tema oscuro no llega al contraste
 * mínimo sobre un fondo casi blanco.
 */
const GALLERY_TOKENS = [
  '[--gallery-accent:oklch(0.58_0.13_58)]',
  'dark:[--gallery-accent:oklch(0.76_0.14_65)]',
].join(' ');

/**
 * Regla bajo el título que además hace de barra de progreso: avanza mientras
 * corre la cuenta atrás del autoplay y se reinicia con cada imagen.
 *
 * Se engancha a los eventos del plugin (`autoplay:timerset` trae el arranque
 * real del temporizador, `autoplay:timerstopped` la pausa) en vez de estimar el
 * tiempo por nuestra cuenta: así la barra no se adelanta ni se retrasa respecto
 * al cambio de foto, y se congela si el autoplay se detiene. Si no hay autoplay
 * —una sola imagen, o `prefers-reduced-motion`— se queda llena y quieta.
 */
function ProgressRule({ durationMs }: { durationMs: number }) {
  const { emblaApi } = useCarousel();
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const controls = React.useRef<ReturnType<typeof animate> | null>(null);

  React.useEffect(() => {
    const bar = scope.current;
    if (!emblaApi || !bar) return;

    if (!emblaApi.plugins().autoplay) {
      animate(bar, { scaleX: 1 }, { duration: 0 });
      return;
    }

    const start = () => {
      controls.current?.stop();
      controls.current = animate(
        bar,
        { scaleX: [0, 1] },
        { duration: durationMs / 1000, ease: 'linear' },
      );
    };

    const freeze = () => controls.current?.pause();

    emblaApi.on('autoplay:timerset', start).on('autoplay:timerstopped', freeze);

    // El primer `timerset` se emite al inicializar el plugin, antes de que este
    // efecto llegue a suscribirse, así que enganchamos el ciclo ya en marcha.
    if (emblaApi.plugins().autoplay?.isPlaying()) start();

    return () => {
      emblaApi.off('autoplay:timerset', start).off('autoplay:timerstopped', freeze);
      controls.current?.stop();
    };
  }, [emblaApi, animate, scope, durationMs]);

  return (
    <span
      aria-hidden="true"
      className="mt-3 mb-5 block h-0.5 w-16 overflow-hidden rounded-full bg-(--gallery-accent)/25"
    >
      {/* Sin radio propio: lo redondea el carril con su `overflow-hidden`. Un
          `rounded-full` aquí se deforma al escalar y su borde antialiaseado
          asoma como motas sueltas en los 2 px de alto de la barra. */}
      <span ref={scope} className="block h-full w-full origin-left bg-(--gallery-accent)" />
    </span>
  );
}

/**
 * Párrafo lateral. Vive dentro de <Carousel> para leer del contexto qué imagen
 * está activa, así que no hace falta tocar nada de la capa de UI del carrusel.
 */
function GalleryBody({
  images,
  title,
  facts,
  icons,
  progressMs,
  translate,
}: {
  images: GalleryImage[];
  title: string;
  facts: PlaceFact[];
  icons: Record<string, React.ReactNode>;
  progressMs: number;
  translate: (key: string) => string;
}) {
  const { selectedIndex } = useCarousel();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const image = images[selectedIndex];

  // Título y datos propios de la imagen cuando los trae; si no, los del lugar.
  const heading = image?.titleKey ? translate(image.titleKey) : title;
  const ownFacts = image?.facts?.map((fact) => ({
    icon: fact.icon ? icons[fact.icon] : undefined,
    label: translate(fact.labelKey),
    value: translate(fact.valueKey),
  }));
  const visibleFacts = ownFacts?.length ? ownFacts : facts;

  // Si el título no cambia entre imágenes no tiene sentido reanimarlo.
  const headingKey = images.some((item) => item.titleKey) ? selectedIndex : 'fijo';

  const fade = {
    initial: prefersReducedMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
    transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' as const },
  };

  return (
    <div className="relative mt-5 min-w-0 md:mt-0">
      {/* El título va en el color del acento, el mismo que ya usan los iconos de
          los datos y la barra de progreso. Como es un token, se recolorea solo
          al cambiar de tema y se puede pisar desde fuera.

          `popLayout` en vez de `wait`: con `wait` el elemento que sale se
          desmonta antes de que entre el siguiente, el panel se queda un
          instante sin contenido y su altura colapsa. Eso es el rebote. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.h2
          key={headingKey}
          {...fade}
          className="text-2xl font-bold tracking-tight text-balance text-(--gallery-accent) md:text-3xl"
        >
          {heading}
        </motion.h2>
      </AnimatePresence>

      {/* La barra queda fuera de las zonas animadas: si se desmontara en cada
          cambio perdería la suscripción al temporizador del autoplay. */}
      <ProgressRule durationMs={progressMs} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={selectedIndex} {...fade} className="relative">
          {image?.bodyKey ? (
            <p className="text-sm leading-relaxed text-pretty opacity-85 md:text-base">
              {translate(image.bodyKey)}
            </p>
          ) : null}

          {visibleFacts.length > 0 ? (
            <dl
              className={cn(
                'mt-6 grid grid-cols-2 gap-x-6 gap-y-4',
                // Con dos datos, dos columnas en cualquier tamaño: repartidos y
                // sin huecos. Solo a partir de tres se abre a una tercera.
                visibleFacts.length > 2 && 'sm:grid-cols-3',
              )}
            >
              {visibleFacts.map((fact, index) => (
                <div
                  key={fact.label}
                  className={cn(
                    // Divisor vertical entre los dos datos. Va como borde
                    // izquierdo del segundo, no como columna aparte, para no
                    // romper el reparto a partes iguales del `grid`. Solo con
                    // exactamente dos: con tres o más la fila se parte en dos
                    // renglones al estrecharse y el borde quedaría suelto al
                    // principio del segundo.
                    visibleFacts.length === 2 && index > 0 && 'border-l border-current/15 pl-6',
                  )}
                >
                  <dt className="flex items-center gap-1.5 text-xs opacity-70">
                    {fact.icon ? (
                      <span
                        aria-hidden="true"
                        className="text-(--gallery-accent) [&_svg]:size-4 [&_svg]:shrink-0"
                      >
                        {fact.icon}
                      </span>
                    ) : null}
                    {fact.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function PlaceGallery({
  images,
  placeName,
  facts = [],
  icons = {},
  autoplayDelay = 5000,
  transitionDuration = 45,
  pauseOnHover = false,
  aspectRatio = '3 / 2',
  showDots = false,
  priority = false,
  className,
}: PlaceGalleryProps) {
  const t = useTranslations('Gallery');
  const tRoot = useTranslations();

  // `altKey` llega en runtime (BD/CMS), fuera del union de claves tipadas de
  // next-intl, así que se resuelve con una firma laxa deliberada.
  const translateAlt = React.useCallback(
    (key: string) => (tRoot as unknown as (k: string) => string)(key),
    [tRoot],
  );

  const parsed = React.useMemo(() => GalleryImagesSchema.safeParse(images), [images]);

  const labels = React.useMemo<CarouselLabels>(
    () => ({
      slide: (index, total) => t('slideLabel', { index, total }),
      thumb: (index, total) => t('thumbLabel', { index, total }),
      dot: (index, total) => t('dotLabel', { index, total }),
    }),
    [t],
  );

  const autoPlayOptions = React.useMemo(
    () => ({
      delay: autoplayDelay,
      playOnInit: true,
      // Ni el clic en una miniatura ni el arrastre detienen el avance: el
      // temporizador se reinicia y el carrusel sigue solo.
      stopOnInteraction: false,
      stopOnMouseEnter: pauseOnHover,
    }),
    [autoplayDelay, pauseOnHover],
  );

  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[PlaceGallery] Imágenes inválidas:', parsed.error.issues);
    }
    return (
      <p role="status" className="text-sm opacity-70">
        {t('empty')}
      </p>
    );
  }

  const gallery = parsed.data;
  const total = gallery.length;
  const isSingle = total === 1;
  const hasSide =
    gallery.some((image) => image.bodyKey || image.titleKey || image.facts?.length) ||
    facts.length > 0;

  /**
   * Fila de miniaturas. Ya no va superpuesta sobre la foto: cierra la columna
   * de texto, y solo cae bajo la foto cuando esa columna no existe.
   *
   * El ancho de cada una es un cuarto del carril menos su propia separación,
   * así entran cuatro justas y la quinta asoma cortada — que es lo que le dice
   * al ojo que la fila sigue. La separación va como margen y no como `gap` del
   * flex: Embla mide la costura del bucle leyendo el margen del último slide,
   * y un `gap` ahí vale cero.
   */
  const carrilMiniaturas = isSingle ? null : (
    <ThumbsSlider className="mt-8" containerClassName="flex-row">
      {gallery.map((image, index) => (
        <ThumbSlide
          key={image.thumbnailUrl}
          aria-label={t('thumbLabel', { index: index + 1, total })}
          className="mr-3 aspect-3/2 w-[calc(25%-0.75rem)] rounded-[0.625rem]"
        >
          <Image
            src={image.thumbnailUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes={THUMB_SIZES}
            style={{ objectPosition: image.objectPosition }}
            className="object-cover select-none"
            draggable={false}
          />
        </ThumbSlide>
      ))}
    </ThumbsSlider>
  );

  return (
    <Carousel
      aria-label={t('regionLabel', { place: placeName })}
      options={{
        ...MAIN_OPTIONS,
        duration: transitionDuration,
        loop: !isSingle,
        watchDrag: !isSingle,
      }}
      thumbsOptions={THUMBS_OPTIONS}
      isAutoPlay={!isSingle}
      autoPlayOptions={autoPlayOptions}
      labels={labels}
      className={cn(
        GALLERY_TOKENS,
        'w-full',
        // Dos columnas solo cuando hay texto que mostrar al costado.
        hasSide &&
          'md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-start md:gap-10',
        className,
      )}
    >
      {/* Columna de la foto */}
      <div className="min-w-0">
        {/* Marco: fija la proporción y recorta. El fondo asoma en el hueco que
            queda entre dos fotos mientras el carrusel se desplaza. */}
        <div
          style={{ aspectRatio }}
          className={cn(
            'relative w-full overflow-hidden rounded-(--carousel-radius)',
            'bg-(--carousel-surface) shadow-[0_1px_3px_oklch(0_0_0/0.18)]',
          )}
        >
          {/* La separación entre fotos va como margen del slide, no como `gap`
              de flex: Embla mide la costura del bucle leyendo el margen del
              último slide, y un `gap` ahí vale cero. El eje cambia en `md`. */}
          <SliderContainer
            className="h-full w-full"
            containerClassName="flex-row touch-pan-y md:flex-col md:touch-pan-x"
          >
            {gallery.map((image, index) => (
              <Slider key={image.url} className="mr-2.5 h-full md:mr-0 md:mb-2.5">
                <Image
                  src={image.url}
                  alt={translateAlt(image.altKey)}
                  fill
                  sizes={MAIN_SIZES}
                  priority={priority && index === 0}
                  style={{ objectPosition: image.objectPosition }}
                  className="object-cover select-none"
                  draggable={false}
                />
              </Slider>
            ))}
          </SliderContainer>
        </div>

        {showDots && !isSingle ? <SliderDotButton className="mt-4" /> : null}

        {/* Sin columna de texto, el carril no tiene dónde ir salvo aquí. */}
        {hasSide ? null : carrilMiniaturas}
      </div>

      {/* Texto al costado, sincronizado con la imagen activa, y el carril
          cerrando la columna. */}
      {hasSide ? (
        <div className="min-w-0">
          <GalleryBody
            images={gallery}
            title={placeName}
            facts={facts}
            icons={icons}
            progressMs={autoplayDelay}
            translate={translateAlt}
          />
          {carrilMiniaturas}
        </div>
      ) : null}
    </Carousel>
  );
}

export default PlaceGallery;
