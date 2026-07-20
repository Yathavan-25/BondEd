import type { Metadata } from "next";
import { Geist, Funnel_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  weight: ["300", "800"],
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
      <body className="min-h-full flex flex-col">
      <Toaster position="top-right" reverseOrder={false} toastOptions={{
         success: {
          style: {
            background: "#059669", 
            color: "#FFFFFF",    
            borderRadius: "12px", 
          },
        },
        error: {
          style: {
            background: "#DC2626", 
            color: "#FFFFFF",
            borderRadius: "12px",
          }},
          duration: 3000,
        }}/>
        {children}
      </body>
    </html>
  );
}


