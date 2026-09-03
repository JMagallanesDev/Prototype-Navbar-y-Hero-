/**
 * Tipos y tokens de color compartidos por NavegacionPrincipal y HeroInicio.
 *
 * Conexión con tu sistema de tema real: este archivo NO gestiona estado.
 * En tu proyecto, deriva el valor `Tema` desde next-themes (`useTheme()`)
 * o tu store de Zustand, y pásalo como prop a ambos componentes junto con
 * el callback para alternarlo.
 *
 * Cada token tiene variante para los dos temas. El hero ya no fuerza un
 * overlay oscuro en tema claro: en claro el fondo es blanco de verdad y la
 * foto asoma por la derecha, así que el texto tiene que oscurecerse.
 *
 * Los valores de la variante clara están elegidos con contraste WCAG medido
 * sobre blanco, no a ojo. El dorado y el malva del tema oscuro se ven muy
 * bien sobre negro pero se caen sobre blanco (2.94:1 y 1.88:1), por eso
 * cada uno tiene su gemelo oscurecido.
 */

export type Tema = "claro" | "oscuro";

/** Acento dorado/terracota de marca — el mismo en los dos temas. */
export const COLOR_ACENTO = "#C68A4B";
export const COLOR_ACENTO_FUERTE = "#A8672F";

/**
 * Acento para TEXTO sobre fondo claro. No basta con que contraste sobre
 * blanco puro: en el hero cae sobre la foto ya velada, y el punto más
 * oscuro bajo el párrafo es la arcada en sombra del portal. Como el velo
 * del hero ya no llega nunca a blanco (la foto se ve en todo el ancho),
 * este acento tuvo que bajar otro escalón. Medido con el velo real:
 * 5.28:1 (mínimo 4.5:1).
 */
export const COLOR_ACENTO_TEXTO_CLARO = "#7A4A1F";

/**
 * Titular de 3 líneas del Hero, tema OSCURO. Contraste sobre neutral-950:
 * 17.59:1 / 6.73:1 / 10.54:1.
 */
export const COLOR_TITULAR_LINEA_1 = "#F5F1EA"; // "Explora Ayacucho,"
export const COLOR_TITULAR_LINEA_2 = COLOR_ACENTO; // "vive su historia,"
export const COLOR_TITULAR_LINEA_3 = "#E3AFC2"; // "protege su legado." (malva)

/**
 * Los mismos tres, tema CLARO. Van más oscuros que sus gemelos del tema
 * oscuro por una razón que no es obvia: el velo blanco del hero no llega
 * a blanco puro donde la foto tiene sombras profundas, así que el fondo
 * real bajo el titular es un gris claro, no blanco. Un dorado de tono
 * medio no contrasta ni contra lo claro ni contra lo oscuro, y ahí es
 * donde se caía. Medidos sobre el bloque más oscuro bajo el titular con
 * el velo real: 12.90:1 / 3.25:1 / 3.67:1 (mínimo 3:1 por ser texto
 * grande — font-black, hasta 4.5rem).
 */
export const COLOR_TITULAR_LINEA_1_CLARO = "#171717";
export const COLOR_TITULAR_LINEA_2_CLARO = "#A8672F";
export const COLOR_TITULAR_LINEA_3_CLARO = "#9C5A72";

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

/**
 * La misma banda para tema claro. La del tema oscuro arranca en crema
 * (#F5F1EA), que sobre blanco es invisible: el barrido no se vería.
 */
export const BANDA_GRADIENTE_TITULAR_CLARO = [
  "#171717",
  "#8F5624",
  COLOR_TITULAR_LINEA_2_CLARO,
  COLOR_ACENTO_FUERTE,
  COLOR_TITULAR_LINEA_3_CLARO,
];
