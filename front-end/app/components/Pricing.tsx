"use client";

import { motion, Variants } from "framer-motion";
import { DotsRing } from "@/components/ui/dots-ring";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";

const plans = [
  {
    name: "Starter",
    price: "10",
    description: "Perfect for occasional study sessions.",
    features: ["200 AI Voice Assistant Minutes", "500 Video Collaboration Minutes", "Basic Session Analytics", "Standard Matchmaking"],
    highlighted: false,
  },
  {
    name: "Student",
    price: "25",
    description: "The ideal package for consistent weekly studying.",
    features: ["500 AI Voice Assistant Minutes", "1000 Video Collaboration Minutes", "Advanced Weekly Analytics", "Priority Matchmaking", "Automated Flashcard Generation"],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "45",
    description: "For power users and rigorous exam prep.",
    features: ["1000 AI Voice Assistant Minutes", "2000 Video Collaboration Minutes", "Full Profile Generative Updates", "Unlimited AI Image Generation", "24/7 Priority Support"],
    highlighted: false,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (planName: string) => {

    const user = auth.currentUser;

    // If they click 'Buy' on the home page but aren't logged in, redirect them!
    if (!user) {
        toast.error("Please sign in or create an account to purchase credits.");
        router.push('/login'); 
        return;
    }

    setLoadingPlan(planName);

    try {
      const token = await user.getIdToken();
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
      
      const res = await fetch(`${baseUrl}/api/payments/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // We no longer need to send userId, the backend gets it from the token!
        body: JSON.stringify({ planName }) 
      });

      const data = await res.json();
      if (data.url) {
        // FIX: Use assign() instead of href to satisfy the linter immutability rule
        window.location.assign(data.url); 
      } else {
        toast.error("Failed to initiate checkout. Please try again.");
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error occurred.");
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-24 overflow-hidden" id="pricing">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="text-center mb-16 px-6">
          <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="text-[11px] font-bold tracking-[.18em] uppercase text-violet-500 mb-3">Pricing</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-4xl md:text-5xl font-extrabold text-primary-color tracking-tight mb-3">Supercharge your study sessions</motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-gray-500 tracking-widest font-geist">Unlock the full power of AI-assisted collaboration.</motion.p>
        </div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={cardVariants} className={` relative isolate flex flex-col h-full rounded-2xl transform-gpu transition-transform duration-300 hover:-translate-y-2 will-change-transform ${plan.highlighted ? "md:-translate-y-4 hover:md:-translate-y-6 shadow-xl hover:scale-[1.03] hover:shadow-[#1363cb56]" : "shadow-sm hover:shadow-md"}`}>
              {plan.highlighted ? (
                <>
                  <div className="absolute inset-0 rounded-2xl bg-line-linear z-[-3]" />
                  <div className="absolute inset-0.5 rounded-[calc(1rem-2px)] bg-white z-[-2]" />
                </>
              ) : (
                <div className="absolute inset-0 rounded-2xl border border-slate-200 bg-white z-[-2]" />
              )}

              {plan.highlighted && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                  <span className="bg-primary-linear text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="relative z-10 flex flex-col p-8 h-full pointer-events-none">
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? "text-primary-color" : "text-slate-900"}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
                    <span className="text-slate-500 font-medium text-sm">/month</span>
                  </div>
                  <p className="text-slate-500 text-sm h-10 font-geist">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3 font-geist">
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.highlighted ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pointer-events-auto">
                  {plan.highlighted ? 
                    <button onClick={() => handleCheckout(plan.name)} disabled={loadingPlan !== null} className="group border-2 bg-primary-linear w-full px-6 py-2 text-white hover:opacity-90 transition-all flex items-center justify-center gap-2">
                        {loadingPlan === plan.name ? <DotsRing className="text-[#9C2FDF] w-8 h-8" /> : "Choose Student"}
                    </button>
                  :
                    <button onClick={() => handleCheckout(plan.name)} disabled={loadingPlan !== null} className={`w-full px-6 py-2 text-white hover:bg-transparent hover:text-primary-color border-2 border-transparent hover:border-primary-color rounded-xl font-regular bg-primary-color transition-all flex items-center justify-center gap-2`}>
                        {loadingPlan === plan.name ? <DotsRing className="text-[#9C2FDF] w-8 h-8" /> : `Choose ${plan.name}`}
                    </button> 
                  }
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}