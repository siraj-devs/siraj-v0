import { Footer, Header } from "@/components";
import type React from "react";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="mt-[73px] flex min-h-[90vh] flex-col justify-center px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
