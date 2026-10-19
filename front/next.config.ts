import type { NextConfig } from "next";

/** Адрес Spring Boot backend. Rewrites вычисляются при сборке, поэтому в Docker он передается как build arg. */
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Плашка dev-инструментов Next.js перекрывает блок профиля в sidebar
  devIndicators: false,
  // Минимальный сервер для Docker-образа
  output: "standalone",
  // Браузер ходит в API через тот же origin, поэтому CORS не нужен
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
  experimental: {
    // Генерация статьи идет 30-90 секунд, по умолчанию прокси обрывает запрос через 30
    proxyTimeout: 300_000,
    // Файлы-источники до 20 МБ; по умолчанию тело проксируемого запроса обрезается до 10 МБ
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
