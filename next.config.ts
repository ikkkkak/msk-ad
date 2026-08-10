import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "meskney-iv.sfo3.digitaloceanspaces.com" },
      { protocol: "https", hostname: "sfo3.digitaloceanspaces.com" },
      {
        protocol: "https",
        hostname: "meskney-iv.sfo3.cdn.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
