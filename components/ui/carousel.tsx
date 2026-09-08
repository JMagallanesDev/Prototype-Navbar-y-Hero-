'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import type { AutoplayOptionsType } from 'embla-carousel-autoplay';
import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from 'embla-carousel';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                                    Tipos                                   */
/* -------------------------------------------------------------------------- */

export type CarouselAxis = 'x' | 'y';

/**
 * Etiquetas accesibles. Se inyectan ya traducidas (next-intl) desde el
 * componente de dominio: la capa de UI nunca contiene texto hardcodeado.
 */
export type CarouselLabels = {
  slide?: (index: number, total: number) => string;
  thumb?: (index: number, total: number) => string;
  dot?: (index: number, total: number) => string;
};

type CarouselContextValue = {
  id: string;
  emblaRef: (node: HTMLElement | null) => void;
  emblaApi: EmblaCarouselType | undefined;
  thumbsRef: (node: HTMLElement | null) => void;
  thumbsApi: EmblaCarouselType | undefined;
  axis: CarouselAxis;
  selectedIndex: number;
  scrollSnaps: number[];
  slideCount: number;
  isPlaying: boolean;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  labels: CarouselLabels;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

export function useCarousel(): CarouselContextValue {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('Los subcomponentes del carrusel deben renderizarse dentro de <Carousel />.');
  }
  return context;
}

/** Foco visible dibujado con box-shadow para no depender de `ring-offset`. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--carousel-surface),0_0_0_4px_var(--carousel-accent)]';

/** Índice que SliderContainer / ThumbsSlider inyectan a cada hijo. */
const ItemIndexContext = React.createContext(0);

/**
 * Total de slides contado a partir de los hijos. Embla solo puede medirlo tras
 * montar, así que sin esto el HTML del servidor anunciaría «imagen 1 de 0».
 */
const ItemTotalContext = React.createContext(0);

/* -------------------------------------------------------------------------- */
/*                                  Carousel                                  */
/* -------------------------------------------------------------------------- */

/**
 * Paleta propia del carrusel, en OKLCH y sin dependencia de ningún design
 * system. Van como utilidades y no como `style` inline para poder llevar
 * variante `dark:`: así siguen el tema de la app sea cual sea su estrategia
 * —clase o `prefers-color-scheme`—, sin que el componente tenga que saberlo.
 *
 * Se heredan a todos los subcomponentes y se sobreescriben desde fuera con una
 * clase propia o con `style`, que gana a cualquier utilidad.
 */
const CAROUSEL_TOKENS = [
  '[--carousel-radius:0.5rem]',
  // Fondo del marco: el que asoma entre dos fotos durante el desplazamiento.
  '[--carousel-surface:oklch(0.93_0.006_85)]',
  'dark:[--carousel-surface:oklch(0.27_0_0)]',
  // Marco de la miniatura activa, puntos y foco.
  '[--carousel-accent:oklch(0.36_0.02_70)]',
  'dark:[--carousel-accent:oklch(0.98_0_0)]',
].join(' ');

const DEFAULT_OPTIONS: EmblaOptionsType = {
  loop: true,
  axis: 'y',
  align: 'center',
  duration: 30,
  skipSnaps: false,
};

const DEFAULT_THUMBS_OPTIONS: EmblaOptionsType = {
  containScroll: 'keepSnaps',
  dragFree: true,
};

const DEFAULT_AUTOPLAY_OPTIONS: AutoplayOptionsType = {
  delay: 2000,
  playOnInit: true,
  stopOnInteraction: false,
  // Avanza siempre. Para pausar al pasar el mouse, activa stopOnMouseEnter
  // desde la prop autoPlayOptions.
  stopOnMouseEnter: false,
  // Se detiene al entrar con el teclado: es la vía de escape accesible para
  // poder inspeccionar una foto sin que se mueva bajo el foco.
  stopOnFocusIn: true,
  // Si se activa el hover, debe cubrir la galería entera, no solo el viewport.
  rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement,
};

export type CarouselProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> & {
  children: React.ReactNode;
  options?: EmblaOptionsType;
  thumbsOptions?: EmblaOptionsType;
  plugins?: EmblaPluginType[];
  /** Autoplay. Se desactiva solo si el usuario pide `prefers-reduced-motion`. */
  isAutoPlay?: boolean;
  autoPlayOptions?: Partial<AutoplayOptionsType>;
  labels?: CarouselLabels;
};

export function Carousel({
  children,
  className,
  options,
  thumbsOptions,
  plugins,
  isAutoPlay = false,
  autoPlayOptions,
  labels,
  style,
  ...props
}: CarouselProps) {
  const id = React.useId();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const autoPlayEnabled = isAutoPlay && !prefersReducedMotion;

  const mergedOptions = React.useMemo<EmblaOptionsType>(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options],
  );

  const mergedThumbsOptions = React.useMemo<EmblaOptionsType>(
    () => ({
      ...DEFAULT_THUMBS_OPTIONS,
      axis: mergedOptions.axis ?? 'y',
      ...thumbsOptions,
    }),
    [mergedOptions.axis, thumbsOptions],
  );

  const mergedAutoPlayOptions = React.useMemo<AutoplayOptionsType>(
    () => ({ ...DEFAULT_AUTOPLAY_OPTIONS, ...autoPlayOptions }),
    [autoPlayOptions],
  );

  const emblaPlugins = React.useMemo<EmblaPluginType[]>(() => {
    const list: EmblaPluginType[] = [...(plugins ?? [])];
    if (autoPlayEnabled) list.push(Autoplay(mergedAutoPlayOptions));
    return list;
  }, [plugins, autoPlayEnabled, mergedAutoPlayOptions]);

  const [emblaRef, emblaApi] = useEmblaCarousel(mergedOptions, emblaPlugins);
  const [thumbsRef, thumbsApi] = useEmblaCarousel(mergedThumbsOptions);

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [slideCount, setSlideCount] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Sincronización carrusel principal -> carril de miniaturas.
  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      thumbsApi?.scrollTo(index);
    };

    const onInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      setSlideCount(emblaApi.slideNodes().length);
    };

    onInit();
    onSelect();
    emblaApi.on('select', onSelect).on('reInit', onSelect).on('reInit', onInit);

    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect).off('reInit', onInit);
    };
  }, [emblaApi, thumbsApi]);

  // Estado real del autoplay (hover, focus, interacción del usuario).
  React.useEffect(() => {
    if (!emblaApi) return;

    const sync = () => setIsPlaying(emblaApi.plugins().autoplay?.isPlaying() ?? false);

    sync();
    emblaApi.on('autoplay:play', sync).on('autoplay:stop', sync).on('reInit', sync);

    return () => {
      emblaApi.off('autoplay:play', sync).off('autoplay:stop', sync).off('reInit', sync);
    };
  }, [emblaApi]);

  const scrollTo = React.useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      // Reinicia el temporizador para que el slide elegido no salte de inmediato.
      emblaApi.plugins().autoplay?.reset();
    },
    [emblaApi],
  );

  const scrollPrev = React.useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    emblaApi.plugins().autoplay?.reset();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    emblaApi.plugins().autoplay?.reset();
  }, [emblaApi]);

  const value = React.useMemo<CarouselContextValue>(
    () => ({
      id,
      emblaRef,
      emblaApi,
      thumbsRef,
      thumbsApi,
      axis: mergedOptions.axis ?? 'y',
      selectedIndex,
      scrollSnaps,
      slideCount,
      isPlaying,
      scrollTo,
      scrollPrev,
      scrollNext,
      labels: labels ?? {},
    }),
    [
      id,
      emblaRef,
      emblaApi,
      thumbsRef,
      thumbsApi,
      mergedOptions.axis,
      selectedIndex,
      scrollSnaps,
      slideCount,
      isPlaying,
      scrollTo,
      scrollPrev,
      scrollNext,
      labels,
    ],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        data-slot="carousel"
        role="region"
        aria-roledescription="carousel"
        style={style}
        className={cn(CAROUSEL_TOKENS, 'relative', className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SliderContainer                              */
/* -------------------------------------------------------------------------- */

type ContainerProps = React.ComponentPropsWithoutRef<'div'> & {
  /** Clases del track interno (flex). Útil para gap y dirección responsive. */
  containerClassName?: string;
};

/** Viewport del carrusel principal: recibe el ref de Embla y el foco de teclado. */
export function SliderContainer({
  className,
  containerClassName,
  children,
  ...props
}: ContainerProps) {
  const { emblaRef, axis, isPlaying, scrollPrev, scrollNext, scrollTo, slideCount } =
    useCarousel();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Se aceptan ambos ejes: en móvil el carrusel se reconfigura a horizontal.
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        scrollPrev();
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        scrollNext();
        break;
      case 'Home':
        event.preventDefault();
        scrollTo(0);
        break;
      case 'End':
        event.preventDefault();
        scrollTo(Math.max(slideCount - 1, 0));
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={emblaRef}
      data-slot="slider-viewport"
      tabIndex={0}
      // Con autoplay activo la región no debe anunciar cada cambio.
      aria-live={isPlaying ? 'off' : 'polite'}
      onKeyDown={handleKeyDown}
      className={cn('overflow-hidden', FOCUS_RING, className)}
      {...props}
    >
      <div
        data-slot="slider-track"
        className={cn(
          'flex',
          axis === 'y' ? 'h-full flex-col touch-pan-x' : 'touch-pan-y',
          containerClassName,
        )}
      >
        <ItemTotalContext.Provider value={React.Children.count(children)}>
          {React.Children.map(children, (child, index) => (
            <ItemIndexContext.Provider value={index}>{child}</ItemIndexContext.Provider>
          ))}
        </ItemTotalContext.Provider>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Slider                                   */
/* -------------------------------------------------------------------------- */

export type SliderProps = React.ComponentPropsWithoutRef<'div'> & {
  index?: number;
};

/** Slide individual del carrusel principal. */
export function Slider({ className, children, index: indexProp, ...props }: SliderProps) {
  const contextIndex = React.useContext(ItemIndexContext);
  const index = indexProp ?? contextIndex;
  const { selectedIndex, slideCount, labels } = useCarousel();
  const totalFromChildren = React.useContext(ItemTotalContext);
  const total = totalFromChildren || slideCount;
  const isSelected = index === selectedIndex;

  return (
    <div
      data-slot="slider-slide"
      role="group"
      aria-roledescription="slide"
      aria-label={labels.slide?.(index + 1, total)}
      aria-current={isSelected || undefined}
      data-selected={isSelected ? '' : undefined}
      className={cn('relative min-h-0 min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ThumbsSlider                                */
/* -------------------------------------------------------------------------- */

/** Carril de miniaturas: segundo carrusel Embla sincronizado con el principal. */
export function ThumbsSlider({
  className,
  containerClassName,
  children,
  ...props
}: ContainerProps) {
  const { thumbsRef, axis } = useCarousel();

  return (
    <div
      ref={thumbsRef}
      data-slot="thumbs-viewport"
      className={cn('overflow-hidden', className)}
      {...props}
    >
      <div
        data-slot="thumbs-track"
        className={cn('flex', axis === 'y' ? 'h-full flex-col' : 'flex-row', containerClassName)}
      >
        {React.Children.map(children, (child, index) => (
          <ItemIndexContext.Provider value={index}>{child}</ItemIndexContext.Provider>
        ))}
      </div>
    </div>
  );
}

export type ThumbSlideProps = React.ComponentPropsWithoutRef<'button'> & {
  index?: number;
  /** Marco animado que resalta la miniatura activa. */
  showActiveRing?: boolean;
};

/** Miniatura clicable: navega al slide correspondiente del carrusel principal. */
export function ThumbSlide({
  className,
  children,
  index: indexProp,
  showActiveRing = true,
  onClick,
  ...props
}: ThumbSlideProps) {
  const contextIndex = React.useContext(ItemIndexContext);
  const index = indexProp ?? contextIndex;
  const { id, selectedIndex, scrollTo, thumbsApi } = useCarousel();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isSelected = index === selectedIndex;

  return (
    <button
      type="button"
      data-slot="thumb-slide"
      aria-current={isSelected}
      data-selected={isSelected ? '' : undefined}
      onClick={(event) => {
        scrollTo(index);
        thumbsApi?.scrollTo(index);
        onClick?.(event);
      }}
      className={cn(
        'relative shrink-0 grow-0 basis-auto overflow-hidden rounded-(--carousel-radius)',
        'opacity-80 transition-opacity duration-300 hover:opacity-100 data-selected:opacity-100',
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      {children}
      {showActiveRing && isSelected ? (
        <motion.span
          aria-hidden="true"
          layoutId={`${id}-thumb-ring`}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 420, damping: 34 }
          }
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_var(--carousel-accent)]"
        />
      ) : null}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SliderDotButton                              */
/* -------------------------------------------------------------------------- */

export type SliderDotButtonProps = React.ComponentPropsWithoutRef<'div'> & {
  dotClassName?: string;
  activeDotClassName?: string;
};

/** Indicadores de posición. Alternativa compacta al carril de miniaturas. */
export function SliderDotButton({
  className,
  dotClassName,
  activeDotClassName,
  ...props
}: SliderDotButtonProps) {
  const { scrollSnaps, selectedIndex, scrollTo, labels } = useCarousel();

  return (
    <div
      data-slot="slider-dots"
      role="group"
      className={cn('flex items-center justify-center gap-2', className)}
      {...props}
    >
      {scrollSnaps.map((_, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={index}
            type="button"
            aria-label={labels.dot?.(index + 1, scrollSnaps.length)}
            aria-current={isSelected}
            data-selected={isSelected ? '' : undefined}
            onClick={() => scrollTo(index)}
            className={cn(
              'h-2 rounded-full bg-(--carousel-accent) transition-all duration-300',
              isSelected ? 'w-6 opacity-100' : 'w-2 opacity-40 hover:opacity-70',
              FOCUS_RING,
              dotClassName,
              isSelected && activeDotClassName,
            )}
          />
        );
      })}
    </div>
  );
}
