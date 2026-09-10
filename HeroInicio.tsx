"use client";

/**
 * HeroInicio — Yachay Ayacucho
 *
 * Tarjeta de esquinas redondeadas que ocupa una pantalla completa, con la foto
 * de Huamanga de fondo y el contenido repartido en tres franjas.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: llega por la prop `tema`. Conéctalo a next-themes (`useTheme()`) o a
 *   tu store; el componente no guarda estado de tema.
 * - Imágenes: pasa tus rutas en `imagenDia` / `imagenNoche`. Si las fotos no
 *   encuadran el mismo punto, ajusta `posicionFocoDia` / `posicionFocoNoche`
 *   (valores de `object-position`) hasta que coincidan.
 * - Traducciones: todo el copy vive en `TEXTOS` y en las listas de abajo, y se
 *   puede pisar entero con la prop `textos`. Cuando montes next-intl, el cambio
 *   es mecánico: `<HeroInicio textos={{ ... t("...") }} />`.
 * - La barra superior NO vive aquí: es <NavegacionPrincipal>, que va fija por
 *   encima de esta tarjeta. El `pt` del contenido es el que le deja sitio.
 *
 * ── Cómo está montado ────────────────────────────────────────────────────────
 * En escritorio el mockup son tres franjas —arriba, centro y pie— con dos
 * columnas cada una. Está resuelto con una rejilla de 2×3 y NO con elementos
 * flotando en absoluto: así ningún bloque puede montarse sobre otro cuando el
 * texto crece (traducciones más largas, tipografía mayor por accesibilidad).
 *
 * En móvil esa misma rejilla se desarma en una columna y el orden de lectura lo
 * fija `order-*`: titular, propuesta y llamada a la acción, prueba social,
 * tarjeta, fichas y redes. Nada flota y nada se escala: se reordena.
 *
 * ── Contraste ────────────────────────────────────────────────────────────────
 * El texto es claro en LOS DOS temas, porque la tarjeta es oscura en ambos: lo
 * que cambia con el tema es la foto y el lienzo de la página, no la tarjeta.
 * El velo tiene una capa radial extra justo detrás del titular, que es donde la
 * foto diurna se va a las luces cálidas y el blanco se caía por debajo de AA.
 */

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ShieldCheck,
  Instagram,
  Facebook,
  Twitter,
  Boxes,
  Landmark,
  CalendarDays,
  Award,
  Star,
  TriangleAlert,
  ArrowUpRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { type Tema, COLOR_ACENTO } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                   Textos                                   */
/* -------------------------------------------------------------------------- */

export interface TextosHero {
  /** El titular va partido porque dos de sus palabras van dentro de píldoras. */
  tituloLinea1: string;
  tituloPildora1: string;
  tituloLinea2: string;
  tituloPildora2: string;
  pruebaSocial: string;
  tarjetaTitulo: string;
  tarjetaTexto: string;
  /** Versión recortada de lo anterior, la que se ve en móvil. */
  tarjetaTextoCorto: string;
  etiquetaOferta: string;
  propuesta: string;
  botonPrimario: string;
  altFotoDia: string;
  altFotoNoche: string;
  irAlSiguiente: string;
}

const TEXTOS: TextosHero = {
  tituloLinea1: "Explora su",
  tituloPildora1: "historia,",
  tituloLinea2: "protege su",
  tituloPildora2: "legado.",
  pruebaSocial: "Miles de viajeros exploran Ayacucho",
  tarjetaTitulo: "Descubre. Conoce. Protege.",
  tarjetaTexto:
    "Tu guía inteligente del patrimonio de Huamanga: mapa 3D, clima y reseñas. Explora más.",
  tarjetaTextoCorto: "Mapa 3D, clima y reseñas del patrimonio de Huamanga.",
  etiquetaOferta: "Lo que te ofrecemos:",
  propuesta: "Descubre el patrimonio vivo de Ayacucho en un mapa 3D interactivo.",
  botonPrimario: "Explorar mapa 3D",
  altFotoDia: "Plaza de Armas de Huamanga, Ayacucho — de día",
  altFotoNoche: "Plaza de Armas de Huamanga, Ayacucho — de noche",
  irAlSiguiente: "Ir al siguiente bloque",
};

/** Las seis fichas de la esquina inferior izquierda. */
const OFERTA: ReadonlyArray<{ etiqueta: string; Icono: LucideIcon; href: string }> = [
  { etiqueta: "Mapa 3D", Icono: Boxes, href: "#mapa-3d" },
  { etiqueta: "Lugares históricos", Icono: Landmark, href: "#lugares" },
  { etiqueta: "Agenda cultural", Icono: CalendarDays, href: "#festividades" },
  { etiqueta: "Insignias", Icono: Award, href: "#pasaporte" },
  { etiqueta: "Reseñas", Icono: Star, href: "#comunidad" },
  { etiqueta: "Reportar daños", Icono: TriangleAlert, href: "#reportar" },
];

const REDES: ReadonlyArray<{ nombre: string; Icono: LucideIcon; href: string }> = [
  { nombre: "Instagram", Icono: Instagram, href: "#instagram" },
  { nombre: "Facebook", Icono: Facebook, href: "#facebook" },
  { nombre: "X", Icono: Twitter, href: "#x" },
];

/**
 * Prueba social. Se dibujan con iniciales y un degradado propio en vez de con
 * fotos: son cuatro avatares de 36 px que no justifican cuatro peticiones de
 * red, y así el bloque no depende de ningún archivo que pueda faltar.
 */
const VIAJEROS: ReadonlyArray<{ iniciales: string; de: string; a: string }> = [
  { iniciales: "MQ", de: "#D9A05B", a: "#A8672F" },
  { iniciales: "JC", de: "#7E9AA6", a: "#3F5A66" },
  { iniciales: "SR", de: "#C98B9B", a: "#8A4E60" },
  { iniciales: "AH", de: "#A8B58C", a: "#5E6B45" },
];

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

interface HeroInicioProps {
  tema: Tema;
  imagenDia: string;
  imagenNoche: string;
  /** `object-position` para afinar el punto focal de cada foto. */
  posicionFocoDia?: string;
  posicionFocoNoche?: string;
  /** Pisa cualquier texto; el resto se queda con el de por defecto. */
  textos?: Partial<TextosHero>;
  /** Ancla del bloque al que baja el indicador de scroll. */
  hrefSiguiente?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export function HeroInicio({
  tema,
  imagenDia,
  imagenNoche,
  posicionFocoDia = "center",
  posicionFocoNoche = "center",
  textos,
  hrefSiguiente = "#festividades",
}: HeroInicioProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;
  const t = { ...TEXTOS, ...textos };

  // Precarga las dos fotos al montar para que el crossfade nunca parpadee.
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const src of [imagenDia, imagenNoche]) {
      const img = new window.Image();
      img.src = src;
    }
  }, [imagenDia, imagenNoche]);

  /** Entrada escalonada. Con `prefers-reduced-motion` no se anima nada. */
  const entrada = (retardo: number) =>
    quieto
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay: retardo, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section id="inicio" className="w-full px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-4">
      {/*
        La tarjeta ocupa la pantalla menos su propio margen. `100svh` y no
        `100vh`: en móvil la barra del navegador entra y sale, y con `vh` el
        hero pega un salto cada vez que eso pasa.
      */}
      {/*
        El filete de un píxel no es decoración: en tema oscuro el lienzo de la
        página y la parte alta de la tarjeta son casi el mismo negro, y sin él
        las esquinas redondeadas se pierden y el hero parece ir a sangre. En
        claro apenas se nota, porque ahí el contraste ya lo da el lienzo.
      */}
      <div
        className={`relative isolate flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-3xl sm:min-h-[calc(100svh-2rem)] ${
          oscuro ? "ring-1 ring-white/10" : "ring-1 ring-black/10"
        }`}
      >
        {/* ---------------------------- Fondo ---------------------------- */}
        {/*
          Las dos fotos van siempre montadas y superpuestas exactamente igual.
          Nunca se mueven ni se escalan: lo único que cruza es la opacidad, así
          que el cambio de tema se lee como un amanecer y no como un salto.
        */}
        <div className="absolute inset-0 -z-10">
          <motion.img
            src={imagenDia}
            alt={t.altFotoDia}
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: posicionFocoDia }}
            initial={false}
            animate={{ opacity: oscuro ? 0 : 1 }}
            transition={{ duration: quieto ? 0 : 0.4, ease: "easeInOut" }}
          />
          <motion.img
            src={imagenNoche}
            alt={t.altFotoNoche}
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: posicionFocoNoche }}
            initial={false}
            animate={{ opacity: oscuro ? 1 : 0 }}
            transition={{ duration: quieto ? 0 : 0.4, ease: "easeInOut" }}
          />

          {/*
            Velo en cuatro capas, cada una con un trabajo distinto:

            1. Tinte plano, para bajar el brillo general de la foto.
            2. Refuerzo radial en el centro. Es el que salva el titular: la foto
               diurna tiene ahí el cielo y la piedra iluminada, y el blanco sobre
               eso se quedaba corto de contraste.
            3. Pie, para que las fichas y el botón se lean sobre la parte baja.
            4. Cabecera, para el navbar transparente que va por encima.

            La foto nocturna ya es oscura de partida, así que en tema oscuro el
            velo es MÁS suave que en claro; si no, la foto desaparecía.
          */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 ${oscuro ? "bg-[#0b0908]/35" : "bg-[#100c08]/45"}`}
          />
          <div
            aria-hidden="true"
            className={
              oscuro
                ? "absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_48%,rgba(8,6,5,0.55)_0%,rgba(8,6,5,0.22)_58%,transparent_82%)]"
                : "absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_48%,rgba(8,6,5,0.68)_0%,rgba(8,6,5,0.34)_58%,transparent_82%)]"
            }
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-[#0b0908]/92 via-[#0b0908]/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#0b0908]/75 to-transparent"
          />
        </div>

        {/* --------------------------- Contenido -------------------------- */}
        {/*
          Móvil: columna con el orden de lectura puesto a mano con `order-*`.
          Escritorio: rejilla de dos columnas y tres filas —cabecera, titular y
          pie—, donde la fila del medio se come el espacio sobrante y centra el
          titular. `pt` deja sitio al navbar fijo; `pb` respeta el área segura
          de iOS para que las fichas no queden bajo el indicador del sistema.
        */}
        <div className="relative z-10 flex flex-1 flex-col gap-7 px-5 pt-24 pb-[calc(1.75rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-28 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr_auto] lg:gap-x-10 lg:gap-y-0 lg:px-10 lg:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
          {/* ======================= TITULAR ======================= */}
          <motion.h1
            {...entrada(0.05)}
            className="order-1 text-left font-display font-bold text-[#faf6f0] lg:col-span-2 lg:row-start-2 lg:self-center lg:text-center"
            style={{
              // `clamp` en vez de saltos por breakpoint: a 320 px entra sin
              // desbordar y crece de forma continua hasta el tope de 4.75rem.
              fontSize: "clamp(2.25rem, 8.5vw, 4.75rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            {t.tituloLinea1}{" "}
            <PildoraTitular>{t.tituloPildora1}</PildoraTitular>
            <br />
            {t.tituloLinea2} <PildoraTitular>{t.tituloPildora2}</PildoraTitular>
          </motion.h1>

          {/* ================= PROPUESTA + CTA PRIMARIO ================= */}
          {/*
            En móvil sube justo debajo del titular: es la acción principal y no
            puede quedar al final de una columna larga. En escritorio se va al
            pie derecho, alineada con las fichas para que el bloque no flote.
          */}
          <motion.div
            {...entrada(0.14)}
            className="order-2 flex flex-col items-start gap-4 lg:col-start-2 lg:row-start-3 lg:max-w-sm lg:items-end lg:justify-self-end lg:text-right"
          >
            <p className="text-[15px] leading-relaxed text-white/75 sm:text-base lg:text-[15px]">
              {t.propuesta}
            </p>
            <a
              href="#mapa-3d"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-[#1b1206] shadow-lg transition-transform active:scale-[0.98] sm:w-auto"
              style={{
                backgroundColor: COLOR_ACENTO,
                boxShadow: `0 12px 30px -12px ${COLOR_ACENTO}b3`,
              }}
            >
              {t.botonPrimario}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.div>

          {/* ===================== PRUEBA SOCIAL ===================== */}
          <motion.div
            {...entrada(0.22)}
            className="order-3 flex items-center gap-3 lg:col-start-1 lg:row-start-1 lg:self-start"
          >
            <ul className="flex -space-x-2.5" aria-hidden="true">
              {VIAJEROS.map((v) => (
                <li
                  key={v.iniciales}
                  className="grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold text-white/90 ring-2 ring-[#0b0908]/60"
                  style={{ backgroundImage: `linear-gradient(140deg, ${v.de}, ${v.a})` }}
                >
                  {v.iniciales}
                </li>
              ))}
            </ul>
            <p className="max-w-[16ch] text-[13px] leading-tight text-white/80 sm:max-w-none sm:text-sm">
              {t.pruebaSocial}
            </p>
          </motion.div>

          {/* ================ TARJETA GLASS + REDES ================ */}
          <motion.div
            {...entrada(0.3)}
            className="order-4 flex items-start gap-3 lg:col-start-2 lg:row-start-1 lg:justify-self-end"
          >
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5 lg:max-w-sm lg:text-right">
              <ShieldCheck
                className="h-5 w-5 lg:ml-auto"
                style={{ color: COLOR_ACENTO }}
                aria-hidden="true"
              />
              <h2 className="mt-2.5 font-display text-lg font-bold text-[#faf6f0] sm:text-xl">
                {t.tarjetaTitulo}
              </h2>
              {/*
                Dos versiones del mismo párrafo en vez de una recortada con
                puntos suspensivos: en móvil la tarjeta compite con el resto de
                la columna y el texto largo la convertía en un muro.
              */}
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/70 sm:text-sm">
                <span className="sm:hidden">{t.tarjetaTextoCorto}</span>
                <span className="hidden sm:inline">{t.tarjetaTexto}</span>
              </p>
            </div>

            {/* Tira vertical de redes: solo en escritorio, al costado. */}
            <Redes className="hidden flex-col lg:flex" />
          </motion.div>

          {/* ========================= FICHAS ========================= */}
          <motion.div
            {...entrada(0.38)}
            className="order-5 lg:col-start-1 lg:row-start-3 lg:self-end"
          >
            <p className="text-[13px] font-semibold text-white/70 sm:text-sm">
              {t.etiquetaOferta}
            </p>

            {/*
              Móvil: carril que se arrastra en horizontal con anclaje, sangrado
              hasta el borde para que se vea que sigue. Desde `sm` ya hay ancho
              de sobra y se convierte en fichas que fluyen en varias líneas.

              Los márgenes negativos van acompañados del mismo relleno: el
              carril se sale del bloque pero su contenido sigue alineado con el
              resto de la columna.
            */}
            <ul className="sin-barra-scroll -mx-5 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {OFERTA.map(({ etiqueta, Icono, href }) => (
                <li key={etiqueta} className="shrink-0 snap-start sm:shrink">
                  <a
                    href={href}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-[13px] font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20 sm:text-sm"
                  >
                    <Icono className="h-4 w-4 shrink-0" style={{ color: COLOR_ACENTO }} aria-hidden="true" />
                    <span className="whitespace-nowrap">{etiqueta}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ============ REDES EN MÓVIL: PIE DISCRETO ============ */}
          <motion.div {...entrada(0.46)} className="order-6 lg:hidden">
            <Redes className="flex-row justify-start" />
          </motion.div>
        </div>

        {/* ---------------------- Indicador de scroll ---------------------- */}
        {/*
          Solo en escritorio: en móvil el contenido ya llega hasta abajo y un
          chevron flotando se montaría sobre las fichas.
        */}
        <motion.a
          href={hrefSiguiente}
          aria-label={t.irAlSiguiente}
          animate={quieto ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-5 left-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-white/25 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 lg:grid"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Auxiliares                                */
/* -------------------------------------------------------------------------- */

/**
 * Palabra del titular dentro de una píldora crema.
 *
 * `inline-block` con relleno en `em` para que la cápsula crezca con la letra y
 * no haya que reajustarla en cada breakpoint. `whitespace-nowrap` es lo que
 * garantiza que la palabra caiga entera al renglón siguiente en vez de
 * partirse por la mitad, que es justo lo que no queremos a 320 px.
 */
function PildoraTitular({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-[#f5ece0] px-[0.3em] pb-[0.06em] whitespace-nowrap text-[#17120c]">
      {children}
    </span>
  );
}

/** Tira de redes. Se usa en vertical en escritorio y en horizontal en móvil. */
function Redes({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex gap-1 ${className}`}>
      {REDES.map(({ nombre, Icono, href }) => (
        <li key={nombre}>
          <a
            href={href}
            aria-label={nombre}
            className="grid h-11 w-11 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icono className="h-4.5 w-4.5" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default HeroInicio;
