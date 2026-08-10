'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react'

export default function FAQs() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const faqs = [
    {
      q: "How does BondEd match me with study partners?",
      a: "BondEd uses a multi-factor matching engine that analyzes your academic subjects, current study topics, preferred learning style (e.g. Visual, Auditory, Hands-on), and available weekly study hours to recommend compatible study partners with 95% accuracy."
    },
    {
      q: "What does the AI Study Assistant do during sessions?",
      a: "During live collaborative audio/video study sessions, the AI assistant actively transcribes the discussion, extracts key concepts, creates structured session summaries, and automatically builds flashcard decks for post-session revision."
    },
    {
      q: "Is BondEd free for students?",
      a: "Yes! BondEd provides a generous free tier that includes peer matching, live study rooms, and daily free AI recording/summarization minutes. We also offer BondEd Pro for unlimited Vapi AI minutes and advanced analytics."
    },
    {
      q: "Are my study notes and voice recordings private?",
      a: "Absolutely. All study sessions are encrypted end-to-end. Your private notes and voice recordings are confidential and are never used to train public AI foundation models."
    },
    {
      q: "How do Vapi Minutes and Daily Credits work?",
      a: "Every new account receives initial Vapi AI minutes for automated session recording. Credits reset daily/monthly depending on your plan tier, and extra credits can be topped up anytime."
    },
    {
      q: "What happens if a study partner violates the Code of Conduct?",
      a: "We maintain zero tolerance for harassment or inappropriate behavior. You can immediately leave a session and report any user directly through the session room interface. Reported users are investigated within 2 hours."
    }
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
              <HelpCircle className="w-4 h-4 text-[#A855F7]" /> Frequently Asked Questions
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              Got Questions? We’ve Got Answers
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              Everything you need to know about peer matching, AI study notes, credits, and account management.
            </p>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section className="max-w-4xl mx-auto px-4 mb-20">
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none hover:bg-gray-50/50"
                >
                  <span className="text-lg font-bold text-gray-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 shrink-0 ${openIdx === i ? 'rotate-180 text-violet-600' : ''}`} />
                </button>

                {openIdx === i && (
                  <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
