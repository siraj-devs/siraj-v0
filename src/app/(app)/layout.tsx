import { Footer, Header } from "@/components";
import type React from "react";

export const dynamic = "force-dynamic";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="mx-auto mt-[73px] flex min-h-[90vh] w-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
