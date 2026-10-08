import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// The browser only ever calls this app's own origin under /api; the backend's
// address stays out of the bundle. In production Vercel runs api/proxy.js for
// that path. `vite dev` has no serverless functions, so the dev server proxies
// the same path here instead.
//
// BACKEND_URL has no VITE_ prefix, so Vite never inlines it into the bundle.
// loadEnv with an empty prefix is what lets this Node-side file read it.

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = (env.BACKEND_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: backend,
          changeOrigin: true,
          // Sockets too, so /api/ws/support reaches the backend in dev.
          // Production cannot: a serverless function does not hold a socket,
          // so there VITE_SUPPORT_WS_URL is the backend's wss:// address.
          ws: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
