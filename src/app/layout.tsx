import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import ScrollLight from "@/components/ScrollLight";
import PageBackground3D from "@/components/three/PageBackground3D";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cyber Range — Live-Fire Cybersecurity Training",
  description:
    "MIST Cyber Range (CACR): hands-on cybersecurity training with live-fire labs, CEH and OSCP tracks, and dedicated range access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-black antialiased`}
      >
        {/* Global space backdrop: fixed 3D starfield behind every page,
            film grain tying DOM to the 3D layer, and scroll-driven light
            sweeps. All fixed + pointer-events-none, so pages just render
            translucent sections on top. */}
        <PageBackground3D />
        <div aria-hidden className="grain" />
        <ScrollLight />
        {children}
      </body>
    </html>
  );
}
