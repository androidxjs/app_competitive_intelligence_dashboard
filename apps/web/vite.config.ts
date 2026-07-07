import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGithubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGithubPages ? "/app_competitive_intelligence_dashboard/" : "/",
  plugins: [react()],
  server: {
    port: 4311
  }
});
