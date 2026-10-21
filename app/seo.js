export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Default share image — always resolved to an absolute URL so Telegram,
// WhatsApp, and Twitter crawlers can fetch it without a metadataBase fallback.
export const shareImage = new URL("/images/dorowet.jpg", siteUrl).toString();

export function createPageMetadata({ title, description, path, image = shareImage, imageAlt }) {
  // Ensure the image URL is always absolute. If a relative path is passed in,
  // resolve it against siteUrl. Social media crawlers reject relative URLs.
  const absoluteImage =
    image.startsWith("http://") || image.startsWith("https://")
      ? image
      : new URL(image, siteUrl).toString();

  const absoluteUrl =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : new URL(path, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl,
    },
    openGraph: {
      type: "website",
      title: `${title} | Addis Eats`,
      description,
      url: absoluteUrl,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: imageAlt ?? `${title} at Addis Eats in Addis Ababa`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Addis Eats`,
      description,
      images: [absoluteImage],
    },
  };
}

export function jsonLd(data) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
