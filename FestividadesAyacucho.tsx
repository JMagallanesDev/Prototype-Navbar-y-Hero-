"use client";

/**
 * FestividadesAyacucho — Yachay Ayacucho
 *
 * Sección autocontenida: cabecera, evento destacado con cuenta regresiva y un
 * selector de festividades en carrusel. Al elegir una miniatura cambia el
 * destacado de arriba.
 *
 * ── Conexión con tu proyecto real ────────────────────────────────────────────
 * - Tema: llega por la prop `tema`, igual que el resto de secciones. El
 *   componente no guarda estado de tema.
 * - Datos: `FESTIVIDADES` es un array tipado con el copy y las fotos que ya hay
 *   en `public/festividades/`. Se sustituye entero por la prop `festividades`
 *   —de tu BD o de next-intl— sin tocar nada del componente.
 * - Cuenta regresiva: <CuentaRegresiva> vive aquí abajo porque el proyecto no
 *   tenía una. Si montas la tuya, cámbiala en el único sitio donde se usa y
 *   borra la de aquí.
 * - La cabecera reutiliza <DiaTextReveal>, <FileteOrnamental> y
 *   <TypingAnimation> de `components/ui`, que son los mismos que usan las demás
 *   secciones: así todas abren igual.
 *
 * ── Por qué la fecha es {mes, dia} y no una fecha completa ───────────────────
 * Son fiestas ANUALES. Con una fecha absoluta ("2026-12-09") la sección se
 * queda obsoleta el 10 de diciembre y hay que editar los datos cada año. Con
 * mes y día se calcula siempre la próxima ocurrencia: si la de este año ya
 * pasó, cuenta a la del que viene. Y mientras el día está en curso, el estado
 * cambia a "En curso" en vez de saltar a 365 días.
 *
 * Las fiestas móviles (Carnaval, Semana Santa) llevan una fecha aproximada,
 * marcada en los datos: esas sí hay que ponerlas a mano cada año.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import {
  MapPin,
  CalendarDays,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { FileteOrnamental } from "@/components/ui/filete-ornamental";
import { TypingAnimation } from "@/components/ui/typing-animation";
import {
  type Tema,
  BANDA_GRADIENTE_TITULAR,
  BANDA_GRADIENTE_TITULAR_CLARO,
  COLOR_TITULAR_LINEA_1,
  COLOR_TITULAR_LINEA_1_CLARO,
  COLOR_ACENTO,
  COLOR_ACENTO_FUERTE,
} from "./tema";

/* -------------------------------------------------------------------------- */
/*                                    Datos                                   */
/* -------------------------------------------------------------------------- */

/** Día del año en que cae la fiesta. Ver la nota de arriba sobre por qué. */
export interface FechaAnual {
  /** 1 = enero. */
  mes: number;
  dia: number;
  /** Fiesta movible (Carnaval, Semana Santa): la fecha es orientativa. */
  aproximada?: boolean;
}

export interface Festividad {
  id: string;
  /** Nombre corto, el que va bajo la miniatura. */
  nombre: string;
  /** Título largo del destacado. */
  titulo: string;
  descripcion: string;
  ubicacion: string;
  /** Fecha tal y como se muestra ("9 de diciembre", "Marzo / Abril"…). */
  fecha: string;
  imagen: string;
  alt: string;
  fechaObjetivo: FechaAnual;
}

export const FESTIVIDADES: readonly Festividad[] = [
  {
    id: "carnaval",
    nombre: "Carnaval Ayacuchano",
    titulo: "Carnaval Ayacuchano",
    descripcion:
      "Es una de las festividades más coloridas y tradicionales del Perú, declarada Patrimonio Cultural de la Nación, destacada por sus comparsas, canciones satíricas en quechua y el juego masivo con agua y talco.",
    ubicacion: "Huamanga, Ayacucho",
    fecha: "Febrero / Marzo",
    imagen: "/festividades/carnaval.png",
    alt: "Vista aérea del pasacalle de carnaval en la Plaza Mayor de Huamanga, con comparsas de bailarinas avanzando por la calzada",
    fechaObjetivo: { mes: 2, dia: 16, aproximada: true },
  },
  {
    id: "semana-santa",
    nombre: "Semana Santa",
    titulo: "Semana Santa en Ayacucho",
    descripcion:
      "Es la festividad religiosa y cultural más importante de la región, famosa por sus multitudinarias procesiones, alfombras de flores y el fervor popular que paraliza la ciudad durante diez días.",
    ubicacion: "Huamanga, Ayacucho",
    fecha: "Marzo / Abril",
    imagen: "/festividades/semana-santa.png",
    alt: "Procesión nocturna de Semana Santa frente a la catedral de Ayacucho, con el anda cubierta de flores blancas y cirios encendidos",
    fechaObjetivo: { mes: 4, dia: 2, aproximada: true },
  },
  {
    id: "fiesta-cruces",
    nombre: "Fiesta de las Cruces",
    titulo: "Fiesta de las Cruces",
    descripcion:
      "Una de las festividades religiosas más arraigadas de la región, marcada por la bajada de las cruces desde los cerros tutelares, las vísperas con quema de chamizas y las procesiones que recorren los barrios.",
    ubicacion: "Huamanga y provincias de Ayacucho",
    fecha: "3 de mayo",
    imagen: "/festividades/fiesta-cruces.png",
    alt: "Un fiel carga al hombro una cruz turquesa cubierta por un manto rojo bordado en oro mientras avanza por una calle del pueblo",
    fechaObjetivo: { mes: 5, dia: 3 },
  },
  {
    id: "yaku-raymi",
    nombre: "Yaku Raymi",
    titulo: "Yaku Raymi, la Fiesta del Agua",
    descripcion:
      "Una de las festividades ancestrales más representativas: la comunidad limpia las acequias antes de las lluvias y rinde el pago a la Pachamama, con los danzantes de tijeras como protagonistas del ritual.",
    ubicacion: "Andamarca, Lucanas (Ayacucho)",
    fecha: "24 y 25 de agosto",
    imagen: "/festividades/yaku-raymi.png",
    alt: "Danzantes de tijeras en la plaza de Andamarca, con trajes bordados de flecos y monteras de espejos, ejecutando sus pasos",
    fechaObjetivo: { mes: 8, dia: 24 },
  },
  {
    id: "todos-los-santos",
    nombre: "Todos los Santos",
    titulo: "Todos los Santos",
    descripcion:
      "Una de las festividades de memoria ancestral más profundas de la región, con la visita a los cementerios con ofrendas, la preparación de las tradicionales t'anta wawas y la celebración de la vida tras la muerte.",
    ubicacion: "Huamanga y provincias de Ayacucho",
    fecha: "1 y 2 de noviembre",
    imagen: "/festividades/todos-los-santos.png",
    alt: "Primer plano de una t'anta wawa: pan trenzado y glaseado, cubierto de grageas de colores, con la carita de yeso pintada",
    fechaObjetivo: { mes: 11, dia: 1 },
  },
  {
    id: "batalla-ayacucho",
    nombre: "Batalla de Ayacucho",
    titulo: "Escenificación de la Batalla de Ayacucho",
    descripcion:
      "Es una de las conmemoraciones patrióticas e históricas más importantes del Perú, declarada Patrimonio Cultural de la Nación, destacada por la multitudinaria recreación del enfrentamiento de 1824 que selló la independencia hispanoamericana.",
    ubicacion: "Pampa de Quinua, Ayacucho",
    fecha: "9 de diciembre",
    imagen: "/festividades/batalla-ayacucho.png",
    alt: "Ceremonia conmemorativa al pie del obelisco de la Pampa de Quinua, con formaciones de militares con uniformes de época y banderas peruanas",
    fechaObjetivo: { mes: 12, dia: 9 },
  },
];

const TEXTOS = {
  titulo: "Festividades de Ayacucho",
  subtitulo: "Descubre las celebraciones que marcan el año en Huamanga",
  etiquetaUbicacion: "Ubicación",
  etiquetaFecha: "Fecha",
  botonPrimario: "Ver evento",
  botonSecundario: "Ver agenda completa",
  anterior: "Festividad anterior",
  siguiente: "Festividad siguiente",
  dias: "Días",
  horas: "Horas",
  minutos: "Minutos",
};

/* -------------------------------------------------------------------------- */
/*                              Fechas y conteo                               */
/* -------------------------------------------------------------------------- */

interface Restante {
  dias: number;
  horas: number;
  minutos: number;
  /** El día de la fiesta ya empezó pero no ha terminado. */
  enCurso: boolean;
}

/**
 * Calcula cuánto falta para la próxima vez que cae la fiesta.
 *
 * Mientras el día está en curso cuenta hasta que acabe, y solo entonces salta
 * al año siguiente. Así la sección nunca muestra "faltan 365 días" justo el día
 * de la celebración, que es cuando más gente la mira.
 */
function calculaRestante(objetivo: FechaAnual, ahora: Date): Restante {
  const { mes, dia } = objetivo;
  const ano = ahora.getFullYear();
  const inicio = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  const fin = new Date(ano, mes - 1, dia, 23, 59, 59, 999);

  const enCurso = ahora >= inicio && ahora <= fin;
  const destino = enCurso
    ? fin
    : ahora < inicio
      ? inicio
      : new Date(ano + 1, mes - 1, dia, 0, 0, 0, 0);

  const ms = Math.max(0, destino.getTime() - ahora.getTime());
  return {
    dias: Math.floor(ms / 86_400_000),
    horas: Math.floor(ms / 3_600_000) % 24,
    minutos: Math.floor(ms / 60_000) % 60,
    enCurso,
  };
}

/**
 * Cuenta regresiva.
 *
 * El cálculo depende de la hora actual, así que NO puede hacerse al renderizar:
 * el servidor y el navegador darían números distintos y React abortaría la
 * hidratación. Por eso arranca en `null` —el servidor y el primer render del
 * cliente pintan los mismos guiones— y se rellena ya montado. Los guiones
 * ocupan el mismo sitio que las cifras, así que nada se mueve al aparecer.
 *
 * Se refresca cada minuto porque la unidad más fina que se muestra es el
 * minuto; un intervalo de un segundo solo gastaría renders.
 */
function CuentaRegresiva({
  objetivo,
  colorAcento,
  textoSutil,
}: {
  objetivo: FechaAnual;
  colorAcento: string;
  textoSutil: string;
}) {
  const [restante, setRestante] = useState<Restante | null>(null);

  useEffect(() => {
    const actualiza = () => setRestante(calculaRestante(objetivo, new Date()));
    actualiza();
    const id = setInterval(actualiza, 60_000);
    return () => clearInterval(id);
  }, [objetivo]);

  const bloques = [
    { valor: restante?.dias, etiqueta: TEXTOS.dias },
    { valor: restante?.horas, etiqueta: TEXTOS.horas },
    { valor: restante?.minutos, etiqueta: TEXTOS.minutos },
  ];

  return (
    <div className="flex items-start gap-2 sm:gap-3" role="timer" aria-live="off">
      {bloques.map(({ valor, etiqueta }, i) => (
        <div key={etiqueta} className="flex items-start gap-2 sm:gap-3">
          {i > 0 ? (
            <span aria-hidden="true" className="pt-1 text-2xl font-light sm:text-3xl" style={{ color: colorAcento }}>
              :
            </span>
          ) : null}
          <div className="min-w-[2.5rem] text-center">
            <p
              className="font-display text-[28px] leading-none font-bold tabular-nums sm:text-[32px]"
              style={{ color: colorAcento }}
            >
              {valor === undefined ? "––" : String(valor).padStart(2, "0")}
            </p>
            <p className={`mt-1.5 text-[11px] ${textoSutil}`}>{etiqueta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Props                                   */
/* -------------------------------------------------------------------------- */

interface FestividadesAyacuchoProps {
  tema: Tema;
  /** Sustituye los datos de ejemplo por los tuyos. */
  festividades?: readonly Festividad[];
  /** Cuál sale destacada al cargar. Ver la nota junto al estado. */
  indiceInicial?: number;
  /**
   * Segundos que cada festividad permanece destacada antes de pasar a la
   * siguiente. Es también lo que tarda en llenarse la barra de progreso: las
   * dos cosas salen del mismo valor para que no puedan desincronizarse.
   */
  segundosPorFestividad?: number;
  onVerEvento?: (festividad: Festividad) => void;
  onVerAgenda?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                                 Componente                                 */
/* -------------------------------------------------------------------------- */

export function FestividadesAyacucho({
  tema,
  festividades = FESTIVIDADES,
  indiceInicial = 0,
  segundosPorFestividad = 5,
  onVerEvento,
  onVerAgenda,
}: FestividadesAyacuchoProps) {
  const oscuro = tema === "oscuro";
  const quieto = useReducedMotion() ?? false;

  /*
   * Índice fijo al cargar, no "la más próxima". Elegir la más próxima depende
   * de la hora y el servidor y el navegador pueden no coincidir, así que el
   * primer render dejaría de cuadrar. Si la quieres automática, calcúlala en
   * un efecto después de montar y llama a `setActiva`.
   */
  const [activa, setActiva] = useState(indiceInicial);
  const festividad = festividades[activa] ?? festividades[0];


  /* --- Paleta ------------------------------------------------------------- */
  // El dorado de marca sobre el fondo claro se queda en 2.9:1, por debajo del
  // mínimo. En tema claro el texto dorado usa el tono fuerte, que llega a 4.3:1.
  const acentoTexto = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;
  const fondoSeccion = oscuro ? "bg-[#0e0d0c]" : "bg-[#faf8f5]";
  const textoBase = oscuro ? "text-neutral-100" : "text-neutral-900";
  const textoCuerpo = oscuro ? "text-neutral-300" : "text-neutral-700";
  const textoSutil = oscuro ? "text-neutral-400" : "text-neutral-500";
  const divisor = oscuro ? "bg-white/12" : "bg-black/10";
  const superficieBoton = oscuro
    ? "border-white/20 text-neutral-100 hover:bg-white/10"
    : "border-black/15 text-neutral-900 hover:bg-black/5";
  const flechaEstilo = oscuro
    ? "border-white/20 text-neutral-300 hover:bg-white/10"
    : "border-black/15 text-neutral-600 hover:bg-black/5";

  /* --- Carrusel del selector --------------------------------------------- */
  const [emblaRef, emblaApi] = useEmblaCarousel({
    /*
     * `center` y no `start`: la activa se queda en el medio del carril. Con
     * `start` había que llevarla al borde izquierdo en cada cambio, y desde la
     * última eso era un salto de un carril entero —el "reinicio brusco"—.
     * Centrada, cada paso es un desplazamiento de una miniatura.
     */
    align: "center",
    startIndex: indiceInicial,
    /*
     * En bucle: al llegar a la última miniatura la primera vuelve a entrar por
     * el otro lado, en los dos sentidos. Embla solo puede enlazar los extremos
     * si las miniaturas DESBORDAN el carril; con seis y cinco a la vista sobra
     * una, que es lo justo. Si alguna vez se estrecha la lista, hay que
     * estrechar también la miniatura para que siga sobrando.
     *
     * `containScroll` no se pasa a propósito: Embla lo ignora cuando el bucle
     * entra en juego, y dejarlo puesto solo confundiría al leer esto.
     */
    loop: true,
  });

  /**
   * Pasa a la siguiente. El bucle lo resuelve Embla, así que desde la última
   * sigue por la primera con el mismo desplazamiento de siempre.
   *
   * No lo dispara un temporizador aparte: lo llama la propia barra de progreso
   * cuando termina de llenarse. Así el cambio ocurre EXACTAMENTE cuando la
   * barra llega al final; con dos relojes distintos, uno siempre se adelanta.
   */
  const avanzar = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const retroceder = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);

  /*
   * El carril es la ÚNICA fuente de verdad de qué festividad está activa: lo
   * que mueve el carrusel —flecha, gesto, clic en una miniatura o el propio
   * temporizador— dispara `select`, y de ahí sale `activa`.
   *
   * Antes había dos mandos: un estado propio y el carril, cada uno tirando por
   * su lado. Eso era lo que hacía que las flechas parecieran ir al revés y que
   * el bucle diera tirones. Con un solo mando, el desplazamiento es siempre de
   * una miniatura y el bucle lo resuelve Embla, que para eso está.
   */
  useEffect(() => {
    if (!emblaApi) return;
    const alSeleccionar = () => setActiva(emblaApi.selectedScrollSnap());
    alSeleccionar();
    emblaApi.on("select", alSeleccionar).on("reInit", alSeleccionar);
    return () => {
      emblaApi.off("select", alSeleccionar).off("reInit", alSeleccionar);
    };
  }, [emblaApi]);

  /* --- Entrada de la sección ---------------------------------------------- */
  const refSeccion = useRef<HTMLDivElement>(null);
  const enVista = useInView(refSeccion, { once: true, amount: 0.15 });
  const entrada = (retardo: number) =>
    quieto
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 16 },
          animate: enVista ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
          transition: { duration: 0.55, delay: retardo, ease: [0.22, 1, 0.36, 1] as const },
        };

  /** Fundido al cambiar de evento. Con reduced-motion no se anima. */
  const cambio = quieto
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.3, ease: "easeOut" as const },
      };

  return (
    <section id="festividades" className={`w-full ${fondoSeccion} ${textoBase}`}>
      <div
        ref={refSeccion}
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
      >
        {/* ========================== Cabecera ========================== */}
        <Cabecera oscuro={oscuro} quieto={quieto} textoSutil={textoSutil} />

        {/* ====================== Evento destacado ====================== */}
        {/*
          Dos columnas desde `lg` y apiladas por debajo. La foto va primero en
          el DOM, así que al apilarse queda arriba sin necesidad de reordenar.
        */}
        <div className="mt-10 grid gap-8 md:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10">
          {/* ------------------------- Foto ------------------------- */}
          <motion.div {...entrada(0.05)}>
            {/*
              `aspect-[...]` en vez de una altura fija: el marco se adapta al
              ancho disponible sin que la foto se deforme ni descuadre la
              rejilla en ningún tamaño.

              Sin nada encima: ni nombre ni píldora de estado. Los dos estaban
              repetidos en la columna de al lado —el título y la cuenta
              regresiva— y solo tapaban la foto. Por eso tampoco hay ya
              degradado: no queda texto al que dar contraste.
            */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl sm:aspect-[16/11]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={festividad.id} {...cambio} className="absolute inset-0">
                  <Image
                    src={festividad.imagen}
                    alt={festividad.alt}
                    fill
                    sizes="(max-width: 1023px) 100vw, 55vw"
                    /*
                      `eager` y no el `lazy` por defecto. Dentro del envoltorio
                      animado, el navegador no llegaba a elegirle fuente:
                      `currentSrc` se quedaba vacío y la foto no se pedía nunca
                      —solo salían las miniaturas—. Y aunque cargara, tampoco
                      tiene sentido diferir la imagen principal de la sección,
                      que además se sustituye al pulsar cada miniatura.
                    */
                    loading="eager"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

            </div>
          </motion.div>

          {/* ------------------------- Ficha ------------------------- */}
          <motion.div {...entrada(0.14)} className="min-w-0">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={festividad.id} {...cambio}>
                <h3
                  className="font-display font-bold text-balance"
                  style={{
                    // clamp para que no desborde a 320 px ni se quede pequeño
                    // en pantallas grandes.
                    fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)",
                    lineHeight: 1.12,
                    /*
                      Dos renglones reservados siempre. Los títulos no miden lo
                      mismo —"Todos los Santos" ocupa uno y "Escenificación de
                      la Batalla de Ayacucho" dos—, y sin esto el bloque entero
                      daba un salto de medio renglón en cada cambio. Va en `em`
                      para que la reserva crezca junto con el `clamp` y valga en
                      todos los anchos: 2 renglones × 1.12 de interlineado.
                    */
                    minHeight: "2.24em",
                    color: acentoTexto,
                  }}
                >
                  {festividad.titulo}
                </h3>
              </motion.div>
            </AnimatePresence>

            {/*
              El filete bajo el título es la barra de progreso: se llena en
              `segundosPorFestividad` y, al completarse, salta a la siguiente
              festividad.

              Va FUERA del <AnimatePresence> a propósito. Dentro no llegaba a
              animarse: `initial={false}` silencia la animación de entrada de
              todos los descendientes del bloque, así que la barra aparecía ya
              llena de golpe y, sin animación, nunca se disparaba el evento de
              fin que hace avanzar. Fuera se anima con normalidad y es su `key`
              la que la reinicia en cada cambio.

              El relleno no lleva radio propio: lo redondea el carril con su
              `overflow-hidden`. Un `rounded-full` aquí se deforma al escalar y
              su borde asoma como motas en 2 px de alto.

              Con `prefers-reduced-motion` se queda llena y quieta, y no hay
              avance automático: mover el contenido cada cinco segundos es justo
              lo que esa preferencia pide evitar.
            */}
            <span
              aria-hidden="true"
              className="mt-4 block h-0.5 w-16 overflow-hidden rounded-full"
              style={{ backgroundColor: `${acentoTexto}33` }}
            >
              {quieto ? (
                <span className="block h-full w-full" style={{ backgroundColor: acentoTexto }} />
              ) : (
                <motion.span
                  key={activa}
                  className="block h-full w-full origin-left"
                  style={{ backgroundColor: acentoTexto }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: segundosPorFestividad, ease: "linear" }}
                  onAnimationComplete={avanzar}
                />
              )}
            </span>

            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={festividad.id} {...cambio}>
                {/*
                  Reserva de alto para la descripción.

                  Las descripciones no miden lo mismo: la de la Batalla ocupa un
                  renglón más que las demás, y al cambiar de festividad todo el
                  bloque —datos, cuenta y botones— pegaba un salto de 26 px. Un
                  `min-height` fijo no vale: el número de renglones depende del
                  ancho (cuatro a 1280 px, cinco a 1024, seis en móvil).

                  Así que se apilan TODAS las descripciones en la misma celda de
                  una rejilla, invisibles, y la visible encima. La celda toma el
                  alto de la más alta, sea cual sea el ancho y cambie el texto lo
                  que cambie. Es la misma técnica que usa `reserveSpace` en
                  <TypingAnimation>.
                */}
                <div className="mt-5 grid">
                  {festividades.map((f) => (
                    <p
                      key={`reserva-${f.id}`}
                      aria-hidden="true"
                      className="invisible col-start-1 row-start-1 max-w-xl text-[15px] leading-relaxed sm:text-base"
                    >
                      {f.descripcion}
                    </p>
                  ))}
                  <p className={`col-start-1 row-start-1 max-w-xl text-[15px] leading-relaxed sm:text-base ${textoCuerpo}`}>
                    {festividad.descripcion}
                  </p>
                </div>

                {/*
                  Ubicación y fecha. En móvil se apilan; desde `sm` van en fila
                  con un divisor vertical entre ambas, que es como el divisor de
                  la sección de clima: borde del segundo bloque, no un elemento
                  suelto.
                */}
                <dl className="mt-7 flex flex-col gap-4 sm:flex-row sm:gap-6">
                  <Dato
                    Icono={MapPin}
                    etiqueta={TEXTOS.etiquetaUbicacion}
                    valor={festividad.ubicacion}
                    color={acentoTexto}
                    textoSutil={textoSutil}
                  />
                  <div aria-hidden="true" className={`hidden w-px self-stretch sm:block ${divisor}`} />
                  <Dato
                    Icono={CalendarDays}
                    etiqueta={TEXTOS.etiquetaFecha}
                    valor={festividad.fecha}
                    color={acentoTexto}
                    textoSutil={textoSutil}
                  />
                </dl>
              </motion.div>
            </AnimatePresence>

            {/*
              La cuenta regresiva queda FUERA del <AnimatePresence>: si se
              desmontara con cada cambio de festividad perdería su intervalo y
              volvería a arrancar en guiones. Recibe el objetivo por prop y se
              recalcula sola.
            */}
            {/*
              `flex-wrap`: si la cuenta y los dos botones no caben en una línea,
              los botones bajan ENTEROS a la siguiente. Sin esto el contenedor
              los comprimía y el texto se partía en dos renglones dentro de la
              propia píldora.
            */}
            {/*
              Cuenta regresiva y botones EN LA MISMA FILA desde `sm`. Poner los
              botones al costado y no debajo es lo que iguala el alto de esta
              columna con el de la foto: sin ellos abajo, el bloque medía 66 px
              más que la imagen y la pareja se veía descuadrada.

              `flex-wrap` se queda como red de seguridad: si una traducción más
              larga no cupiera, los botones bajan enteros en vez de desbordar.
            */}
            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-5">
              <CuentaRegresiva
                objetivo={festividad.fechaObjetivo}
                colorAcento={acentoTexto}
                textoSutil={textoSutil}
              />

              {/* Botones: apilados y a todo el ancho en móvil. */}
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => onVerEvento?.(festividad)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap text-[#1b1206] transition-transform active:scale-[0.98]"
                  style={{
                    backgroundColor: COLOR_ACENTO,
                    boxShadow: `0 12px 30px -14px ${COLOR_ACENTO}b3`,
                  }}
                >
                  {TEXTOS.botonPrimario}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onVerAgenda}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold whitespace-nowrap transition-colors active:scale-[0.98] ${superficieBoton}`}
                >
                  {TEXTOS.botonSecundario}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ========================== Selector ========================== */}
        <motion.div {...entrada(0.22)} className="relative mt-12 md:mt-16">
          {/*
            Las flechas aparecen desde `sm`. En móvil sobra el gesto y, con el
            ancho justo, se comerían media miniatura.
          */}
          <Flecha
            lado="izquierda"
            etiqueta={TEXTOS.anterior}
            onClick={retroceder}
            className={flechaEstilo}
          />
          <Flecha
            lado="derecha"
            etiqueta={TEXTOS.siguiente}
            onClick={avanzar}
            className={flechaEstilo}
          />

          {/*
            El desbordamiento es INTERNO del carrusel: la página nunca gana
            scroll horizontal. Los márgenes laterales desde `sm` dejan sitio a
            las flechas sin que tapen las miniaturas.
          */}
          <div ref={emblaRef} className="overflow-hidden sm:mx-14">
            {/*
              La separación va como MARGEN de cada miniatura, no como `gap` del
              flex. Embla calcula la costura del bucle midiendo los slides y sus
              márgenes; un `gap` ahí vale cero, y por eso al pasar de la última a
              la primera las dos aparecían pegadas sin separación.
            */}
            <ul className="flex">
              {festividades.map((f, i) => {
                const seleccionada = i === activa;
                return (
                  <li
                    key={f.id}
                    /*
                      ~2.5 miniaturas en móvil: la tercera asoma y le dice al
                      ojo que la lista sigue. Desde `sm` van de tres en tres y
                      en `lg` entran las cinco.
                    */
                    className="mr-3 min-w-0 shrink-0 grow-0 basis-[38%] sm:mr-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                  >
                    <button
                      type="button"
                      onClick={() => emblaApi?.scrollTo(i)}
                      aria-current={seleccionada}
                      className="group w-full text-left"
                    >
                      <span
                        className={`relative block aspect-[4/3] w-full overflow-hidden rounded-2xl transition-opacity duration-300 ${
                          seleccionada ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={f.imagen}
                          alt=""
                          aria-hidden="true"
                          fill
                          sizes="(max-width: 639px) 38vw, (max-width: 1023px) 25vw, 20vw"
                          className="object-cover"
                        />

                        {/*
                          El anillo de la activa va HACIA DENTRO y como capa
                          propia encima de la foto. Dibujado hacia fuera con un
                          `box-shadow` normal, el carril lo recortaba: la sombra
                          cae fuera del recuadro y el viewport del carrusel se
                          come todo lo que sobresale, así que el borde salía
                          partido por arriba y por abajo. Y no puede ir como
                          sombra interior del propio recuadro porque la imagen
                          se pinta encima y lo taparía.
                        */}
                        {seleccionada ? (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-[inherit]"
                            style={{ boxShadow: `inset 0 0 0 2px ${COLOR_ACENTO}` }}
                          />
                        ) : null}
                      </span>
                      <span
                        className={`mt-2.5 block truncate text-center text-[13px] font-medium transition-colors sm:text-sm ${
                          seleccionada ? "" : textoSutil
                        }`}
                        style={seleccionada ? { color: acentoTexto } : undefined}
                      >
                        {f.nombre}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Auxiliares                                */
/* -------------------------------------------------------------------------- */

/**
 * Cabecera de la sección: título con barrido entre filetes dorados y subtítulo
 * tecleado. Es la misma que abren las demás secciones, de ahí que reutilice los
 * tres componentes de `components/ui` en vez de replicar el efecto.
 */
function Cabecera({
  oscuro,
  quieto,
  textoSutil,
}: {
  oscuro: boolean;
  quieto: boolean;
  textoSutil: string;
}) {
  const colorFilete = oscuro ? COLOR_ACENTO : COLOR_ACENTO_FUERTE;
  const refTitulo = useRef<HTMLHeadingElement>(null);
  const enVista = useInView(refTitulo, { once: true, amount: 0.6 });
  const abierto = quieto || enVista;

  return (
    <header>
      <div className="flex items-center justify-center gap-5 sm:gap-6">
        <FileteOrnamental
          color={colorFilete}
          invertido
          quieto={quieto}
          className="hidden max-w-40 md:flex"
        />

        {/*
          El recorte va en el PROPIO <DiaTextReveal> y por transición CSS. Si se
          envolviera, el componente quedaría dentro de un ancestro recortado a
          cero de ancho y su detector de "entró en pantalla" no se dispararía
          nunca; como el texto se pinta con un degradado que arranca fuera del
          cuadro, el titular se quedaría permanentemente invisible.
        */}
        <h2
          ref={refTitulo}
          className="text-center font-display text-[26px] font-bold tracking-[-0.02em] sm:text-4xl md:shrink-0 md:whitespace-nowrap lg:text-[2.75rem]"
        >
          <DiaTextReveal
            text={TEXTOS.titulo}
            colors={oscuro ? BANDA_GRADIENTE_TITULAR : BANDA_GRADIENTE_TITULAR_CLARO}
            textColor={oscuro ? COLOR_TITULAR_LINEA_1 : COLOR_TITULAR_LINEA_1_CLARO}
            duration={1.7}
            delay={0.15}
            once
            className={`block pb-[0.16em] transition-[clip-path] duration-850 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              abierto ? "[clip-path:inset(0%_0%_0%_0%)]" : "[clip-path:inset(0%_50%_0%_50%)]"
            }`}
          />
        </h2>

        <FileteOrnamental
          color={colorFilete}
          quieto={quieto}
          className="hidden max-w-40 md:flex"
        />
      </div>

      {/*
        Lo que se centra es la CAJA (`mx-auto w-fit`), no el texto: con
        `text-center` el tecleado crecería hacia los dos lados a la vez y la
        frase se vería deslizar.
      */}
      <TypingAnimation
        as="p"
        typeSpeed={19}
        delay={600}
        reserveSpace
        hideCursorOnFinish
        className={`mx-auto mt-3 w-fit max-w-full text-[14px] leading-snug sm:text-[15px] ${textoSutil}`}
      >
        {TEXTOS.subtitulo}
      </TypingAnimation>
    </header>
  );
}

/** Bloque de dato con icono: etiqueta arriba y valor en negrita debajo. */
function Dato({
  Icono,
  etiqueta,
  valor,
  color,
  textoSutil,
}: {
  Icono: typeof MapPin;
  etiqueta: string;
  valor: string;
  color: string;
  textoSutil: string;
}) {
  return (
    <div className="min-w-0">
      <dt className={`flex items-center gap-1.5 text-[13px] ${textoSutil}`}>
        <Icono className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
        {etiqueta}
      </dt>
      <dd className="mt-1 text-[15px] font-semibold">{valor}</dd>
    </div>
  );
}

/** Flecha circular del selector. Oculta en móvil, donde manda el gesto. */
function Flecha({
  lado,
  etiqueta,
  onClick,
  className,
}: {
  lado: "izquierda" | "derecha";
  etiqueta: string;
  onClick: () => void;
  className: string;
}) {
  const Icono = lado === "izquierda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      className={`absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border transition-colors sm:grid ${
        lado === "izquierda" ? "left-0" : "right-0"
      } ${className}`}
    >
      <Icono className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default FestividadesAyacucho;
