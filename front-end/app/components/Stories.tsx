'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: "Sarah J.",
    role: "Computer Science Major",
    content: "I was struggling with Data Structures until BondEd matched me with a study group that actually understood my learning style. We aced the final together!",
    avatar: "bg-gradient-to-br from-purple-500 to-indigo-500",
  },
  {
    name: "Marcus T.",
    role: "Pre-Med Student",
    content: "Finding a study partner for Organic Chemistry felt impossible. BondEd matched me with someone in my exact timezone with the same goals. Total lifesaver.",
    avatar: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    name: "Emily R.",
    role: "Engineering Student",
    content: "The AI note-taker during our live sessions is an absolute game changer. We spend more time actually learning and discussing instead of aggressively writing things down.",
    avatar: "bg-gradient-to-br from-pink-500 to-rose-500",
  },
  {
    name: "David L.",
    role: "Business Administration",
    content: "I love the smart scheduling feature. It takes all the back-and-forth hassle out of finding a time that works for everyone in our project group.",
    avatar: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
  {
    name: "Priya K.",
    role: "Law Student",
    content: "The shared whiteboard and document editing made reviewing dense case studies incredibly efficient. It feels like we are in the same library room.",
    avatar: "bg-gradient-to-br from-emerald-500 to-teal-500",
  },
]

// Duplicate the array so the infinite slider loops seamlessly
const SLIDER_ITEMS = [...TESTIMONIALS, ...TESTIMONIALS]

export default function Stories() {
  return (
    <section className="w-full py-24 overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pure-css-marquee {
          0% { transform: translateX(0) translateZ(0); }
          100% { transform: translateX(-50%) translateZ(0); }
        }
        .animate-pure-marquee {
          animation: pure-css-marquee 35s linear infinite;
          /* Force GPU rendering and pre-allocate memory */
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
      `}} />

      {/* --- Section Header --- */}
      <div className="text-center mb-16 px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-[11px] font-bold tracking-[.18em] uppercase text-violet-500 mb-3"
        >
          Success Stories
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-3"
        >
          Don&apos;t just take our word for it
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 tracking-widest"
        >
          See how students are reaching their goals together
        </motion.p>
      </div>

      {/* --- The Auto-Slider --- */}
      <div className="relative w-full flex items-center h-100">
        
        <div className="flex gap-6 w-max px-3 animate-pure-marquee hover:[animation-play-state:paused]">
          {SLIDER_ITEMS.map((testimonial, idx) => (
            <TestimonialCard key={idx} testimonial={testimonial} />
          ))}
        </div>

        {/*Fade Edges */}
        <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-gray-50 to-transparent pointer-events-none z-20 rounded-md" />
        <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-gray-50 to-transparent pointer-events-none z-20 rounded-md" />
      </div>
      
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: typeof TESTIMONIALS[0] }) {
  return (

    <div className="group w-[320px] sm:w-95 h-full flex flex-col rounded-3xl bg-white p-8 border border-gray-200 shadow-sm transition-all duration-300 hover:scale-[1.05] hover:border-violet-500 hover:shadow-xl cursor-grab active:cursor-grabbing transform-gpu">
      
      {/* Quote Icon & Stars */}
      <div className="flex justify-between items-start mb-6">
        <Quote className="w-8 h-8 text-violet-200 group-hover:text-violet-500 transition-colors duration-300" fill="currentColor" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400" fill="currentColor" />
          ))}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-600 text-[15px] leading-relaxed mb-8 grow">
          &quot;{testimonial.content}&quot;
      </p>

      {/* User Info Profile */}
      <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-100">
        <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-white font-bold text-sm shadow-inner ${testimonial.avatar}`}>
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm tracking-tight">{testimonial.name}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{testimonial.role}</p>
        </div>
      </div>

    </div>
  )
}