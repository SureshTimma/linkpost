import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'media.licdn.com', // For LinkedIn profile images
      'media.linkedin.com', // Alternative LinkedIn domain
    ],
  },
};

export default nextConfig;
