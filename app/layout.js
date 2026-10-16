import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "./NavBar";
import { Providers } from "./providers";
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
  title: "Addis Eats",
  description: "Modern Ethiopian restaurant menu and ordering experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="flex-1">{children}</main>

            <footer className="border-t border-stone-200 bg-stone-900 text-stone-200">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm md:flex-row md:items-center md:justify-between">
                <p>Fresh Ethiopian flavors, served daily.</p>
                <p>© 2026 Addis Eats</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
