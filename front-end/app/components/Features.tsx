'use client'
import { motion, Variants } from 'framer-motion'

import {

  Brain,
  Mic,
  BarChart3,
  CalendarCheck,
  Users,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [

  {
    icon: Brain,
    title: 'Intelligent Pairing',
    desc: 'Algorithm matches you with study partners based on personality, learning style, and academic goals.',
  },

  {
    icon: Mic,
    title: 'AI Voice Assistant',
    desc: 'An always-on study buddy that answers questions, explains concepts, and quizzes you in real time.',
  },

  {
    icon: BarChart3,
    title: 'Session Analytics',
    desc: 'Track participation, knowledge growth, and study patterns with beautiful weekly reports.',
  },

  {

    icon: CalendarCheck,
    title: 'Smart Scheduling',
    desc: 'Easily coordinate study sessions with availability matching and automated calendar integration.',
  },

  {
    icon: Users,
    title: 'Live Collaboration',
    desc: 'Whiteboard, screen share, chat, and notes synced across every device in your study room.',
  },

  {
    icon: ShieldCheck,
    title: 'Safe & Secure',
    desc: 'Verified student profiles, encrypted communications, and comprehensive safety features.',
  },

]



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}



const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}


export default function PlatformEcosystem() {

  return (
    <section className="w-full py-24 px-6 md:px-12">
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[11px] font-bold tracking-[.18em] uppercase text-violet-500 mb-3"
        >
          Platform Ecosystem
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-extrabold text-primary-color tracking-tight mb-3"
        >
          Everything You Need
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 tracking-widest font-geist"
        >
          For successful collaborative learning
        </motion.p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-9"
      >

        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
          />
        ))}
      </motion.div>
    </section>

  )

}

function FeatureCard({ feature }: { feature: (typeof FEATURES)[number] }) {
  const { icon: Icon, title, desc } = feature

  return (
    <motion.div
      variants={cardVariants}
      className="group relative isolate rounded-[20px] bg-white overflow-hidden cursor-default shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 hover:-translate-y-1.5"
    >

      <div className="absolute inset-0 bg-line-linear opacity-60 z-[-3]" />
      <div className="absolute inset-[1.5px] rounded-[18.5px] bg-white z-[-2]" />
      <div
        className="absolute inset-[1.5px] rounded-[18.5px] z-[-1] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1800 ease-in-out"
        style={{
          background: 'linear-gradient(-45deg, rgba(79, 85, 238, 0.85) 20%, rgba(156, 47, 223, 0.85) 100%)'
        }}
      />

      <div className="relative z-10 p-7 flex flex-col h-full pointer-events-none">
        <div className="w-12 h-12 rounded-[13px] bg-primary-linear flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-none group-hover:bg-white">
          <Icon className="w-5 h-5 text-white group-hover:text-violet-500" />
        </div>
        <h3 className="text-[17px] font-bold text-gray-950 tracking-tight mb-2 leading-snug">
          {title}
        </h3>

        <p className="text-[13px] text-gray-500 leading-relaxed font-geist">
          {desc}
        </p>
      </div>

      <div className="absolute inset-0 z-20 p-7 flex flex-col h-full pointer-events-none [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0_0_0)] transition-all duration-1800 ease-in-out">
        <div className="w-12 h-12 mb-5 shrink-0" />
        <h3 className="text-[17px] font-bold text-white tracking-tight mb-2 leading-snug">
          {title}
        </h3>

        <p className="text-[13px] text-white leading-relaxed font-geist">
          {desc}
        </p>
      </div>
    </motion.div>

  )
} 

