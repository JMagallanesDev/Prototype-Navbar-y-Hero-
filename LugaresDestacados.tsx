"use client";

/**
 * LugaresDestacados — Yachay Ayacucho
 *
 * Sección autocontenida: encabezado alineado a la izquierda y un carrusel de
 * tarjetas de lugares patrimoniales con swipe nativo.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: llega por la prop `tema`, igual que el resto de secciones. El
 *   componente no guarda estado de tema.
 * - Datos: `LUGARES` es un array tipado con las fotos que ya hay en
 *   `public/places/`. Se sustituye entero por la prop `lugares` —de tu BD o de
 *   next-intl— sin tocar nada del componente.
 * - Favoritos: hoy son estado local, solo visual. El sitio donde enganchar tu
 *   mutación real (TanStack Query) está marcado en `alternarFavorito`.
 * - <LugarCard> vive en este mismo archivo porque el proyecto no tenía ninguna
 *   tarjeta de lugar. Si montas la tuya, cámbiala en el único punto donde se
 *   usa —dentro del carrusel— y borra la de aquí.
 *
 * ── Una desviación consciente del mockup ─────────────────────────────────────
 * En la maqueta "Ver todos" es un botón dorado macizo. Va como enlace discreto,
 * sin fondo, porque así lo pide el encargo: en esta página los botones macizos
 * dorados son las acciones primarias (el "Explorar mapa 3D" del hero, el "Ver
 * evento" de festividades) y otro más aquí competiría con ellos.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  Church,
  Landmark,
  Mountain,
  Building2,
  Heart,
  Star,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { type Tema, COLOR_ACENTO, COLOR_ACENTO_FUERTE } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                    Datos                                   */
/* -------------------------------------------------------------------------- */

export type CategoriaLugar = "iglesia" | "museo" | "mirador" | "monumento";

export interface Lugar {
  id: string;
  nombre: string;
  categoria: CategoriaLugar;
  /** Barrio o punto de la ciudad. Primer dato de la línea de ubicación. */
  zona: string;
  /**
   * Segundo dato de esa línea. Es SIEMPRE del mismo tipo —un rasgo del lugar—
   * y nunca un horario ni una distancia: mezclar clases de dato en la misma
   * posición hace que la fila se lea distinta en cada tarjeta.
   */
  caracteristica: string;
  rating: number;
  imagen: string;
  alt: string;
  abierto: boolean;
  favorito: boolean;
  /** Para construir el enlace a la ficha del lugar. */
  slug: string;
}

const CATEGORIAS: Readonly<Record<CategoriaLugar, { etiqueta: string; Icono: LucideIcon }>> = {
  iglesia: { etiqueta: "Iglesia", Icono: Church },
  museo: { etiqueta: "Museo", Icono: Landmark },
  mirador: { etiqueta: "Mirador", Icono: Mountain },
  monumento: { etiqueta: "Monumento", Icono: Building2 },
};

export const LUGARES: readonly Lugar[] = [
  {
    id: "catedral",
    nombre: "Catedral de Ayacucho",
    categoria: "iglesia",
    zona: "Plaza Mayor",
    caracteristica: "Arte barroco",
    rating: 4.8,
    imagen: "/places/1.jpg",
    alt: "Fachada de la Catedral de Ayacucho en la Plaza Mayor de Huamanga",
    abierto: true,
    favorito: false,
    slug: "catedral-de-ayacucho",
  },
  {
    id: "acuchimay",
    nombre: "Mirador de Acuchimay",
    categoria: "mirador",
    zona: "Acuchimay",
    caracteristica: "Vista panorámica",
    rating: 4.9,
    imagen: "/places/2.jpg",
    alt: "Mirador del cerro Acuchimay con vista sobre la ciudad de Huamanga",
    abierto: true,
    favorito: true,
    slug: "mirador-de-acuchimay",
  },
  {
    id: "san-francisco",
    nombre: "Templo de San Francisco de Asís",
    categoria: "iglesia",
    zona: "Centro histórico",
    caracteristica: "Arte colonial",
    rating: 4.7,
    imagen: "/places/3.jpg",
    alt: "Iglesia de San Francisco de Asís en el centro histórico de Huamanga",
    abierto: true,
    favorito: false,
    slug: "templo-de-san-francisco",
  },
  {
    id: "arte-popular",
    nombre: "Museo de Arte Popular",
    categoria: "museo",
    zona: "Santa Ana",
    caracteristica: "Arte retablo",
    rating: 4.6,
    imagen: "/places/4.jpg",
    alt: "Casona colonial que alberga el Museo de Arte Popular de Ayacucho",
    abierto: true,
    favorito: false,
    slug: "museo-de-arte-popular",
  },
  {
    id: "arco-triunfo",
    nombre: "Arco del Triunfo",
    categoria: "monumento",
    zona: "Plaza Mayor",
    caracteristica: "Fachada neoclásica",
    rating: 4.5,
    imagen: "/places/5.jpg",
    alt: "Arco del Triunfo de Ayacucho visto desde la calle empedrada",
    abierto: true,
    favorito: false,
    slug: "arco-del-triunfo",
  },
  {
    id: "boza-solis",
    nombre: "Casona Boza y Solís",
    categoria: "museo",
    zona: "Portal Constitución",
    caracteristica: "Casona virreinal",
    rating: 4.4,
    imagen: "/places/6.jpg",
    alt: "Patio de la casona donde funcionó la Universidad San Cristóbal de Huamanga",
    abierto: false,
    favorito: false,
    slug: "casona-boza-y-solis",
  },
  {
    id: "santo-domingo",
    nombre: "Templo de Santo Domingo",
    categoria: "iglesia",
    zona: "Jr. 9 de Diciembre",
    caracteristica: "Arte colonial",
    rating: 4.6,
    imagen: "/places/7.jpg",
    alt: "Templo de Santo Domingo de Ayacucho con su espadaña de piedra",
    abierto: true,
    favorito: false,
    slug: "templo-de-santo-domingo",
  },
];

const TEXTOS = {
  titulo: "Lugares destacados",
  subtitulo: "Descubre los tesoros históricos de Huamanga",
  verTodos: "Ver todos",
  abierto: "Abierto ahora",
  cerrado: "Cerrado",
  anterior: "Lugares anteriores",
  siguiente: "Lugares siguientes",
  irA: (n: number) => `Ir al grupo ${n}`,
  anadirFavorito: (n: string) => `Añadir ${n} a favoritos`,
  quitarFavorito: (n: string) => `Quitar ${n} de favoritos`,
  valoracion: "estrellas de valoración",
};

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

interface LugaresDestacadosProps {
  tema: Tema;
  /** Sustituye los datos de ejemplo por los tuyos. */
  lugares?: readonly Lugar[];
  onVerTodos?: () => void;
  onSeleccionar?: (lugar: Lugar) => void;
  onAlternarFavorito?: (id: string, favorito: boolean) => void;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export function LugaresDestacados({
  tema,
  lugares = LUGARES,
  onVerTodos,
  onSeleccionar,
  onAlternarFavorito,
}: LugaresDestacadosProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;

  /* --- Paleta ------------------------------------------------------------- */
  // El dorado de marca sobre el fondo claro se queda en 2.9:1, por debajo del
  // mínimo. En tema claro el texto dorado usa el tono fuerte, que llega a 4.3:1.
  const acentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;
  const fondoSeccion = oscuro ? "bg-[#0e0d0c]" : "bg-[#faf8f5]";
  const textoBase = oscuro ? "text-neutral-100" : "text-neutral-900";
  const textoSutil = oscuro ? "text-neutral-400" : "text-neutral-500";
  const flechaEstilo = oscuro
    ? "border-white/20 text-neutral-300 hover:bg-white/10"
    : "border-black/15 text-neutral-600 hover:bg-black/5";

  /* --- Favoritos ---------------------------------------------------------- */
  /*
   * Se re-sincroniza cuando cambia la lista entrante. Se ajusta DURANTE el
   * render y no en un efecto —patrón recomendado por React— porque un efecto
   * provocaría un segundo render en cascada con los corazones ya pintados mal.
   */
  const [favoritos, setFavoritos] = useState<{
    origen: readonly Lugar[];
    ids: ReadonlySet<string>;
  }>(() => ({ origen: lugares, ids: idsFavoritos(lugares) }));

  if (favoritos.origen !== lugares) {
    setFavoritos({ origen: lugares, ids: idsFavoritos(lugares) });
  }

  const alternarFavorito = useCallback(
    (id: string) => {
      setFavoritos((prev) => {
        const ids = new Set(prev.ids);
        const activar = !ids.has(id);
        if (activar) ids.add(id);
        else ids.delete(id);
        // Aquí va tu mutación real (TanStack Query): el estado de arriba es
        // optimista y esta llamada es la que debe persistirlo.
        onAlternarFavorito?.(id, activar);
        return { origen: prev.origen, ids };
      });
    },
    [onAlternarFavorito],
  );

  /* --- Carrusel ----------------------------------------------------------- */
  const [emblaRef, emblaApi] = useEmblaCarousel({
    /*
     * `center` + `loop`: las tarjetas de los dos bordes quedan siempre cortadas
     * —el "peek" del mockup— y las flechas no se agotan nunca en los extremos,
     * así que no hay que deshabilitarlas. Es la opción más limpia de las dos
     * que planteaba el encargo.
     */
    align: "center",
    loop: true,
  });

  const [activo, setActivo] = useState(0);
  const [puntos, setPuntos] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const alSeleccionar = () => setActivo(emblaApi.selectedScrollSnap());
    const alIniciar = () => setPuntos(emblaApi.scrollSnapList().map((_, i) => i));
    alIniciar();
    alSeleccionar();
    emblaApi.on("select", alSeleccionar).on("reInit", alSeleccionar).on("reInit", alIniciar);
    return () => {
      emblaApi.off("select", alSeleccionar).off("reInit", alSeleccionar).off("reInit", alIniciar);
    };
  }, [emblaApi]);

  const retroceder = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const avanzar = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  /* --- Entrada ------------------------------------------------------------ */
  const refSeccion = useRef<HTMLDivElement>(null);
  const enVista = useInView(refSeccion, { once: true, amount: 0.15 });

  return (
    <section id="lugares" className={`w-full overflow-x-hidden ${fondoSeccion} ${textoBase}`}>
      <div
        ref={refSeccion}
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
      >
        {/* ========================== Encabezado ========================== */}
        {/*
          Alineado a la izquierda y en una sola fila desde `sm`: título y
          subtítulo a un lado, el enlace al otro, pegado a la línea base del
          título (`items-end`). En móvil se apila y el enlace cae debajo del
          subtítulo, que es donde no estorba al pulgar.
        */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <motion.h2
              initial={quieto ? false : { opacity: 0, y: 14 }}
              animate={enVista ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-bold"
              style={{
                // clamp para que no desborde a 320 px ni se quede pequeño en
                // pantallas grandes.
                fontSize: "clamp(1.875rem, 5vw, 3rem)",
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
          </div>

          {/* Enlace discreto, sin fondo. Ver la nota de la cabecera del archivo. */}
          <button
            type="button"
            onClick={onVerTodos}
            /* `sm:mt-1` lo sube a la altura del titular en vez de dejarlo
               colgando del subtítulo, que es donde caía al alinear por abajo. */
            className="group -mx-2 inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full px-2 text-[15px] font-semibold transition-colors sm:mt-1"
            style={{ color: acentoTexto }}
          >
            {TEXTOS.verTodos}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </header>

        {/* =========================== Carrusel =========================== */}
        {/*
          El desbordamiento es INTERNO del carrusel; la sección lleva además
          `overflow-x-hidden` para que las tarjetas que asoman por los bordes no
          puedan generar scroll horizontal en la página.

          Los márgenes negativos con su relleno igual hacen que el carril se
          extienda hasta el borde de la pantalla mientras la primera tarjeta
          sigue alineada con el título.
        */}
        <div className="mt-8 -mx-4 sm:-mx-6 md:mt-10 lg:-mx-8">
          <div ref={emblaRef} className="overflow-hidden px-4 sm:px-6 lg:px-8">
            {/*
              La separación va como MARGEN de cada tarjeta, no como `gap` del
              flex: Embla calcula la costura del bucle midiendo los slides y sus
              márgenes, y un `gap` ahí vale cero —al dar la vuelta, dos tarjetas
              aparecerían pegadas.
            */}
            <ul className="flex">
              {lugares.map((lugar, i) => (
                <li
                  key={lugar.id}
                  /*
                    Anchos por breakpoint: ~1,35 tarjetas en móvil para que la
                    siguiente asome e invite a deslizar, 2 en `sm`, 2,6 en `md`
                    y 3-4 desde `lg`, como el mockup.
                  */
                  className="mr-4 min-w-0 shrink-0 grow-0 basis-[74%] sm:basis-1/2 md:basis-[38%] lg:basis-[31%] xl:basis-[24%]"
                >
                  <LugarCard
                    lugar={lugar}
                    oscuro={oscuro}
                    acentoTexto={acentoTexto}
                    esFavorito={favoritos.ids.has(lugar.id)}
                    onAlternarFavorito={alternarFavorito}
                    onSeleccionar={onSeleccionar}
                    quieto={quieto}
                    visible={enVista}
                    retardo={Math.min(i, 4) * 0.07}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* =========================== Controles =========================== */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Flecha
            etiqueta={TEXTOS.anterior}
            Icono={ChevronLeft}
            onClick={retroceder}
            className={flechaEstilo}
          />

          <ul className="flex items-center gap-2">
            {puntos.map((p) => {
              const activoEste = p === activo;
              return (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => emblaApi?.scrollTo(p)}
                    aria-label={TEXTOS.irA(p + 1)}
                    aria-current={activoEste}
                    /*
                      El punto visible mide 8 px, pero el botón que lo rodea
                      llega a 44: el área táctil no puede ser del tamaño del
                      dibujo. El relleno es transparente, así que no se ve.
                    */
                    className="grid h-11 w-5 place-items-center"
                  >
                    <span
                      className="block h-2 w-2 rounded-full transition-colors"
                      style={{
                        backgroundColor: activoEste
                          ? acentoTexto
                          : oscuro
                            ? "rgba(255,255,255,0.25)"
                            : "rgba(0,0,0,0.18)",
                      }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <Flecha
            etiqueta={TEXTOS.siguiente}
            Icono={ChevronRight}
            onClick={avanzar}
            className={flechaEstilo}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  LugarCard                                 */
/* -------------------------------------------------------------------------- */

/**
 * Tarjeta de un lugar.
 *
 * `h-full` con columna flexible: todas las tarjetas de una fila miden lo mismo
 * aunque el nombre ocupe una línea o dos, y las filas de abajo —ubicación y
 * valoración— quedan alineadas entre tarjetas. Sin esto, la estrella de una
 * tarjeta cae más arriba que la de su vecina y la fila se ve desordenada.
 */
function LugarCard({
  lugar,
  oscuro,
  acentoTexto,
  esFavorito,
  onAlternarFavorito,
  onSeleccionar,
  quieto,
  visible,
  retardo,
}: {
  lugar: Lugar;
  oscuro: boolean;
  acentoTexto: string;
  esFavorito: boolean;
  onAlternarFavorito: (id: string) => void;
  onSeleccionar?: (lugar: Lugar) => void;
  quieto: boolean;
  visible: boolean;
  retardo: number;
}) {
  const { etiqueta, Icono } = CATEGORIAS[lugar.categoria];

  const superficie = oscuro
    ? "border border-white/[0.08] bg-[#1a1817]"
    : "border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(20,16,10,0.05),0_12px_30px_-20px_rgba(20,16,10,0.3)]";
  const textoSutil = oscuro ? "text-neutral-400" : "text-neutral-500";

  return (
    <motion.article
      initial={quieto ? false : { opacity: 0, y: 18 }}
      animate={visible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: retardo, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl ${superficie}`}
    >
      {/* ---------------------------- Foto ---------------------------- */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        <Image
          src={lugar.imagen}
          alt={lugar.alt}
          fill
          sizes="(max-width: 639px) 74vw, (max-width: 767px) 50vw, (max-width: 1023px) 38vw, (max-width: 1279px) 31vw, 24vw"
          className="object-cover select-none"
          draggable={false}
        />

        {/*
          Distintivo de categoría. El fondo es oscuro y translúcido en los DOS
          temas, no uno por tema: va encima de la foto, y varias de estas son de
          cielo abierto. Con un fondo claro, el texto se perdía.
        */}
        <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 py-1.5 pr-3 pl-2.5 text-[12px] font-medium text-white backdrop-blur-[2px]">
          <Icono className="h-3.5 w-3.5" style={{ color: COLOR_ACENTO }} aria-hidden="true" />
          {etiqueta}
        </span>

        {/* Favorito. El botón mide 44; el círculo visible, 34. */}
        <button
          type="button"
          onClick={() => onAlternarFavorito(lugar.id)}
          aria-pressed={esFavorito}
          aria-label={
            esFavorito ? TEXTOS.quitarFavorito(lugar.nombre) : TEXTOS.anadirFavorito(lugar.nombre)
          }
          className="absolute top-1 right-1 z-10 grid h-11 w-11 place-items-center"
        >
          <motion.span
            className="grid h-[34px] w-[34px] place-items-center rounded-full bg-black/55 backdrop-blur-[2px]"
            /*
              El "pop" al marcar: un rebote corto, no un `scale` lineal, para
              que se sienta como un botón físico. Con `prefers-reduced-motion`
              no hay animación, solo el cambio de color.
            */
            animate={quieto ? undefined : { scale: esFavorito ? [1, 1.28, 1] : 1 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <Heart
              className={`h-[17px] w-[17px] transition-colors ${
                esFavorito ? "fill-[#E5484D] text-[#E5484D]" : "text-white"
              }`}
              aria-hidden="true"
            />
          </motion.span>
        </button>

        {/* Estado, abajo a la izquierda sobre la foto. */}
        <span
          className={`pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-2 text-[11.5px] font-medium ${
            lugar.abierto ? "bg-[#0f2a1b] text-[#4ADE80]" : "bg-black/60 text-neutral-300"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${lugar.abierto ? "bg-[#4ADE80]" : "bg-neutral-400"}`}
          />
          {lugar.abierto ? TEXTOS.abierto : TEXTOS.cerrado}
        </span>
      </div>

      {/* -------------------------- Contenido -------------------------- */}
      <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
        {/*
          Dos renglones reservados para el nombre. "Catedral de Ayacucho" ocupa
          uno y "Templo de San Francisco de Asís" dos; sin la reserva, la
          ubicación y la valoración de cada tarjeta caían a distinta altura y la
          fila se veía descuadrada. Va en `em` para que acompañe al tamaño de
          letra en cualquier breakpoint.
        */}
        <h3
          className="font-bold text-balance"
          style={{ fontSize: "16px", lineHeight: 1.3, minHeight: "2.6em" }}
        >
          {/*
            Enlace extendido: el `after` invisible cubre la tarjeta entera, así
            que se puede pulsar en cualquier punto de ella y no solo sobre las
            dos líneas del nombre —que por sí solas no llegan a los 44 px de
            área táctil—. El corazón lleva `z-10` para quedar por encima y
            seguir siendo pulsable por separado.
          */}
          <button
            type="button"
            onClick={() => onSeleccionar?.(lugar)}
            className="text-left transition-colors after:absolute after:inset-0 after:content-[''] hover:opacity-80"
          >
            {lugar.nombre}
          </button>
        </h3>

        {/*
          Zona y característica. `line-clamp-1` porque los dos datos juntos se
          van de ancho en las tarjetas estrechas de móvil, y una segunda línea
          aquí volvería a descuadrar la valoración.
        */}
        <p className={`mt-1.5 flex items-center gap-1.5 text-[13px] ${textoSutil}`}>
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1">
            {lugar.zona} · {lugar.caracteristica}
          </span>
        </p>

        {/* `mt-auto` empuja la valoración al fondo: queda a la misma altura en
            todas las tarjetas, sea cual sea el largo del nombre. */}
        <p className="mt-auto flex items-center gap-1.5 pt-3.5">
          <Star className="h-4 w-4" style={{ color: COLOR_ACENTO, fill: COLOR_ACENTO }} aria-hidden="true" />
          <span className="text-[13.5px] font-semibold">{lugar.rating.toFixed(1)}</span>
          <span className="sr-only">{TEXTOS.valoracion}</span>
        </p>
      </div>
    </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Auxiliares                                */
/* -------------------------------------------------------------------------- */

/** Ids de los lugares que llegan ya marcados como favoritos. */
function idsFavoritos(lista: readonly Lugar[]): ReadonlySet<string> {
  return new Set(lista.filter((l) => l.favorito).map((l) => l.id));
}

/** Flecha circular del carrusel. */
function Flecha({
  etiqueta,
  Icono,
  onClick,
  className,
}: {
  etiqueta: string;
  Icono: LucideIcon;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${className}`}
    >
      <Icono className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default LugaresDestacados;
