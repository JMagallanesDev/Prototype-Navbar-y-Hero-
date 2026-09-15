"use client";

/**
 * MapHero — "Explora Ayacucho como nunca antes" · Yachay Ayacucho
 *
 * Hero con el texto a la izquierda y, a la derecha, un mapa SVG interactivo del
 * departamento de Ayacucho dividido en sus 11 provincias: fronteras doradas,
 * un marcador con nombre por provincia (Huamanga destacada), tooltip al pasar
 * el cursor y zoom animado a la provincia al hacer clic.
 *
 * Autónomo: estilo propio con utilidades Tailwind y valores literales; la
 * paleta oscura va con la variante `dark:` (clase `.dark` en un ancestro).
 * Geometría incrustada en `provincias-ayacucho-detalle.ts`: sin fetch.
 *
 * Conexión con tu proyecto:
 * - `onExplore()` → botón "Explorar mapa 3D".
 * - `onSelectProvince(nombre)` → clic en una provincia. Recibe NOMBPROV tal
 *   cual viene del GeoJSON ("VILCAS HUAMAN"), que es la clave estable; para
 *   mostrarlo usa `normalizarNombreProvincia` de `lib/provincias.ts`.
 */

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight, Landmark, Map as MapIcon, Minimize2 } from "lucide-react";
import { normalizarNombreProvincia } from "@/lib/provincias";
import { PROVINCIAS_AYACUCHO_DETALLE, type LonLat } from "./provincias-ayacucho-detalle";

/* -------------------------------------------------------------------------- */
/*                                  Geometría                                 */
/* -------------------------------------------------------------------------- */

type Punto = readonly [number, number];
type Anillo = readonly Punto[];
/** viewBox: [x, y, ancho, alto] */
type Vista = readonly [number, number, number, number];

interface ProvinciaSvg {
  id: string; // NOMBPROV original
  nombre: string; // normalizado para mostrar
  capital: string; // normalizada
  d: string;
  anillos: readonly Anillo[];
  caja: Vista;
  /** Punto interior donde va el marcador. */
  ancla: Punto;
  area: number;
  principal: boolean;
}

const ALTO_MAPA = 1000; // alto del mapa en unidades SVG; el ancho sale de la proyección
const MARGEN_MAPA = 36; // aire alrededor para el resplandor del borde
const PROVINCIA_PRINCIPAL = "HUAMANGA";

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
 * MARCADORES: el centroide puede caer fuera de una provincia cóncava, así que
 * se usa el "polo de inaccesibilidad": el punto interior más alejado de la
 * frontera. Rejilla gruesa sobre la caja y dos refinados alrededor del mejor.
 */
function puntoInterior(anillos: readonly Anillo[], [x0, y0, w, h]: Vista): Punto {
  let mejor: Punto = [x0 + w / 2, y0 + h / 2];
  let mejorDist = -1;
  const probar = (x: number, y: number) => {
    if (!dentro(anillos, x, y)) return;
    const d = distanciaAlBorde(anillos, x, y);
    if (d > mejorDist) [mejor, mejorDist] = [[x, y], d];
  };
  const pasos = 18;
  for (let i = 0; i <= pasos; i++) for (let j = 0; j <= pasos; j++) probar(x0 + (w * i) / pasos, y0 + (h * j) / pasos);
  let radio = Math.max(w, h) / pasos;
  for (let r = 0; r < 2; r++, radio /= 3) {
    const [cx, cy] = mejor;
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) probar(cx + (i * radio) / 3, cy + (j * radio) / 3);
  }
  return mejor;
}

/**
 * PROYECCIÓN: equirectangular local. Un grado de longitud mide cos(lat) veces
 * un grado de latitud, así que x ∝ lon·cos(latMedia) e y ∝ −lat conservan la
 * forma del departamento. La caja total se escala a ALTO_MAPA unidades.
 * Se calcula una sola vez, al cargar el módulo.
 */
const GEOMETRIA = (() => {
  const exteriores = PROVINCIAS_AYACUCHO_DETALLE.flatMap((p) => p.anillos[0]!);
  const minLon = Math.min(...exteriores.map(([lon]) => lon));
  const maxLon = Math.max(...exteriores.map(([lon]) => lon));
  const minLat = Math.min(...exteriores.map(([, lat]) => lat));
  const maxLat = Math.max(...exteriores.map(([, lat]) => lat));
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const unidad = ALTO_MAPA / (maxLat - minLat);
  const ancho = (maxLon - minLon) * k * unidad;
  const proyectar = ([lon, lat]: LonLat): Punto => [(lon - minLon) * k * unidad, (maxLat - lat) * unidad];
  const n1 = (v: number) => Math.round(v * 10) / 10;

  const provincias: ProvinciaSvg[] = PROVINCIAS_AYACUCHO_DETALLE.map((p) => {
    const anillos = p.anillos.map((a) => a.map(proyectar));
    const ext = anillos[0]!;
    const xs = ext.map(([x]) => x);
    const ys = ext.map(([, y]) => y);
    const caja: Vista = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    let area = 0;
    for (let i = 0, j = ext.length - 1; i < ext.length; j = i++) area += (ext[j]![0] + ext[i]![0]) * (ext[j]![1] - ext[i]![1]);
    return {
      id: p.provincia,
      nombre: normalizarNombreProvincia(p.provincia),
      capital: normalizarNombreProvincia(p.capital),
      d: anillos.map((a) => `M${a.map(([x, y]) => `${n1(x)} ${n1(y)}`).join("L")}Z`).join(""),
      anillos,
      caja,
      ancla: puntoInterior(anillos, caja),
      area: Math.abs(area / 2),
      principal: p.provincia === PROVINCIA_PRINCIPAL,
    };
  });

  const general: Vista = [-MARGEN_MAPA, -MARGEN_MAPA, ancho + MARGEN_MAPA * 2, ALTO_MAPA + MARGEN_MAPA * 2];
  return { provincias, general, contorno: provincias.map((p) => p.d).join("") };
})();

/**
 * ZOOM: la vista de una provincia es su caja con aire alrededor y un tamaño
 * mínimo, para que las provincias pequeñas no se acerquen de más.
 */
function vistaDeProvincia(p: ProvinciaSvg): Vista {
  const [x, y, w, h] = p.caja;
  const lado = Math.max(w, h, 240) * 1.45;
  return [x + w / 2 - lado / 2, y + h / 2 - lado / 2, lado, lado];
}

/** Convierte coordenadas SVG a píxeles del contenedor (equivale a `xMidYMid meet`). */
function proyector(vista: Vista, ancho: number, alto: number) {
  const s = ancho && alto ? Math.min(ancho / vista[2], alto / vista[3]) : 0;
  const ox = (ancho - vista[2] * s) / 2;
  const oy = (alto - vista[3] * s) / 2;
  return ([x, y]: Punto): Punto => [ox + (x - vista[0]) * s, oy + (y - vista[1]) * s];
}

/* -------------------------------------------------------------------------- */
/*                                  Etiquetas                                 */
/* -------------------------------------------------------------------------- */

const ALTO_ETIQUETA = 24;
const anchoEtiqueta = (nombre: string) => Math.round(nombre.length * 6.4 + 22);
const tamPin = (principal: boolean) => (principal ? { w: 28, h: 36 } : { w: 20, h: 26 });

interface Caja2D {
  x: number;
  y: number;
  w: number;
  h: number;
}
const chocan = (a: Caja2D, b: Caja2D) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Coloca las etiquetas sin que se pisen. Van por prioridad (Huamanga primero,
 * luego de mayor a menor área) y cada una prueba cuatro sitios alrededor de su
 * pin: debajo, encima, derecha e izquierda. Si ninguno cabe dentro del
 * contenedor sin chocar con otra etiqueta o con un pin, se oculta (el pin
 * sigue). Así en móvil aparecen menos etiquetas sin reglas aparte.
 * Devuelve, por provincia, el índice del sitio elegido.
 */
function colocarEtiquetas(aPantalla: (p: Punto) => Punto, ancho: number, alto: number): Map<string, number> {
  const orden = [...GEOMETRIA.provincias].sort((a, b) => Number(b.principal) - Number(a.principal) || b.area - a.area);
  const pines: Caja2D[] = orden.map((p) => {
    const [x, y] = aPantalla(p.ancla);
    const t = tamPin(p.principal);
    return { x: x - t.w / 2, y: y - t.h, w: t.w, h: t.h };
  });
  const ocupadas: Caja2D[] = [];
  const res = new Map<string, number>();
  orden.forEach((p) => {
    const [x, y] = aPantalla(p.ancla);
    if (x < 0 || y < 0 || x > ancho || y > alto) return;
    const w = anchoEtiqueta(p.nombre);
    const hp = tamPin(p.principal).h;
    const sitios = sitiosEtiqueta(x, y, w, hp);
    const i = sitios.findIndex(
      (c) =>
        c.x >= 4 && c.y >= 4 && c.x + c.w <= ancho - 4 && c.y + c.h <= alto - 4 &&
        !ocupadas.some((o) => chocan(o, c)) &&
        !pines.some((pin) => chocan(pin, c)),
    );
    if (i >= 0) {
      ocupadas.push(sitios[i]!);
      res.set(p.id, i);
    }
  });
  return res;
}

function sitiosEtiqueta(x: number, y: number, w: number, altoPin: number): Caja2D[] {
  const h = ALTO_ETIQUETA;
  return [
    { x: x - w / 2, y: y + 6, w, h }, // debajo
    { x: x - w / 2, y: y - altoPin - h - 6, w, h }, // encima
    { x: x + 14, y: y - altoPin / 2 - h / 2, w, h }, // derecha
    { x: x - 14 - w, y: y - altoPin / 2 - h / 2, w, h }, // izquierda
  ];
}

/* -------------------------------------------------------------------------- */
/*                               Capa de provincias                           */
/* -------------------------------------------------------------------------- */

interface CapaProps {
  idBase: string;
  activa: string | null;
  seleccion: string | null;
  visible: boolean;
  quieto: boolean;
  /** Aumento de la vista de destino (1 = general). */
  zoom: number;
  onEntrar: (id: string, e: ReactPointerEvent<SVGPathElement>) => void;
  onMover: (e: ReactPointerEvent<SVGPathElement>) => void;
  onSalir: () => void;
  onElegir: (id: string) => void;
  onFoco: (id: string | null) => void;
}

/**
 * El SVG pesado (11 paths con ~2100 vértices) va memoizado: durante el zoom
 * solo cambia el `viewBox` del <svg> padre y esta capa no se vuelve a pintar.
 */
const CapaProvincias = memo(function CapaProvincias({
  idBase,
  activa,
  seleccion,
  visible,
  quieto,
  zoom,
  onEntrar,
  onMover,
  onSalir,
  onElegir,
  onFoco,
}: CapaProps) {
  const mascara = `${idBase}-fuera`;
  const brillo = `${idBase}-brillo`;

  return (
    <>
      <defs>
        {/*
          El desenfoque y el grosor del resplandor van en unidades del mapa, así
          que crecerían con el zoom y el brillo se volvería una mancha. Se
          dividen por el aumento de la vista de destino para verse igual.
        */}
        <filter id={brillo} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={9 / zoom} />
        </filter>
        {/*
          BORDE EXTERIOR: máscara que solo deja ver lo que queda FUERA del
          departamento. Un trazo grueso de todas las provincias pasado por ella
          conserva únicamente la mitad exterior; las fronteras internas quedan
          tapadas por las provincias de ambos lados.
        */}
        <mask id={mascara} maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="11000" height="11000">
          <rect x="-5000" y="-5000" width="11000" height="11000" fill="#fff" />
          <path d={GEOMETRIA.contorno} fill="#000" />
        </mask>
      </defs>

      {/* Resplandor del borde exterior. */}
      <path
        d={GEOMETRIA.contorno}
        fill="none"
        className="stroke-[#C68A4B] opacity-40 dark:stroke-[#F0A93E] dark:opacity-60"
        strokeWidth={16 / zoom}
        mask={`url(#${mascara})`}
        filter={`url(#${brillo})`}
        pointerEvents="none"
      />

      {GEOMETRIA.provincias.map((p, i) => {
        const encendida = activa === p.id || seleccion === p.id;
        return (
          <g key={p.id}>
            {/* Huamanga: resplandor propio detrás de su relleno. */}
            {p.principal && (
              <path
                d={p.d}
                // Solo trazo, sin relleno: difuminado, un relleno se convierte en
                // una mancha al hacer zoom (el desenfoque crece con el viewBox).
                fill="none"
                className="stroke-[#C68A4B] opacity-70 dark:stroke-[#F0A93E] dark:opacity-80"
                strokeWidth={8 / zoom}
                filter={`url(#${brillo})`}
                pointerEvents="none"
              />
            )}
            <motion.path
              d={p.d}
              role="button"
              tabIndex={0}
              aria-label={`${p.nombre}. Capital: ${p.capital}. Acercar el mapa`}
              aria-pressed={seleccion === p.id}
              initial={quieto ? false : { opacity: 0, scale: 0.94 }}
              animate={visible || quieto ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              vectorEffect="non-scaling-stroke"
              /*
                FRONTERAS Y HOVER: relleno translúcido con tinte ámbar y trazo
                dorado de grosor fijo en píxeles (`non-scaling-stroke`), que no
                engorda al hacer zoom. Encendida (hover, foco o seleccionada):
                más relleno, dorado más claro y trazo más grueso.
              */
              className={`cursor-pointer outline-none transition-[fill,stroke,stroke-width] duration-200 ${
                p.principal
                  ? encendida
                    ? "fill-[#C68A4B]/50 stroke-[#8F5718] [stroke-width:2.2] dark:fill-[#F0A93E]/45 dark:stroke-[#FFE0A8]"
                    : "fill-[#C68A4B]/35 stroke-[#A8672F] [stroke-width:1.5] dark:fill-[#F0A93E]/30 dark:stroke-[#F6C275]"
                  : encendida
                    ? "fill-[#C68A4B]/25 stroke-[#8F5718] [stroke-width:2.2] dark:fill-[#F0A93E]/20 dark:stroke-[#FFE0A8]"
                    : "fill-[#C68A4B]/10 stroke-[#B8752A] [stroke-width:1.2] dark:fill-[#F0A93E]/[0.07] dark:stroke-[#E9B064]/85"
              }`}
              onPointerEnter={(e) => onEntrar(p.id, e)}
              onPointerMove={onMover}
              onPointerLeave={onSalir}
              onClick={(e) => {
                e.stopPropagation();
                onElegir(p.id);
              }}
              onFocus={() => onFoco(p.id)}
              onBlur={() => onFoco(null)}
              onKeyDown={(e: KeyboardEvent<SVGPathElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onElegir(p.id);
                }
              }}
            />
          </g>
        );
      })}

      {/* Borde exterior del departamento, más marcado que las divisiones. */}
      <path
        d={GEOMETRIA.contorno}
        fill="none"
        className="stroke-[#A8672F] dark:stroke-[#F6C275]"
        strokeWidth={4}
        vectorEffect="non-scaling-stroke"
        mask={`url(#${mascara})`}
        pointerEvents="none"
      />
    </>
  );
});

/* -------------------------------------------------------------------------- */
/*                                  Marcador                                  */
/* -------------------------------------------------------------------------- */

function Marcador({ principal, quieto }: { principal: boolean; quieto: boolean }) {
  const { w, h } = tamPin(principal);
  return (
    <span className="relative block" style={{ width: w, height: h }}>
      {/* Halo pulsante solo en Huamanga. */}
      {principal && (
        <motion.span
          aria-hidden="true"
          className="absolute left-1/2 size-14 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,169,62,0.55)_0%,rgba(240,169,62,0)_70%)]"
          style={{ bottom: -20 }}
          animate={quieto ? undefined : { scale: [0.8, 1.35, 0.8], opacity: [0.9, 0.35, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <svg viewBox="0 0 20 26" width={w} height={h} className="relative drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)]" aria-hidden="true">
        <path d="M10 26C7.5 20 1 15.5 1 9.5A9 9 0 0 1 19 9.5C19 15.5 12.5 20 10 26Z" fill="#F0A93E" stroke="#FFD699" strokeWidth="0.8" />
        <circle cx="10" cy="9.5" r="3.4" fill="#1F1407" />
      </svg>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export interface MapHeroProps {
  eyebrow?: string;
  /** Líneas del título; cada una va en su propia línea desde `sm`. */
  titleLines?: readonly string[];
  subtitle?: string;
  ctaLabel?: string;
  badgeLabel?: string;
  onExplore?: () => void;
  /** Recibe NOMBPROV original, p. ej. "VILCAS HUAMAN". */
  onSelectProvince?: (nombre: string) => void;
  className?: string;
}

const TEXTOS = {
  eyebrow: "Mapa 3D interactivo",
  titleLines: ["Explora Ayacucho", "como nunca antes"],
  subtitle: "Navega el patrimonio de Huamanga en un mapa 3D con clima y recomendaciones en tiempo real",
  ctaLabel: "Explorar mapa 3D",
  badgeLabel: "30+ lugares patrimoniales",
  volver: "Vista general",
  ayuda: "Toca una provincia para acercarte",
  capital: "Capital",
};

export function MapHero({
  eyebrow = TEXTOS.eyebrow,
  titleLines = TEXTOS.titleLines,
  subtitle = TEXTOS.subtitle,
  ctaLabel = TEXTOS.ctaLabel,
  badgeLabel = TEXTOS.badgeLabel,
  onExplore,
  onSelectProvince,
  className = "",
}: MapHeroProps) {
  const quieto = useReducedMotion() ?? false;
  // useId trae caracteres que rompen `url(#…)`: se dejan solo letras y números.
  const idBase = `mh${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const refSeccion = useRef<HTMLElement>(null);
  const enVista = useInView(refSeccion, { once: true, amount: 0.2 });

  /* --- Tamaño del lienzo ------------------------------------------------- */
  const refLienzo = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = refLienzo.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setTam({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --- Cámara (zoom al viewBox) ------------------------------------------ */
  /*
    ZOOM: en SVG no hay cámara; lo que se anima es el `viewBox`. `animate()` de
    Motion recorre un progreso 0→1 y en cada fotograma se interpola la vista
    entre origen y destino. La capa de provincias está memoizada, así que en
    cada fotograma solo cambian el atributo `viewBox` y la posición de los
    marcadores. Con movimiento reducido el cambio es instantáneo.
  */
  const [vista, setVista] = useState<Vista>(GEOMETRIA.general);
  const [destino, setDestino] = useState<Vista>(GEOMETRIA.general);
  const refVista = useRef<Vista>(GEOMETRIA.general);
  const refAnimacion = useRef<ReturnType<typeof animate> | null>(null);

  const irA = useCallback(
    (hacia: Vista) => {
      refAnimacion.current?.stop();
      setDestino(hacia);
      const desde = refVista.current;
      if (quieto) {
        refVista.current = hacia;
        setVista(hacia);
        return;
      }
      refAnimacion.current = animate(0, 1, {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (t) => {
          const v = desde.map((d, i) => d + (hacia[i]! - d) * t) as unknown as Vista;
          refVista.current = v;
          setVista(v);
        },
      });
    },
    [quieto],
  );
  useEffect(() => () => refAnimacion.current?.stop(), []);

  /* --- Selección, hover y foco ------------------------------------------ */
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [foco, setFoco] = useState<string | null>(null);

  const posicionRelativa = (e: ReactPointerEvent) => {
    const r = refLienzo.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };

  // HOVER: solo con ratón o lápiz. En táctil el "hover" se quedaría pegado; ahí
  // el tooltip lo muestra la selección, anclado al marcador.
  const onEntrar = useCallback((id: string, e: ReactPointerEvent<SVGPathElement>) => {
    if (e.pointerType === "touch") return;
    setHover({ id, ...posicionRelativa(e) });
  }, []);
  const onMover = useCallback((e: ReactPointerEvent<SVGPathElement>) => {
    if (e.pointerType === "touch") return;
    const pos = posicionRelativa(e);
    setHover((h) => (h ? { ...h, ...pos } : h));
  }, []);
  const onSalir = useCallback(() => setHover(null), []);

  const onElegir = useCallback(
    (id: string) => {
      const p = GEOMETRIA.provincias.find((q) => q.id === id);
      if (!p) return;
      setSeleccion(id);
      irA(vistaDeProvincia(p));
      onSelectProvince?.(id);
    },
    [irA, onSelectProvince],
  );

  const volver = useCallback(() => {
    setSeleccion(null);
    irA(GEOMETRIA.general);
  }, [irA]);

  /* --- Marcadores, etiquetas y tooltip en píxeles ----------------------- */
  const aPantalla = proyector(vista, tam.w, tam.h);
  // Qué etiquetas caben se decide con la vista de DESTINO, no fotograma a
  // fotograma: así no parpadean durante el zoom.
  const sitios = useMemo(
    () => (tam.w ? colocarEtiquetas(proyector(destino, tam.w, tam.h), tam.w, tam.h) : new Map<string, number>()),
    [destino, tam.w, tam.h],
  );

  const conTooltip = hover?.id ?? foco ?? seleccion;
  const provTooltip = GEOMETRIA.provincias.find((p) => p.id === conTooltip);
  const posTooltip: Punto | null = provTooltip
    ? hover && hover.id === provTooltip.id
      ? [hover.x, hover.y - 16]
      : (() => {
          const [x, y] = aPantalla(provTooltip.ancla);
          return [x, y - tamPin(provTooltip.principal).h - 8] as const;
        })()
    : null;

  const entrada = (retardo: number) =>
    quieto
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 14 },
          animate: enVista ? { opacity: 1, y: 0 } : undefined,
          transition: { duration: 0.55, delay: retardo, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section
      ref={refSeccion}
      id="mapa-3d"
      aria-labelledby={`${idBase}-titulo`}
      className={`relative isolate w-full overflow-hidden bg-[#faf8f5] dark:bg-[#0e0d0c] ${className}`}
    >
      <div className="relative flex flex-col md:min-h-[min(88svh,46rem)] md:flex-row md:items-center">
        {/* ------------------------------ Texto ------------------------------ */}
        {/*
          Móvil: ancho completo, arriba. Tablet: ~55 %. Escritorio: ~45 %.
          Desde `lg` la sangría va en `vw`, igual que el resto de secciones.
        */}
        <div className="relative z-20 w-full px-4 pt-14 sm:px-6 sm:pt-20 md:w-[55%] md:py-20 lg:w-[46%] lg:pr-0 lg:pl-[max(2rem,6vw)]">
          <div className="w-full max-w-xl">
            <motion.p
              {...entrada(0)}
              className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] text-[#A8672F] uppercase sm:text-xs dark:text-[#E7A94F]"
            >
              <span aria-hidden="true" className="h-px w-7 shrink-0 bg-current" />
              {eyebrow}
            </motion.p>

            <motion.h2
              {...entrada(0.08)}
              id={`${idBase}-titulo`}
              className="mt-5 font-bold text-balance text-[#1b1712] dark:text-white"
              style={{
                fontFamily: "var(--font-fraunces), ui-serif, Georgia, serif",
                fontSize: "clamp(2rem, 4.2vw, 3.5rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {titleLines.map((linea, i) => (
                <span key={linea} className="sm:block">
                  {linea}
                  {i < titleLines.length - 1 ? " " : ""}
                </span>
              ))}
            </motion.h2>

            <motion.p
              {...entrada(0.16)}
              className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-700 sm:text-base dark:text-white/70"
            >
              {subtitle}
            </motion.p>

            <motion.div {...entrada(0.24)} className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#C68A4B] px-6 text-[15px] font-semibold whitespace-nowrap text-[#1b1206] shadow-[0_14px_34px_-14px_rgba(198,138,75,0.8)] transition-[transform,background-color] hover:bg-[#D39A5C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8672F] active:scale-[0.98] dark:focus-visible:outline-[#F0B45E]"
              >
                <MapIcon className="size-[18px]" aria-hidden="true" />
                {ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>

              <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white/70 px-5 text-[14px] font-medium text-neutral-800 backdrop-blur-sm dark:border-white/15 dark:bg-white/[0.07] dark:text-white/90">
                <Landmark className="size-4 shrink-0 text-[#A8672F] dark:text-[#E7A94F]" aria-hidden="true" />
                {badgeLabel}
              </span>
            </motion.div>
          </div>
        </div>

        {/* ------------------------------ Mapa ------------------------------ */}
        {/*
          Móvil: bloque propio debajo del texto, así el mapa es tocable sin que
          el texto lo tape. Desde `md` ocupa la mitad derecha a todo el alto.
        */}
        <div className="relative h-[min(125vw,36rem)] w-full md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[50%] lg:w-[58%]">
          <div
            ref={refLienzo}
            className="absolute inset-0"
            onKeyDown={(e) => {
              if (e.key === "Escape" && seleccion) volver();
            }}
          >
            <svg
              viewBox={vista.join(" ")}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 size-full touch-manipulation"
              role="group"
              aria-label="Mapa de las 11 provincias de Ayacucho"
            >
              {/* Fondo que recoge el clic fuera de las provincias: vuelve a la vista general. */}
              <rect x="-5000" y="-5000" width="11000" height="11000" fill="transparent" onClick={() => seleccion && volver()} />
              <CapaProvincias
                idBase={idBase}
                activa={hover?.id ?? foco}
                seleccion={seleccion}
                visible={enVista}
                quieto={quieto}
                zoom={GEOMETRIA.general[3] / destino[3]}
                onEntrar={onEntrar}
                onMover={onMover}
                onSalir={onSalir}
                onElegir={onElegir}
                onFoco={setFoco}
              />
            </svg>

            {/*
              INTEGRACIÓN CON EL FONDO (sin capturar el puntero): degradado desde
              la izquierda para que el mapa no compita con el texto, fundidos
              arriba y abajo, y una viñeta que funde los bordes con la página.
            */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#faf8f5_0%,rgba(250,248,245,0.85)_10%,rgba(250,248,245,0)_32%)] md:block dark:bg-[linear-gradient(90deg,#0e0d0c_0%,rgba(14,13,12,0.85)_10%,rgba(14,13,12,0)_32%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#faf8f5_0%,rgba(250,248,245,0)_14%,rgba(250,248,245,0)_86%,#faf8f5_100%)] dark:bg-[linear-gradient(180deg,#0e0d0c_0%,rgba(14,13,12,0)_14%,rgba(14,13,12,0)_86%,#0e0d0c_100%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,248,245,0)_60%,rgba(250,248,245,0.9)_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(14,13,12,0)_60%,rgba(14,13,12,0.9)_100%)]"
            />

            {/* ------------------- Marcadores y etiquetas ------------------- */}
            {tam.w > 0 && (
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {GEOMETRIA.provincias.map((p, i) => {
                  const [x, y] = aPantalla(p.ancla);
                  // Fuera del lienzo (p. ej. tras un zoom) no se pinta: evita pines cortados.
                  if (x < 8 || y < 8 || x > tam.w - 8 || y > tam.h - 8) return null;
                  const { w, h } = tamPin(p.principal);
                  const sitio = sitios.get(p.id);
                  const caja = sitio === undefined ? null : sitiosEtiqueta(x, y, anchoEtiqueta(p.nombre), h)[sitio]!;
                  return (
                    <motion.div
                      key={p.id}
                      className={`absolute top-0 left-0 ${p.principal ? "z-10" : ""}`}
                      initial={quieto ? false : { opacity: 0, scale: 0.6 }}
                      animate={enVista || quieto ? { opacity: 1, scale: 1 } : undefined}
                      transition={{ duration: 0.45, delay: 0.55 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span className="absolute" style={{ transform: `translate(${x - w / 2}px, ${y - h}px)` }}>
                        <Marcador principal={p.principal} quieto={quieto} />
                      </span>
                      {caja && (
                        <span
                          className={`absolute flex h-6 items-center justify-center rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap backdrop-blur-[3px] ${
                            p.principal
                              ? "bg-[#1F1407]/85 text-[#FFE0A8] ring-1 ring-[#F0A93E]/50"
                              : "bg-white/85 text-neutral-800 ring-1 ring-black/10 dark:bg-black/55 dark:text-white/90 dark:ring-white/10"
                          }`}
                          style={{ width: caja.w, transform: `translate(${caja.x}px, ${caja.y}px)` }}
                        >
                          {p.nombre}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ---------------------------- Tooltip ---------------------------- */}
            <AnimatePresence>
              {provTooltip && posTooltip && (
                <motion.div
                  key={provTooltip.id}
                  role="status"
                  className="pointer-events-none absolute top-0 left-0 z-30"
                  style={{ x: posTooltip[0], y: posTooltip[1] }}
                  initial={quieto ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                >
                  <div className="-translate-x-1/2 -translate-y-full rounded-xl bg-white/95 px-3 py-2 whitespace-nowrap shadow-[0_10px_30px_-10px_rgba(60,36,6,0.35)] ring-1 ring-black/10 dark:bg-[#15110c]/92 dark:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)] dark:ring-[#F0A93E]/30">
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-white">{provTooltip.nombre}</p>
                    <p className="text-[12px] text-neutral-600 dark:text-white/65">
                      {TEXTOS.capital}: <span className="font-medium text-[#8F5718] dark:text-[#F6C275]">{provTooltip.capital}</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ----------------------- Volver / ayuda ------------------------ */}
            <AnimatePresence>
              {seleccion ? (
                <motion.button
                  key="volver"
                  type="button"
                  onClick={volver}
                  initial={quieto ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-3 right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/90 px-4 text-[13px] font-semibold text-neutral-800 shadow-sm ring-1 ring-black/10 backdrop-blur focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8672F] md:top-6 md:right-6 dark:bg-black/60 dark:text-white dark:ring-white/15 dark:focus-visible:outline-[#F0B45E]"
                >
                  <Minimize2 className="size-4" aria-hidden="true" />
                  {TEXTOS.volver}
                </motion.button>
              ) : (
                <motion.p
                  key="ayuda"
                  initial={quieto ? false : { opacity: 0 }}
                  animate={{ opacity: enVista || quieto ? 1 : 0, transition: { delay: quieto ? 0 : 1.1 } }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="pointer-events-none absolute right-4 bottom-4 z-30 text-[12px] text-neutral-500 md:right-6 md:bottom-8 dark:text-white/45"
                >
                  {TEXTOS.ayuda}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MapHero;
