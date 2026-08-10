import { ArrowRight, Crosshair, Sparkles } from 'lucide-react'
import Navbar from './components/Navbar'
import SplineScene from './components/SplineScene'
import HowItWorks from './components/HowItWorks'
import Title from './components/Title'
import Features from './components/Features'
import Stories from './components/Stories'
import Pricing from './components/Pricing'
import CTA from './components/CTA'
import Footer from './components/Footer'
import Link from 'next/link'
import StudentCounter from './components/StudentCounter'

const Home = () => {

  return (
    <>
      <Navbar />
    
    <main className='min-h-screen lg:mx-20 mx-2'>

      {/* HERO SECTION */}
      <section id='#home' className="relative min-h-vh overflow-x-hidden rounded-2xl mt-5 shadow-2xl overflow-hidden">
        
        {/* Main Container */}
        <div className="relative w-full min-h-170 bg-black rounded-2xl flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden">
          
          {/* Spline Background Conatainer */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none rounded-2xl overflow-hidden">
            <div className="w-full h-full pointer-events-auto">
              <SplineScene />
            </div>
          </div>

          {/* ========================================== */}
          {/* Foreground Content Container */}
          {/* ========================================== */}
          <div className="relative z-10 w-full h-full grow flex flex-col items-center justify-between gap-8 text-center pt-16 pointer-events-none">
            
            {/* Badge */}
            <div className="flex justify-center w-full">
              <span className="flex w-fit justify-center items-center gap-2 text-white bg-white/10 font-medium text-xs sm:text-sm rounded-full px-4 py-1.5 backdrop-blur-md shadow-sm border border-white/5">
                <Sparkles className="w-4 h-4 text-[#A855F7]" />
                Bond. Learn. Succeed Together.
              </span>
            </div>

            {/* Title and Sub Contents */}
            <div className="flex flex-col items-center max-w-4xl px-2 sm:px-6">
              <Title />
              
              <p className="text-xs sm:text-sm md:text-base font-geist text-gray-500 max-w-xl sm:max-w-2xl font-normal leading-relaxed px-2">
                BondEd matches you with students who share your goals, schedule, and learning style, then powers every session with an AI assistant that takes notes, makes flashcards, and tracks your progress.
              </p>
            </div>

            {/* ========================================== */}
            {/* CTA Buttons */}
            {/* FIX: Added pointer-events-auto here so the buttons remain clickable! */}
            {/* ========================================== */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 pointer-events-auto">
              <Link href="/Register">
                <button className="group w-full sm:w-auto bg-primary-linear text-white font-medium shadow-lg flex items-center justify-center px-6 h-10 gap-2 hover:border-dark-primary-linear border-2 border-transparent hover:border-2 hover:bg-transparent transition-all duration-300 max-lg:text-[12px] max-lg:px-2">
                <span>Start Collaborating</span> 
                  <ArrowRight className="w-4 h-4 mt-0.75" />
                </button> 
              </Link>
              <button className="relative w-full sm:w-auto group overflow-hidden border-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/10 hover:border-white shadow-sm px-6 py-2 flex items-center justify-center transition-all duration-900">
                <span className="absolute bottom-0 right-0 w-64 h-64 bg-gray-300 rounded-full translate-x-1/2 translate-y-1/2 scale-0 group-hover:scale-[1.5] transition-transform duration-900 ease-in-out origin-center"></span>
                <span className="relative z-10 font-medium group-hover:text-black transition-colors duration-700">
                  Watch Demo
                </span>
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-col sm:flex-row font-geist items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400 font-light mt-4">
              <span className="flex items-center gap-2">
                <Crosshair strokeWidth={1.5} className="w-5 h-5 text-[#6366F1]" />
                95% Accurate Matching
              </span>
              <StudentCounter />
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id='how-it-works'>
        <HowItWorks />
      </section>

      {/* FEATURES SECTION */}
      <section id='features'>
        <Features />
      </section> 

      {/* STORIES SECTION */}
      <section id='stories'>
        <Stories />
      </section>

      {/* Pricing SECTION */}
      <section id='pricing'>
        <Pricing />
      </section>

      {/* CTA SECTION */}
      <section>
        <CTA />
      </section>
    </main>

    <Footer />
    </>
  )
}

export default Home