'use client'

import { motion, Variants } from "framer-motion"
import { Headset, WandSparkles } from "lucide-react"


const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.1, 0.25, 1] as const 
    } 
  }
}

const CTA = () => {
  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="bg-primary-linear flex flex-col items-center justify-center lg:rounded-lg rounded-md py-15 my-30 w-full max-w-7xl mx-auto px-4 overflow-hidden"
    >
        {/* Title */}
        <motion.h1 
          variants={itemVariants}
          className="text-center text-white text-[32px] md:text-[48px] font-bold leading-tight"
        >
          Ready to Transform Your Learning?
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          variants={itemVariants}
          className="text-center font-geist text-white text-[16px] md:text-[20px] font-light mt-4"
        >
          Join 12,000+ students already studying smarter with BondEd
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row gap-4 md:gap-16 mt-10 justify-center items-center w-full md:w-auto"
        >
            {/* FIRST BUTTON */}
            <button className="group relative w-full md:w-auto overflow-hidden border-2  hover:border-violet-600 bg-transparent text-primary hover:text-white px-6 py-2 flex items-center justify-center transition-all duration-900">
                <span className="absolute bottom-0 right-0 w-300 h-300 bg-white rounded-full translate-x-1/2 translate-y-1/2 scale-[1.5] group-hover:scale-0 transition-transform duration-1500 ease-in-out origin-center"></span>
                <span className="relative z-10 flex items-center gap-2.5 font-medium">
                    Start Learning <WandSparkles className="size-4.5" />
                </span>
            </button>
            
            {/* SECOND BUTTON*/}
            <button className="relative w-full md:w-auto group overflow-hidden border-2 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border-violet-600 hover:border-primary shadow-sm px-6 py-2 flex items-center justify-center transition-all duration-900">
                <span className="absolute bottom-0 right-0 w-300 h-300 bg-white rounded-full translate-x-1/2 translate-y-1/2 scale-0 group-hover:scale-[1.5] transition-transform duration-1500 ease-in-out origin-center"></span>
                
                <span className="relative z-10 font-medium flex items-center gap-2.5 group-hover:text-primary transition-colors duration-700">
                  Talk to Sales <Headset className="size-4.5" />
                </span>
            </button>
        </motion.div>
        
    </motion.main>
  )
}

export default CTA