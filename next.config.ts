import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Плашка dev-инструментов Next.js перекрывает блок профиля в sidebar
  devIndicators: false,
};

export default nextConfig;
