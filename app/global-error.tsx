"use client";

// Catches errors thrown by the root layout itself (app/error.tsx only
// covers errors in routes it wraps). Must render its own <html>/<body> -
// it fully replaces the root layout, so it can't rely on globals.css
// having loaded. Inline styles only, on purpose.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#fafafa",
          color: "#171717",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#52525b" }}>
            The app failed to load. Your practice data is safe — it&apos;s stored
            locally and this didn&apos;t affect it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              width: "100%",
              borderRadius: 8,
              background: "#18181b",
              color: "#fff",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
