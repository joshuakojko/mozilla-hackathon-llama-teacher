import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/chats/:path*',
        destination: 'http://localhost:8000/chats/:path*',
      },
    ];
  },
};

export default nextConfig;
