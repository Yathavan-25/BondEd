"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // When the user lands here, Firebase has usually already verified the email via the link.
    // Let's just check if they are logged in on this browser.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsChecking(false);
      if (user) {
        setIsLoggedIn(true);
        await user.reload();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 sm:p-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col items-center text-center text-white">

        <div className="w-24 h-24 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-emerald-400/50 bg-emerald-500/20 shadow-2xl mb-8 animate-bounce-short">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Email Verified! 🎉
        </h1>

        <p className="text-white/80 font-medium mb-8 leading-relaxed">
          Your email address has been successfully verified.
          <br /><br />
          You can safely close this page and <strong className="text-white">return to your original tab or device</strong> — it will automatically continue to the next step!
        </p>
      </div>
    </div>
  );
}
