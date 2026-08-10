import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Compass, CheckCircle2, UserPlus, Mic, FileText, Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Student Guide | BondEd',
  description: 'Complete user manual and best practices for collaborative learning with BondEd.',
}

export default function StudentGuide() {
  const steps = [
    {
      step: "01",
      icon: UserPlus,
      title: "Complete Your Academic Profile",
      description: "Fill out your subjects, current topics, learning style (e.g. Visual, Practical, Auditorial), and study availability. The more accurate your profile, the better our 95% matching engine works."
    },
    {
      step: "02",
      icon: Compass,
      title: "Find & Connect with Partners",
      description: "Browse recommended study partners algorithmically matched for your goals. Send study session requests and connect via instant messaging."
    },
    {
      step: "03",
      icon: Mic,
      title: "Launch an AI-Powered Study Room",
      description: "Start your video/audio session. Activate BondEd’s Vapi voice assistant to listen seamlessly in the background and take automatic notes without missing a beat."
    },
    {
      step: "04",
      icon: FileText,
      title: "Review Summaries & Flashcards",
      description: "After the session ends, access instant AI-generated summaries, key concept breakdowns, and automated flashcard decks directly from your Student Dashboard."
    }
  ]

  const tips = [
    "Set clear study goals at the beginning of each session.",
    "Take turns teaching concepts to your peer to reinforce active recall.",
    "Utilize the AI assistant for difficult questions during the session.",
    "Review generated flashcards within 24 hours of completing a session."
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen lg:mx-20 mx-2 my-8 font-geist">
        {/* Hero */}
        <section className="bg-black text-white rounded-2xl p-8 sm:p-12 md:p-16 mb-16 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-primary-linear opacity-15 blur-3xl pointer-events-none rounded-full" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <span className="inline-flex items-center gap-2 bg-white/10 text-violet-300 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <Compass className="w-4 h-4 text-[#A855F7]" /> Student Manual
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              How to Master BondEd
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              Step-by-step guide to maximizing your study efficiency, partner matching, and AI note-taking capabilities.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="max-w-5xl mx-auto px-4 mb-20">
          <div className="space-y-8">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start gap-6">
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-3xl font-black text-violet-600 font-mono">{s.step}</span>
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pro Tips */}
        <section className="max-w-5xl mx-auto px-4 mb-20">
          <div className="bg-violet-900 text-white rounded-2xl p-8 sm:p-10 border border-violet-800">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" /> Pro Tips for Maximum Retention
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tips.map((t, idx) => (
                <div key={idx} className="bg-white/10 rounded-xl p-4 flex items-start gap-3 backdrop-blur-md">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-violet-100 text-sm font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
