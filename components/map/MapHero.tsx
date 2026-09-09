'use client';

/**
 * MapHero — Sección hero del mapa 3D para Yachay Ayacucho.
 *
 * Componente 100% autónomo: todo el estilo vive aquí (valores hardcodeados con
 * Tailwind 4), no depende de tokens de tema globales ni de otros componentes UI.
 *
 * El fondo por defecto es la captura del mapa 3D servida desde /public. Si le
 * pasas una URL remota por `backgroundUrl`, recuerda declarar el host en
 * next.config.ts → images.remotePatterns.
 */

import Image from 'next/image';
import { Box } from 'lucide-react';
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Schemas (Zod)                                                              */
/* -------------------------------------------------------------------------- */

const MapHeroSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ctaLabel: z.string(),
  // Admite una URL absoluta o una ruta servida desde /public ("/mapa.png").
  backgroundUrl: z
    .string()
    .refine((value) => value.startsWith('/') || /^https?:\/\//.test(value), {
      message: 'backgroundUrl debe ser una URL absoluta o una ruta desde /public',
    }),
});

export type MapHeroData = z.infer<typeof MapHeroSchema>;

/* -------------------------------------------------------------------------- */
/* Datos de ejemplo (reproducen la referencia, funcionan sin backend)          */
/* -------------------------------------------------------------------------- */

const DEFAULT_DATA: MapHeroData = {
  eyebrow: 'MAPA 3D INTERACTIVO',
  title: 'Explora Ayacucho como nunca antes',
  subtitle:
    'Navega el patrimonio de Huamanga en un mapa 3D con clima y recomendaciones en tiempo real',
  ctaLabel: 'Explorar mapa 3D',
  backgroundUrl: '/mapa-seccion-3d-nuevo.png',
};

/* -------------------------------------------------------------------------- */
/* Props                                                                       */
/* -------------------------------------------------------------------------- */

export interface MapHeroProps extends Partial<MapHeroData> {
  /** Callback del CTA principal. */
  onExplore?: () => void;
  /** Clases extra para el contenedor (márgenes del layout, etc.). */
  className?: string;
  /** Marca la imagen de fondo como LCP cuando el hero está above the fold. */
  priority?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Componente                                                                  */
/* -------------------------------------------------------------------------- */

export default function MapHero({
  onExplore,
  className,
  priority = false,
  ...overrides
}: MapHeroProps) {
  // Merge explícito con los valores de ejemplo + validación en runtime.
  const data: MapHeroData = MapHeroSchema.parse({
    eyebrow: overrides.eyebrow ?? DEFAULT_DATA.eyebrow,
    title: overrides.title ?? DEFAULT_DATA.title,
    subtitle: overrides.subtitle ?? DEFAULT_DATA.subtitle,
    ctaLabel: overrides.ctaLabel ?? DEFAULT_DATA.ctaLabel,
    backgroundUrl: overrides.backgroundUrl ?? DEFAULT_DATA.backgroundUrl,
  });

  return (
    <section
      aria-labelledby="maphero-title"
      className={[
        'relative isolate w-full overflow-hidden',
        'rounded-[22px] sm:rounded-[26px] lg:rounded-[28px]',
        // Alturas pensadas para que la captura se recorte lo menos posible: dentro
        // del contenedor la imagen no se amplía (se muestra al 100% o por debajo).
        'h-[420px] sm:h-[440px] md:h-[460px] lg:h-[520px] xl:h-[560px]',
        // Light: anillo + sombra para integrarse en una página clara.
        'ring-1 ring-black/10 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)]',
        // Dark: borde tenue y sombra profunda.
        'dark:ring-white/10 dark:shadow-[0_22px_60px_-25px_rgba(0,0,0,0.9)]',
        className ?? '',
      ].join(' ')}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Fondo: captura del mapa 3D del centro histórico de Huamanga       */}
      {/* ---------------------------------------------------------------- */}
      <Image
        src={data.backgroundUrl}
        alt="Mapa 3D del centro histórico de Huamanga, Ayacucho, con sus lugares patrimoniales"
        fill
        priority={priority}
        sizes="(min-width: 1280px) 1100px, 100vw"
        className="select-none object-cover object-center"
      />

      {/* Tinte sobre la captura: es un mapa diurno y claro. Suave en light para
          no apagarlo, más denso en dark para que encaje con la página oscura. */}
      <div aria-hidden className="absolute inset-0 bg-[#141009]/20 dark:bg-[#0A0806]/55" />

      {/* Degradado MÓVIL: vertical y más fuerte, el texto ocupa todo el ancho. */}
      <div
        aria-hidden
        className={[
          'absolute inset-0 md:hidden',
          // Light: negro cálido, algo menos denso para no ensuciar el layout claro.
          'bg-[linear-gradient(to_top,rgba(22,17,12,0.96)_0%,rgba(22,17,12,0.88)_40%,rgba(22,17,12,0.5)_68%,rgba(22,17,12,0.28)_100%)]',
          // Dark: negro puro como en la referencia.
          'dark:bg-[linear-gradient(to_top,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.9)_40%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.2)_100%)]',
        ].join(' ')}
      />

      {/* Degradado TABLET/DESKTOP: horizontal sobre la mitad izquierda. */}
      <div
        aria-hidden
        className={[
          'absolute inset-0 hidden md:block',
          'bg-[linear-gradient(to_right,rgba(22,17,12,0.95)_0%,rgba(22,17,12,0.9)_28%,rgba(22,17,12,0.6)_50%,rgba(22,17,12,0.18)_68%,rgba(22,17,12,0)_82%)]',
          'dark:bg-[linear-gradient(to_right,rgba(0,0,0,0.96)_0%,rgba(0,0,0,0.92)_30%,rgba(0,0,0,0.6)_52%,rgba(0,0,0,0.15)_70%,rgba(0,0,0,0)_84%)]',
        ].join(' ')}
      />

      {/* Viñeta inferior sutil: asienta la foto dentro de un layout claro. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(120%_80%_at_50%_0%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.5)_100%)]"
      />

      {/* ---------------------------------------------------------------- */}
      {/* Contenido IZQUIERDO (texto + CTA)                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative z-20 flex h-full flex-col justify-end p-5 sm:p-7 md:justify-center md:p-9 lg:p-12 xl:p-14">
        {/* Móvil: ancho completo · Tablet: ~60% · Desktop: ~45% */}
        <div className="w-full md:max-w-[60%] lg:max-w-[46%]">
          {/* Eyebrow: dash ámbar + label en mayúsculas con tracking amplio. */}
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <span aria-hidden className="h-px w-5 bg-[#E9A83C] sm:w-6" />
            <span className="text-[10px] font-semibold tracking-[0.22em] text-[#E9A83C] uppercase sm:text-[11px]">
              {data.eyebrow}
            </span>
          </div>

          <h2
            id="maphero-title"
            className="text-[27px] leading-[1.08] font-extrabold tracking-tight text-balance text-white sm:text-[32px] md:text-[34px] lg:text-[40px] xl:text-[44px]"
          >
            {data.title}
          </h2>

          <p className="mt-3 max-w-[38ch] text-[13px] leading-relaxed text-white/70 sm:text-sm md:mt-4 dark:text-white/65">
            {data.subtitle}
          </p>

          {/* CTA principal: ancho completo en móvil, auto desde sm. */}
          <button
            type="button"
            onClick={onExplore}
            aria-label={`${data.ctaLabel} del centro histórico de Huamanga`}
            className={[
              'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 sm:mt-6 sm:w-auto',
              'bg-[#E9A83C] text-[15px] font-semibold text-[#1B1206]',
              'shadow-[0_10px_26px_-10px_rgba(233,168,60,0.9)]',
              'transition-[transform,background-color,box-shadow,filter] duration-200 ease-out',
              'hover:bg-[#F2B650] hover:brightness-[1.04] hover:shadow-[0_14px_34px_-10px_rgba(233,168,60,1)] md:hover:scale-[1.02]',
              'active:scale-[0.98]',
              'focus-visible:ring-2 focus-visible:ring-[#F2B650] focus-visible:ring-offset-2 focus-visible:ring-offset-black/70 focus-visible:outline-none',
            ].join(' ')}
          >
            <Box aria-hidden className="h-[18px] w-[18px]" strokeWidth={2} />
            {data.ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
