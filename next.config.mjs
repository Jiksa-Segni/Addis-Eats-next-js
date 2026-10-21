/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

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
