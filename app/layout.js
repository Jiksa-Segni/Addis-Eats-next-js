import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavBar from "./NavBar";
import { Providers } from "./providers";
import { getSession } from "@/lib/auth";
import { shareImage, siteUrl } from "./seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Addis Eats | Ethiopian Food in Addis Ababa",
    template: "%s | Addis Eats",
  },
  description:
    "Discover authentic Ethiopian food in Addis Ababa. Explore fresh favorites like Doro Wet, Kitfo, Shiro, and Tibs, then order online from Addis Eats.",
  applicationName: "Addis Eats",
  keywords: [
    "Ethiopian food Addis Ababa",
    "Ethiopian restaurant",
    "Ethiopian food delivery",
    "Doro Wet",
    "Kitfo",
    "Addis Eats",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ET",
    siteName: "Addis Eats",
    url: "/",
    title: "Addis Eats | Ethiopian Food in Addis Ababa",
    description:
      "Explore fresh Ethiopian favorites and order online from Addis Eats in Addis Ababa.",
    images: [
      {
        url: shareImage,
        width: 1024,
        height: 680,
        type: "image/jpeg",
        alt: "Freshly prepared Ethiopian Doro Wet served at Addis Eats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Addis Eats | Ethiopian Food in Addis Ababa",
    description:
      "Explore fresh Ethiopian favorites and order online from Addis Eats in Addis Ababa.",
    images: [shareImage],
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
