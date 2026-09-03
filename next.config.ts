import type { NextConfig } from "next";

// Runs as a Node server (not a static export): the /api/analytics routes
// need server-side filesystem access for the local SQLite habit-tracking
// database. Every OpenAI call still happens directly from the browser under
// the user's own key. See
// docs/superpowers/specs/2026-08-31-interview-coach-mvp-design.md section 1.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
