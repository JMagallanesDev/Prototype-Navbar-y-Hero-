"use client";

/**
 * PasaporteCultural — Yachay Ayacucho
 *
 * Sección a sangre: la foto del pasaporte es el fondo y el texto va encima.
 * Sin tarjeta ni contenedor alrededor.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: llega por la prop `tema`, igual que el resto de secciones.
 * - Imágenes: por defecto apuntan a `public/pasaporte/`. Next.js SOLO sirve
 *   archivos desde `public/`, así que los PNG que estaban en la raíz del
 *   proyecto no habrían cargado nunca. Ahí hay copias en WebP de los mismos
 *   originales —mismas dimensiones, ~210 KB frente a 2,4 MB—; los PNG siguen
 *   en la raíz sin tocar. Si cambias las imágenes, déjalas en `public/` y
 *   corrige la ruta en `imagenPasaporteOscuro` / `imagenPasaporteClaro`.
 * - El destino del botón llega por `hrefCTA`; los textos viven en `TEXTOS`
 *   para cambiarlos por next-intl sin tocar el marcado.
 *
 * ── Cómo se reparte según el ancho ───────────────────────────────────────────
 * Desde `lg` la imagen cubre toda la sección y el texto ocupa el hueco vacío
 * de la izquierda. Por debajo de `lg` ese hueco no existe: la foto se encuadra
 * sobre el pasaporte en la parte alta y el texto sube sobre su mitad inferior,
 * donde un degradado funde la foto con el color del tema para que se lea.
 */

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { type Tema, COLOR_ACENTO, COLOR_ACENTO_FUERTE } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                    Textos                                  */
/* -------------------------------------------------------------------------- */

const TEXTOS = {
  antetitulo: "Pasaporte cultural",
  titulo: "Colecciona los sellos de Ayacucho",
  parrafo:
    "Cada lugar histórico que visitas deja su sello en tu pasaporte digital. Reúnelos todos y conviértete en guardián del patrimonio.",
  boton: "Comienza tu pasaporte",
  altOscuro:
    "Pasaporte cultural de Yachay Ayacucho abierto sobre una mesa oscura, con los sellos de los lugares históricos de Huamanga",
  altClaro:
    "Pasaporte cultural de Yachay Ayacucho abierto sobre un fondo claro, con los sellos de los lugares históricos de Huamanga",
};

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

interface PasaporteCulturalProps {
  tema: Tema;
  /** Ruta dentro de `public/`. Ver la nota de la cabecera. */
  imagenPasaporteOscuro?: string;
  imagenPasaporteClaro?: string;
  hrefCTA?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export function PasaporteCultural({
  tema,
  imagenPasaporteOscuro = "/pasaporte/pasaporte-oscuro-v2.webp",
  imagenPasaporteClaro = "/pasaporte/pasaporte-claro.webp",
  hrefCTA = "/pasaporte",
}: PasaporteCulturalProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;

  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { once: true, amount: 0.25 });

  /* --- Paleta ------------------------------------------------------------- */
  // Sobre fondo claro el dorado de marca se queda corto de contraste; el texto
  // dorado usa el tono fuerte en tema claro. El relleno del botón no cambia.
  const acentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;
  const fondo = oscuro ? "#0e0d0c" : "#faf8f5";
  const colorTitulo = oscuro ? "text-[#faf6f0]" : "text-[#1b1712]";
  const textoCuerpo = oscuro ? "text-white/75" : "text-neutral-700";

  const entrada = (retardo: number) =>
    quieto
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 14 },
          animate: enVista ? { opacity: 1, y: 0 } : undefined,
          transition: { duration: 0.55, delay: retardo, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    /*
      El relleno vertical va en la SECCIÓN y la foto en el bloque interior: así
      queda una franja de color liso entre el mapa y el pasaporte y las dos
      imágenes no se tocan.
    */
    <section
      id="pasaporte"
      className="relative isolate w-full overflow-x-hidden py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: fondo }}
    >
      <div
        ref={ref}
        /*
          Desde `lg`, alto mínimo = el de la imagen a su proporción natural
          (941 / 1672 = 56,28 % del ancho). Así la foto no se recorta ni por los
          lados ni por arriba. Sin tope en rem a propósito: con él, en monitores
          anchos se cortaba la tapa del pasaporte. Si el contenido pide más alto,
          la sección crece.
        */
        className="relative flex flex-col lg:min-h-[56.28vw] lg:justify-center"
      >
        {/* ---------------------------- Imagen ---------------------------- */}
        {/*
          Móvil: cuadrada y encuadrada a la derecha (92 %), que es justo lo que
          hace falta para que el pasaporte —del 42 % al 98 % del ancho de la
          foto— entre casi entero. Tablet: 16:10. Escritorio: cubre la sección.
        */}
        <div className="relative aspect-square w-full overflow-hidden sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto">
          {/*
            Las dos imágenes van siempre montadas y superpuestas exactamente
            igual: lo único que cruza al cambiar de tema es la opacidad, sin
            mover ni escalar nada. `eager` porque, dentro de un envoltorio
            animado, el navegador puede no llegar a elegirles fuente en diferido.
          */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: oscuro ? 1 : 0 }}
            transition={{ duration: quieto ? 0 : 0.4, ease: "easeInOut" }}
          >
            <Image
              src={imagenPasaporteOscuro}
              alt={TEXTOS.altOscuro}
              fill
              sizes="100vw"
              loading="eager"
              className="object-cover object-[92%_50%] lg:object-center"
            />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: oscuro ? 0 : 1 }}
            transition={{ duration: quieto ? 0 : 0.4, ease: "easeInOut" }}
          >
            <Image
              src={imagenPasaporteClaro}
              alt={TEXTOS.altClaro}
              fill
              sizes="100vw"
              loading="eager"
              className="object-cover object-[92%_50%] lg:object-center"
            />
          </motion.div>

          {/*
            Velos, siempre como capas separadas y pintados con el color de la
            página.

            TEMA OSCURO
            Móvil y tablet: un fundido corto arriba, para que la foto no empiece
            con un corte seco, y uno largo abajo que llega a color liso justo
            donde empieza el texto.
            Escritorio: un velo lateral SUAVE que muere antes del pasaporte —el
            tercio izquierdo de la imagen ya es liso, así que solo refuerza, no
            tapa— y fundidos finos arriba y abajo.

            TEMA CLARO
            Pintados en crema, esos mismos velos lavaban la foto con una niebla
            blanca. Aquí no hacen falta: el tercio izquierdo de la foto clara ya
            es crema liso y el texto oscuro se lee sin ayuda. Solo queda, en
            móvil y tablet, un fundido CORTO en el borde inferior, pegado al
            texto, para que la foto no acabe en un corte seco bajo el título.
          */}
          {oscuro ? (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-0 lg:hidden"
                style={{
                  backgroundImage: `linear-gradient(to bottom, ${fondo} 0%, ${fondo}00 12%, ${fondo}00 42%, ${fondo}b3 62%, ${fondo} 80%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 hidden lg:block"
                style={{
                  backgroundImage: `linear-gradient(to right, ${fondo}d9 0%, ${fondo}a6 22%, ${fondo}40 36%, ${fondo}00 44%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 hidden lg:block"
                style={{
                  backgroundImage: `linear-gradient(to bottom, ${fondo} 0%, ${fondo}00 10%, ${fondo}00 88%, ${fondo} 100%)`,
                }}
              />
            </>
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${fondo}00 0%, ${fondo}00 70%, ${fondo} 88%)`,
              }}
            />
          )}
        </div>

        {/* --------------------------- Contenido --------------------------- */}
        {/*
          Por debajo de `lg`, el margen negativo sube el texto sobre la parte
          baja de la foto (la del degradado), de modo que imagen y texto forman
          un solo bloque. Va en `vw` porque el alto de la foto también lo es.
          En tema claro sube menos, porque su fundido es más corto.

          Desde `lg` el ancho va en `vw` y NO dentro del contenedor centrado
          `max-w-7xl` del resto de secciones. El pasaporte empieza al 42 % del
          ancho de la imagen, y la imagen ocupa la ventana entera: en un monitor
          de 1920 px el contenedor centrado desplazaba el texto 320 px hacia la
          derecha y lo metía encima del pasaporte. Midiendo en `vw`, el texto
          termina siempre antes del 40 %.
        */}
        <div className={`relative z-10 w-full px-4 sm:px-6 lg:mt-0 ${oscuro ? "-mt-[26vw] sm:-mt-[18vw]" : "-mt-[14vw] sm:-mt-[10vw]"} lg:py-12 lg:pr-0 lg:pl-[max(2rem,6vw)]`}>
          <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-[min(34rem,31vw)]">
            <motion.p
              {...entrada(0.05)}
              className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] uppercase sm:text-xs"
              style={{ color: acentoTexto }}
            >
              <span aria-hidden="true" className="h-px w-7 shrink-0" style={{ backgroundColor: acentoTexto }} />
              {TEXTOS.antetitulo}
            </motion.p>

            <motion.h2
              {...entrada(0.12)}
              className={`mt-4 font-display font-bold text-balance ${colorTitulo}`}
              style={{
                // clamp: no desborda a 320 px ni se queda pequeño en escritorio.
                fontSize: "clamp(2rem, 4.2vw, 3.5rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {TEXTOS.titulo}
            </motion.h2>

            <motion.p
              {...entrada(0.19)}
              className={`mt-4 text-[15px] leading-relaxed sm:text-base ${textoCuerpo}`}
            >
              {TEXTOS.parrafo}
            </motion.p>

            <motion.div {...entrada(0.26)} className="mt-8">
              <a
                href={hrefCTA}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold text-[#1b1206] transition-transform active:scale-[0.98] sm:w-auto"
                style={{
                  backgroundColor: COLOR_ACENTO,
                  boxShadow: `0 14px 34px -14px ${COLOR_ACENTO}cc`,
                }}
              >
                {TEXTOS.boton}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PasaporteCultural;
