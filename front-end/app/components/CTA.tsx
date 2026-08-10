'use client'

import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import { Headset, WandSparkles } from "lucide-react"
import Link from "next/link"
import CountUp from "react-countup"

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
  const [studentCount, setStudentCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000'
        const res = await fetch(`${baseUrl}/api/auth/count`)
        if (res.ok) {
          const data = await res.json()
          setStudentCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching student count for CTA:', error)
      }
    }

    fetchUserCount()
  }, [])

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
          className="text-center font-geist text-white/75 text-[16px] md:text-[20px] font-light mt-4"
        >
          Join {studentCount !== null ? <CountUp end={studentCount} duration={2.5} separator="," /> : 0}+ students already studying smarter with BondEd
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row gap-4 md:gap-16 mt-10 justify-center items-center w-full md:w-auto"
        >
            {/* FIRST BUTTON */}

            <Link href="/Register" >
              <button className="group relative w-full md:w-auto overflow-hidden border-2  hover:border-violet-600 bg-transparent text-primary-color hover:text-white px-6 py-2 flex items-center justify-center transition-all duration-900">
                  <span className="absolute bottom-0 right-0 w-300 h-300 bg-white rounded-full translate-x-1/2 translate-y-1/2 scale-[1.5] group-hover:scale-0 transition-transform duration-900 ease-in-out origin-center"></span>
                  <span className="relative z-10 flex items-center gap-2.5 font-medium">
                      Start Learning <WandSparkles className="size-4.5" />
                  </span>
              </button>
            </Link>
            {/* SECOND BUTTON*/}
            <button className="relative w-full md:w-auto group overflow-hidden border-2 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border-violet-600 hover:border-primary-color shadow-sm px-6 py-2 flex items-center justify-center transition-all duration-900">
                <span className="absolute bottom-0 right-0 w-300 h-300 bg-white rounded-full translate-x-1/2 translate-y-1/2 scale-0 group-hover:scale-[1.5] transition-transform duration-900 ease-in-out origin-center"></span>
                
                <span className="relative z-10 font-medium flex items-center gap-2.5 group-hover:text-primary-color transition-colors duration-700">
                  Talk to Sales <Headset className="size-4.5" />
                </span>
            </button>
        </motion.div>
        
    </motion.main>
  )
}

export default CTA