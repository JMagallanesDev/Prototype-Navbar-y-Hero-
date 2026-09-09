'use client';

/**
 * CulturalPassport.tsx — Sección "Pasaporte Cultural" de Yachay Ayacucho.
 *
 * Componente independiente y autónomo: TODO su estilo vive aquí dentro
 * (no consume tokens de tema globales ni otros componentes de UI del proyecto).
 *
 * Stack: Next.js 16 (App Router) · React 19 · TypeScript estricto ·
 *        Tailwind CSS 4 · motion/react (Motion 12) · next/image · lucide-react · zod
 *
 * Las imágenes de ejemplo (pasaporte abierto + medallas) son SVG embebidos como
 * `data:` URI, así el componente renderiza sin backend y sin tocar `next.config`
 * (next/image sirve los `data:` URI sin optimizar automáticamente).
 */

import Image from 'next/image';
import { useMemo, type JSX } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BookMarked, MapPin } from 'lucide-react';
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* 1. Esquemas (Zod) + tipos                                           */
/* ------------------------------------------------------------------ */

const BadgeSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(), // emblema de la medalla
  label: z.string(), // "Explorador colonial", etc.
  unlocked: z.boolean(),
});

const PassportSchema = z.object({
  eyebrow: z.string(), // "PASAPORTE CULTURAL"
  title: z.string(), // "Colecciona sellos, desbloquea insignias"
  description: z.string(),
  visitedCount: z.number(), // 3
  totalCount: z.number(), // 25
  ctaLabel: z.string(), // "Comienza tu pasaporte"
  passportImageUrl: z.string().url(),
  badges: z.array(BadgeSchema), // 3 medallas
});

export type Badge = z.infer<typeof BadgeSchema>;
export type PassportContent = z.infer<typeof PassportSchema>;

export type CulturalPassportProps = Partial<PassportContent> & {
  /** Callback del CTA principal. */
  onStart?: () => void;
  /** Clases extra para el contenedor externo (posicionamiento / márgenes). */
  className?: string;
};

/* ------------------------------------------------------------------ */
/* 2. Imágenes de ejemplo (SVG → data: URI)                            */
/* ------------------------------------------------------------------ */

const svgUrl = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' ').trim())}`;

/** Corona de laurel de las medallas (dos arcos de hojas alrededor del emblema). */
function laurel(color: string, opacity = 0.85): string {
  let out = '';
  for (let i = 0; i < 9; i += 1) {
    const spread = 20 + i * 16; // separación angular desde la base de la corona
    for (const side of [-1, 1] as const) {
      out += `<g transform='rotate(${side * spread} 100 100)'><ellipse cx='100' cy='181' rx='5.2' ry='9.6' fill='${color}' opacity='${opacity}' transform='rotate(${side * 26} 100 181)'/></g>`;
    }
  }
  return out;
}

/** Medalla circular reutilizable (oro / plata) con laurel y emblema central. */
function medalSvg(variant: 'gold' | 'silver', emblem: string): string {
  const g =
    variant === 'gold'
      ? { a: '#f7d489', b: '#d29a35', c: '#8d5c15', inner: '#6d4713', edge: '#f4cd7d' }
      : { a: '#f2f5f8', b: '#b8c1c9', c: '#6f7982', inner: '#525c66', edge: '#e8edf2' };

  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'>
    <defs>
      <radialGradient id='ring' cx='35%' cy='28%' r='78%'>
        <stop offset='0' stop-color='${g.a}'/><stop offset='0.55' stop-color='${g.b}'/><stop offset='1' stop-color='${g.c}'/>
      </radialGradient>
      <radialGradient id='core' cx='38%' cy='30%' r='80%'>
        <stop offset='0' stop-color='${g.b}' stop-opacity='0.55'/><stop offset='1' stop-color='${g.inner}'/>
      </radialGradient>
      <linearGradient id='shine' x1='0' y1='0' x2='0.6' y2='1'>
        <stop offset='0' stop-color='#ffffff' stop-opacity='0.45'/><stop offset='0.5' stop-color='#ffffff' stop-opacity='0'/>
      </linearGradient>
    </defs>
    <circle cx='100' cy='100' r='96' fill='url(#ring)'/>
    <circle cx='100' cy='100' r='96' fill='url(#shine)'/>
    <circle cx='100' cy='100' r='84' fill='none' stroke='${g.c}' stroke-opacity='0.55' stroke-width='2'/>
    ${laurel(g.edge, 0.9)}
    <circle cx='100' cy='100' r='68' fill='url(#core)' stroke='${g.edge}' stroke-width='3'/>
    <g fill='${g.edge}'>${emblem}</g>
  </svg>`;
}

/** Emblema 1: cúpula colonial → "Explorador colonial". */
const EMBLEM_DOME = `
  <path d='M100 44 l3.5 11 h-7 z'/>
  <path d='M100 58 c-16 6 -24 20 -24 32 h48 c0 -12 -8 -26 -24 -32 z'/>
  <rect x='72' y='90' width='56' height='32' rx='3'/>
  <rect x='62' y='122' width='76' height='9' rx='3'/>
  <rect x='83' y='100' width='11' height='22' rx='5.5' fill='#3a2609' fill-opacity='0.55'/>
  <rect x='106' y='100' width='11' height='22' rx='5.5' fill='#3a2609' fill-opacity='0.55'/>
  <rect x='56' y='133' width='88' height='7' rx='3.5' fill-opacity='0.85'/>`;

/** Emblema 2: escudo con cruz → "Guardián del patrimonio". */
const EMBLEM_SHIELD = `
  <path d='M100 46 l40 14 v30 c0 26 -18 44 -40 54 c-22 -10 -40 -28 -40 -54 v-30 z'/>
  <g fill='#3a2609' fill-opacity='0.6'>
    <rect x='94' y='68' width='12' height='58' rx='3'/>
    <rect x='76' y='86' width='48' height='12' rx='3'/>
  </g>`;

/** Emblema 3: número + montañas → "10 lugares". */
const EMBLEM_TEN = `
  <text x='100' y='114' text-anchor='middle' font-family='Helvetica, Arial, sans-serif' font-size='58' font-weight='700' fill='#f3f7fa'>10</text>
  <path d='M58 140 l20 -26 l14 18 l12 -16 l22 24 z' fill='#f3f7fa' fill-opacity='0.75'/>`;

const BADGE_EXPLORER_URL = svgUrl(medalSvg('gold', EMBLEM_DOME));
const BADGE_GUARDIAN_URL = svgUrl(medalSvg('gold', EMBLEM_SHIELD));
const BADGE_TEN_PLACES_URL = svgUrl(medalSvg('silver', EMBLEM_TEN));

/* --- Pasaporte abierto de ejemplo: portada con QR + página de sellos ---
   Los sellos viven DENTRO de la imagen (no se construyen en HTML).      */

/** Módulos deterministas para el QR decorativo (mismo resultado en server y cliente). */
function qrRects(x: number, y: number, size: number, modules = 21): string {
  const cell = size / modules;
  let seed = 20250384;
  const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const isFinder = (r: number, c: number): boolean =>
    (r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7);

  let out = '';
  for (let r = 0; r < modules; r += 1) {
    for (let c = 0; c < modules; c += 1) {
      const on = rnd() > 0.52;
      if (isFinder(r, c) || !on) continue;
      out += `<rect x='${(x + c * cell).toFixed(2)}' y='${(y + r * cell).toFixed(2)}' width='${cell.toFixed(2)}' height='${cell.toFixed(2)}' fill='#1b1611'/>`;
    }
  }
  // Patrones de posición (esquinas) del QR
  const finders: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [0, modules - 7],
    [modules - 7, 0],
  ];
  for (const [fr, fc] of finders) {
    const fx = x + fc * cell;
    const fy = y + fr * cell;
    out += `<rect x='${fx.toFixed(2)}' y='${fy.toFixed(2)}' width='${(cell * 7).toFixed(2)}' height='${(cell * 7).toFixed(2)}' fill='#1b1611'/><rect x='${(fx + cell).toFixed(2)}' y='${(fy + cell).toFixed(2)}' width='${(cell * 5).toFixed(2)}' height='${(cell * 5).toFixed(2)}' fill='#f2e7cf'/><rect x='${(fx + cell * 2).toFixed(2)}' y='${(fy + cell * 2).toFixed(2)}' width='${(cell * 3).toFixed(2)}' height='${(cell * 3).toFixed(2)}' fill='#1b1611'/>`;
  }
  return out;
}

/** Siluetas de monumentos de Huamanga usadas dentro de cada sello. */
const STAMP_ICONS = {
  cathedral: `<g><rect x='34' y='46' width='18' height='46'/><path d='M34 46 L43 30 L52 46 Z'/><rect x='100' y='46' width='18' height='46'/><path d='M100 46 L109 30 L118 46 Z'/><path d='M58 56 c2 -22 34 -22 36 0 z'/><rect x='58' y='56' width='36' height='36'/><rect x='74' y='16' width='4' height='14'/><rect x='69' y='20' width='14' height='4'/><rect x='26' y='90' width='100' height='8' rx='2'/></g>`,
  arch: `<g><path d='M32 96 V54 a44 44 0 0 1 88 0 v42 h-18 V54 a26 26 0 0 0 -52 0 v42 z'/><rect x='40' y='30' width='72' height='12' rx='3'/><rect x='34' y='96' width='84' height='8' rx='2'/></g>`,
  franciscan: `<g><rect x='30' y='40' width='22' height='54'/><path d='M30 40 L41 22 L52 40 Z'/><rect x='39' y='10' width='4' height='12'/><rect x='35' y='14' width='12' height='4'/><rect x='58' y='50' width='60' height='44'/><path d='M58 50 L88 32 L118 50 Z'/><rect x='24' y='94' width='104' height='8' rx='2'/></g>`,
  obelisk: `<g transform='translate(0 -8)'><path d='M76 12 L88 42 V84 H64 V42 Z'/><rect x='56' y='84' width='40' height='10'/><rect x='44' y='94' width='64' height='10'/><rect x='32' y='104' width='88' height='8' rx='2'/></g>`,
  rider: `<g><ellipse cx='78' cy='62' rx='34' ry='18'/><path d='M104 52 l16 -14 6 10 -12 12 z'/><rect x='52' y='74' width='8' height='26' rx='3'/><rect x='68' y='74' width='8' height='26' rx='3'/><rect x='86' y='74' width='8' height='26' rx='3'/><rect x='100' y='74' width='8' height='26' rx='3'/><path d='M46 60 l-14 12 8 6 14 -10 z'/><circle cx='74' cy='30' r='11'/><path d='M64 42 h22 l6 16 h-34 z'/><rect x='26' y='100' width='104' height='6' rx='2'/></g>`,
  dome: `<g><path d='M46 62 c4 -32 56 -32 60 0 z'/><rect x='46' y='62' width='60' height='32'/><rect x='74' y='20' width='4' height='14'/><rect x='69' y='24' width='14' height='4'/><rect x='36' y='94' width='80' height='8' rx='2'/></g>`,
  facade: `<g><rect x='38' y='40' width='76' height='54'/><path d='M38 40 L76 18 L114 40 Z'/><rect x='86' y='60' width='16' height='16'/><rect x='30' y='94' width='92' height='8' rx='2'/></g>`,
} as const;

type StampSpec = {
  icon: keyof typeof STAMP_ICONS;
  lines: readonly string[];
  color: string;
  tint: string;
  locked: boolean;
};

/** 3 sellos conseguidos + 1 disponible + 5 bloqueados, como en la referencia. */
const STAMPS: readonly StampSpec[] = [
  { icon: 'cathedral', lines: ['CATEDRAL', 'DE AYACUCHO'], color: '#c08a2c', tint: '#f6e6c4', locked: false },
  { icon: 'arch', lines: ['ARCO DE', 'SANTA CLARA'], color: '#bf5442', tint: '#f7ded5', locked: false },
  { icon: 'franciscan', lines: ['SAN FRANCISCO', 'DE ASÍS'], color: '#4e8a5e', tint: '#dcecdc', locked: false },
  { icon: 'obelisk', lines: ['PAMPA DE', 'AYACUCHO'], color: '#4a6d9c', tint: '#dbe5f2', locked: false },
  { icon: 'dome', lines: [], color: '#a99a7d', tint: '#e6dcc6', locked: true },
  { icon: 'arch', lines: [], color: '#a99a7d', tint: '#e6dcc6', locked: true },
  { icon: 'rider', lines: [], color: '#a99a7d', tint: '#e6dcc6', locked: true },
  { icon: 'dome', lines: [], color: '#a99a7d', tint: '#e6dcc6', locked: true },
  { icon: 'facade', lines: [], color: '#a99a7d', tint: '#e6dcc6', locked: true },
];

const padlock = (tx: number, ty: number, scale: number): string =>
  `<g transform='translate(${tx} ${ty}) scale(${scale})'><path d='M6 12 V8 a6 6 0 0 1 12 0 v4' fill='none' stroke='#8e8064' stroke-width='3'/><rect x='2' y='12' width='20' height='16' rx='3' fill='#8e8064'/></g>`;

function passportSvg(): string {
  const cols = 3;
  const cardW = 152;
  const cardH = 146;
  const gap = 20;
  const gridX = 652;
  const gridY = 130;

  const stamps = STAMPS.map((s, i) => {
    const x = gridX + (i % cols) * (cardW + gap);
    const y = gridY + Math.floor(i / cols) * (cardH + gap);
    const labels = s.lines
      .map(
        (line, li) =>
          `<text x='${cardW / 2}' y='${112 + li * 13}' text-anchor='middle' font-size='11.5' letter-spacing='0.5' font-family='Helvetica, Arial, sans-serif' font-weight='600' fill='${s.color}'>${line}</text>`,
      )
      .join('');
    const badge = s.locked ? padlock(cardW / 2 - 12, 96, 1.05) : labels;
    return `<g transform='translate(${x} ${y})'><rect width='${cardW}' height='${cardH}' rx='7' fill='${s.tint}' fill-opacity='${s.locked ? 0.5 : 0.92}'/><rect x='4' y='4' width='${cardW - 8}' height='${cardH - 8}' rx='5' fill='none' stroke='${s.color}' stroke-opacity='${s.locked ? 0.35 : 0.9}' stroke-width='2'/><g transform='translate(0 -6)' fill='${s.color}' fill-opacity='${s.locked ? 0.28 : 0.95}'>${STAMP_ICONS[s.icon]}</g>${badge}</g>`;
  }).join('');

  const legend = `<g font-family='Helvetica, Arial, sans-serif' font-size='13' fill='#7c6b4c'><circle cx='690' cy='690' r='5.5' fill='#c08a2c'/><text x='704' y='694'>Visitado</text><circle cx='812' cy='690' r='5.5' fill='none' stroke='#c08a2c' stroke-width='2'/><text x='826' y='694'>Disponible</text>${padlock(936, 676, 0.6)}<text x='960' y='694'>Bloqueado</text></g>`;

  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1240 780' width='1240' height='780'>
    <defs>
      <linearGradient id='cover' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#2b241c'/><stop offset='0.45' stop-color='#181410'/><stop offset='1' stop-color='#0d0b09'/>
      </linearGradient>
      <linearGradient id='page' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#f6ecd6'/><stop offset='1' stop-color='#e7dabc'/>
      </linearGradient>
      <linearGradient id='spine' x1='0' y1='0' x2='1' y2='0'>
        <stop offset='0' stop-color='#000000' stop-opacity='0.55'/>
        <stop offset='0.5' stop-color='#000000' stop-opacity='0.10'/>
        <stop offset='1' stop-color='#000000' stop-opacity='0.26'/>
      </linearGradient>
      <filter id='soft' x='-20%' y='-20%' width='140%' height='140%'>
        <feDropShadow dx='0' dy='18' stdDeviation='26' flood-color='#000000' flood-opacity='0.5'/>
      </filter>
    </defs>

    <g filter='url(#soft)'>
      <rect x='60' y='30' width='560' height='720' rx='14' fill='url(#cover)'/>
      <rect x='620' y='30' width='560' height='720' rx='14' fill='url(#page)'/>
      <rect x='586' y='30' width='68' height='720' fill='url(#spine)'/>
    </g>

    <g fill='#d9a94d' font-family='Georgia, serif' text-anchor='middle'>
      <rect x='96' y='64' width='488' height='676' rx='6' fill='none' stroke='#d9a94d' stroke-opacity='0.35' stroke-width='2'/>
      <text x='340' y='176' font-size='22' letter-spacing='4'>YACHAY AYACUCHO</text>
      <text x='340' y='254' font-size='54' font-weight='700' letter-spacing='2'>PASAPORTE</text>
      <text x='340' y='314' font-size='54' font-weight='700' letter-spacing='2'>CULTURAL</text>
      <g stroke='#d9a94d' stroke-width='2.5' fill='none' stroke-opacity='0.9'>
        <path d='M300 470 v-58 c0 -26 80 -26 80 0 v58'/>
        <path d='M300 412 c0 -30 20 -46 40 -58 c20 12 40 28 40 58'/>
        <path d='M338 344 v-18 M330 334 h16'/>
        <path d='M268 470 v-42 h32 M412 470 v-42 h-32'/>
        <path d='M254 482 h172' stroke-opacity='0.6'/>
        <path d='M262 496 c26 -12 52 12 78 0 c26 -12 52 12 78 0' stroke-opacity='0.5'/>
      </g>
      <text x='340' y='548' font-size='32' letter-spacing='3'>HUAMANGA</text>
      <text x='340' y='578' font-size='17' letter-spacing='3' fill-opacity='0.8'>AYACUCHO - PERÚ</text>
    </g>

    <rect x='284' y='594' width='112' height='112' rx='6' fill='#f2e7cf'/>
    ${qrRects(290, 600, 100)}
    <text x='340' y='730' text-anchor='middle' font-size='15' letter-spacing='1' font-family='Helvetica, Arial, sans-serif' fill='#d9a94d' fill-opacity='0.75'>ID: YA-2025-000384</text>

    <g text-anchor='middle' fill='#8a6a2c' font-family='Helvetica, Arial, sans-serif'>
      <text x='900' y='96' font-size='17' letter-spacing='5' font-weight='700'>&#9672; SELLOS &#9672;</text>
    </g>
    ${stamps}
    ${legend}
  </svg>`;
}

const PASSPORT_IMAGE_URL = svgUrl(passportSvg());

/* ------------------------------------------------------------------ */
/* 3. Datos de ejemplo (reproducen la referencia)                      */
/* ------------------------------------------------------------------ */

const DEFAULT_BADGES: readonly Badge[] = [
  { id: 'explorador-colonial', imageUrl: BADGE_EXPLORER_URL, label: 'Explorador colonial', unlocked: true },
  { id: 'guardian-patrimonio', imageUrl: BADGE_GUARDIAN_URL, label: 'Guardián del patrimonio', unlocked: true },
  { id: 'diez-lugares', imageUrl: BADGE_TEN_PLACES_URL, label: '10 lugares', unlocked: true },
];

const DEFAULTS: PassportContent = {
  eyebrow: 'PASAPORTE CULTURAL',
  title: 'Colecciona sellos, desbloquea insignias',
  description:
    'Visita sitios históricos de Huamanga, gana sellos en tu pasaporte digital y sube de nivel como explorador del patrimonio.',
  visitedCount: 3,
  totalCount: 25,
  ctaLabel: 'Comienza tu pasaporte',
  passportImageUrl: PASSPORT_IMAGE_URL,
  badges: [...DEFAULT_BADGES],
};

/* ------------------------------------------------------------------ */
/* 4. Componente                                                       */
/* ------------------------------------------------------------------ */

export default function CulturalPassport({
  eyebrow,
  title,
  description,
  visitedCount,
  totalCount,
  ctaLabel,
  passportImageUrl,
  badges,
  onStart,
  className = '',
}: CulturalPassportProps): JSX.Element {
  // Los props se validan contra el esquema; lo no provisto cae en los datos de ejemplo.
  const data = useMemo<PassportContent>(
    () =>
      PassportSchema.parse({
        eyebrow: eyebrow ?? DEFAULTS.eyebrow,
        title: title ?? DEFAULTS.title,
        description: description ?? DEFAULTS.description,
        visitedCount: visitedCount ?? DEFAULTS.visitedCount,
        totalCount: totalCount ?? DEFAULTS.totalCount,
        ctaLabel: ctaLabel ?? DEFAULTS.ctaLabel,
        passportImageUrl: passportImageUrl ?? DEFAULTS.passportImageUrl,
        badges: badges ?? DEFAULTS.badges,
      }),
    [eyebrow, title, description, visitedCount, totalCount, ctaLabel, passportImageUrl, badges],
  );

  // Accesibilidad de movimiento: con prefers-reduced-motion se desactivan las animaciones.
  const reduceMotion = useReducedMotion();

  // Progreso = visitados / total, acotado a [0, 100].
  const percent = useMemo<number>(() => {
    if (!Number.isFinite(data.totalCount) || data.totalCount <= 0) return 0;
    return Math.min(100, Math.max(0, (data.visitedCount / data.totalCount) * 100));
  }, [data.visitedCount, data.totalCount]);

  const [titleLine1, titleLine2] = useMemo<[string, string]>(() => {
    const idx = data.title.indexOf(',');
    if (idx === -1) return [data.title, ''];
    return [data.title.slice(0, idx + 1), data.title.slice(idx + 1).trim()];
  }, [data.title]);

  return (
    <section
      aria-labelledby="cultural-passport-title"
      className={[
        // Bloque contenedor: claro por defecto, oscuro (referencia) con `dark:`
        'relative w-full overflow-hidden rounded-[22px] sm:rounded-[28px]',
        'border border-[#e6dcc6] bg-[#fbf6ec] text-[#151310]',
        'shadow-[0_1px_2px_rgba(20,16,10,0.06),0_18px_44px_-28px_rgba(20,16,10,0.35)]',
        'dark:border-white/[0.07] dark:bg-[#0a0a0b] dark:text-white',
        'dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-40px_rgba(0,0,0,0.9)]',
        className,
      ].join(' ')}
    >
      {/* Halo ámbar muy sutil (idéntico en ambos temas, solo cambia la intensidad) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#e0a94a]/10 blur-3xl dark:bg-[#e0a94a]/[0.07]"
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
        {/* ---------------- COLUMNA IZQUIERDA: texto + progreso + CTA ---------------- */}
        <div className="flex min-w-0 flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          {/* Eyebrow: dash ámbar + texto en mayúsculas con tracking amplio */}
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8711a] sm:text-xs dark:text-[#e0a94a]">
            <span aria-hidden="true" className="h-px w-7 bg-[#c8912c] dark:bg-[#e0a94a]" />
            {data.eyebrow}
          </p>

          <h2
            id="cultural-passport-title"
            className="mt-5 text-[28px] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#151310] text-balance sm:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[46px] dark:text-white"
          >
            {titleLine1}
            {titleLine2 ? (
              <>
                <br />
                {titleLine2}
              </>
            ) : null}
          </h2>

          <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.65] text-[#5d5449] sm:text-base dark:text-[#a7a29a]">
            {data.description}
          </p>

          {/* -------- Bloque de progreso: pin ámbar + contador + barra animada -------- */}
          <div className="mt-7 flex items-center gap-4 sm:mt-8">
            <span
              aria-hidden="true"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#e2c88c] bg-[#e0a94a]/15 text-[#a8711a] sm:h-14 sm:w-14 dark:border-[#e0a94a]/25 dark:bg-[#e0a94a]/10 dark:text-[#e0a94a]"
            >
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[#151310] sm:text-base dark:text-white">
                {data.visitedCount} de {data.totalCount} lugares visitados
              </p>

              {/* role="progressbar" + aria-* para lectores de pantalla */}
              <div
                role="progressbar"
                aria-label={`Progreso del pasaporte cultural: ${data.visitedCount} de ${data.totalCount} lugares visitados`}
                aria-valuenow={data.visitedCount}
                aria-valuemin={0}
                aria-valuemax={data.totalCount}
                aria-valuetext={`${data.visitedCount} de ${data.totalCount} lugares visitados`}
                className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#e8ddc7] dark:bg-[#232325]"
              >
                {/* La barra se llena de 0 → percent al entrar en viewport (una sola vez).
                    Con prefers-reduced-motion se pinta directamente ya llena. */}
                {reduceMotion ? (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d9963a] to-[#f0be62]"
                    style={{ width: `${percent}%` }}
                  />
                ) : (
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#d9963a] to-[#f0be62]"
                    initial={{ width: '0%' }}
                    whileInView={{ width: `${percent}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ----------------------------- CTA principal ----------------------------- */}
          <motion.button
            type="button"
            onClick={onStart}
            aria-label={data.ctaLabel}
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.008 }}
            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="group relative mt-7 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#e5a83f] px-6 py-4 text-[15px] font-bold text-[#1c1509] shadow-[0_10px_28px_-14px_rgba(229,168,63,0.9)] transition-colors hover:bg-[#eeb352] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8711a] sm:py-5 sm:text-base dark:shadow-[0_14px_34px_-18px_rgba(229,168,63,0.75)] dark:focus-visible:outline-[#e0a94a]"
          >
            {/* Brillo que recorre el botón en loop lento (se desactiva con reduced motion) */}
            {!reduceMotion && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: '-140%' }}
                animate={{ x: '360%' }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
              />
            )}
            <BookMarked aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2.4} />
            <span className="relative">{data.ctaLabel}</span>
          </motion.button>
        </div>

        {/* ---------------- COLUMNA DERECHA: pasaporte + insignias ---------------- */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-w-0 flex-col gap-5 border-t border-[#ece2cd] px-5 pb-8 pt-2 sm:px-8 sm:pb-10 lg:border-l lg:border-t-0 lg:px-10 lg:py-12 dark:border-white/[0.06]"
        >
          {/* 1) Imagen estática del pasaporte abierto (los sellos van dentro de la imagen) */}
          <div className="relative w-full">
            <Image
              src={data.passportImageUrl}
              alt="Pasaporte cultural abierto de Yachay Ayacucho: portada con código QR y página con los sellos de los sitios históricos de Huamanga"
              width={1240}
              height={780}
              priority={false}
              sizes="(max-width: 1023px) 100vw, 55vw"
              className="h-auto w-full rounded-2xl object-contain drop-shadow-[0_18px_36px_rgba(20,16,10,0.22)] dark:drop-shadow-[0_22px_44px_rgba(0,0,0,0.65)]"
            />
          </div>

          {/* 2) Panel de INSIGNIAS (HTML/CSS), un tono por encima del bloque */}
          <div className="rounded-2xl border border-[#e7dcc4] bg-[#f2e8d5] p-4 sm:p-6 dark:border-white/[0.06] dark:bg-[#131315]">
            <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a8711a] dark:text-[#e0a94a]">
              <span aria-hidden="true" className="text-[#c8912c]/70 dark:text-[#e0a94a]/60">
                &#8249;
              </span>
              INSIGNIAS
              <span aria-hidden="true" className="text-[#c8912c]/70 dark:text-[#e0a94a]/60">
                &#8250;
              </span>
            </p>

            {/* Fila de 3 medallas: se mantiene en 3 columnas también en móvil */}
            <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-6">
              {data.badges.map((badge) => (
                <li key={badge.id} className="flex flex-col items-center">
                  <motion.div
                    className="group relative"
                    whileHover={reduceMotion ? undefined : { scale: 1.07 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  >
                    {/* Resplandor ámbar en hover */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full bg-[#e0a94a] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40 motion-reduce:transition-none motion-reduce:group-hover:opacity-0"
                    />
                    <Image
                      src={badge.imageUrl}
                      alt={
                        badge.unlocked
                          ? `Insignia desbloqueada: ${badge.label}`
                          : `Insignia bloqueada: ${badge.label}`
                      }
                      width={200}
                      height={200}
                      sizes="(max-width: 640px) 25vw, 112px"
                      className={[
                        'relative h-16 w-16 select-none rounded-full object-contain sm:h-[92px] sm:w-[92px]',
                        badge.unlocked ? '' : 'opacity-45 grayscale',
                      ].join(' ')}
                    />
                  </motion.div>

                  <span
                    className={[
                      'mt-2.5 max-w-[11ch] text-center text-[11px] font-medium leading-tight sm:mt-3 sm:max-w-[14ch] sm:text-[13px]',
                      badge.unlocked
                        ? 'text-[#4a4239] dark:text-[#d8d3cb]'
                        : 'text-[#8b8175] dark:text-[#7c766d]',
                    ].join(' ')}
                  >
                    {badge.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
