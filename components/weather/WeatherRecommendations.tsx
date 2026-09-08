'use client';

/**
 * WeatherRecommendations — "Tu clima, tus recomendaciones"
 * Sección autónoma para Yachay Ayacucho (Huamanga, Ayacucho).
 *
 * - Todo el estilo vive aquí dentro (valores hardcodeados de Tailwind 4) y no
 *   depende de tokens de tema globales. La única excepción es la cabecera, que
 *   comparte con el resto de la página los filetes ornamentales, el barrido de
 *   <DiaTextReveal> en el título y el tecleado de <TypingAnimation> en el
 *   subtítulo, para que las secciones se lean como una sola pieza.
 * - Mobile-first: tarjetas apiladas en móvil, lado a lado desde lg.
 * - Dark mode con variantes `dark:` (base = tema claro).
 */

import { useMemo, useRef, type JSX } from 'react';
import {
  Thermometer,
  Droplet,
  Sun,
  SunMedium,
  RefreshCw,
  Box,
  Mountain,
  Church,
  Cross,
  ChevronRight,
} from 'lucide-react';
import { z } from 'zod';
import { useInView, useReducedMotion } from 'motion/react';

import { DiaTextReveal } from '@/components/ui/dia-text-reveal';
import { FileteOrnamental } from '@/components/ui/filete-ornamental';
import { TypingAnimation } from '@/components/ui/typing-animation';

/* ------------------------------------------------------------------ */
/* Schemas + tipos                                                     */
/* ------------------------------------------------------------------ */

const WeatherSchema = z.object({
  temperature: z.number(), // 18
  feelsLike: z.number(), // 16
  location: z.string(), // "Huamanga, Ayacucho"
  max: z.number(), // 21
  min: z.number(), // 10
  humidity: z.number(), // 48
  uvIndex: z.string(), // "Alto"
  condition: z.string(), // para elegir el icono de clima
  highlight: z.string(), // "Tarde soleada, ideal para miradores"
  updatedLabel: z.string(), // "Actualizado hace un momento"
});

const RecommendationSchema = z.object({
  id: z.string(),
  icon: z.enum(['mountain', 'church', 'sun', 'cross']),
  title: z.string(),
  subtitle: z.string(),
});

export type Weather = z.infer<typeof WeatherSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;

export interface WeatherRecommendationsProps {
  weather?: Weather;
  recommendations?: readonly Recommendation[];
  /** Handler opcional para las filas (hoy son solo visuales). */
  onSelectRecommendation?: (recommendation: Recommendation) => void;
  /** Handler opcional del pie "Actualizado hace un momento". */
  onRefresh?: () => void;
  /**
   * Banda de color que barre el título al entrar en pantalla. Se pasa desde
   * fuera porque el barrido se dibuja en JS y no puede leer la variante `dark:`
   * como hace el resto del componente.
   */
  titleSweepColors?: string[];
  /**
   * Color del título una vez pasado el barrido. Por el mismo motivo que la
   * banda, viaja por props: gana a la clase `dark:text-white`, así que en tema
   * oscuro hay que pasar el valor claro o el título se queda negro sobre negro.
   */
  titleColor?: string;
  /**
   * Acento de los filetes que flanquean el título. Como los dos de arriba, se
   * aplica en JS y no ve la variante `dark:`.
   */
  accentColor?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Datos de ejemplo (reproducen exactamente la referencia)             */
/* ------------------------------------------------------------------ */

export const SAMPLE_WEATHER: Weather = WeatherSchema.parse({
  temperature: 18,
  feelsLike: 16,
  location: 'Huamanga, Ayacucho',
  max: 21,
  min: 10,
  humidity: 48,
  uvIndex: 'Alto',
  condition: 'partly-cloudy',
  highlight: 'Tarde soleada, ideal para miradores',
  updatedLabel: 'Actualizado hace un momento',
});

export const SAMPLE_RECOMMENDATIONS: readonly Recommendation[] = z
  .array(RecommendationSchema)
  .parse([
    {
      id: 'acuchimay',
      icon: 'mountain',
      title: 'Visita el Mirador de Acuchimay',
      subtitle: 'Cielo despejado, gran atardecer',
    },
    {
      id: 'templos',
      icon: 'church',
      title: 'Recorre templos del centro',
      subtitle: 'Buen clima para caminar',
    },
    {
      id: 'protector',
      icon: 'sun',
      title: 'Lleva protector solar',
      subtitle: 'Índice UV alto',
    },
    {
      id: 'semana-santa',
      icon: 'cross',
      title: 'Semana Santa se acerca',
      subtitle: 'No te la pierdas',
    },
  ]);

/* ------------------------------------------------------------------ */
/* Ilustración de clima (SVG a color: sol dorado detrás de nubes)      */
/* ------------------------------------------------------------------ */

/**
 * Coordenadas de los rayos, a tres decimales.
 *
 * Sin redondear, React aborta la hidratación de este SVG: las posiciones salen
 * de `Math.cos`/`Math.sin`, y el número que el servidor escribe en el atributo
 * y el que el navegador calcula difieren en el último dígito
 * (23.4833395016046 frente a 23.483339501604604). React lo lee como un atributo
 * que no coincide y avisa de un desajuste. Tres decimales sobran para un dibujo
 * de 160×120 y dejan a los dos lados escribiendo exactamente lo mismo.
 */
const redondea = (n: number): number => Number(n.toFixed(3));

/**
 * Icono de clima ilustrativo. Se dibuja a mano en SVG (no un icono de línea)
 * para lograr el sol dorado con rayos y las nubes superpuestas de la referencia.
 * `condition` decide si se pintan las nubes.
 */
function WeatherArt({
  condition,
  className,
}: {
  condition: string;
  className?: string;
}): JSX.Element {
  const c = condition.toLowerCase();
  const isClear = /clear|despejado|sunny|soleado/.test(c) && !/cloud|nub/.test(c);

  return (
    <svg viewBox="0 0 160 120" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="yw-sun-core" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#fff4c9" />
          <stop offset="55%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <linearGradient id="yw-ray" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="yw-cloud-back" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="yw-cloud-front" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <filter id="yw-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sol: halo difuso + rayos radiales + núcleo con degradado */}
      <g filter="url(#yw-glow)">
        <circle cx="66" cy="46" r="32" fill="#fbbf24" opacity="0.16" />
        <g stroke="url(#yw-ray)" strokeWidth="5" strokeLinecap="round">
          {Array.from({ length: 12 }, (_unused, i) => {
            const angle = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={redondea(66 + Math.cos(angle) * 26)}
                y1={redondea(46 + Math.sin(angle) * 26)}
                x2={redondea(66 + Math.cos(angle) * 36)}
                y2={redondea(46 + Math.sin(angle) * 36)}
              />
            );
          })}
        </g>
        <circle cx="66" cy="46" r="23" fill="url(#yw-sun-core)" />
      </g>

      {/* Nubes blancas superpuestas al sol */}
      {isClear ? null : (
        <g>
          <path
            d="M96 34c-11 0-20 8.5-20 19.5 0 1 .1 2 .2 3H120c7.2 0 13-5.8 13-13s-5.8-13-13-13c-2.1 0-4.1.5-5.9 1.4C111.2 25.7 104.2 34 96 34z"
            fill="url(#yw-cloud-back)"
            opacity="0.9"
          />
          <path
            d="M60 96c-8.8 0-16-7.2-16-16s7.2-16 16-16c1.6 0 3.2.2 4.7.7C68.3 57 76.1 51 85.3 51c11.9 0 21.6 9.7 21.6 21.6 0 .9 0 1.7-.1 2.5 6.4 1.5 11.2 7.2 11.2 14 0 2.5-.7 4.9-1.9 6.9H60z"
            fill="url(#yw-cloud-front)"
          />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Iconos de recomendación + clases compartidas                        */
/* ------------------------------------------------------------------ */

const RECOMMENDATION_ICONS = {
  mountain: Mountain,
  church: Church,
  sun: Sun,
  cross: Cross,
} as const;

/** Divisor sutil, legible tanto en claro como en oscuro. */
const DIVIDER = 'h-px w-full bg-[#17150f]/10 dark:bg-white/[0.08]';

/** Círculo con fondo ámbar translúcido de iconos y banner. */
const AMBER_BUBBLE =
  'flex shrink-0 items-center justify-center rounded-full bg-amber-500/12 ring-1 ring-amber-500/15 dark:bg-amber-400/10 dark:ring-amber-300/10';

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export default function WeatherRecommendations({
  weather = SAMPLE_WEATHER,
  recommendations = SAMPLE_RECOMMENDATIONS,
  onSelectRecommendation,
  onRefresh,
  titleSweepColors = ['#17150f', '#8F5624', '#C68A4B', '#A8672F', '#9C5A72'],
  titleColor = '#17150f',
  accentColor = '#C68A4B',
  className = '',
}: WeatherRecommendationsProps): JSX.Element {
  const data = useMemo<Weather>(() => WeatherSchema.parse(weather), [weather]);
  const items = useMemo<readonly Recommendation[]>(
    () => z.array(RecommendationSchema).parse(recommendations),
    [recommendations],
  );

  // La apertura del título se vigila desde el <h2>, que no está recortado: el
  // recorte va por dentro y no queremos que un elemento a medio abrir decida si
  // está o no en pantalla.
  const quieto = useReducedMotion() ?? false;
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const tituloEnVista = useInView(tituloRef, { once: true, amount: 0.6 });
  const tituloAbierto = quieto || tituloEnVista;

  return (
    <section
      aria-labelledby="yachay-weather-heading"
      /* El fondo es exactamente el de la página que la aloja —blanco en claro,
         #0a0a0a en oscuro— y no el crema y el #070707 que traía. Antes se veía
         como una banda de otro tono al hacer scroll; ahora la sección se funde
         con lo que tiene arriba y abajo, que es lo que hace que el bloque se
         lea limpio. */
      className={`w-full bg-white px-4 py-10 text-[#17150f] transition-colors sm:px-6 sm:py-14 lg:px-10 lg:py-16 dark:bg-[#0a0a0a] dark:text-white ${className}`}
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Cabecera de la sección. Los filetes salen a partir de `md` y más
            cortos que los de Festividades (10rem en vez de 14): este título es
            largo —29 caracteres— y a lo ancho de esta caja no caben dos filetes
            de 14rem sin estrangularlo. */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-5 sm:gap-6">
            <FileteOrnamental
              color={accentColor}
              invertido
              quieto={quieto}
              className="hidden max-w-40 md:flex"
            />

            {/* La apertura desde el centro recorta el PROPIO <DiaTextReveal>, no
                un envoltorio, y por transición CSS. Envuelto, el componente
                quedaría dentro de un ancestro recortado a cero de ancho y su
                detector de "entró en pantalla" no se dispararía nunca; como el
                texto se pinta con un degradado que arranca fuera del cuadro y
                solo entra con el barrido, el titular se quedaría permanentemente
                invisible. Y no puede ir por `motion` porque el componente no
                acepta `style` ni `animate` desde fuera: se pisarían con los
                suyos, que son los que pintan el degradado.

                `nowrap` solo desde `md`, que es donde aparecen los filetes: por
                debajo el título necesita poder partirse en dos renglones. */}
            <h2
              id="yachay-weather-heading"
              ref={tituloRef}
              className="text-center text-[1.75rem] leading-tight font-bold tracking-[-0.02em] sm:text-4xl md:shrink-0 md:whitespace-nowrap lg:text-[2.75rem]"
            >
              <DiaTextReveal
                text="Tu clima, tus recomendaciones"
                colors={titleSweepColors}
                textColor={titleColor}
                duration={1.7}
                delay={0.15}
                once
                className={`block pb-[0.16em] transition-[clip-path] duration-850 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  tituloAbierto
                    ? '[clip-path:inset(0%_0%_0%_0%)]'
                    : '[clip-path:inset(0%_50%_0%_50%)]'
                }`}
              />
            </h2>

            <FileteOrnamental
              color={accentColor}
              quieto={quieto}
              className="hidden max-w-40 md:flex"
            />
          </div>

          {/* Lo que se centra es la CAJA (`mx-auto w-fit`), no el texto: con
              `text-center` el tecleado crecería hacia los dos lados a la vez y
              la frase se vería deslizar. Dentro va alineado a la izquierda, así
              que se escribe de izquierda a derecha y, al caber en una línea, el
              resultado final queda centrado igual. `reserveSpace` guarda el alto
              de la frase para que las tarjetas no bajen mientras se teclea. */}
          <TypingAnimation
            as="p"
            typeSpeed={19}
            delay={600}
            reserveSpace
            hideCursorOnFinish
            className="mx-auto mt-3 w-fit max-w-full text-sm text-[#6f675c] sm:text-base lg:text-lg dark:text-[#8b8b8b]"
          >
            El mejor momento para explorar Huamanga
          </TypingAnimation>
        </header>

        {/* Cuerpo: un solo bloque, sin tarjetas. Las dos mitades ya no llevan
            marco, relleno ni fondo propio —se apoyan directamente sobre el de
            la sección— y lo único que las separa es una línea de un píxel.

            Esa línea cambia de eje con la disposición: horizontal mientras las
            mitades van apiladas y vertical cuando se ponen lado a lado desde
            `lg`. Va como borde de la segunda mitad, no como elemento aparte,
            para que nunca aparezca suelta si la primera falta.

            El `gap` de la rejilla es cero a propósito: la separación la dan los
            rellenos de cada mitad, y así la línea cae justo en medio en vez de
            pegada a una de las dos. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
          {/* ============ MITAD IZQUIERDA — clima actual ============ */}
          <article className="min-w-0 lg:pr-10 xl:pr-14">
            <h3 className="sr-only">Clima actual en {data.location}</h3>

            {/* Temperatura gigante + ilustración de clima */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-start text-[4.5rem] leading-[0.9] font-bold tracking-[-0.045em] sm:text-[6rem] lg:text-[7.5rem]">
                  <span>{data.temperature}</span>
                  {/* El símbolo de grado va más pequeño y alineado arriba */}
                  <span className="text-[0.42em] leading-none" aria-hidden="true">
                    °
                  </span>
                  <span className="sr-only"> grados</span>
                </p>
                <p className="mt-3 truncate text-lg font-bold sm:text-xl lg:text-2xl">
                  {data.location}
                </p>
                <p className="mt-1 text-sm text-[#6f675c] sm:text-base dark:text-[#8b8b8b]">
                  Sensación {data.feelsLike}°
                </p>
              </div>

              <WeatherArt
                condition={data.condition}
                className="mt-1 h-20 w-24 shrink-0 sm:h-28 sm:w-36 lg:h-32 lg:w-44"
              />
            </div>

            <div className={`my-5 sm:my-6 ${DIVIDER}`} />

            {/* Grid de métricas: 2 columnas en móvil, 3 desde sm — nunca se rompe ni desborda */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 sm:gap-x-6">
              {/* Máx. y Mín. comparten el icono de termómetro */}
              <div className="flex items-center gap-3">
                <Thermometer
                  className="h-5 w-5 shrink-0 text-amber-600 sm:h-6 sm:w-6 dark:text-amber-300/90"
                  aria-hidden="true"
                  strokeWidth={1.6}
                />
                <div className="flex gap-4 sm:gap-5">
                  <div>
                    <dt className="text-xs text-[#6f675c] sm:text-sm dark:text-[#8b8b8b]">Máx.</dt>
                    <dd className="text-base font-bold sm:text-lg">{data.max}°</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#6f675c] sm:text-sm dark:text-[#8b8b8b]">Mín.</dt>
                    <dd className="text-base font-bold sm:text-lg">{data.min}°</dd>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Droplet
                  className="h-5 w-5 shrink-0 text-amber-600 sm:h-6 sm:w-6 dark:text-amber-300/90"
                  aria-hidden="true"
                  strokeWidth={1.6}
                />
                <div className="min-w-0">
                  <dt className="text-xs text-[#6f675c] sm:text-sm dark:text-[#8b8b8b]">Humedad</dt>
                  <dd className="text-base font-bold sm:text-lg">{data.humidity}%</dd>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Sun
                  className="h-5 w-5 shrink-0 text-amber-600 sm:h-6 sm:w-6 dark:text-amber-300/90"
                  aria-hidden="true"
                  strokeWidth={1.6}
                />
                <div className="min-w-0">
                  <dt className="text-xs text-[#6f675c] sm:text-sm dark:text-[#8b8b8b]">
                    Índice UV
                  </dt>
                  <dd className="text-base font-bold text-amber-600 sm:text-lg dark:text-amber-400">
                    {data.uvIndex}
                  </dd>
                </div>
              </div>
            </dl>

            <div className={`my-5 sm:my-6 ${DIVIDER}`} />

            {/* Banner destacado en ámbar */}
            <div className="flex items-center gap-3 sm:gap-4">
              <span className={`${AMBER_BUBBLE} h-11 w-11 sm:h-12 sm:w-12`}>
                <SunMedium
                  className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6 dark:text-amber-400"
                  aria-hidden="true"
                  strokeWidth={1.7}
                />
              </span>
              <p className="text-sm font-semibold text-amber-700 sm:text-base lg:text-lg dark:text-amber-400">
                {data.highlight}
              </p>
            </div>

            <div className={`my-5 sm:my-6 ${DIVIDER}`} />

            {/* Pie: actualización */}
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Actualizar información del clima"
              className="-m-1 flex cursor-pointer items-center gap-2 rounded-lg p-1 text-xs text-[#6f675c] transition-colors hover:text-[#17150f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:text-sm dark:text-[#8b8b8b] dark:hover:text-white"
            >
              <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.6} />
              <span>{data.updatedLabel}</span>
            </button>
          </article>

          {/* ============ MITAD DERECHA — recomendaciones ============ */}
          <article className="mt-8 min-w-0 border-t border-[#17150f]/10 pt-8 sm:mt-10 sm:pt-10 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10 xl:pl-14 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Box
                className="h-5 w-5 shrink-0 text-amber-600 sm:h-6 sm:w-6 dark:text-amber-400"
                aria-hidden="true"
                strokeWidth={1.7}
              />
              <h3 className="text-base font-semibold sm:text-lg lg:text-xl">
                Recomendaciones para hoy
              </h3>
            </div>

            <ul className="mt-4 sm:mt-5">
              {items.map((item, index) => {
                const Icon = RECOMMENDATION_ICONS[item.icon];
                return (
                  <li key={item.id}>
                    {/* Divisor entre filas (no antes de la primera) */}
                    {index > 0 ? <div className={DIVIDER} /> : null}
                    <button
                      type="button"
                      onClick={() => onSelectRecommendation?.(item)}
                      aria-label={`${item.title}. ${item.subtitle}`}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-1 py-3.5 text-left transition-colors hover:bg-[#17150f]/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:gap-4 sm:px-2 sm:py-4 dark:hover:bg-white/[0.04]"
                    >
                      <span className={`${AMBER_BUBBLE} h-11 w-11 sm:h-12 sm:w-12`}>
                        <Icon
                          className="h-5 w-5 text-amber-600 sm:h-[22px] sm:w-[22px] dark:text-amber-400"
                          aria-hidden="true"
                          strokeWidth={1.7}
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold sm:text-base lg:text-[17px]">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#6f675c] sm:text-sm dark:text-[#8b8b8b]">
                          {item.subtitle}
                        </span>
                      </span>

                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-[#9c948a] transition-transform group-hover:translate-x-0.5 dark:text-[#6b6b6b]"
                        aria-hidden="true"
                        strokeWidth={1.8}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
