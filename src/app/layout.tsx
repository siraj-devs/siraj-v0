import { ToastProvider } from "@/components";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "سراج",
  description: "نادي سراج هو نادي طلابي يهدف إلى تطوير الطلبة في مناح كثيرة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Kufam:wght@400;500;600;700;800;900&family=Tajawal:wght@200;300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-tajawal">
        {children}
        <ToastProvider />
        <Analytics />
      </body>
    </html>
  );
}
