/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Allow the dev server's HMR socket to be reached from other hosts on the
  // local network (e.g. testing the app on a phone at http://10.101.0.211:3000).
  // Dev-only — ignored by `next start` in production.
  allowedDevOrigins: ["10.101.0.211"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    // Allow Leaflet CDN marker icons used in DeliveryMap.jsx.
    // Only this specific host is permitted — arbitrary remote hosts are not allowed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "unpkg.com",
        pathname: "/leaflet@1.9.4/dist/images/**",
      },
    ],
  },
};

export default nextConfig;
