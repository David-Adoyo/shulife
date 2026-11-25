import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ["@shulife/core", "@shulife/demo", "@shulife/db", "@shulife/integrations"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
