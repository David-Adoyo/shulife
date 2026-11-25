import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ["@shulife/core", "@shulife/demo"],
  serverExternalPackages: [],
};

export default nextConfig;
