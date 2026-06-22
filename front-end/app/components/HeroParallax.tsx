// 'use client'

// import { useRef } from 'react'
// import { motion, useScroll, useTransform } from 'framer-motion'
// import { ArrowRight, Crosshair, Sparkles, Users } from 'lucide-react'
// import SplineScene from './SplineScene'
// import Title from './Title'

// export default function HeroParallax() {
//   const heroRef = useRef<HTMLDivElement>(null)

//   const { scrollYProgress } = useScroll({
//     target: heroRef,
//     offset: ["start start", "end start"]
//   })

//   // Parallax Animations
//   const boxPadding = useTransform(scrollYProgress, [0, 0.5], ["1.25rem", "0rem"])
//   const boxRadius = useTransform(scrollYProgress, [0, 0.5], ["1rem", "0rem"])
//   const splineScale = useTransform(scrollYProgress, [0, 1], [1, 1.3])
//   const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
//   const textY = useTransform(scrollYProgress, [0, 0.3], [0, -50])

//   return (
//     <div ref={heroRef} className="relative h-[150vh] w-full">
//       <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        
//         {/* EXPANDING BLACK BOX */}
//         <motion.div style={{ padding: boxPadding }} className="w-full h-full max-w-screen-2xl mx-auto flex items-center justify-center">
//           <motion.div style={{ borderRadius: boxRadius }} className="relative w-full h-full bg-black overflow-hidden shadow-2xl flex flex-col items-center justify-center">
            
//             {/* 3D Spline Background */}
//             <motion.div style={{ scale: splineScale }} className="absolute inset-0 w-full h-full z-0 pointer-events-none">
//               <div className="w-full h-full pointer-events-auto">
//                 <SplineScene />
//               </div>
//             </motion.div>

//             {/* Foreground Content */}
//             <motion.div style={{ opacity: textOpacity, y: textY }} className="relative z-10 w-full flex flex-col items-center justify-center gap-8 text-center px-4 pt-16">
//               <div className="flex justify-center w-full">
//                 <span className="flex w-fit justify-center items-center gap-2 text-white bg-white/10 font-medium text-xs sm:text-sm rounded-full px-4 py-1.5 backdrop-blur-md shadow-sm border border-white/5">
//                   <Sparkles className="w-4 h-4 text-[#A855F7]" />
//                   Bond. Learn. Succeed Together.
//                 </span>
//               </div>

//               <div className="flex flex-col items-center max-w-4xl px-2 sm:px-6">
//                 <Title />
//                 <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-xl sm:max-w-2xl font-normal leading-relaxed px-2 mt-2">
//                   BondEd matches you with students who share your goals, schedule, and learning style, then powers every session with an AI assistant that takes notes, makes flashcards, and tracks your progress.
//                 </p>
//               </div>

//               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 mt-2">
//                 <button className="group w-full sm:w-auto bg-gradient-to-r from-[#227EF4] to-[#1B5299] text-white font-medium shadow-lg flex items-center justify-center px-6 h-10 rounded-lg gap-2 hover:opacity-90 transition-all duration-300">
//                   <span>Start Collaborating</span> 
//                   <ArrowRight className="w-4 h-4" />
//                 </button>
//                 <button className="relative w-full sm:w-auto group overflow-hidden rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white shadow-sm px-6 py-2 flex items-center justify-center transition-all duration-300">
//                   <span className="relative z-10 font-medium transition-colors duration-300">Watch Demo</span>
//                 </button>
//               </div>

//               <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400 font-light mt-4">
//                 <span className="flex items-center gap-2"><Crosshair strokeWidth={1.5} className="w-5 h-5 text-[#6366F1]" /> 95% Accurate Matching</span>
//                 <span className="flex items-center gap-2"><Users strokeWidth={1.5} className="w-5 h-5 text-[#A855F7]" /> 10,000+ Students</span>
//               </div>
//             </motion.div>

//           </motion.div>
//         </motion.div>
//       </div>
//     </div>
//   )
// }