"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import type { Tema } from "./tema";

interface InterruptorTemaProps {
  tema: Tema;
  alternarTema: () => void;
  /** Clases de color/hover del botón; el padre decide el contexto visual
   *  (ej. sobre una foto vs. sobre una superficie sólida). */
  className?: string;
}

/** Botón sol/luna puro: solo anima el ícono y delega el estado al padre. */
export function InterruptorTema({ tema, alternarTema, className = "" }: InterruptorTemaProps) {
  const oscuro = tema === "oscuro";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={tema}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          {oscuro ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
