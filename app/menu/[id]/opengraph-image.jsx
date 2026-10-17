/**
 * Task 21 — Per-dish Open Graph image.
 *
 * Next.js generates /menu/[id]/opengraph-image.png for every dish.
 * The image uses the real dish name, price, and description so sharing
 * any dish page on social media shows accurate, up-to-date content.
 *
 * No external images are fetched; the design uses solid colours that are
 * always available at generation time regardless of environment.
 */
import { ImageResponse } from "next/og";
import { getDishById } from "@/lib/dishes";

export const alt = "Dish detail — Addis Eats";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function DishOpenGraphImage({ params }) {
  const { id } = await params;
  const dish = await getDishById(id);

  // If the dish does not exist, fall back to a generic branded image.
  const name = dish?.name ?? "Our Menu";
  const description = dish?.description ?? "Fresh Ethiopian food served daily in Addis Ababa.";
  const price = dish ? `${dish.price} ETB` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #292524 0%, #44403c 60%, #1c1917 100%)",
          fontFamily: "sans-serif",
          padding: "64px 72px",
        }}
      >
        {/* Header — brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "4px",
              background: "#d97706",
              borderRadius: "2px",
            }}
          />
          <span style={{ color: "#d97706", fontSize: "22px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" }}>
            Addis Eats
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#fbbf24",
              textTransform: "uppercase",
              letterSpacing: "4px",
            }}
          >
            Featured dish
          </div>

          <div
            style={{
              fontSize: "80px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-1px",
              maxWidth: "900px",
            }}
          >
            {name}
          </div>

          <div
            style={{
              fontSize: "28px",
              color: "#d6d3d1",
              maxWidth: "780px",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        </div>

        {/* Footer — price */}
        {price ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                background: "rgba(217,119,6,0.2)",
                border: "1px solid rgba(217,119,6,0.5)",
                borderRadius: "50px",
                padding: "14px 36px",
                color: "#fde68a",
                fontSize: "36px",
                fontWeight: 800,
              }}
            >
              {price}
            </div>
            <div style={{ color: "#78716c", fontSize: "20px" }}>
              Order online · Addis Ababa
            </div>
          </div>
        ) : null}
      </div>
    ),
    { ...size }
  );
}
