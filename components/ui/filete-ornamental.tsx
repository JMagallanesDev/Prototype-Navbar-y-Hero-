"use client";

/**
 * FileteOrnamental — el adorno que flanquea los títulos de sección: un rombo
 * pegado al titular y una línea que sale de él y se apaga hacia fuera.
 *
 * Decorativo puro, invisible para lectores de pantalla.
 *
 * La línea se dibuja desde su extremo de FUERA hacia el título, así que el
 * origen de la escala es el borde exterior de cada lado. El rombo entra al
 * final, cuando la línea acaba de llegar, y remata el gesto.
 *
 * Se esconde por debajo del punto de ruptura que le indique quien lo use: en
 * pantallas estrechas no queda ancho que repartir entre el título y dos
 * filetes sin que todo se estrangule.
 */

import { motion } from "motion/react";

interface FileteOrnamentalProps {
  /** Color del rombo y de la línea. Llega resuelto según el tema. */
  color: string;
  /** El del lado izquierdo. Invierte el orden para que el rombo mire al título. */
  invertido?: boolean;
  /** Con `prefers-reduced-motion`, entra directamente a su estado final. */
  quieto: boolean;
  /**
   * Clases del contenedor. Aquí van el punto de ruptura desde el que se ve y
   * el largo máximo de la línea — los dos se pasan enteros y no se mezclan con
   * un valor por defecto, porque dos `max-w` en la misma clase compiten sin
   * que se sepa cuál gana.
   */
  className?: string;
}

export function FileteOrnamental({
  color,
  invertido = false,
  quieto,
  className = "hidden max-w-56 sm:flex",
}: FileteOrnamentalProps) {
  const entrada = { once: true, amount: 0.6 } as const;

  return (
    <span
      aria-hidden="true"
      className={`flex-1 items-center gap-3 ${className} ${
        invertido ? "flex-row-reverse" : ""
      }`}
    >
      <motion.span
        className="size-1.5 shrink-0"
        style={{ backgroundColor: color, rotate: 45 }}
        initial={quieto ? false : { opacity: 0, scale: 0.3 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={entrada}
        transition={{ duration: quieto ? 0 : 0.35, delay: quieto ? 0 : 1.05 }}
      />
      <motion.span
        className="h-px w-full"
        style={{
          // El degradado arranca en el rombo y se apaga hacia fuera: así la
          // línea no compite con el titular ni corta en seco contra él.
          backgroundImage: `linear-gradient(${invertido ? "to left" : "to right"}, ${color}, transparent)`,
          transformOrigin: invertido ? "left center" : "right center",
        }}
        initial={quieto ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={entrada}
        transition={{
          duration: quieto ? 0 : 0.9,
          delay: quieto ? 0 : 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </span>
  );
}

export default FileteOrnamental;
