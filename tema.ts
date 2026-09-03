/**
 * Tipos y tokens de color compartidos por NavegacionPrincipal y HeroInicio.
 *
 * Conexión con tu sistema de tema real: este archivo NO gestiona estado.
 * En tu proyecto, deriva el valor `Tema` desde next-themes (`useTheme()`)
 * o tu store de Zustand, y pásalo como prop a ambos componentes junto con
 * el callback para alternarlo.
 */

export type Tema = "claro" | "oscuro";

/** Acento dorado/terracota — constante, no cambia entre temas. */
export const COLOR_ACENTO = "#C68A4B";
export const COLOR_ACENTO_FUERTE = "#A8672F";

/**
 * Colores del titular de 3 líneas del Hero. Son IDÉNTICOS en tema claro
 * y oscuro a propósito (ver HeroInicio.tsx): lo único que cambia con el
 * tema es la foto de fondo y la intensidad del overlay, nunca esta paleta.
 */
export const COLOR_TITULAR_LINEA_1 = "#F5F1EA"; // "Explora Ayacucho,"
export const COLOR_TITULAR_LINEA_2 = COLOR_ACENTO; // "vive su historia,"
export const COLOR_TITULAR_LINEA_3 = "#E3AFC2"; // "protege su legado." (malva)

/**
 * Banda de gradiente que barre el titular en <DiaTextReveal> (Magic UI).
 * Misma paleta cálida en las 3 líneas — solo cambia el `textColor` final
 * de cada línea (las constantes de arriba), nunca este barrido.
 */
export const BANDA_GRADIENTE_TITULAR = [
  "#F5F1EA",
  "#F0C48A",
  COLOR_ACENTO,
  COLOR_ACENTO_FUERTE,
  COLOR_TITULAR_LINEA_3,
];
