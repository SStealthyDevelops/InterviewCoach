import type { NextConfig } from "next";

// Fully static export: no Node server, no Route Handlers. Every OpenAI call
// is made directly from the browser under the user's own key. See
// docs/superpowers/specs/2026-08-31-interview-coach-mvp-design.md section 1.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
