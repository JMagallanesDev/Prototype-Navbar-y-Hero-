import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hay un pnpm-lock.yaml suelto en C:\Users\USER (de otro proyecto) y Next
  // lo tomaba como raíz del workspace. Anclamos la raíz a esta carpeta.
  outputFileTracingRoot: path.resolve(import.meta.dirname),

  images: {
    // Host de las URLs que trae DEFAULT_PLACES en <FeaturedPlaces>. La
    // sección no las usa —sirve copias locales desde public/places, porque
    // Wikimedia devuelve 429 al pedir las siete a la vez—, pero el patrón se
    // queda para que el componente siga funcionando suelto, sin la prop
    // `places`. Cuando conectes tus lugares reales, añade aquí su CDN.
    remotePatterns: [{ protocol: "https", hostname: "upload.wikimedia.org" }],
  },
};

export default nextConfig;
