"use client";

/**
 * ClimaRecomendaciones — Yachay Ayacucho
 *
 * Sección autocontenida: encabezado alineado a la derecha y dos columnas —las
 * recomendaciones del día a la izquierda y el clima actual a la derecha—
 * separadas por un filete vertical.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: llega por la prop `tema`, igual que el resto de secciones. El
 *   componente no guarda estado de tema.
 * - Datos: `CLIMA` y `RECOMENDACIONES` son constantes tipadas. Se sustituyen
 *   enteras por las props `clima` y `recomendaciones` cuando enchufes
 *   OpenWeatherMap y tu backend; ningún otro punto del componente hay que
 *   tocar.
 * - <BloqueClima> y <FilaRecomendacion> viven en este mismo archivo porque el
 *   proyecto no tenía ni `TarjetaClima` ni `Recomendaciones` como componentes
 *   —lo comprobé—. Si los montas, cámbialos en los dos únicos puntos donde se
 *   usan, marcados más abajo, y borra los de aquí.
 *
 * ── Por qué las columnas van al revés que en el mockup ───────────────────────
 * El encabezado va alineado a la derecha, así que el clima tiene que quedar
 * debajo de la palabra "clima" del título: columna derecha para el clima,
 * izquierda para las recomendaciones. Con el orden del mockup, el título
 * apuntaba a la columna equivocada.
 *
 * En móvil ese argumento desaparece —no hay columnas— y manda otro: el clima es
 * el dato de contexto que se consulta primero, así que sube arriba. Se resuelve
 * con `order`, sin duplicar nada.
 */

import { useEffect, useRef, useState, type JSX } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  Sparkles,
  Thermometer,
  Droplet,
  Sun,
  SunMedium,
  RefreshCw,
  Mountain,
  Church,
  CalendarDays,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { type Tema, COLOR_ACENTO, COLOR_ACENTO_FUERTE } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                    Datos                                   */
/* -------------------------------------------------------------------------- */

export type NivelUV = "Bajo" | "Medio" | "Alto";

export interface Clima {
  temperatura: number;
  sensacion: number;
  ciudad: string;
  /** Decide el dibujo del icono. Reconoce "despejado", "nublado"… */
  condicion: string;
  max: number;
  min: number;
  humedad: number;
  indiceUV: NivelUV;
  /** La línea dorada destacada bajo las métricas. */
  destacado: string;
  actualizado: string;
}

export interface Recomendacion {
  id: string;
  titulo: string;
  /** Por qué se recomienda hoy. Una línea corta. */
  motivo: string;
  icono: "mirador" | "templo" | "sol" | "evento";
  /** Dónde lleva la fila. Conecta aquí tu ruta real. */
  destino: string;
}

export const CLIMA: Clima = {
  temperatura: 18,
  sensacion: 16,
  ciudad: "Huamanga, Ayacucho",
  condicion: "parcialmente nublado",
  max: 21,
  min: 10,
  humedad: 48,
  indiceUV: "Alto",
  destacado: "Tarde soleada, ideal para miradores",
  actualizado: "Actualizado hace un momento",
};

const ICONOS_RECOMENDACION: Readonly<Record<Recomendacion["icono"], LucideIcon>> = {
  mirador: Mountain,
  // `Church` y no un icono genérico: a 20 px tiene que leerse como templo de un
  // vistazo, y los de edificio sin campanario se confunden con "museo".
  templo: Church,
  sol: Sun,
  evento: CalendarDays,
};

export const RECOMENDACIONES: readonly Recomendacion[] = [
  {
    id: "acuchimay",
    titulo: "Visita el Mirador de Acuchimay",
    motivo: "Cielo despejado, gran atardecer",
    icono: "mirador",
    destino: "#lugares",
  },
  {
    id: "templos",
    titulo: "Recorre templos del centro",
    motivo: "Buen clima para caminar",
    icono: "templo",
    destino: "#lugares",
  },
  {
    id: "protector",
    titulo: "Lleva protector solar",
    motivo: "Índice UV alto",
    icono: "sol",
    destino: "#clima",
  },
  {
    id: "semana-santa",
    titulo: "Semana Santa se acerca",
    motivo: "No te la pierdas",
    icono: "evento",
    destino: "#festividades",
  },
];

const TEXTOS = {
  titulo: "Tu clima, tus recomendaciones",
  subtitulo: "El mejor momento para explorar Huamanga",
  tituloRecomendaciones: "Recomendaciones para hoy",
  max: "Máx.",
  min: "Mín.",
  humedad: "Humedad",
  indiceUV: "Índice UV",
  sensacion: (g: number) => `Sensación ${g}°`,
  grados: "grados",
  climaDe: (ciudad: string) => `Clima actual en ${ciudad}`,
};

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

interface ClimaRecomendacionesProps {
  tema: Tema;
  /** Sustituye los datos de ejemplo por los de tu proveedor de clima. */
  clima?: Clima;
  recomendaciones?: readonly Recomendacion[];
  onRefrescar?: () => void;
  onSeleccionar?: (recomendacion: Recomendacion) => void;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export function ClimaRecomendaciones({
  tema,
  clima = CLIMA,
  recomendaciones = RECOMENDACIONES,
  onRefrescar,
  onSeleccionar,
}: ClimaRecomendacionesProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;

  /* --- Paleta ------------------------------------------------------------- */
  // El dorado de marca sobre el fondo claro se queda en 2.9:1, por debajo del
  // mínimo. En tema claro el texto dorado usa el tono fuerte, que llega a 4.3:1.
  const acentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;
  const fondoSeccion = oscuro ? "bg-[#0e0d0c]" : "bg-[#faf8f5]";
  const textoBase = oscuro ? "text-neutral-100" : "text-neutral-900";
  const textoSutil = oscuro ? "text-neutral-400" : "text-neutral-500";
  const filete = oscuro ? "bg-white/12" : "bg-black/10";
  const filaHover = oscuro ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.035]";
  const burbuja = oscuro ? "bg-[#C68A4B]/15" : "bg-[#C68A4B]/12";

  const refSeccion = useRef<HTMLDivElement>(null);
  const enVista = useInView(refSeccion, { once: true, amount: 0.15 });

  return (
    <section id="clima" className={`w-full overflow-x-hidden ${fondoSeccion} ${textoBase}`}>
      <div
        ref={refSeccion}
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
      >
        {/* ========================== Encabezado ========================== */}
        {/*
          Alineado al margen derecho. En móvil el texto se queda a la derecha
          igualmente: es lo que ata el encabezado a la columna del clima, que en
          esa disposición va justo debajo.
        */}
        <header className="text-right">
          <motion.h2
            initial={quieto ? false : { opacity: 0, y: 14 }}
            animate={enVista ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold text-balance"
            style={{
              // clamp para que no desborde a 320 px ni se quede pequeño en
              // pantallas grandes.
              fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {TEXTOS.titulo}
          </motion.h2>
          <motion.p
            initial={quieto ? false : { opacity: 0, y: 14 }}
            animate={enVista ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={`mt-2 text-[15px] sm:text-base ${textoSutil}`}
          >
            {TEXTOS.subtitulo}
          </motion.p>
        </header>

        {/* =========================== Columnas =========================== */}
        {/*
          Una sola columna en móvil, dos desde `lg`. El clima lleva `order-1`
          para subir arriba en la pila y vuelve a su sitio —la derecha— cuando
          hay dos columnas.

          El filete vertical va como BORDE de la columna del clima, no como
          elemento aparte: así no puede quedarse huérfano si algún día una de
          las dos columnas no se renderiza.
        */}
        <div className="mt-10 flex flex-col gap-10 md:mt-14 lg:grid lg:grid-cols-2 lg:gap-0">
          {/* -------------------- Recomendaciones -------------------- */}
          {/* Aquí enchufarías tu <Recomendaciones />, pasándole la lista. */}
          <div className="order-2 min-w-0 lg:order-1 lg:pr-10 xl:pr-14">
            <p className="flex items-center gap-2.5 text-lg font-bold sm:text-xl">
              <Sparkles className="h-5 w-5 shrink-0" style={{ color: acentoTexto }} aria-hidden="true" />
              {TEXTOS.tituloRecomendaciones}
            </p>

            <ul className="mt-4 sm:mt-5">
              {recomendaciones.map((r, i) => (
                <li key={r.id}>
                  {/* Filete entre filas, nunca antes de la primera. */}
                  {i > 0 ? <div className={`h-px w-full ${filete}`} /> : null}
                  <FilaRecomendacion
                    recomendacion={r}
                    acentoTexto={acentoTexto}
                    burbuja={burbuja}
                    textoSutil={textoSutil}
                    filaHover={filaHover}
                    onSeleccionar={onSeleccionar}
                    quieto={quieto}
                    visible={enVista}
                    retardo={0.12 + i * 0.07}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* ------------------------- Clima ------------------------- */}
          {/* Aquí enchufarías tu <TarjetaClima />, pasándole `clima`. */}
          <div
            className={`order-1 min-w-0 lg:order-2 lg:border-l lg:pl-10 xl:pl-14 ${
              oscuro ? "lg:border-white/12" : "lg:border-black/10"
            }`}
          >
            <BloqueClima
              clima={clima}
              oscuro={oscuro}
              acentoTexto={acentoTexto}
              textoSutil={textoSutil}
              filete={filete}
              burbuja={burbuja}
              onRefrescar={onRefrescar}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                BloqueClima                                 */
/* -------------------------------------------------------------------------- */

function BloqueClima({
  clima,
  oscuro,
  acentoTexto,
  textoSutil,
  filete,
  burbuja,
  onRefrescar,
}: {
  clima: Clima;
  oscuro: boolean;
  acentoTexto: string;
  textoSutil: string;
  filete: string;
  burbuja: string;
  onRefrescar?: () => void;
}) {
  const metricas: ReadonlyArray<{
    Icono: LucideIcon;
    etiqueta: string;
    valor: string;
    acentuado?: boolean;
  }> = [
    { Icono: Thermometer, etiqueta: TEXTOS.max, valor: `${clima.max}°` },
    { Icono: Thermometer, etiqueta: TEXTOS.min, valor: `${clima.min}°` },
    { Icono: Droplet, etiqueta: TEXTOS.humedad, valor: `${clima.humedad}%` },
    { Icono: Sun, etiqueta: TEXTOS.indiceUV, valor: clima.indiceUV, acentuado: true },
  ];

  return (
    <div>
      <h3 className="sr-only">{TEXTOS.climaDe(clima.ciudad)}</h3>

      {/* Temperatura y dibujo del cielo */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-start font-bold tracking-[-0.045em]" style={{ fontSize: "clamp(3.5rem, 11vw, 6rem)", lineHeight: 0.9 }}>
            <span>{clima.temperatura}</span>
            {/* El símbolo de grado va más pequeño y alineado arriba. */}
            <span className="text-[0.42em] leading-none" aria-hidden="true">
              °
            </span>
            <span className="sr-only"> {TEXTOS.grados}</span>
          </p>
          <p className="mt-3 truncate text-lg font-bold sm:text-xl lg:text-2xl">{clima.ciudad}</p>
          <p className={`mt-1 text-[15px] sm:text-base ${textoSutil}`}>
            {TEXTOS.sensacion(clima.sensacion)}
          </p>
        </div>

        <DibujoCielo
          condicion={clima.condicion}
          className="mt-1 h-20 w-24 shrink-0 sm:h-28 sm:w-36 lg:h-32 lg:w-40"
        />
      </div>

      <div className={`my-5 h-px w-full sm:my-6 ${filete}`} />

      {/*
        Métricas. En móvil van en rejilla de dos columnas y desde `sm` pasan a
        las cuatro en fila: a 320 px las cuatro juntas no caben sin partir las
        etiquetas, y "Índice UV" es la primera que se rompe.
      */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-5">
        {metricas.map(({ Icono, etiqueta, valor, acentuado }, i) => (
          <div
            key={etiqueta}
            className={`flex items-center gap-2.5 ${
              // Filete separador entre métricas contiguas de la misma fila.
              i % 2 === 1 ? `border-l pl-4 ${oscuro ? "border-white/12" : "border-black/10"}` : ""
            } ${i === 2 ? `sm:border-l sm:pl-4 ${oscuro ? "sm:border-white/12" : "sm:border-black/10"}` : ""}`}
          >
            <Icono
              className="h-5 w-5 shrink-0"
              style={{ color: acentoTexto }}
              strokeWidth={1.7}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className={`text-xs sm:text-[13px] ${textoSutil}`}>{etiqueta}</dt>
              <dd
                className="text-base font-bold sm:text-lg"
                style={acentuado ? { color: acentoTexto } : undefined}
              >
                {valor}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className={`my-5 h-px w-full sm:my-6 ${filete}`} />

      {/* Línea destacada del día */}
      <p className="flex items-center gap-3 sm:gap-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 ${burbuja}`}>
          <SunMedium
            className="h-5 w-5 sm:h-6 sm:w-6"
            style={{ color: acentoTexto }}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </span>
        <span className="text-[15px] font-semibold sm:text-base lg:text-lg" style={{ color: acentoTexto }}>
          {clima.destacado}
        </span>
      </p>

      <div className={`my-5 h-px w-full sm:my-6 ${filete}`} />

      {/* Pie: última actualización. Botón porque se puede pulsar para refrescar. */}
      <button
        type="button"
        onClick={onRefrescar}
        className={`-m-2 flex min-h-11 items-center gap-2 rounded-lg p-2 text-xs transition-colors sm:text-[13px] ${textoSutil} ${
          oscuro ? "hover:text-neutral-200" : "hover:text-neutral-900"
        }`}
      >
        <RefreshCw className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
        {clima.actualizado}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            FilaRecomendacion                               */
/* -------------------------------------------------------------------------- */

function FilaRecomendacion({
  recomendacion,
  acentoTexto,
  burbuja,
  textoSutil,
  filaHover,
  onSeleccionar,
  quieto,
  visible,
  retardo,
}: {
  recomendacion: Recomendacion;
  acentoTexto: string;
  burbuja: string;
  textoSutil: string;
  filaHover: string;
  onSeleccionar?: (r: Recomendacion) => void;
  quieto: boolean;
  visible: boolean;
  retardo: number;
}) {
  const Icono = ICONOS_RECOMENDACION[recomendacion.icono];

  return (
    <motion.a
      /* Conecta aquí tu ruta real: hoy `destino` apunta a anclas de la página. */
      href={recomendacion.destino}
      onClick={() => onSeleccionar?.(recomendacion)}
      initial={quieto ? false : { opacity: 0, y: 12 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay: retardo, ease: [0.22, 1, 0.36, 1] }}
      className={`-mx-2 flex min-h-16 items-center gap-3 rounded-xl px-2 py-3.5 transition-colors sm:gap-4 sm:py-4 ${filaHover}`}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-12 sm:w-12 ${burbuja}`}>
        <Icono
          className="h-5 w-5 sm:h-[22px] sm:w-[22px]"
          style={{ color: acentoTexto }}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold sm:text-base">{recomendacion.titulo}</span>
        <span className={`mt-0.5 block text-[13px] sm:text-sm ${textoSutil}`}>
          {recomendacion.motivo}
        </span>
      </span>

      <ChevronRight
        className={`h-5 w-5 shrink-0 ${textoSutil}`}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </motion.a>
  );
}

/* -------------------------------------------------------------------------- */
/*                                DibujoCielo                                 */
/* -------------------------------------------------------------------------- */

/**
 * Coordenadas de los rayos, a tres decimales.
 *
 * Sin redondear, React aborta la hidratación de este SVG: las posiciones salen
 * de `Math.cos`/`Math.sin`, y el número que el servidor escribe en el atributo y
 * el que el navegador calcula difieren en el último dígito
 * (23.4833395016046 frente a 23.483339501604604). React lo lee como un atributo
 * que no coincide y avisa de un desajuste. Tres decimales sobran para un dibujo
 * de 160×120 y dejan a los dos lados escribiendo exactamente lo mismo.
 */
const redondea = (n: number): number => Number(n.toFixed(3));

/**
 * Sol con nubes, dibujado a mano en SVG en vez de con un icono de línea: el
 * mockup pide una ilustración amable a color, y un icono de trazo no da ese
 * tono. `condicion` decide si se pintan las nubes.
 */
function DibujoCielo({
  condicion,
  className,
}: {
  condicion: string;
  className?: string;
}): JSX.Element {
  const c = condicion.toLowerCase();
  const despejado = /clear|despejado|sunny|soleado/.test(c) && !/cloud|nub/.test(c);

  return (
    <svg viewBox="0 0 160 120" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="yc-sol" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#fff4c9" />
          <stop offset="55%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <linearGradient id="yc-rayo" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="yc-nube-fondo" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="yc-nube-frente" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <filter id="yc-halo" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="difuso" />
          <feMerge>
            <feMergeNode in="difuso" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sol: halo difuso + rayos radiales + núcleo con degradado */}
      <g filter="url(#yc-halo)">
        <circle cx="66" cy="46" r="32" fill="#fbbf24" opacity="0.16" />
        <g stroke="url(#yc-rayo)" strokeWidth="5" strokeLinecap="round">
          {Array.from({ length: 12 }, (_sinUsar, i) => {
            const angulo = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={redondea(66 + Math.cos(angulo) * 26)}
                y1={redondea(46 + Math.sin(angulo) * 26)}
                x2={redondea(66 + Math.cos(angulo) * 36)}
                y2={redondea(46 + Math.sin(angulo) * 36)}
              />
            );
          })}
        </g>
        <circle cx="66" cy="46" r="23" fill="url(#yc-sol)" />
      </g>

      {/* Nubes blancas superpuestas al sol */}
      {despejado ? null : (
        <g>
          <path
            d="M96 34c-11 0-20 8.5-20 19.5 0 1 .1 2 .2 3H120c7.2 0 13-5.8 13-13s-5.8-13-13-13c-2.1 0-4.1.5-5.9 1.4C111.2 25.7 104.2 34 96 34z"
            fill="url(#yc-nube-fondo)"
            opacity="0.9"
          />
          <path
            d="M60 96c-8.8 0-16-7.2-16-16s7.2-16 16-16c1.6 0 3.2.2 4.7.7C68.3 57 76.1 51 85.3 51c11.9 0 21.6 9.7 21.6 21.6 0 .9 0 1.7-.1 2.5 6.4 1.5 11.2 7.2 11.2 14 0 2.5-.7 4.9-1.9 6.9H60z"
            fill="url(#yc-nube-frente)"
          />
        </g>
      )}
    </svg>
  );
}

export default ClimaRecomendaciones;
