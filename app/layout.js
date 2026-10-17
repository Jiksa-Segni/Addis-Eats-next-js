import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavBar from "./NavBar";
import { Providers } from "./providers";
import { getSession } from "@/lib/auth";
import "./globals.css";

/**
 * The canonical public URL for this deployment.
 *
 * Priority order:
 *   1. NEXT_PUBLIC_SITE_URL  — set this in your hosting environment (e.g. Vercel) to the
 *      real production domain, e.g. https://addis-eats.example.com
 *   2. VERCEL_URL             — automatically injected by Vercel for preview deployments.
 *   3. http://localhost:3000  — development fallback only; never used in production.
 *
 * If you deploy to a custom domain, set NEXT_PUBLIC_SITE_URL in your environment variables
 * before building. Do NOT commit a real domain here.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  /**
   * metadataBase makes all relative image URLs in metadata absolute.
   * It must be set to the canonical public URL of the deployment.
   */
  metadataBase: new URL(siteUrl),

  title: {
    /**
     * default — shown on pages that do not export their own metadata.
     * template — applied to every page that exports a plain string title.
     */
    default: "Addis Eats — Authentic Ethiopian Food in Addis Ababa",
    template: "%s | Addis Eats",
  },

  description:
    "Addis Eats serves fresh, authentic Ethiopian food in Addis Ababa. Browse Doro Wet, Kitfo, Shiro, Tibs, and more, then order online for delivery.",

  applicationName: "Addis Eats",

  keywords: [
    "Ethiopian food Addis Ababa",
    "Ethiopian restaurant",
    "Ethiopian food delivery",
    "Doro Wet",
    "Kitfo",
    "Shiro",
    "Tibs",
    "Addis Eats",
    "injera",
  ],

  openGraph: {
    type: "website",
    locale: "en_ET",
    siteName: "Addis Eats",
    title: "Addis Eats — Authentic Ethiopian Food in Addis Ababa",
    description:
      "Fresh Ethiopian dishes prepared daily and available for online ordering in Addis Ababa.",
    /**
     * /opengraph-image.png is generated at build time by app/opengraph-image.jsx.
     * The URL is resolved against metadataBase so it becomes absolute automatically.
     */
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Addis Eats — Fresh Ethiopian food served daily in Addis Ababa",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Addis Eats — Authentic Ethiopian Food in Addis Ababa",
    description:
      "Fresh Ethiopian dishes prepared daily and available for online ordering in Addis Ababa.",
    images: ["/opengraph-image.png"],
  },
};

export default async function RootLayout({ children }) {
  const initialUser = await getSession();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <Providers initialUser={initialUser}>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="flex-1">{children}</main>

            <footer className="border-t border-stone-200 bg-stone-900 text-stone-200">
              <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-lg font-black text-white">Addis Eats</p>
                  <p className="mt-3 text-stone-300">Fresh Ethiopian flavors, served daily.</p>
                </div>
                <div>
                  <h2 className="font-bold text-white">Quick links</h2>
                  <ul className="mt-3 space-y-2">
                    <li><Link className="hover:text-amber-300" href="/">Home</Link></li>
                    <li><Link className="hover:text-amber-300" href="/menu">Menu</Link></li>
                    <li><Link className="hover:text-amber-300" href="/about">About us</Link></li>
                    <li><Link className="hover:text-amber-300" href="/cart">Your cart</Link></li>
                  </ul>
                </div>
                <div>
                  <h2 className="font-bold text-white">Get help</h2>
                  <ul className="mt-3 space-y-2">
                    <li><Link className="hover:text-amber-300" href="/#contact">Delivery and contact help</Link></li>
                    {initialUser?.role === "customer" ? (
                      <li><Link className="hover:text-amber-300" href="/orders">Order history</Link></li>
                    ) : null}
                    <li><Link className="hover:text-amber-300" href="/checkout">Checkout help</Link></li>
                  </ul>
                </div>
                <div id="contact">
                  <h2 className="font-bold text-white">Contact</h2>
                  <address className="mt-3 space-y-2 not-italic text-stone-300">
                    <p>Addis Ababa, Ethiopia</p>
                    <p><a className="hover:text-amber-300" href="tel:+251112223344">+251 11 222 3344</a></p>
                    <p>Open daily, 9:00 AM – 11:00 PM</p>
                  </address>
                </div>
                <p className="border-t border-stone-700 pt-5 text-stone-400 sm:col-span-2 lg:col-span-4">
                  © 2026 Addis Eats
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
