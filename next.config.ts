import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  headers: async () => [
    // checkin以外の全ページ: カメラ・マイクを禁止
    {
      source: "/((?!checkin).*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
      ],
    },
    // checkinページ: カメラ・マイクを許可（Wherebyビデオ通話用）
    {
      source: "/checkin(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Permissions-Policy", value: "camera=*, microphone=*, display-capture=*" },
      ],
    },
  ],
};

export default nextConfig;
