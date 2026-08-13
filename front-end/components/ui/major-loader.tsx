"use client";

import dynamic from "next/dynamic";
import animationData from "@/public/animations/loading.json";

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export function MajorLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-64 h-64 flex items-center justify-center">
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
}
