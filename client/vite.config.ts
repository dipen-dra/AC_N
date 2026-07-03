import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({ target: "react", routesDirectory: "./src/routes" }),
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true, // Listen on all network interfaces (0.0.0.0)
    cors: {
      origin: ['http://localhost:5173', 'http://192.168.1.103:5173'],
      credentials: true
    },
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
