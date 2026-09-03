"use client";

/**
 * TypingAnimation — Magic UI, con dos extensiones locales.
 *
 * Implementa la API documentada por Magic UI (children, words, duration,
 * typeSpeed, deleteSpeed, delay, pauseDelay, loop, as, startOnView,
 * showCursor, blinkCursor, cursorStyle) y añade dos props propias que el
 * componente original no trae y que aquí hacían falta:
 *
 * - `segments`: en vez de un string plano, una lista de tramos con estilo
 *   propio. El tecleo avanza carácter a carácter POR ENCIMA de los tramos,
 *   así que las palabras resaltadas conservan su color. Con `children` a
 *   secas, el párrafo del Hero perdería el acento dorado de "lugares
 *   históricos", "reseñas" e "insignias".
 * - `reserveSpace`: reserva de antemano la altura del texto completo. Sin
 *   esto, un párrafo de varias líneas crece de 1 a 3 líneas mientras teclea
 *   y empuja hacia abajo todo lo que tenga debajo (en el Hero, los botones).
 * - `hideCursorOnFinish`: oculta el cursor al acabar. El componente original
 *   lo deja parpadeando para siempre, que en un hero es una distracción
 *   permanente en el centro de la página.
 *
 * Accesibilidad: el texto animado va `aria-hidden`; el lector de pantalla
 * recibe siempre el texto completo de una vez, nunca letra a letra. Con
 * `prefers-reduced-motion` no hay tecleo — el texto aparece ya completo.
 */

import { useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export interface TramoTecleado {
  /** Texto del tramo. */
  text: string;
  className?: string;
  style?: CSSProperties;
}

type EtiquetaPermitida =
  | "article"
  | "div"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "li"
  | "p"
  | "section"
  | "span";

interface TypingAnimationProps {
  /** Un solo string a teclear. */
  children?: string;
  /** Varios strings, tecleados y borrados en secuencia. */
  words?: string[];
  /** Extensión local: tramos con estilo propio (ver cabecera). */
  segments?: TramoTecleado[];
  className?: string;
  /** Alias heredado de `typeSpeed` en la API de Magic UI. */
  duration?: number;
  /** ms por carácter al escribir. */
  typeSpeed?: number;
  /** ms por carácter al borrar. */
  deleteSpeed?: number;
  /** ms de espera antes de arrancar. */
  delay?: number;
  /** ms de pausa entre palabras. */
  pauseDelay?: number;
  loop?: boolean;
  as?: EtiquetaPermitida;
  startOnView?: boolean;
  showCursor?: boolean;
  blinkCursor?: boolean;
  cursorStyle?: "line" | "block" | "underscore";
  /** Extensión local: reserva la altura del texto completo (ver cabecera). */
  reserveSpace?: boolean;
  /** Extensión local: oculta el cursor al terminar, en vez de dejarlo parpadeando. */
  hideCursorOnFinish?: boolean;
}

type Fase = "escribiendo" | "pausa" | "borrando" | "fin";

export function TypingAnimation({
  children,
  words,
  segments,
  className,
  duration = 100,
  typeSpeed,
  deleteSpeed = 50,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as = "span",
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = "line",
  reserveSpace = false,
  hideCursorOnFinish = false,
}: TypingAnimationProps) {
  const Etiqueta = as as ElementType;
  const velocidadEscritura = typeSpeed ?? duration;
  const prefiereMenosMovimiento = useReducedMotion();

  // `segments` gana sobre `words`, y `words` sobre `children`.
  const listaPalabras = segments
    ? [segments.map((t) => t.text).join("")]
    : words && words.length > 0
      ? words
      : children
        ? [children]
        : [];

  const contenedorRef = useRef<HTMLElement>(null);
  const enVista = useInView(contenedorRef, { once: true, amount: 0.3 });

  const [iniciado, setIniciado] = useState(false);
  const [indicePalabra, setIndicePalabra] = useState(0);
  const [visibles, setVisibles] = useState(0);
  const [fase, setFase] = useState<Fase>("escribiendo");

  const palabraActual = listaPalabras[indicePalabra] ?? "";
  const esUltimaPalabra = indicePalabra === listaPalabras.length - 1;

  // Arranque: espera a estar en vista (si toca) y luego al `delay`.
  useEffect(() => {
    if (prefiereMenosMovimiento) return;
    if (startOnView && !enVista) return;
    if (delay <= 0) {
      setIniciado(true);
      return;
    }
    const t = setTimeout(() => setIniciado(true), delay);
    return () => clearTimeout(t);
  }, [startOnView, enVista, delay, prefiereMenosMovimiento]);

  // Bucle de tecleo/borrado.
  useEffect(() => {
    if (!iniciado || prefiereMenosMovimiento) return;
    if (fase === "fin") return;

    if (fase === "escribiendo") {
      if (visibles < palabraActual.length) {
        const t = setTimeout(() => setVisibles((v) => v + 1), velocidadEscritura);
        return () => clearTimeout(t);
      }
      // Palabra completa: si no hay nada más que teclear, se queda ahí.
      if (esUltimaPalabra && !loop) {
        setFase("fin");
        return;
      }
      setFase("pausa");
      return;
    }

    if (fase === "pausa") {
      const t = setTimeout(() => setFase("borrando"), pauseDelay);
      return () => clearTimeout(t);
    }

    // fase === "borrando"
    if (visibles > 0) {
      const t = setTimeout(() => setVisibles((v) => v - 1), deleteSpeed);
      return () => clearTimeout(t);
    }
    setIndicePalabra((i) => (i + 1) % listaPalabras.length);
    setFase("escribiendo");
  }, [
    iniciado,
    prefiereMenosMovimiento,
    fase,
    visibles,
    palabraActual.length,
    esUltimaPalabra,
    loop,
    velocidadEscritura,
    deleteSpeed,
    pauseDelay,
    listaPalabras.length,
  ]);

  const textoCompleto = listaPalabras.join(" ");
  const terminado = fase === "fin";
  const mostrarTodo = Boolean(prefiereMenosMovimiento);
  const cuentaVisible = mostrarTodo ? palabraActual.length : visibles;

  // El cursor parpadea cuando no está tecleando activamente (pausa o final),
  // igual que en una terminal real.
  const cursorQuieto = fase === "escribiendo" || fase === "borrando";
  const cursorParpadea = blinkCursor && !cursorQuieto && !mostrarTodo;
  const cursorVisible =
    showCursor && !mostrarTodo && !(terminado && hideCursorOnFinish);

  const clasesCursor = {
    line: "inline-block h-[1em] w-px translate-y-[0.15em] bg-current",
    block: "inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-current",
    underscore: "inline-block h-[2px] w-[0.6em] bg-current",
  }[cursorStyle];

  // Reparte los caracteres visibles entre los tramos, respetando su estilo.
  let restantes = cuentaVisible;
  const tramosVisibles = (segments ?? [{ text: palabraActual } as TramoTecleado]).map(
    (tramo, i) => {
      const corte = Math.max(0, Math.min(tramo.text.length, restantes));
      restantes -= tramo.text.length;
      const trozo = tramo.text.slice(0, corte);
      if (!trozo) return null;
      return (
        <span key={i} className={tramo.className} style={tramo.style}>
          {trozo}
        </span>
      );
    }
  );

  const textoCompletoConEstilo = (segments ?? [{ text: textoCompleto } as TramoTecleado]).map(
    (tramo, i) => (
      <span key={i} className={tramo.className} style={tramo.style}>
        {tramo.text}
      </span>
    )
  );

  return (
    <Etiqueta ref={contenedorRef} className={cn(reserveSpace && "grid", className)}>
      {reserveSpace ? (
        // Ocupa la altura final desde el primer frame. `opacity-0` en vez de
        // `invisible` a propósito: sigue existiendo para el lector de pantalla,
        // que así recibe el párrafo entero de una vez.
        <span className="pointer-events-none col-start-1 row-start-1 opacity-0">
          {textoCompletoConEstilo}
        </span>
      ) : (
        <span className="sr-only">{textoCompleto}</span>
      )}
      <span aria-hidden="true" className={cn(reserveSpace && "col-start-1 row-start-1")}>
        {tramosVisibles}
        {cursorVisible ? (
          <span
            aria-hidden="true"
            className={cn(
              "ml-px",
              clasesCursor,
              cursorParpadea && "animate-[parpadeo-cursor_1s_step-end_infinite]"
            )}
          />
        ) : null}
      </span>
    </Etiqueta>
  );
}
