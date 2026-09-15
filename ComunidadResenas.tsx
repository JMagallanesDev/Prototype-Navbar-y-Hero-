"use client";

/**
 * ComunidadResenas — Yachay Ayacucho
 *
 * Reseñas de la comunidad en un carrusel Embla con "peek": se ve la tarjeta
 * siguiente asomando por la derecha para invitar al gesto.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: prop `tema`, igual que el resto de secciones.
 * - Tipografía: usa las utilidades `font-display` (Fraunces) y la fuente base
 *   (Plus Jakarta Sans). Ya están mapeadas en `app/globals.css`:
 *     @theme inline {
 *       --font-sans: var(--font-jakarta), ui-sans-serif, system-ui, sans-serif;
 *       --font-display: var(--font-fraunces), ui-serif, Georgia, serif;
 *     }
 *   con las variables `--font-fraunces` / `--font-jakarta` que crea
 *   `next/font/google` en `app/layout.tsx`.
 * - Datos: `resenas` y `ratingGlobal` llegan por props, con `RESENAS` y
 *   `RATING_GLOBAL` como ejemplo. Cuando conectes el backend (PanelResenas),
 *   mapea cada fila al tipo `Resena` y pásalo tal cual; las URLs de Cloudinary
 *   sirven para `autorAvatar` y `lugarImagen` si añades su host en
 *   `images.remotePatterns` de `next.config`.
 * - Si ya tienes un componente `Estrellas` propio, sustituye el interno de
 *   este archivo: solo tiene que aceptar `valor` (admite .5) y `tamano`.
 * - Textos de interfaz en `TEXTOS`, listos para next-intl.
 *
 * ── Imágenes de ejemplo ─────────────────────────────────────────────────────
 * - Miniaturas: las fotos locales de `public/places` que ya usa
 *   LugaresDestacados, así que cada reseña apunta a un lugar con foto real.
 * - Avatares: retratos de ejemplo de randomuser.me (servicio de datos de
 *   prueba) copiados a `public/comunidad/avatares`. Son marcadores de
 *   posición: los nombres son inventados y no corresponden a esas personas.
 *   Si una reseña no trae foto —o la foto falla—, se muestran las iniciales.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { type Tema, COLOR_ACENTO, COLOR_ACENTO_FUERTE } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                    Datos                                   */
/* -------------------------------------------------------------------------- */

export interface Resena {
  id: string;
  comentario: string;
  autorNombre: string;
  /** Opcional: sin foto se pintan las iniciales. */
  autorAvatar?: string;
  lugar: string;
  lugarImagen: string;
  /** De 0 a 5; admite medios puntos (4.5). */
  rating: number;
}

export const RATING_GLOBAL = 4.8;

export const RESENAS: readonly Resena[] = [
  {
    id: "r1",
    comentario: "Explorar la Catedral de noche fue mágico, la app me guió en cada detalle.",
    autorNombre: "Valeria Torres",
    autorAvatar: "/comunidad/avatares/women-12.jpg",
    lugar: "Catedral de Ayacucho",
    lugarImagen: "/places/1.jpg",
    rating: 5,
  },
  {
    id: "r2",
    comentario: "Gracias a Yachay descubrí miradores que ni sabía que existían.",
    autorNombre: "Carlos Mendoza",
    autorAvatar: "/comunidad/avatares/men-22.jpg",
    lugar: "Mirador de Acuchimay",
    lugarImagen: "/places/2.jpg",
    rating: 4.5,
  },
  {
    id: "r3",
    comentario: "Me encanta ganar sellos cada vez que visito un templo. ¡Muy adictivo!",
    autorNombre: "Lucía Fernández",
    autorAvatar: "/comunidad/avatares/women-90.jpg",
    lugar: "Templo de San Francisco",
    lugarImagen: "/places/3.jpg",
    rating: 5,
  },
  {
    id: "r4",
    comentario: "Los retablos ayacuchanos cobran vida con las historias que cuenta la app.",
    autorNombre: "Diego Quispe",
    autorAvatar: "/comunidad/avatares/men-61.jpg",
    lugar: "Museo de Arte Popular",
    lugarImagen: "/places/4.jpg",
    rating: 5,
  },
  {
    id: "r5",
    comentario: "Ideal para recorrer el centro a pie: rutas claras y datos curiosos en cada parada.",
    autorNombre: "Rosa Huamán",
    autorAvatar: "/comunidad/avatares/women-79.jpg",
    lugar: "Arco del Triunfo",
    lugarImagen: "/places/5.jpg",
    rating: 4.5,
  },
  {
    id: "r6",
    comentario: "La guía de la casona es excelente. Solo me faltó información de horarios.",
    autorNombre: "Jorge Palomino",
    autorAvatar: "/comunidad/avatares/men-85.jpg",
    lugar: "Casona Boza y Solís",
    lugarImagen: "/places/6.jpg",
    rating: 4,
  },
  {
    id: "r7",
    comentario: "Llegué en Semana Santa y el mapa me ayudó a no perderme ninguna procesión.",
    autorNombre: "Andrea Cárdenas",
    autorAvatar: "/comunidad/avatares/women-65.jpg",
    lugar: "Templo de Santo Domingo",
    lugarImagen: "/places/7.jpg",
    rating: 5,
  },
];

const TEXTOS = {
  antetitulo: "La comunidad nos quiere",
  titulo: ["Preferido por quienes", "aman Ayacucho"] as const,
  ratingGlobal: (v: number) => `${v.toFixed(1)}/5`,
  ratingAria: (v: number) => `Valoración de ${v.toLocaleString("es-PE")} de 5 estrellas`,
  anterior: "Reseña anterior",
  siguiente: "Reseña siguiente",
  region: "Reseñas de la comunidad",
  diapositiva: (i: number, t: number) => `${i} de ${t}`,
  fotoLugar: (lugar: string) => `Foto de ${lugar}`,
};

/* -------------------------------------------------------------------------- */
/*                                   Estrellas                                */
/* -------------------------------------------------------------------------- */

interface EstrellasProps {
  valor: number;
  /** Lado de cada estrella en px. */
  tamano?: number;
  /** Color de la parte vacía. */
  colorVacio: string;
  className?: string;
}

/**
 * Cinco estrellas con relleno parcial. Cada una es una estrella vacía con una
 * copia dorada encima, recortada al porcentaje que le toca: así 4.5 pinta la
 * quinta a la mitad sin necesitar un icono de media estrella.
 */
export function Estrellas({ valor, tamano = 16, colorVacio, className = "" }: EstrellasProps) {
  const v = Math.max(0, Math.min(5, valor));
  return (
    <span
      role="img"
      aria-label={TEXTOS.ratingAria(v)}
      className={`inline-flex shrink-0 items-center gap-0.5 ${className}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const relleno = Math.max(0, Math.min(1, v - i)) * 100;
        return (
          <span key={i} aria-hidden="true" className="relative inline-block" style={{ width: tamano, height: tamano }}>
            <Star className="absolute inset-0" style={{ width: tamano, height: tamano, color: colorVacio }} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${relleno}%` }}>
              <Star style={{ width: tamano, height: tamano, color: COLOR_ACENTO }} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Avatar                                  */
/* -------------------------------------------------------------------------- */

// Fondos para las iniciales: tonos tierra que conviven con el dorado.
const FONDOS_INICIALES = ["#8C5A3C", "#5E6B4E", "#6B4F7A", "#3F6275", "#9A6B2F", "#7A3E3E"] as const;

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function colorDeNombre(nombre: string) {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FONDOS_INICIALES[h % FONDOS_INICIALES.length]!;
}

function Avatar({ nombre, src }: { nombre: string; src?: string }) {
  const [fallo, setFallo] = useState(false);
  const conFoto = Boolean(src) && !fallo;

  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full">
      {conFoto ? (
        <Image
          src={src!}
          alt=""
          fill
          sizes="44px"
          draggable={false}
          onError={() => setFallo(true)}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-full w-full place-items-center text-sm font-semibold text-white"
          style={{ backgroundColor: colorDeNombre(nombre) }}
        >
          {iniciales(nombre)}
        </span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Tarjeta                                  */
/* -------------------------------------------------------------------------- */

function TarjetaResena({ resena, tema }: { resena: Resena; tema: Tema }) {
  const oscuro = tema === "oscuro";

  return (
    <article
      className={`@container flex h-full flex-col rounded-2xl border p-5 sm:p-6 ${
        oscuro
          ? "border-white/[0.08] bg-[#1a1817]"
          : "border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-14px_rgba(40,28,14,0.18)]"
      }`}
    >
      {/*
        Tres líneas como máximo y alto reservado para las tres: un comentario
        corto no hace la tarjeta más baja que sus vecinas.
      */}
      <p
        className={`line-clamp-3 min-h-[4.5em] text-[15px] leading-[1.5] sm:text-base ${
          oscuro ? "text-white/85" : "text-neutral-800"
        }`}
      >
        “{resena.comentario}”
      </p>

      <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl">
        <Image
          src={resena.lugarImagen}
          alt={TEXTOS.fotoLugar(resena.lugar)}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 85vw"
          draggable={false}
          className="object-cover"
        />
      </div>

      <hr className={`mt-5 border-0 border-t ${oscuro ? "border-white/10" : "border-black/[0.08]"}`} />

      {/*
        Pie: avatar, nombre y lugar; estrellas a la derecha. Si la tarjeta es
        estrecha (menos de 17rem de contenido) las estrellas bajan bajo el lugar para no
        comerse el nombre. Lo decide el ancho de la TARJETA (container query),
        no el de la ventana.
      */}
      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 @[17rem]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="row-span-2 @[17rem]:row-span-1">
          <Avatar nombre={resena.autorNombre} src={resena.autorAvatar} />
        </div>
        <div className="min-w-0">
          <p className={`truncate text-[15px] font-semibold ${oscuro ? "text-white" : "text-neutral-900"}`}>
            {resena.autorNombre}
          </p>
          <p
            className="truncate text-[13px] font-medium"
            style={{ color: oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE }}
          >
            {resena.lugar}
          </p>
        </div>
        <Estrellas
          valor={resena.rating}
          tamano={14}
          colorVacio={oscuro ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)"}
          className="@[17rem]:self-start @[17rem]:pt-1"
        />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

interface ComunidadResenasProps {
  tema: Tema;
  resenas?: readonly Resena[];
  ratingGlobal?: number;
}

export function ComunidadResenas({ tema, resenas = RESENAS, ratingGlobal = RATING_GLOBAL }: ComunidadResenasProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;

  const [refVisor, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    duration: quieto ? 10 : 28,
  });

  const [puedeAtras, setPuedeAtras] = useState(false);
  const [puedeAdelante, setPuedeAdelante] = useState(false);

  const sincronizar = useCallback(() => {
    if (!emblaApi) return;
    setPuedeAtras(emblaApi.canScrollPrev());
    setPuedeAdelante(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    sincronizar();
    emblaApi.on("select", sincronizar).on("reInit", sincronizar);
    return () => {
      emblaApi.off("select", sincronizar).off("reInit", sincronizar);
    };
  }, [emblaApi, sincronizar]);

  const fondo = oscuro ? "#0e0d0c" : "#faf8f5";
  const acentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;

  const flecha = `grid h-11 w-11 place-items-center rounded-full border transition-[opacity,background-color] disabled:cursor-default disabled:opacity-35 ${
    oscuro ? "enabled:hover:bg-white/5" : "enabled:hover:bg-black/[0.04]"
  }`;

  return (
    <section
      id="comunidad"
      aria-labelledby="comunidad-titulo"
      className="w-full overflow-x-hidden py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: fondo }}
    >
      {/*
        Mismo margen izquierdo que MapaPreview y PasaporteCultural: en `vw`
        desde el borde de la ventana. La tarjeta que asoma por la derecha llega
        hasta el borde, así que el carrusel no lleva margen derecho.
      */}
      <div className="px-4 sm:px-6 lg:px-[max(2rem,6vw)]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p
              className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] uppercase sm:text-xs"
              style={{ color: acentoTexto }}
            >
              <span aria-hidden="true" className="h-px w-7 shrink-0" style={{ backgroundColor: acentoTexto }} />
              {TEXTOS.antetitulo}
            </p>
            <h2
              id="comunidad-titulo"
              className={`mt-4 font-display font-bold text-balance ${oscuro ? "text-[#faf6f0]" : "text-[#1b1712]"}`}
              style={{ fontSize: "clamp(1.9rem, 5.2vw, 3.5rem)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
            >
              {/*
                Dos líneas fijas desde `sm`. En móvil "Preferido por quienes" no
                cabe en una línea y el salto forzado dejaba "quienes" huérfano:
                ahí el título fluye y `text-balance` reparte las líneas.
              */}
              {TEXTOS.titulo[0]}
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>
              {TEXTOS.titulo[1]}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Estrellas
              valor={ratingGlobal}
              tamano={18}
              colorVacio={oscuro ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)"}
            />
            <span className={`text-base font-semibold ${oscuro ? "text-white/85" : "text-neutral-800"}`}>
              {TEXTOS.ratingGlobal(ratingGlobal)}
            </span>
          </div>
        </header>
      </div>

      {/* ------------------------------ Carrusel ------------------------------ */}
      {/*
        El visor ocupa todo el ancho (la tarjeta que asoma llega al borde) y el
        margen izquierdo va como `padding` del contenedor: Embla lo mide y lo
        respeta como posición de inicio. El `py` + `-my` deja sitio a la sombra
        de las tarjetas claras, que el `overflow-hidden` del visor recortaría.
      */}
      <div
        ref={refVisor}
        className="mt-6 -mb-4 overflow-hidden py-4 sm:mt-8"
        role="region"
        aria-roledescription="carrusel"
        aria-label={TEXTOS.region}
      >
        <ul className="flex touch-pan-y pl-4 sm:pl-6 lg:pl-[max(2rem,6vw)]">
          {resenas.map((r, i) => (
            <li
              key={r.id}
              aria-roledescription="diapositiva"
              aria-label={TEXTOS.diapositiva(i + 1, resenas.length)}
              /*
                Móvil: 1 tarjeta + asomo. sm/md: 2 + asomo. lg: 3 + asomo.
                La separación es margen derecho de cada tarjeta (no `gap`), y la
                última lleva el margen del borde para que al final no quede
                pegada a la ventana.
              */
              className="mr-4 min-w-0 flex-[0_0_84%] sm:mr-5 sm:flex-[0_0_calc(47%-1.25rem)] sm:last:mr-6 lg:flex-[0_0_calc(31%-1.25rem)] lg:last:mr-[max(2rem,6vw)]"
            >
              <motion.div
                className="h-full"
                initial={quieto ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: Math.min(i, 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <TarjetaResena resena={r} tema={tema} />
              </motion.div>
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------ Controles ----------------------------- */}
      <div className="mt-8 flex gap-3 px-4 sm:px-6 lg:px-[max(2rem,6vw)]">
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!puedeAtras}
          aria-label={TEXTOS.anterior}
          className={flecha}
          style={{ borderColor: `${COLOR_ACENTO}99`, color: acentoTexto }}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!puedeAdelante}
          aria-label={TEXTOS.siguiente}
          className={flecha}
          style={{ borderColor: `${COLOR_ACENTO}99`, color: acentoTexto }}
        >
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default ComunidadResenas;
