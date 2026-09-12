"use client";

/**
 * HeroInicio — Yachay Ayacucho
 *
 * Bloque a sangre de una pantalla completa: la foto de Huamanga ocupa el fondo
 * entero y el contenido vive en una sola columna alineada a la IZQUIERDA, con
 * la foto respirando por la derecha.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: llega por la prop `tema`. Conéctalo a next-themes (`useTheme()`) o a
 *   tu store; el componente no guarda estado de tema.
 * - Imágenes: pasa tus rutas en `imagenDia` / `imagenNoche`. Si las fotos no
 *   encuadran el mismo punto, ajusta `posicionFocoDia` / `posicionFocoNoche`
 *   (valores de `object-position`) hasta que coincidan.
 * - Avatares: `avatares` son marcadores servidos desde `public/`. Cámbialos por
 *   las fotos reales de personas cuando las tengas.
 * - Traducciones: todo el copy vive en `TEXTOS` y en las listas de abajo, y se
 *   puede pisar entero con la prop `textos`. Cuando montes next-intl el cambio
 *   es mecánico: `<HeroInicio textos={{ ... t("...") }} />`.
 * - La barra superior NO vive aquí: es <NavegacionPrincipal>, que va fija por
 *   encima de este bloque. El `pt` del contenido es el que le deja sitio.
 *
 * ── Orden de lectura ─────────────────────────────────────────────────────────
 * Titular → párrafo → botones → prueba social → accesos rápidos.
 * Es el mismo en móvil y en escritorio: la columna ya es única, así que no hay
 * que reordenar nada, solo dejar que ocupe todo el ancho y que los botones y
 * los accesos se reorganicen.
 *
 * ── Contraste ────────────────────────────────────────────────────────────────
 * El velo es direccional: denso en la izquierda, donde va el texto, y se abre
 * hacia la derecha para que la foto se vea. La geometría de las paradas viene
 * medida (ver el comentario largo junto al degradado) y el texto cambia de
 * color con el tema —claro sobre velo oscuro, carbón sobre velo claro—, así que
 * los dos temas se leen igual de bien.
 */

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import {
  Boxes,
  Landmark,
  CalendarDays,
  TriangleAlert,
  PlayCircle,
  ArrowUpRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { type Tema, COLOR_ACENTO, COLOR_ACENTO_TEXTO_CLARO } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                   Textos                                   */
/* -------------------------------------------------------------------------- */

/** Un tramo del párrafo. `resaltado` lo pinta con el acento dorado. */
export interface TramoParrafo {
  texto: string;
  resaltado?: boolean;
}

export interface TextosHero {
  /**
   * El titular va troceado porque dos de sus palabras se pintan dentro de
   * píldoras crema y el resto en el color base.
   */
  tituloLinea1: string;
  tituloLinea2: string;
  tituloPildora1: string;
  tituloLinea3: string;
  tituloPildora2: string;
  parrafo: TramoParrafo[];
  botonPrimario: string;
  botonSecundario: string;
  pruebaSocial: string;
  etiquetaAccesos: string;
  altFotoDia: string;
  altFotoNoche: string;
  irAlSiguiente: string;
}

const TEXTOS: TextosHero = {
  tituloLinea1: "Explora Ayacucho,",
  tituloLinea2: "vive su",
  tituloPildora1: "historia,",
  tituloLinea3: "protege su",
  tituloPildora2: "legado.",
  parrafo: [
    { texto: "Tu guía inteligente del patrimonio de Huamanga. Recorre " },
    { texto: "lugares históricos", resaltado: true },
    { texto: " en 3D, consulta el clima, participa con " },
    { texto: "reseñas", resaltado: true },
    { texto: " y gana " },
    { texto: "insignias", resaltado: true },
    { texto: " por tus visitas." },
  ],
  botonPrimario: "Explorar mapa 3D",
  botonSecundario: "Ver video",
  pruebaSocial: "Miles de viajeros exploran Ayacucho",
  etiquetaAccesos: "Accesos rápidos",
  altFotoDia: "Plaza de Armas de Huamanga, Ayacucho — de día",
  altFotoNoche: "Plaza de Armas de Huamanga, Ayacucho — de noche",
  irAlSiguiente: "Ir al siguiente bloque",
};

/** Los cuatro accesos rápidos del pie de la columna. */
const ACCESOS: ReadonlyArray<{ etiqueta: string; Icono: LucideIcon; href: string }> = [
  { etiqueta: "Mapa 3D", Icono: Boxes, href: "#mapa-3d" },
  { etiqueta: "Lugares", Icono: Landmark, href: "#lugares" },
  { etiqueta: "Agenda", Icono: CalendarDays, href: "#festividades" },
  { etiqueta: "Reportar", Icono: TriangleAlert, href: "#reportar" },
];

/**
 * Avatares de la prueba social. Son MARCADORES: fotos que ya están en
 * `public/` y que solo sirven para que el bloque tenga imágenes redondas
 * reales mientras no lleguen las de personas. Se sustituyen por la prop
 * `avatares` sin tocar el componente.
 */
const AVATARES_POR_DEFECTO: readonly string[] = [
  "/places/1.jpg",
  "/places/3.jpg",
  "/places/5.jpg",
  "/places/7.jpg",
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
  /** Fotos circulares de la prueba social. Cuatro, en el orden en que se ven. */
  avatares?: readonly string[];
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
  avatares = AVATARES_POR_DEFECTO,
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

  /* --- Paleta que sigue al tema ------------------------------------------ */
  // El velo es claro en tema claro y oscuro en tema oscuro, así que el texto
  // tiene que invertirse con él. Lo único constante es el dorado de marca.
  const colorTitular = oscuro ? "#faf6f0" : "#1b1712";
  const colorAcentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_TEXTO_CLARO;
  const textoParrafo = oscuro ? "text-white/80" : "text-neutral-800";
  const textoSutil = oscuro ? "text-white/70" : "text-neutral-700";
  const botonSecundarioEstilo = oscuro
    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
    : "border-black/15 bg-white/70 text-neutral-900 hover:bg-white";
  const accesoEstilo = oscuro
    ? "border-white/20 bg-white/10 text-white/90 hover:bg-white/20"
    : "border-black/10 bg-white/70 text-neutral-800 hover:bg-white";
  const anilloAvatar = oscuro ? "ring-[#0e0d0c]" : "ring-[#faf8f5]";
  const chevronEstilo = oscuro
    ? "border-white/25 text-white/80 hover:bg-white/10"
    : "border-black/15 text-neutral-700 hover:bg-black/5";

  return (
    <section id="inicio" className="w-full">
      {/*
        A sangre y de una pantalla de alto. `100svh` y no `100vh`: en móvil la
        barra del navegador entra y sale, y con `vh` el hero pega un salto cada
        vez que eso pasa.
      */}
      <div className="relative isolate flex min-h-svh flex-col overflow-hidden">
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
            Velo direccional: denso donde va el texto y abriéndose hacia la
            derecha para que la foto respire. En móvil no hay hueco lateral que
            abrir, así que ahí es plano y cubre todo.

            OJO con el `sm:bg-transparent` de las dos ramas: el velo plano de
            móvil es `background-color` y el degradado es `background-image`,
            que son propiedades DISTINTAS. Sin él las dos se acumulan en
            escritorio y el velo plano sigue tapando la foto por debajo del
            degradado, hagas lo que hagas con las paradas.

            Por qué van a mano con 6 paradas y no con `from/via/to`: con tres
            paradas el velo arranca plano y luego cae, y ese arranque se ve como
            una COSTURA vertical en mitad del hero. Estas dibujan una caída
            progresiva sin tramo plano, y además NUNCA llegan a opacidad total:
            la foto se ve en todo el ancho en vez de desaparecer bajo un muro.

            Los dos temas usan la MISMA geometría — solo cambia el color, y es
            el de la página (#0e0d0c / #faf8f5), así que el hero entronca con lo
            que viene debajo.

            Por qué hay dos curvas (`sm:` y `xl:`): el ancho del texto está
            acotado, así que cuanto más estrecha es la pantalla MÁS porcentaje
            del ancho ocupa. Con una sola curva habría que proteger el peor caso
            y el velo se comería la foto en pantallas grandes.
          */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 transition-colors duration-300 ${
              oscuro
                ? "bg-[#0e0d0c]/75 sm:bg-transparent" +
                  " sm:bg-[linear-gradient(to_right,#0e0d0ce6_0%,#0e0d0ce0_45%,#0e0d0cd1_60%,#0e0d0c85_75%,#0e0d0c42_90%,#0e0d0c29_100%)]" +
                  " xl:bg-[linear-gradient(to_right,#0e0d0ce0_0%,#0e0d0cdb_30%,#0e0d0cd1_47%,#0e0d0c94_62%,#0e0d0c52_78%,#0e0d0c1f_100%)]"
                : "bg-[#faf8f5]/85 sm:bg-transparent" +
                  " sm:bg-[linear-gradient(to_right,#faf8f5f2_0%,#faf8f5eb_45%,#faf8f5db_60%,#faf8f594_75%,#faf8f552_90%,#faf8f533_100%)]" +
                  " xl:bg-[linear-gradient(to_right,#faf8f5eb_0%,#faf8f5e6_30%,#faf8f5db_47%,#faf8f5a3_62%,#faf8f561_78%,#faf8f529_100%)]"
            }`}
          />

          {/*
            Segunda capa, vertical: asienta los bordes contra el resto de la
            página para que la foto no corte en seco. Ojo, MULTIPLICA con la de
            arriba: lo que ponga en el borde superior se suma al velo lateral y
            lava la foto justo donde tiene que verse, por eso arriba lleva poco.
          */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-linear-to-t transition-colors duration-300 ${
              oscuro
                ? "from-[#0e0d0c]/70 via-transparent to-[#0e0d0c]/45"
                : "from-[#faf8f5]/70 via-transparent to-[#faf8f5]/25"
            }`}
          />
        </div>

        {/* --------------------------- Contenido -------------------------- */}
        {/*
          Una sola columna a la izquierda. `pt` deja sitio al navbar fijo y `pb`
          respeta el área segura de iOS para que los accesos no queden bajo el
          indicador del sistema.
        */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pt-24 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-28 lg:px-8">
          <div className="w-full max-w-xl lg:max-w-2xl">
            {/* ------------------------ Titular ------------------------ */}
            <motion.h1
              {...entrada(0.05)}
              className="font-display font-bold"
              style={{
                // `clamp` en vez de saltos por breakpoint: a 320 px entra sin
                // desbordar y crece de forma continua hasta el tope.
                fontSize: "clamp(2.25rem, 8.5vw, 4.25rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                color: colorTitular,
              }}
            >
              {t.tituloLinea1}
              <br />
              {t.tituloLinea2} <Pildora oscuro={oscuro}>{t.tituloPildora1}</Pildora>
              <br />
              {t.tituloLinea3} <Pildora oscuro={oscuro}>{t.tituloPildora2}</Pildora>
            </motion.h1>

            {/* ------------------------ Párrafo ------------------------ */}
            <motion.p
              {...entrada(0.2)}
              className={`mt-5 max-w-lg text-[15px] leading-relaxed sm:text-base ${textoParrafo}`}
            >
              {t.parrafo.map((tramo, i) =>
                tramo.resaltado ? (
                  <span key={i} className="font-semibold" style={{ color: colorAcentoTexto }}>
                    {tramo.texto}
                  </span>
                ) : (
                  <span key={i}>{tramo.texto}</span>
                ),
              )}
            </motion.p>

            {/* ------------------------ Botones ------------------------ */}
            {/*
              El primario va pegado al titular y es el único macizo: no hay duda
              de cuál es la acción principal. En móvil los dos ocupan el ancho
              completo y se apilan; desde `sm` se ponen en fila y se ajustan a
              su contenido.
            */}
            <motion.div
              {...entrada(0.28)}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <a
                href="#mapa-3d"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold text-[#1b1206] shadow-lg transition-transform active:scale-[0.98]"
                style={{
                  backgroundColor: COLOR_ACENTO,
                  boxShadow: `0 12px 30px -12px ${COLOR_ACENTO}b3`,
                }}
              >
                {t.botonPrimario}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-6 text-[15px] font-semibold backdrop-blur-sm transition-colors active:scale-[0.98] ${botonSecundarioEstilo}`}
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {t.botonSecundario}
              </button>
            </motion.div>

            {/* --------------------- Prueba social --------------------- */}
            <motion.div {...entrada(0.36)} className="mt-7 flex items-center gap-3">
              <ul className="flex -space-x-2.5" aria-hidden="true">
                {avatares.slice(0, 4).map((src) => (
                  <li
                    key={src}
                    className={`relative h-9 w-9 overflow-hidden rounded-full ring-2 ${anilloAvatar}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover select-none"
                      draggable={false}
                    />
                  </li>
                ))}
              </ul>
              <p className={`text-[13px] leading-tight sm:text-sm ${textoSutil}`}>
                {t.pruebaSocial}
              </p>
            </motion.div>

            {/* -------------------- Accesos rápidos -------------------- */}
            {/*
              Rejilla de 2×2 en móvil y fila de cuatro desde `sm`. En 2×2 cada
              acceso conserva su altura táctil y las etiquetas caben enteras;
              amontonar cuatro en una fila a 320 px las partiría.
            */}
            <motion.div {...entrada(0.44)} className="mt-8">
              <p className={`text-[12px] font-semibold ${textoSutil}`}>{t.etiquetaAccesos}</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {ACCESOS.map(({ etiqueta, Icono, href }) => (
                  <li key={etiqueta}>
                    <a
                      href={href}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-[13px] font-medium backdrop-blur-sm transition-colors sm:text-sm ${accesoEstilo}`}
                    >
                      <Icono
                        className="h-4 w-4 shrink-0"
                        style={{ color: colorAcentoTexto }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{etiqueta}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* ---------------------- Indicador de scroll ---------------------- */}
        <motion.a
          href={hrefSiguiente}
          aria-label={t.irAlSiguiente}
          animate={quieto ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-10 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full border backdrop-blur-sm transition-colors ${chevronEstilo}`}
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
 * garantiza que la palabra caiga entera al renglón siguiente en vez de partirse
 * por la mitad, que es justo lo que no queremos a 320 px.
 *
 * En tema claro la píldora lleva un filete y un crema algo más tostado: sobre
 * el velo casi blanco, el mismo crema del tema oscuro se disolvía y dejaba de
 * leerse como píldora.
 */
function Pildora({ children, oscuro }: { children: React.ReactNode; oscuro: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-[0.3em] pb-[0.06em] whitespace-nowrap text-[#17120c] ${
        oscuro ? "bg-[#f5ece0]" : "bg-[#eadbc4] ring-1 ring-black/5"
      }`}
    >
      {children}
    </span>
  );
}

export default HeroInicio;
