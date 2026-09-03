"use client";

/**
 * HeroInicio — Yachay Ayacucho
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema` por props (conéctalo a next-themes o a tu store).
 * - Imágenes: pasa tus rutas reales en `imagenDia` / `imagenNoche` (sin
 *   rutas quemadas aquí dentro). Si tus fotos finales no encuadran el
 *   mismo punto focal (la catedral), ajusta `posicionFocoDia` /
 *   `posicionFocoNoche` (valores CSS `object-position`, ej. "50% 35%")
 *   hasta que coincidan visualmente entre ambas.
 * - Traducciones: todo el copy vive en `TEXTOS_HERO` y `PARRAFO_SEGMENTOS`
 *   más abajo. Reemplázalos por tus hooks de next-intl (`useTranslations`)
 *   cuando conectes la traducción real — están centralizados a propósito
 *   para que ese cambio sea mecánico.
 *
 * Corrección de contraste (importante): los colores del badge, el
 * titular, el párrafo, los botones, la prueba social y los accesos
 * rápidos son FIJOS — no cambian entre tema claro/oscuro. Lo único que
 * cambia con el tema es la foto de fondo y la intensidad del overlay
 * oscuro sobre ella (más fuerte en "claro" porque la foto de día es más
 * clara y necesita más contraste para que el texto claro fijo se siga
 * leyendo bien).
 */

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ShieldCheck,
  Map as MapIcon,
  PlayCircle,
  MapPin,
  CloudSun,
  Star,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import {
  type Tema,
  COLOR_ACENTO,
  COLOR_TITULAR_LINEA_1,
  COLOR_TITULAR_LINEA_2,
  COLOR_TITULAR_LINEA_3,
  BANDA_GRADIENTE_TITULAR,
} from "./tema";

interface HeroInicioProps {
  tema: Tema;
  imagenDia: string;
  imagenNoche: string;
  /** object-position CSS para afinar el punto focal de cada foto. */
  posicionFocoDia?: string;
  posicionFocoNoche?: string;
}

const TEXTOS_HERO = {
  badge: "Descubre. Conoce. Protege.",
  tituloLinea1: "Explora Ayacucho,",
  tituloLinea2: "vive su historia,",
  tituloLinea3: "protege su legado.",
  botonPrimario: "Explorar mapa 3D",
  botonSecundario: "Ver video",
  pruebaSocial: "Únete a miles de viajeros que ya exploran Ayacucho",
  altFotoDia: "Plaza de Armas de Huamanga, Ayacucho — de día",
  altFotoNoche: "Plaza de Armas de Huamanga, Ayacucho — de noche",
};

/** Párrafo descriptivo partido en segmentos para poder resaltar palabras clave. */
const PARRAFO_SEGMENTOS: { texto: string; resaltado?: boolean }[] = [
  { texto: "Yachay Ayacucho es tu guía inteligente para descubrir el patrimonio cultural de Huamanga. Explora " },
  { texto: "lugares históricos", resaltado: true },
  { texto: " en 3D, consulta clima y recomendaciones, participa con " },
  { texto: "reseñas", resaltado: true },
  { texto: " y gana " },
  { texto: "insignias", resaltado: true },
  { texto: " por tus visitas." },
];

const ACCESOS_RAPIDOS: { Icono: LucideIcon; titulo: string; subtitulo: string }[] = [
  { Icono: MapPin, titulo: "Mapa 3D", subtitulo: "Lugares patrimoniales" },
  { Icono: CloudSun, titulo: "Clima y tips", subtitulo: "Recomendaciones contextuales" },
  { Icono: Star, titulo: "Insignias", subtitulo: "Gana logros por tus visitas" },
  { Icono: ShieldCheck, titulo: "Reporta", subtitulo: "Protege nuestro patrimonio" },
];

export function HeroInicio({
  tema,
  imagenDia,
  imagenNoche,
  posicionFocoDia = "center",
  posicionFocoNoche = "center",
}: HeroInicioProps) {
  const oscuro = tema === "oscuro";
  const prefiereMenosMovimiento = useReducedMotion();

  // Precarga ambas imágenes al montar para que el crossfade nunca parpadee.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dia = new window.Image();
    dia.src = imagenDia;
    const noche = new window.Image();
    noche.src = imagenNoche;
  }, [imagenDia, imagenNoche]);

  const variantesContenedor = {
    oculto: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  };
  const variantesItem = {
    oculto: { opacity: 0, y: prefiereMenosMovimiento ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  };

  const duracionCrossfade = prefiereMenosMovimiento ? 0 : 0.4;

  return (
    <section id="inicio" className="relative min-h-[100svh] w-full overflow-hidden bg-neutral-950">
      {/* Fondo: ambas fotos siempre montadas, superpuestas de forma idéntica.
          Nunca se mueven ni cambian de tamaño — solo cruza su opacidad. */}
      <div className="absolute inset-0">
        <motion.img
          src={imagenDia}
          alt={TEXTOS_HERO.altFotoDia}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: posicionFocoDia }}
          initial={false}
          animate={{ opacity: oscuro ? 0 : 1 }}
          transition={{ duration: duracionCrossfade, ease: "easeInOut" }}
        />
        <motion.img
          src={imagenNoche}
          alt={TEXTOS_HERO.altFotoNoche}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: posicionFocoNoche }}
          initial={false}
          animate={{ opacity: oscuro ? 1 : 0 }}
          transition={{ duration: duracionCrossfade, ease: "easeInOut" }}
        />

        {/* Overlay: capa separada ENCIMA de ambas fotos. Solo su intensidad
            varía con el tema (día necesita más para el mismo contraste). */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            oscuro
              ? "bg-neutral-950/70 sm:bg-gradient-to-r sm:from-neutral-950/95 sm:via-neutral-950/65 sm:to-neutral-950/10"
              : "bg-neutral-950/78 sm:bg-gradient-to-r sm:from-neutral-950/97 sm:via-neutral-950/75 sm:to-neutral-950/15"
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${
            oscuro ? "from-neutral-950 via-transparent to-neutral-950/45" : "from-neutral-950 via-transparent to-neutral-950/55"
          }`}
        />
      </div>

      {/* Contenido — paleta fija, no depende del tema */}
      <motion.div
        variants={variantesContenedor}
        initial="oculto"
        animate="visible"
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-8"
      >
        <motion.div
          variants={variantesItem}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-sm"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {TEXTOS_HERO.badge}
        </motion.div>

        {/* Titular: la entrada de cada línea es el propio barrido de
            DiaTextReveal (Magic UI), en vez del fade+subida de motion/react
            que usan el resto de bloques del hero. Cada línea tiene su color
            final (`textColor`) FIJO — idéntico en tema claro y oscuro — y
            comparte la misma banda de gradiente cálida. Si el usuario tiene
            prefers-reduced-motion, el propio componente salta directo al
            color final sin barrido. */}
        <h1 className="mt-5 text-[clamp(2.25rem,9vw,4.5rem)] font-black leading-[1.05] tracking-tight sm:mt-6">
          <DiaTextReveal
            text={TEXTOS_HERO.tituloLinea1}
            colors={BANDA_GRADIENTE_TITULAR}
            textColor={COLOR_TITULAR_LINEA_1}
            duration={1.7}
            delay={0.15}
            once
            className="block pb-[0.16em]"
          />
          <DiaTextReveal
            text={TEXTOS_HERO.tituloLinea2}
            colors={BANDA_GRADIENTE_TITULAR}
            textColor={COLOR_TITULAR_LINEA_2}
            duration={1.7}
            delay={0.33}
            once
            className="block pb-[0.16em]"
          />
          <DiaTextReveal
            text={TEXTOS_HERO.tituloLinea3}
            colors={BANDA_GRADIENTE_TITULAR}
            textColor={COLOR_TITULAR_LINEA_3}
            duration={1.7}
            delay={0.51}
            once
            className="block pb-[0.16em]"
          />
        </h1>

        <motion.p variants={variantesItem} className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-200 sm:text-base">
          {PARRAFO_SEGMENTOS.map((segmento, i) =>
            segmento.resaltado ? (
              <span key={i} className="font-semibold" style={{ color: COLOR_ACENTO }}>
                {segmento.texto}
              </span>
            ) : (
              <span key={i}>{segmento.texto}</span>
            )
          )}
        </motion.p>

        <motion.div variants={variantesItem} className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#mapa-3d"
            className="flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: COLOR_ACENTO, boxShadow: `0 10px 25px -8px ${COLOR_ACENTO}66` }}
          >
            <MapIcon className="h-4 w-4" />
            {TEXTOS_HERO.botonPrimario}
          </a>
          <button
            type="button"
            className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-transform active:scale-95"
          >
            <PlayCircle className="h-4 w-4" />
            {TEXTOS_HERO.botonSecundario}
          </button>
        </motion.div>

        <motion.div variants={variantesItem} className="mt-6 flex items-center gap-3">
          <div className="flex -space-x-3">
            {["MT", "JR", "CA"].map((iniciales) => (
              <span
                key={iniciales}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-neutral-950"
                style={{ backgroundColor: COLOR_ACENTO }}
              >
                {iniciales}
              </span>
            ))}
          </div>
          <p className="text-xs text-neutral-300 sm:text-sm">{TEXTOS_HERO.pruebaSocial}</p>
        </motion.div>

        <motion.div
          variants={variantesItem}
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:mt-12 sm:flex sm:items-start sm:gap-0"
        >
          {ACCESOS_RAPIDOS.map(({ Icono, titulo, subtitulo }, i) => (
            <div
              key={titulo}
              className={`flex items-start gap-3 sm:flex-1 sm:px-4 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-white/10"}`}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amber-200"
                style={{ backgroundColor: `${COLOR_ACENTO}26` }}
              >
                <Icono className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{titulo}</p>
                <p className="text-xs text-neutral-400">{subtitulo}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        animate={prefiereMenosMovimiento ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/25 p-2 text-white/80"
        aria-hidden="true"
      >
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </section>
  );
}
