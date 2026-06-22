'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Users, FileUser, GraduationCap } from 'lucide-react'

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"] 
  })

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, restDelta: 0.001 })

  return (
    <section id="how-it-works" className="relative w-full py-20 px-4 md:px-12 lg:px-20 overflow-hidden">
      
      {/* --- Header --- */}
      <div className="text-center mb-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-[11px] font-bold tracking-[.18em] uppercase text-violet-500 mb-3"
        >
          HOW IT WORKS
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-4xl md:text-5xl font-extrabold text-primary-color tracking-tight mb-3"
        >
          Forming the Perfect Bond
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 tracking-widest font-geist"
        >
          From building your profile to your first collaborative session in minutes.
        </motion.p>
      </div>

      {/* --- Vertical Timeline Container --- */}
      <div ref={containerRef} className="relative max-w-6xl mx-auto flex flex-col">
        
        {/* Timeline Path */}
        <div className="absolute left-13 md:left-18 top-5 bottom-5 w-1 bg-gray-200 rounded-full z-0 overflow-hidden">
          <motion.div 
            className="w-full bg-linear-to-b from-[#227EF4] via-[#A855F7] to-[#1B5299] origin-top h-full"
            style={{ scaleY: smoothProgress }}
          />
        </div>

        {/* --- STEP 01 --- */}
        <StepRow 
          stepNumber="01"
          title="Build Your Profile"
          description="Tell us your subjects, knowledge levels, learning style, and weekly availability."
          icon={<FileUser className="w-5 h-5 text-[#4993F2]" />}
          lottieSrc="/animations/profile-2.json"
        />

        {/* --- STEP 02 --- */}
        <StepRow 
          stepNumber="02"
          title="Collaborate"
          description="Our algorithm surfaces partners with high compatibility scores across academics and personality traits."
          icon={<Users className="w-5 h-5 text-[#A855F7]" />}
          lottieSrc="/animations/collaborate.json"
        />

        {/* --- STEP 03 --- */}
        <StepRow 
          stepNumber="03"
          title="Learn Together"
          description="Schedule sessions, collaborate in real-time, and track your progress together."
          icon={<GraduationCap className="w-5 h-5 text-[#4993F2]" />}
          lottieSrc="/animations/learn.json"
        />

      </div>
    </section>
  )
}

function StepRow({ 
  stepNumber, 
  title, 
  description, 
  icon, 
  lottieSrc 
}: { 
  stepNumber: string, 
  title: string, 
  description: string, 
  icon: React.ReactNode,
  lottieSrc: string 
}) {
  return (
    <div className="relative flex flex-col md:flex-row items-center w-full group py-0 my-8 md:my-12">
      
      {/* Left Side: Content Box*/}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full md:w-1/2 bg-gray-background py-4 md:py-6 pl-7.5 md:pl-12.5 pr-4 md:pr-12 rounded-md flex flex-col items-start"
      >
        
        {/* ICON (Stacked on top) */}
        <div className="w-12 h-12 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center mb-6">
          {icon}
        </div>

        <span className="text-xs font-bold text-[#227EF4] tracking-widest uppercase mb-2">
          Step {stepNumber}
        </span>

        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
          {title}
        </h3>
        
        <p className="text-sm md:text-base text-gray-500 leading-relaxed font-light font-geist">
          {description}
        </p>
      </motion.div>

      {/* Right Side: 3D Animation */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="w-full md:w-1/2 mt-4 md:mt-0 flex justify-center items-center h-62.5 md:h-87.5"
      >
        <div className="w-full max-w-87.5 h-full relative transition-transform duration-500 group-hover:-translate-y-2">
          <DotLottieReact src={lottieSrc} loop autoplay className="w-full h-full object-contain" />
        </div>
      </motion.div>
      
    </div>
  )
}