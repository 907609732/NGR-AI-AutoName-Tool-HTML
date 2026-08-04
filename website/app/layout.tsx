import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "NGR AssetPilot｜AI资源领航 - 游戏 UI 资源智能工作台",
    description: "集 AI 命名、团队知识库、UI 切图规范检测和批量导出于一体的本地资源工作台。",
    keywords: ["NGR AssetPilot", "AI资源领航", "UI切图命名", "资源规范检测", "游戏UI"],
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
    },
    openGraph: {
      title: "NGR AssetPilot｜AI资源领航",
      description: "让每一张 UI 资源，驶向正确的名字。",
      type: "website",
      locale: "zh_CN",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "NGR AssetPilot｜AI资源领航" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "NGR AssetPilot｜AI资源领航",
      description: "游戏 UI 资源智能工作台。",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
