import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["face-api.js"], // ✅ Include face-api.js so Vite processes it
    exclude: ["lucide-react"],
  },
});
