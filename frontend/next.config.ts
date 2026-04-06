import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/white", destination: "/app", permanent: false }];
  },
};

export default nextConfig;
