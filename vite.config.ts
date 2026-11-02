import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      // En desarrollo no hace falta configurar CORS en la API: Vite reenvía
      // /api a la API de .NET (puerto 5259, ver launchSettings.json).
      "/api": {
        target: "http://localhost:5259",
        changeOrigin: true,
      },
    },
  },
});
