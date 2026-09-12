"use client";

/**
 * MapaPreview — Yachay Ayacucho
 *
 * Adelanto del mapa 3D para la portada. NO es el mapa interactivo: el fondo es
 * una imagen estática y los pines son HTML por encima. El mapa de verdad
 * (MapLibre) vive en la ruta a la que apunta el botón.
 *
 * ── Lo que hay que sustituir ─────────────────────────────────────────────────
 * 1. LA IMAGEN es un MARCADOR. Pasa tu render o captura real en
 *    `imagenMapaDia` / `imagenMapaNoche`. Hoy las dos apuntan al mismo archivo
 *    porque el proyecto solo tiene la versión diurna; en cuanto tengas la
 *    nocturna, cámbiala y el crossfade del tema empieza a notarse.
 * 2. AL CAMBIAR DE IMAGEN, ajusta `PROPORCION_MAPA` a la de tu archivo (ancho /
 *    alto). No es cosmético: es lo que mantiene los pines sobre sus puntos, ver
 *    la explicación del "escenario" más abajo.
 * 3. LOS PINES se colocan en porcentaje sobre la imagen: `x` es el ancho desde
 *    la izquierda, `y` el alto desde arriba, los dos de 0 a 100. Para situar uno
 *    nuevo, mídelo sobre tu imagen y escribe el porcentaje.
 *
 *    FRANJA ÚTIL: el escenario se recorta arriba y abajo en pantallas anchas
 *    —a 1280 px se pierde un 11 % por cada lado—, y la gota se dibuja HACIA
 *    ARRIBA desde su punto, unos 6 puntos más. Así que deja los pines entre el
 *    18 % y el 88 % de alto, o aparecerán cortados.
 * 4. EL DESTINO de cada pin y el del botón (`hrefMapa`) apuntan hoy a rutas de
 *    ejemplo. Conéctalos a tu ficha de lugar y a tu página del mapa.
 *
 * ── Por qué hay un "escenario" y no la imagen suelta ─────────────────────────
 * Con la imagen a `object-cover` directamente sobre la sección, el navegador la
 * recorta para rellenar, y un pin al 60 % del CONTENEDOR deja de coincidir con
 * el 60 % de la FOTO en cuanto cambia la proporción de la ventana: los pines se
 * despegan de sus edificios.
 *
 * La solución es un escenario intermedio que conserva siempre la proporción de
 * la imagen y crece hasta cubrir la sección. Los pines van en porcentaje de ESE
 * escenario, no de la sección, así que quedan clavados a la foto pase lo que
 * pase con la ventana. Lo que sobra se recorta por los lados, y de ahí sale la
 * regla de visibilidad de los pines: ver `desde` en los datos.
 */

import { useMemo, useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Map as MapIcon, MapPin, Camera, ArrowRight, type LucideIcon } from "lucide-react";
import { type Tema, COLOR_ACENTO, COLOR_ACENTO_FUERTE } from "./tema";

/* -------------------------------------------------------------------------- */
/*                                    Datos                                   */
/* -------------------------------------------------------------------------- */

/**
 * Proporción de la imagen del mapa (ancho / alto). La de ejemplo es de
 * 1309 × 929. CÁMBIALA si cambias la imagen, o los pines se desplazarán.
 */
const PROPORCION_MAPA = "1309 / 929";

/**
 * Desde qué tamaño de pantalla se ve cada pin.
 *
 * No es solo una cuestión de saturación: el escenario se recorta por los lados
 * en pantallas estrechas. A 375 px solo queda a la vista la franja central de la
 * imagen —del 30 % al 70 % de su ancho—, así que un pin al 94 % simplemente no
 * estaría ahí. Por eso los de los extremos entran más tarde.
 */
export type VisibleDesde = "movil" | "tablet" | "escritorio";

export interface PinMapa {
  id: string;
  nombre: string;
  /** Porcentaje del ancho de la IMAGEN, de 0 a 100. */
  x: number;
  /** Porcentaje del alto de la IMAGEN, de 0 a 100. */
  y: number;
  /** Foto redonda del interior. Solo la usan los destacados. */
  imagen?: string;
  tipo: "templo" | "museo" | "plaza" | "mirador" | "foto";
  /** Gota grande con foto y etiqueta. Si es `false`, pin pequeño y sin nombre. */
  destacado: boolean;
  desde: VisibleDesde;
  /** Ficha del lugar. Conecta aquí tu ruta real. */
  destino: string;
}

export const PINES: readonly PinMapa[] = [
  // --- Centrales: son los únicos que caben en la franja visible en móvil. ---
  {
    id: "catedral",
    nombre: "Catedral de Ayacucho",
    x: 61,
    y: 17.5,
    imagen: "/places/1.jpg",
    tipo: "templo",
    destacado: true,
    desde: "movil",
    destino: "/lugares/catedral-de-ayacucho",
  },
  {
    id: "plaza-armas",
    nombre: "Plaza de Armas de Huamanga",
    x: 67,
    y: 38,
    imagen: "/places/5.jpg",
    tipo: "plaza",
    destacado: true,
    desde: "movil",
    destino: "/lugares/plaza-de-armas",
  },
  {
    id: "santo-domingo",
    nombre: "Templo de Santo Domingo",
    x: 53,
    y: 68,
    imagen: "/places/7.jpg",
    tipo: "templo",
    destacado: true,
    desde: "movil",
    destino: "/lugares/templo-de-santo-domingo",
  },

  // --- Laterales: entran cuando el recorte deja de comérselos. ---
  {
    id: "compania",
    nombre: "Iglesia de la Compañía",
    x: 74,
    y: 72,
    imagen: "/places/3.jpg",
    tipo: "templo",
    destacado: true,
    desde: "tablet",
    destino: "/lugares/iglesia-de-la-compania",
  },
  {
    id: "arte-popular",
    nombre: "Museo de Arte Popular",
    x: 81,
    // Estaba en 13 y quedaba medio cortado: ver la nota sobre la franja segura.
    y: 19,
    imagen: "/places/4.jpg",
    tipo: "museo",
    destacado: true,
    desde: "tablet",
    destino: "/lugares/museo-de-arte-popular",
  },
  {
    id: "acuchimay",
    nombre: "Mirador de Acuchimay",
    x: 94,
    y: 28,
    imagen: "/places/2.jpg",
    tipo: "mirador",
    destacado: true,
    desde: "escritorio",
    destino: "/lugares/mirador-de-acuchimay",
  },

  // --- Secundarios: solo dan densidad, sin nombre ni foto. ---
  { id: "foto-1", nombre: "Punto fotográfico", x: 41, y: 22, tipo: "foto", destacado: false, desde: "escritorio", destino: "/mapa" },
  { id: "foto-2", nombre: "Punto fotográfico", x: 48.5, y: 22.5, tipo: "foto", destacado: false, desde: "escritorio", destino: "/mapa" },
  { id: "foto-3", nombre: "Punto fotográfico", x: 79, y: 44, tipo: "foto", destacado: false, desde: "escritorio", destino: "/mapa" },
  { id: "foto-4", nombre: "Punto fotográfico", x: 81, y: 59, tipo: "foto", destacado: false, desde: "escritorio", destino: "/mapa" },
];

const ICONOS_TIPO: Readonly<Record<PinMapa["tipo"], LucideIcon>> = {
  templo: MapPin,
  museo: MapPin,
  plaza: MapPin,
  mirador: MapPin,
  foto: Camera,
};

/** Clases de visibilidad por tramo. `tablet` arranca en `sm`, que es 640 px. */
const VISIBILIDAD: Readonly<Record<VisibleDesde, string>> = {
  movil: "",
  tablet: "hidden sm:block",
  escritorio: "hidden lg:block",
};

const TEXTOS = {
  antetitulo: "Mapa 3D interactivo",
  tituloLinea1: "Explora Ayacucho",
  tituloLinea2: "como nunca antes",
  parrafo:
    "Navega el patrimonio de Huamanga en un mapa 3D con clima y recomendaciones en tiempo real",
  boton: "Explorar mapa 3D",
  insignia: (n: number) => `${n}+ lugares patrimoniales`,
  altMapaDia: "Vista aérea del centro histórico de Huamanga, Ayacucho, de día",
  altMapaNoche: "Vista aérea del centro histórico de Huamanga, Ayacucho, de noche",
};

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

interface MapaPreviewProps {
  tema: Tema;
  /** MARCADORES: sustituye por tu render real del mapa 3D. */
  imagenMapaDia?: string;
  imagenMapaNoche?: string;
  pines?: readonly PinMapa[];
  /** Ruta del mapa interactivo de verdad, donde vivirá MapLibre. */
  hrefMapa?: string;
  totalLugares?: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export function MapaPreview({
  tema,
  imagenMapaDia = "/mapa-seccion-3d-nuevo.png",
  // Mismo archivo a propósito: todavía no hay versión nocturna. Ver la nota 1.
  imagenMapaNoche = "/mapa-seccion-3d-nuevo.png",
  pines = PINES,
  hrefMapa = "/mapa",
  totalLugares = 30,
}: MapaPreviewProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;

  // El dorado de marca sobre fondo claro se queda corto de contraste; el
  // antetítulo y el texto dorado usan el tono fuerte en tema claro.
  const acentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;

  /*
   * Los destacados entran escalonados y los secundarios después, para que la
   * vista se pose primero en los lugares con nombre.
   */
  /*
   * Un ÚNICO detector de entrada para todos los pines, el de la sección.
   *
   * Con uno por pin, los que caen pegados al borde superior nunca llegaban a
   * verse lo bastante como para dispararse y se quedaban congelados a media
   * animación —escala 0.7 y translúcidos— para siempre. Mirando la sección
   * entera, todos entran a la vez y ninguno depende de su propia posición.
   */
  const refEscenario = useRef<HTMLDivElement>(null);
  const enVista = useInView(refEscenario, { once: true, amount: 0.2 });

  const ordenados = useMemo(
    () => [...pines].sort((a, b) => Number(b.destacado) - Number(a.destacado)),
    [pines],
  );

  return (
    <section id="mapa-3d" className="w-full overflow-x-hidden">
      {/*
        A sangre, sin tarjeta ni margen, y de alto acotado: `svh` para que la
        barra del navegador móvil no lo haga saltar, con un tope en rem para
        que en pantallas muy altas no se convierta en un muro.
      */}
      <div className="relative isolate flex min-h-[min(86svh,44rem)] flex-col overflow-hidden">
        {/* ---------------------------- Fondo ---------------------------- */}
        <div className="absolute inset-0 -z-10">
          {/*
            EL ESCENARIO. Conserva la proporción de la imagen y crece hasta
            cubrir la sección por los dos ejes; lo que sobra se recorta. Los
            pines cuelgan de aquí, no de la sección, y por eso no se despegan
            de sus edificios al cambiar el tamaño de la ventana.
          */}
          <div
            ref={refEscenario}
            className="absolute top-1/2 left-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
            style={{ aspectRatio: PROPORCION_MAPA }}
          >
            {/*
              Las dos imágenes van siempre montadas y superpuestas igual: lo
              único que cruza al cambiar de tema es la opacidad, sin mover ni
              escalar nada.
            */}
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: oscuro ? 0 : 1 }}
              transition={{ duration: quieto ? 0 : 0.4, ease: "easeInOut" }}
            >
              <Image
                src={imagenMapaDia}
                alt={TEXTOS.altMapaDia}
                fill
                sizes="100vw"
                /*
                  `eager`: es la imagen principal de la sección y, dentro de un
                  envoltorio animado, el navegador puede no llegar a elegirle
                  fuente si se deja en diferido.
                */
                loading="eager"
                className="object-cover"
              />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: oscuro ? 1 : 0 }}
              transition={{ duration: quieto ? 0 : 0.4, ease: "easeInOut" }}
            >
              <Image
                src={imagenMapaNoche}
                alt={TEXTOS.altMapaNoche}
                fill
                sizes="100vw"
                loading="eager"
                className="object-cover"
              />
            </motion.div>

            {/* Los pines, dentro del escenario. */}
            {ordenados.map((pin, i) => (
              <Pin
                key={pin.id}
                pin={pin}
                indice={i}
                quieto={quieto}
                visible={enVista}
                acentoTexto={acentoTexto}
              />
            ))}
          </div>

          {/*
            Velo de fusión, en tres capas y POR ENCIMA del escenario, para que
            el mapa no termine en un rectángulo duro contra la página:

            1. Horizontal, denso a la izquierda donde va el texto y abriéndose
               a la derecha. En móvil no hay hueco lateral que abrir, así que
               ahí manda el vertical.
            2. Vertical, funde los bordes de arriba y abajo con el fondo de la
               página.
            3. En móvil, un refuerzo arriba: es donde cae el texto.

            Los dos temas usan la misma geometría; solo cambia el color, que es
            el de la página, así que la costura desaparece.
          */}
          {(() => {
            const c = oscuro ? "#0e0d0c" : "#faf8f5";
            return (
              <>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 hidden sm:block"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${c}f2 0%, ${c}e0 32%, ${c}b3 50%, ${c}5c 70%, ${c}1f 88%, ${c}00 100%)`,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, ${c}cc 0%, ${c}40 22%, ${c}00 45%, ${c}00 62%, ${c}73 84%, ${c} 100%)`,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 sm:hidden"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, ${c}f7 0%, ${c}e0 38%, ${c}8c 58%, ${c}3d 78%, ${c}8c 100%)`,
                  }}
                />
              </>
            );
          })()}
        </div>

        {/* -------------------------- Editorial -------------------------- */}
        {/*
          Arriba en móvil —sobre la zona más velada— y a la izquierda, centrado
          en vertical, desde `lg`. El `pb` respeta el área segura de iOS.
        */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-start px-4 pt-14 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-20 lg:justify-center lg:px-8 lg:py-24">
          <div className="w-full max-w-xl">
            {/* Antetítulo con su guión. */}
            <motion.p
              initial={quieto ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] uppercase sm:text-xs"
              style={{ color: acentoTexto }}
            >
              <span
                aria-hidden="true"
                className="h-px w-7 shrink-0"
                style={{ backgroundColor: acentoTexto }}
              />
              {TEXTOS.antetitulo}
            </motion.p>

            <motion.h2
              initial={quieto ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`mt-5 font-display font-bold ${oscuro ? "text-[#faf6f0]" : "text-[#1b1712]"}`}
              style={{
                // clamp para que no desborde a 320 px ni se quede pequeño en
                // pantallas grandes.
                fontSize: "clamp(2rem, 6vw, 3.75rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              {TEXTOS.tituloLinea1}
              <br />
              {TEXTOS.tituloLinea2}
            </motion.h2>

            <motion.p
              initial={quieto ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className={`mt-5 max-w-md text-[15px] leading-relaxed sm:text-base ${
                oscuro ? "text-white/75" : "text-neutral-700"
              }`}
            >
              {TEXTOS.parrafo}
            </motion.p>

            {/* Botón y contador. En móvil se apilan a todo el ancho. */}
            <motion.div
              initial={quieto ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Aquí es donde se pasa al MapLibre real. */}
              <a
                href={hrefMapa}
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold whitespace-nowrap text-[#1b1206] transition-transform active:scale-[0.98]"
                style={{
                  backgroundColor: COLOR_ACENTO,
                  boxShadow: `0 14px 34px -14px ${COLOR_ACENTO}cc`,
                }}
              >
                <MapIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                {TEXTOS.boton}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <span
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-[14px] font-medium backdrop-blur-sm ${
                  oscuro
                    ? "border-white/20 bg-white/10 text-white/90"
                    : "border-black/10 bg-white/70 text-neutral-800"
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0" style={{ color: acentoTexto }} aria-hidden="true" />
                {TEXTOS.insignia(totalLugares)}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                     Pin                                    */
/* -------------------------------------------------------------------------- */

/**
 * Un pin sobre el mapa.
 *
 * La gota se dibuja con un cuadrado girado 45° al que se le quita el redondeo
 * de una esquina: esa esquina en punta queda abajo. La foto de dentro se gira
 * en sentido contrario para volver a verse derecha.
 *
 * El enlace mide 44 px aunque el dibujo sea menor: el área táctil no puede ser
 * del tamaño del icono.
 */
function Pin({
  pin,
  indice,
  quieto,
  visible,
  acentoTexto,
}: {
  pin: PinMapa;
  indice: number;
  quieto: boolean;
  visible: boolean;
  acentoTexto: string;
}) {
  const Icono = ICONOS_TIPO[pin.tipo];

  /*
   * Los pines pegados a los márgenes alinean su etiqueta hacia DENTRO en vez de
   * centrarla bajo la gota: centrada, se les salía medio nombre del encuadre y
   * el recorte se lo comía.
   *
   * El umbral es distinto en móvil porque el encuadre también lo es. En
   * escritorio se ve la imagen entera de lado a lado y solo molestan los pines
   * por encima del 85 %; a 375 px solo queda a la vista la franja del 30 % al
   * 70 %, así que uno al 67 % ya está casi en el borde y necesita el mismo
   * trato. De ahí los dos umbrales, uno por tramo.
   */
  const anclaMovil = pin.x > 58 ? "right-0 left-auto translate-x-0" : "left-1/2 -translate-x-1/2";
  const anclaAncha =
    pin.x > 85
      ? "sm:right-0 sm:left-auto sm:translate-x-0"
      : pin.x < 15
        ? "sm:left-0 sm:right-auto sm:translate-x-0"
        : "sm:left-1/2 sm:right-auto sm:-translate-x-1/2";
  const anclajeEtiqueta = `${anclaMovil} ${anclaAncha}`;

  const entrada = quieto
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: -18, scale: 0.7 },
        animate: visible ? { opacity: 1, y: 0, scale: 1 } : undefined,
        transition: {
          // Rebote corto al caer: `spring` y no una curva suave, para que se
          // lea como un pin que se posa y no como algo que aparece.
          type: "spring" as const,
          stiffness: 420,
          damping: 18,
          delay: 0.35 + indice * 0.08,
        },
      };

  return (
    <motion.a
      /* Conecta aquí la ficha real del lugar. */
      href={pin.destino}
      aria-label={pin.nombre}
      {...entrada}
      whileHover={quieto ? undefined : { scale: 1.08 }}
      whileTap={quieto ? undefined : { scale: 0.95 }}
      /*
        El enlace mide SOLO la gota, y la etiqueta va absoluta por debajo. Si la
        etiqueta contara para la caja, `-translate-y-full` subiría el conjunto
        entero y la punta dejaría de tocar el edificio: quedaría el nombre sobre
        el punto y la gota flotando por encima. Al ir absoluta sigue siendo
        parte del enlace —y por tanto pulsable—, pero no mueve el ancla.
      */
      className={`absolute z-10 -translate-x-1/2 -translate-y-full ${VISIBILIDAD[pin.desde]}`}
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
    >
      {pin.destacado ? (
        <>
          <span className="grid h-11 w-11 place-items-center sm:h-14 sm:w-14">
            <span
              className="relative block h-10 w-10 rotate-45 rounded-[50%_50%_0_50%] border-2 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.7)] sm:h-12 sm:w-12"
              style={{ borderColor: COLOR_ACENTO, backgroundColor: "#7a1b1b" }}
            >
              {pin.imagen ? (
                <span className="absolute inset-[3px] -rotate-45 overflow-hidden rounded-full">
                  <Image
                    src={pin.imagen}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
              ) : null}
            </span>
          </span>

          {/*
            Etiqueta. Lleva su propio fondo velado porque cae sobre el mapa, y
            ahí hay tejados claros y zonas de césped donde el texto blanco solo
            no se leería.
          */}
          <span
            className={`absolute top-full mt-1 flex w-max max-w-[10rem] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-[2px] sm:max-w-[12rem] sm:text-[12.5px] ${anclajeEtiqueta}`}
          >
            <Icono className="h-3.5 w-3.5 shrink-0" style={{ color: acentoTexto }} aria-hidden="true" />
            <span className="truncate">{pin.nombre}</span>
          </span>
        </>
      ) : (
        // Secundario: solo densidad, sin nombre ni foto.
        <span className="grid h-11 w-11 place-items-center">
          <span
            className="grid h-7 w-7 rotate-45 place-items-center rounded-[50%_50%_0_50%] border shadow-[0_6px_14px_-6px_rgba(0,0,0,0.7)]"
            style={{ borderColor: `${COLOR_ACENTO}b3`, backgroundColor: "rgba(20,16,12,0.72)" }}
          >
            <Icono
              className="h-3.5 w-3.5 -rotate-45"
              style={{ color: COLOR_ACENTO }}
              aria-hidden="true"
            />
          </span>
        </span>
      )}
    </motion.a>
  );
}

export default MapaPreview;
