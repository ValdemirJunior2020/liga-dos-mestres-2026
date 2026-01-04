import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // tudo que começar com /gdoc vai pra docs.google.com
      "/gdoc": {
        target: "https://docs.google.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/gdoc/, ""),
      },
    },
  },
});
