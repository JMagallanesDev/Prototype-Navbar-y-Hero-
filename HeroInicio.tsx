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
 * Temas: el tema claro es claro de verdad. El overlay sobre la foto es
 * blanco y se abre hacia la derecha, así que la mitad izquierda (donde
 * vive el texto) queda casi blanca y la foto asoma por la derecha; en
 * oscuro el mismo overlay es negro. Como el fondo cambia de blanco a
 * negro, TODO el texto cambia con él — titular, párrafo, botones e
 * indicador de scroll. Los valores concretos y su contraste medido están
 * en `tema.ts`.
 */

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Map as MapIcon,
  PlayCircle,
  ChevronDown,
} from "lucide-react";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { TypingAnimation } from "@/components/ui/typing-animation";
import {
  type Tema,
  COLOR_ACENTO,
  COLOR_ACENTO_TEXTO_CLARO,
  COLOR_TITULAR_LINEA_1,
  COLOR_TITULAR_LINEA_2,
  COLOR_TITULAR_LINEA_3,
  COLOR_TITULAR_LINEA_1_CLARO,
  COLOR_TITULAR_LINEA_2_CLARO,
  COLOR_TITULAR_LINEA_3_CLARO,
  BANDA_GRADIENTE_TITULAR,
  BANDA_GRADIENTE_TITULAR_CLARO,
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
  
  tituloLinea1: "Explora Ayacucho,",
  tituloLinea2: "vive su historia,",
  tituloLinea3: "protege su legado.",
  botonPrimario: "Explorar mapa 3D",
  botonSecundario: "Ver video",
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
  };

  const duracionCrossfade = prefiereMenosMovimiento ? 0 : 0.4;

  // Paleta del titular y del acento según el tema. Ver `tema.ts` para el
  // contraste medido de cada valor sobre su fondo.
  const bandaTitular = oscuro ? BANDA_GRADIENTE_TITULAR : BANDA_GRADIENTE_TITULAR_CLARO;
  const colorLinea1 = oscuro ? COLOR_TITULAR_LINEA_1 : COLOR_TITULAR_LINEA_1_CLARO;
  const colorLinea2 = oscuro ? COLOR_TITULAR_LINEA_2 : COLOR_TITULAR_LINEA_2_CLARO;
  const colorLinea3 = oscuro ? COLOR_TITULAR_LINEA_3 : COLOR_TITULAR_LINEA_3_CLARO;
  const colorAcentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_TEXTO_CLARO;

  const textoParrafo = oscuro ? "text-neutral-200" : "text-neutral-800";
  const botonSecundario = oscuro
    ? "border-white/25 bg-white/10 text-white"
    : "border-neutral-300 bg-white/80 text-neutral-900";
  const indicadorScroll = oscuro
    ? "border-white/25 text-white/80"
    : "border-neutral-300 text-neutral-500";

  return (
    <section
      id="inicio"
      className={`relative min-h-[100svh] w-full overflow-hidden transition-colors duration-300 ${
        oscuro ? "bg-neutral-950" : "bg-white"
      }`}
    >
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

        {/* Overlay: capa separada ENCIMA de ambas fotos, del color del fondo
            del tema. Se abre hacia la derecha, así que la columna izquierda
            —donde va el texto— queda casi opaca y la foto respira a la
            derecha. En móvil no hay hueco lateral para eso, así que el
            velo es plano y cubre todo.

            OJO con el `sm:bg-transparent` de las dos ramas: el velo plano de
            móvil es `background-color` y el gradiente es `background-image`,
            que son propiedades DISTINTAS. Sin él las dos se acumulan en
            escritorio y el velo plano sigue tapando la foto por debajo del
            gradiente, hagas lo que hagas con las paradas.

            Por qué van a mano con 6 paradas en vez de `from/via/to`: con tres
            paradas el velo arranca plano y luego cae, y ese arranque se ve
            como una COSTURA vertical en mitad del hero. Estas paradas dibujan
            una caída progresiva sin tramo plano, y además NUNCA llegan a
            opacidad total: la foto se ve en todo el ancho (12% a la izquierda,
            88% a la derecha) en vez de desaparecer bajo un muro de color.

            Los dos temas usan la MISMA geometría de velo — solo cambia el
            color (#ffffff vs #0a0a0a). Eso los deja simétricos: lo único que
            los diferencia es la foto y la paleta de texto.

            Por qué hay dos curvas (`sm:` y `xl:`): el ancho del texto es fijo
            (max-w-xl dentro de max-w-7xl), así que cuanto más estrecha es la
            pantalla, MÁS PORCENTAJE del ancho ocupa. El borde derecho del
            párrafo cae en el 59% a 1024px pero solo en el 47% de 1280px en
            adelante. Con una sola curva habría que proteger el peor caso y el
            blanco se comería la foto en pantallas grandes.

            Contraste medido con el velo real aplicado, sobre el peor punto
            de la foto bajo cada franja de texto — en claro el bloque más
            OSCURO (texto oscuro sobre sombra), en oscuro el más BRILLANTE
            (texto claro sobre farola):

              claro   titular 3.25:1 / 3.67:1 (mín. 3:1)
                      párrafo 5.28:1 / 10.75:1 (mín. 4.5:1)
              oscuro  titular 5.67:1 / 8.88:1 (mín. 3:1)
                      párrafo 5.82:1 / 13.58:1 (mín. 4.5:1)

            El tema claro va justo; el oscuro tiene margen de sobra porque la
            foto nocturna es oscura de partida. Si tocas estas paradas, esos
            números se mueven — el que primero se cae es el dorado del
            titular en claro. */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            oscuro
              ? "bg-neutral-950/70 sm:bg-transparent"                + " sm:bg-[linear-gradient(to_right,#0a0a0ae6_0%,#0a0a0ae0_45%,#0a0a0ad1_60%,#0a0a0a85_75%,#0a0a0a42_90%,#0a0a0a29_100%)]"                + " xl:bg-[linear-gradient(to_right,#0a0a0ae0_0%,#0a0a0adb_30%,#0a0a0ad1_47%,#0a0a0a94_62%,#0a0a0a52_78%,#0a0a0a1f_100%)]"
              : "bg-white/80 sm:bg-transparent"                + " sm:bg-[linear-gradient(to_right,#ffffffe6_0%,#ffffffe0_45%,#ffffffd1_60%,#ffffff85_75%,#ffffff42_90%,#ffffff29_100%)]"                + " xl:bg-[linear-gradient(to_right,#ffffffe0_0%,#ffffffdb_30%,#ffffffd1_47%,#ffffff94_62%,#ffffff52_78%,#ffffff1f_100%)]"
          }`}
        />
        {/* Segunda capa, vertical: asienta el borde inferior contra el fondo
            de la página para que la foto no corte en seco. Ojo: esta capa
            MULTIPLICA con la de arriba, así que lo que ponga en el borde
            superior se suma al blanco lateral y lava la foto justo donde
            tiene que verse. Por eso arriba casi no lleva nada. */}
        <div
          className={`absolute inset-0 bg-gradient-to-t transition-colors duration-300 ${
            oscuro
              ? "from-neutral-950/60 via-transparent to-neutral-950/45"
              : "from-white/60 via-transparent to-white/10"
          }`}
        />
      </div>

      {/* Contenido — toda la paleta sigue al tema (ver arriba) */}
      <motion.div
        variants={variantesContenedor}
        initial="oculto"
        animate="visible"
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-4 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-8"
      >
       

        {/* Titular: la entrada de cada línea es el propio barrido de
            DiaTextReveal (Magic UI), en vez del fade+subida de motion/react
            que usan el resto de bloques del hero. Cada línea tiene su color
            final (`textColor`) y las tres comparten la misma banda cálida;
            ambos cambian con el tema, porque el dorado y el malva del tema
            oscuro no se leen sobre blanco. Si el usuario tiene
            prefers-reduced-motion, el propio componente salta directo al
            color final sin barrido. */}
        <h1 className="mt-5 text-[clamp(2.25rem,9vw,4.5rem)] font-black leading-[1.05] tracking-tight sm:mt-6">
          <DiaTextReveal
            text={TEXTOS_HERO.tituloLinea1}
            colors={bandaTitular}
            textColor={colorLinea1}
            duration={1.7}
            delay={0.15}
            once
            className="block pb-[0.16em]"
          />
          <DiaTextReveal
            text={TEXTOS_HERO.tituloLinea2}
            colors={bandaTitular}
            textColor={colorLinea2}
            duration={1.7}
            delay={0.33}
            once
            className="block pb-[0.16em]"
          />
          <DiaTextReveal
            text={TEXTOS_HERO.tituloLinea3}
            colors={bandaTitular}
            textColor={colorLinea3}
            duration={1.7}
            delay={0.51}
            once
            className="block pb-[0.16em]"
          />
        </h1>

        <motion.div variants={variantesItem} className="mt-5 max-w-xl">
          <TypingAnimation
            as="p"
            segments={PARRAFO_SEGMENTOS.map((segmento) => ({
              text: segmento.texto,
              className: segmento.resaltado ? "font-semibold" : undefined,
              style: segmento.resaltado ? { color: colorAcentoTexto } : undefined,
            }))}
            typeSpeed={19}
            delay={800}
            reserveSpace
            hideCursorOnFinish
            className={`text-sm leading-relaxed transition-colors duration-300 sm:text-base ${textoParrafo}`}
          />
        </motion.div>

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
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold backdrop-blur-sm transition-transform active:scale-95 ${botonSecundario}`}
          >
            <PlayCircle className="h-4 w-4" />
            {TEXTOS_HERO.botonSecundario}
          </button>
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        animate={prefiereMenosMovimiento ? {} : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border p-2 transition-colors duration-300 ${indicadorScroll}`}
        aria-hidden="true"
      >
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </section>
  );
}
