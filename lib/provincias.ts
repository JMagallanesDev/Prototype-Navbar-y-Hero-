/**
 * Utilidades de nombres para las provincias de Ayacucho.
 *
 * Los GeoJSON oficiales (IGN/INEI) traen NOMBPROV y CAPITAL en MAYÚSCULAS y
 * sin tildes. `normalizarNombreProvincia` los devuelve en su forma escrita:
 *   "VILCAS HUAMAN"        → "Vilcas Huamán"
 *   "PAUCAR DEL SARA SARA" → "Páucar del Sara Sara"
 *   "LA MAR"               → "La Mar"
 *   "VICTOR FAJARDO"       → "Víctor Fajardo"
 * Sirve igual para las capitales ("SAN MIGUEL" → "San Miguel").
 */

// Palabras que llevan tilde. Se comparan en mayúsculas y sin tilde; añade aquí
// las que necesites si amplías el mapa a otros departamentos.
const CON_TILDE: Readonly<Record<string, string>> = {
  HUAMAN: "Huamán",
  PAUCAR: "Páucar",
  VICTOR: "Víctor",
  CONCEPCION: "Concepción",
  ASUNCION: "Asunción",
};

// Artículos y preposiciones que van en minúscula salvo al inicio.
const MINUSCULAS = new Set(["de", "del", "la", "las", "los", "y"]);

export function normalizarNombreProvincia(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palabra, i) => {
      if (i > 0 && MINUSCULAS.has(palabra)) return palabra;
      return CON_TILDE[palabra.toUpperCase()] ?? palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(" ");
}
