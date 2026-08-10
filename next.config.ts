import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint style rules (e.g. no-explicit-any) shouldn't fail a production build —
  // run `pnpm lint` in CI/dev for those. This keeps `next build` (and the
  // Dokploy deploy) from breaking on pre-existing lint warnings.
  eslint: {
    ignoreDuringBuilds: true,
  },
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
