import { defineConfig } from "vite";
import path from "path";

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig(({ command }) => {
  const rawPort = process.env.PORT;
  const defaultPort = 3000;
  const port = rawPort ? Number(rawPort) : defaultPort;

  if (rawPort && (Number.isNaN(port) || port <= 0)) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  if (!rawPort && command === "serve") {
    // Only warn for local dev; allow build to proceed without PORT set.
    // Netlify/build environments run `vite build`, so `command === 'build'` will not require PORT.
    // Provide a sensible default so preview/build use a stable port if needed.
    // eslint-disable-next-line no-console
    console.warn(`PORT not set — using default port ${defaultPort} for dev server`);
  }

  return {
    base: basePath,
    root: path.resolve(import.meta.dirname),
    publicDir: "public",
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: !!rawPort,
      host: "0.0.0.0",
      allowedHosts: true,
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
