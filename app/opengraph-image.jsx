/**
 * Task 20 — Site-wide Open Graph image.
 *
 * Next.js serves this file at /opengraph-image.png and references it
 * automatically through the root metadata. ImageResponse renders the JSX
 * to a 1200×630 PNG at build time (or on-demand in development).
 *
 * No external images are fetched — all colours and text are inlined so the
 * image can be generated in any environment without network access.
 */
import { ImageResponse } from "next/og";

export const alt = "Addis Eats — Fresh Ethiopian Food in Addis Ababa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #292524 0%, #44403c 60%, #1c1917 100%)",
          fontFamily: "sans-serif",
          padding: "64px",
        }}
      >
        {/* Amber accent bar */}
        <div
          style={{
            width: "80px",
            height: "6px",
            background: "#d97706",
            borderRadius: "3px",
            marginBottom: "32px",
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          Addis Eats
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#fbbf24",
            fontWeight: 600,
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          Fresh Ethiopian food, served daily in Addis Ababa
        </div>

        {/* Dish highlights */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "48px",
          }}
        >
          {["Doro Wet", "Kitfo", "Shiro", "Tibs"].map((name) => (
            <div
              key={name}
              style={{
                background: "rgba(217,119,6,0.15)",
                border: "1px solid rgba(217,119,6,0.4)",
                borderRadius: "50px",
                padding: "10px 24px",
                color: "#fde68a",
                fontSize: "22px",
                fontWeight: 600,
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
