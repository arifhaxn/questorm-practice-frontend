import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The SPA talks ONLY to the deployed backend via VITE_API_BASE_URL (see .env).
// No dev proxy on purpose: we never want to accidentally hit localhost.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
