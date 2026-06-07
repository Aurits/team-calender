import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav, Sidebar } from "@/components/Nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cadence — Team Schedule",
  description: "One shared place that shows who is doing what, where, when, and how important.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">
        <Sidebar />
        <BottomNav />
        <main className="min-h-dvh pb-20 md:pb-0 md:pl-60">
          <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-9">{children}</div>
        </main>
      </body>
    </html>
  );
}
