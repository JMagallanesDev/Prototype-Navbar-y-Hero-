"use client";

/**
 * NavegacionPrincipal — Yachay Ayacucho
 *
 * Conexión con tu proyecto real:
 * - Tema: recibe `tema`/`alternarTema` por props. Conéctalo a next-themes
 *   (`useTheme()`) o a tu store de Zustand en el componente padre.
 * - Nota de diseño: cuando el navbar está transparente (arriba del todo,
 *   sin scroll) se apoya sobre el Hero, que en tema claro es blanco y en
 *   oscuro es negro (ver HeroInicio.tsx). Por eso el color del texto sigue
 *   al tema en los dos estados; lo único que cambia entre transparente y
 *   sólido es cuánto contraste se le da, porque en transparente debajo hay
 *   una foto y no una superficie plana.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  Globe,
  Menu,
  X,
  Smartphone,
  Compass,
} from "lucide-react";
import type { Tema } from "./tema";
import { COLOR_ACENTO } from "./tema";
import { InterruptorTema } from "./InterruptorTema";

interface EnlaceNav {
  etiqueta: string;
  href: string;
}

const ENLACES_NAV: EnlaceNav[] = [
  { etiqueta: "Eventos", href: "#eventos" },
  { etiqueta: "Directorio", href: "#directorio" },
  { etiqueta: "Comunidad", href: "#comunidad" },
  { etiqueta: "Reportar", href: "#reportar" },
];

const OPCIONES_EXPLORAR: EnlaceNav[] = [
  { etiqueta: "Lugares", href: "#lugares" },
  { etiqueta: "Mapa 3D", href: "#mapa-3d" },
  { etiqueta: "Mapa de incidentes", href: "#mapa-incidentes" },
];

const IDIOMAS = ["ES", "EN", "QU"];

interface NavegacionPrincipalProps {
  tema: Tema;
  alternarTema: () => void;
}

export function NavegacionPrincipal({ tema, alternarTema }: NavegacionPrincipalProps) {
  const [conScroll, setConScroll] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [explorarAbierto, setExplorarAbierto] = useState(false);
  const [idiomaAbierto, setIdiomaAbierto] = useState(false);
  const [idioma, setIdioma] = useState(IDIOMAS[0]);

  const explorarRef = useRef<HTMLDivElement>(null);
  const idiomaRef = useRef<HTMLDivElement>(null);

  const claro = tema === "claro";

  useEffect(() => {
    const onScroll = () => setConScroll(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  useEffect(() => {
    function alClicFuera(evento: MouseEvent) {
      if (explorarRef.current && !explorarRef.current.contains(evento.target as Node)) {
        setExplorarAbierto(false);
      }
      if (idiomaRef.current && !idiomaRef.current.contains(evento.target as Node)) {
        setIdiomaAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  // El navbar sigue al tema esté transparente o sólido. Cuando está
  // transparente se apoya sobre el hero, que en tema claro ahora es blanco
  // de verdad: si el texto siguiera siendo claro fijo, sería ilegible.
  // En transparente los tonos van un punto más contrastados que en sólido,
  // porque debajo hay una foto y no una superficie plana.
  const textoPrincipal = claro ? "text-neutral-900" : "text-white";
  const textoSecundario = claro
    ? conScroll
      ? "text-neutral-600"
      : "text-neutral-700"
    : conScroll
      ? "text-white/70"
      : "text-white/85";
  const textoSutil = claro
    ? conScroll
      ? "text-neutral-500"
      : "text-neutral-600"
    : conScroll
      ? "text-white/55"
      : "text-white/70";
  const hoverSuperficie = claro ? "hover:bg-black/5" : "hover:bg-white/10";

  // Los paneles de los dropdowns siempre son superficies sólidas propias,
  // así que sí siguen el tema sin importar si el navbar está transparente.
  const panelSuperficie = claro ? "border-black/5 bg-white" : "border-white/10 bg-neutral-900";
  const panelItem = claro ? "text-neutral-700 hover:bg-black/5" : "text-white/80 hover:bg-white/10";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-300 ${
        conScroll
          ? claro
            ? "bg-white/85 shadow-lg shadow-neutral-900/5 backdrop-blur-md"
            : "bg-neutral-950/80 shadow-lg shadow-black/20 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#inicio" className="flex min-h-11 items-center">
          <span className="flex flex-col leading-none">
            <span className={`text-[15px] font-bold tracking-tight sm:text-base ${textoPrincipal}`}>
              Yachay Ayacucho
            </span>
            <span className={`mt-1 text-[10px] font-medium sm:text-[11px] ${textoSutil}`}>
              Turismo inteligente y patrimonio cultural
            </span>
          </span>
        </a>

        {/* Navegación central — desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          <div ref={explorarRef} className="relative">
            <button
              type="button"
              onClick={() => setExplorarAbierto((v) => !v)}
              className={`flex min-h-11 items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${hoverSuperficie} ${textoSecundario}`}
            >
              Explorar
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${explorarAbierto ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {explorarAbierto && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border p-1.5 shadow-xl ${panelSuperficie}`}
                >
                  {OPCIONES_EXPLORAR.map((opcion) => (
                    <a
                      key={opcion.etiqueta}
                      href={opcion.href}
                      className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-medium ${panelItem}`}
                    >
                      {opcion.etiqueta}
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {ENLACES_NAV.map((enlace) => (
            <a
              key={enlace.etiqueta}
              href={enlace.href}
              className={`flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${hoverSuperficie} ${textoSecundario}`}
            >
              {enlace.etiqueta}
            </a>
          ))}
        </div>

        {/* Derecha — desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          <div ref={idiomaRef} className="relative">
            <button
              type="button"
              onClick={() => setIdiomaAbierto((v) => !v)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${hoverSuperficie} ${textoSecundario}`}
              aria-label="Seleccionar idioma"
            >
              <Globe className="h-4 w-4" />
              {idioma}
              <ChevronDown className={`h-3 w-3 transition-transform ${idiomaAbierto ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {idiomaAbierto && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-2xl border p-1.5 shadow-xl ${panelSuperficie}`}
                >
                  {IDIOMAS.map((codigo) => (
                    <button
                      key={codigo}
                      type="button"
                      onClick={() => {
                        setIdioma(codigo);
                        setIdiomaAbierto(false);
                      }}
                      className={`flex min-h-11 w-full items-center rounded-xl px-3 text-sm font-medium ${panelItem} ${
                        codigo === idioma ? "font-semibold" : ""
                      }`}
                      style={codigo === idioma ? { color: COLOR_ACENTO } : undefined}
                    >
                      {codigo}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <InterruptorTema
            tema={tema}
            alternarTema={alternarTema}
            className={
              claro
                ? "text-neutral-700 hover:bg-black/5"
                : conScroll
                  ? "text-amber-200 hover:bg-white/10"
                  : "text-amber-100 hover:bg-white/10"
            }
          />

          <a
            href="#descargar"
            className="ml-1 flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95"
            style={{ backgroundColor: COLOR_ACENTO }}
          >
            <Smartphone className="h-4 w-4" />
            Descargar App
          </a>
        </div>

        {/* Botón hamburguesa — móvil */}
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          className={`flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${textoPrincipal}`}
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      <DrawerMovil
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        tema={tema}
        alternarTema={alternarTema}
        idioma={idioma}
        setIdioma={setIdioma}
      />
    </header>
  );
}

function DrawerMovil({
  abierto,
  onCerrar,
  tema,
  alternarTema,
  idioma,
  setIdioma,
}: {
  abierto: boolean;
  onCerrar: () => void;
  tema: Tema;
  alternarTema: () => void;
  idioma: string;
  setIdioma: (v: string) => void;
}) {
  const claro = tema === "claro";
  const prefiereMenosMovimiento = useReducedMotion();
  const [explorarAbierto, setExplorarAbierto] = useState(false);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          />
          <motion.div
            initial={{ x: prefiereMenosMovimiento ? 0 : "100%", opacity: prefiereMenosMovimiento ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: prefiereMenosMovimiento ? 0 : "100%", opacity: prefiereMenosMovimiento ? 0 : 1 }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
            className={`fixed inset-y-0 right-0 z-[70] flex w-[86%] max-w-sm flex-col overflow-y-auto pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden ${
              claro ? "bg-white text-neutral-900" : "bg-neutral-950 text-white"
            }`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="text-base font-bold">Menú</span>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar menú"
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  claro ? "hover:bg-black/5" : "hover:bg-white/10"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
              <button
                type="button"
                onClick={() => setExplorarAbierto((v) => !v)}
                className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-[15px] font-medium ${
                  claro ? "hover:bg-black/5" : "hover:bg-white/10"
                }`}
              >
                Explorar
                <ChevronDown className={`h-4 w-4 transition-transform ${explorarAbierto ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {explorarAbierto && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pl-4"
                  >
                    {OPCIONES_EXPLORAR.map((opcion) => (
                      <a
                        key={opcion.etiqueta}
                        href={opcion.href}
                        onClick={onCerrar}
                        className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm ${
                          claro ? "text-neutral-600 hover:bg-black/5" : "text-white/70 hover:bg-white/10"
                        }`}
                      >
                        <Compass className="h-3.5 w-3.5" />
                        {opcion.etiqueta}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {ENLACES_NAV.map((enlace) => (
                <a
                  key={enlace.etiqueta}
                  href={enlace.href}
                  onClick={onCerrar}
                  className={`flex min-h-11 items-center rounded-xl px-3 text-[15px] font-medium ${
                    claro ? "hover:bg-black/5" : "hover:bg-white/10"
                  }`}
                >
                  {enlace.etiqueta}
                </a>
              ))}
            </nav>

            <div className={`mx-3 my-4 border-t ${claro ? "border-black/10" : "border-white/10"}`} />

            <div className="flex flex-col gap-2 px-3">
              <div className="flex items-center justify-between px-1">
                <span className={`text-sm font-medium ${claro ? "text-neutral-600" : "text-white/70"}`}>Idioma</span>
                <div className="flex gap-1">
                  {IDIOMAS.map((codigo) => (
                    <button
                      key={codigo}
                      type="button"
                      onClick={() => setIdioma(codigo)}
                      className={`flex h-9 min-w-11 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        codigo === idioma
                          ? "text-white"
                          : claro
                          ? "bg-black/5 text-neutral-600"
                          : "bg-white/10 text-white/70"
                      }`}
                      style={codigo === idioma ? { backgroundColor: COLOR_ACENTO } : undefined}
                    >
                      {codigo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-1 py-2">
                <span className={`text-sm font-medium ${claro ? "text-neutral-600" : "text-white/70"}`}>Tema</span>
                <button
                  type="button"
                  onClick={alternarTema}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold ${
                    claro ? "bg-black/5 text-neutral-700" : "bg-white/10 text-amber-200"
                  }`}
                >
                  {claro ? "Claro" : "Oscuro"}
                </button>
              </div>
            </div>

            <div className="mt-auto p-4">
              <a
                href="#descargar"
                onClick={onCerrar}
                className="flex min-h-11 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: COLOR_ACENTO }}
              >
                <Smartphone className="h-4 w-4" />
                Descargar App
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
