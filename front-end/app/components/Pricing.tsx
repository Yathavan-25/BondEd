"use client";

import { motion, Variants } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "10",
    description: "Perfect for occasional study sessions.",
    features: [
      "200 AI Voice Assistant Minutes",
      "500 Video Collaboration Minutes",
      "Basic Session Analytics",
      "Standard Matchmaking",
    ],
    highlighted: false,
  },
  {
    name: "Student",
    price: "25",
    description: "The ideal package for consistent weekly studying.",
    features: [
      "500 AI Voice Assistant Minutes",
      "1000 Video Collaboration Minutes",
      "Advanced Weekly Analytics",
      "Priority Matchmaking",
      "Automated Flashcard Generation",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "45",
    description: "For power users and rigorous exam prep.",
    features: [
      "1000 AI Voice Assistant Minutes",
      "2000 Video Collaboration Minutes",
      "Full Profile Generative Updates",
      "Unlimited AI Image Generation",
      "24/7 Priority Support",
    ],
    highlighted: false,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

export default function Pricing() {
  return (
    <section className="py-24 font-funnel overflow-hidden" id="pricing">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-[11px] font-bold tracking-[.18em] uppercase text-violet-500 mb-3"
        >
          Pricing
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-3"
        >
          Supercharge your study sessions
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 tracking-widest"
        >
          Unlock the full power of AI-assisted collaboration.
        </motion.p>
      </div>

        {/* Pricing Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              className={` relative isolate flex flex-col h-full rounded-2xl transform-gpu transition-transform duration-300 hover:-translate-y-2 will-change-transform ${
                plan.highlighted ? "md:-translate-y-4 hover:md:-translate-y-6 shadow-xl hover:scale-[1.03] hover:shadow-[#1363cb56]" : "shadow-sm hover:shadow-md"
              }`}
            >
              {plan.highlighted ? (
                <>
                  {/* Outer Background (The Gradient Border) */}
                  <div className="absolute inset-0 rounded-2xl bg-line-linear z-[-3]" />
                  {/* Inner White Card (Exposes 2px of the gradient) */}
                  <div className="absolute inset-0.5 rounded-[calc(1rem-2px)] bg-white z-[-2]" />
                </>
              ) : (
                // Standard Border for non-highlighted cards
                <div className="absolute inset-0 rounded-2xl border border-slate-200 bg-white z-[-2]" />
              )}

              {/* "Most Popular" Badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                  <span className="bg-primary-linear text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              {/* Card Content Container */}
              <div className="relative z-10 flex flex-col p-8 h-full pointer-events-none">
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? "text-primary" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
                    <span className="text-slate-500 font-medium text-sm">/package</span>
                  </div>
                  <p className="text-slate-500 text-sm h-10">{plan.description}</p>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        plan.highlighted ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Call to Action Button */}
                <div className="mt-auto pointer-events-auto">

                  {plan.highlighted ? 
                    <button className="group border-2 bg-primary-linear w-full px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all">
                    <span className="group-hover:text-primary-linear">Get Started</span>
                    </button>
                  :
                  <button
                    className={`w-full py-3.5 rounded-xl font-bold transition-transform duration-300 transform-gpu hover:scale-[1.02] active:scale-95`}
                  >
                    Choose {plan.name}
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