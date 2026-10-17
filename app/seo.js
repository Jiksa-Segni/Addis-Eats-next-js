export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const shareImage = "/images/dorowet.jpg";

export function createPageMetadata({ title, description, path, image = shareImage, imageAlt }) {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      title: `${title} | Addis Eats`,
      description,
      url: path,
      images: [
        {
          url: image,
          alt: imageAlt ?? `${title} at Addis Eats in Addis Ababa`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Addis Eats`,
      description,
      images: [image],
    },
  };
}

export function jsonLd(data) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
