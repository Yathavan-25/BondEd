import type { Metadata } from "next";
import { Geist, Funnel_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  weight: ["300", "800"], // Matches your current Google Font import range
});

export const metadata: Metadata = {
  title: "BondEd - AI-Assisted Collaborative Learning Platform",
  description: "AI-Assisted Collaborative Learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${funnelDisplay.variable}  h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}


