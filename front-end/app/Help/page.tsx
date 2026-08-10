import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { HelpCircle, Search, UserCheck, Mic, CreditCard, Shield, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Help Center | BondEd',
  description: 'Search support guides, tutorials, and FAQs for using BondEd platform and AI study assistant.',
}

export default function HelpCenter() {
  const categories = [
    {
      icon: UserCheck,
      title: "Getting Started & Matching",
      articles: [
        "How the 95% Matching Algorithm Works",
        "Setting Up Your Academic Profile & Preferences",
        "Sending and Accepting Study Requests",
        "Managing Available Study Schedule Hours"
      ]
    },
    {
      icon: Mic,
      title: "AI Assistant & Study Rooms",
      articles: [
        "Joining Live Collaborative Audio Sessions",
        "How Automated AI Note-Taking Works",
        "Exporting Session Flashcards and Summaries",
        "Configuring AI Voice Preferences"
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Credits",
      articles: [
        "How Vapi Minutes & Daily Credits Work",
        "Upgrading to BondEd Pro Subscription",
        "Stripe Payment Methods and Invoices",
        "Cancelling or Pausing Your Subscription"
      ]
    },
    {
      icon: Shield,
      title: "Account & Security",
      articles: [
        "Enabling Multi-Factor Authentication (MFA)",
        "Resetting Your Password via Firebase",
        "Deleting Your Account and Session History",
        "Reporting Violations in Study Rooms"
      ]
    }
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen lg:mx-20 mx-2 my-8 font-geist">
        {/* Hero with Search */}
        <section className="bg-black text-white rounded-2xl p-8 sm:p-12 md:p-16 mb-16 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-primary-linear opacity-15 blur-3xl pointer-events-none rounded-full" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <span className="inline-flex items-center gap-2 bg-white/10 text-violet-300 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <HelpCircle className="w-4 h-4 text-[#A855F7]" /> Support & Documentation
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              How Can We Help You?
            </h1>
            
            {/* Search Input Box */}
            <div className="w-full max-w-xl relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search for guides, topics, or features..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500 backdrop-blur-md text-sm sm:text-base"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{cat.title}</h2>
                  </div>

                  <ul className="space-y-3">
                    {cat.articles.map((art, idx) => (
                      <li key={idx}>
                        <Link href="/Faqs" className="text-gray-600 hover:text-violet-600 text-sm flex items-center justify-between py-1 transition-colors group">
                          <span>{art}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* Need More Help Box */}
        <section className="max-w-4xl mx-auto px-4 mb-20">
          <div className="bg-gray-900 text-white rounded-2xl p-8 sm:p-10 text-center border border-gray-800 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-3">Still Need Assistance?</h2>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              Can't find the answer you're looking for? Our dedicated support team is available 24/7.
            </p>
            <Link href="/Contact" className="bg-primary-linear text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm">
              Contact Support Team
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
