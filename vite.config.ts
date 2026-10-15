// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Inline the public client configuration at build time so the browser bundle
    // always receives the VITE_SUPABASE_* values, even when .env is absent from
    // the publish checkout. Values are public/publishable only (no secrets).
    // On Vercel, dashboard-configured VITE_* variables take precedence over
    // these fallbacks.
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env.VITE_SUPABASE_URL || "https://pfzktxekrfshomkokrxo.supabase.co",
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmemt0eGVrcmZzaG9ta29rcnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTYxNDUsImV4cCI6MjA5ODk3MjE0NX0.4h7LfExOX-w2FPCoWN0BRelIm3-0LlejQGbxwOyicC8",
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        process.env.VITE_SUPABASE_PROJECT_ID || "pfzktxekrfshomkokrxo",
      ),
    },
  },
});
