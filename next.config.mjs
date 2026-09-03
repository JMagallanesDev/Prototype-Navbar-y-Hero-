import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hay un pnpm-lock.yaml suelto en C:\Users\USER (de otro proyecto) y Next
  // lo tomaba como raíz del workspace. Anclamos la raíz a esta carpeta.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};

export default nextConfig;
