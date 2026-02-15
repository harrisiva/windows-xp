import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Default frontend dev port.
    port: 5173,
    proxy: {
      // Send API calls to Express backend during local UI development.
      "/api": "http://localhost:3000",
    },
  },
});
