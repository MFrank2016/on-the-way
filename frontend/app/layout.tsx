import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "On The Way - 习惯追踪与时间管理",
  description: "一个简洁高效的习惯追踪与时间管理应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
