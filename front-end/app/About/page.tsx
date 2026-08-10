import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GraduationCap, Target, Users, Sparkles, Award, Compass, HeartHandshake, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About Us | BondEd',
  description: 'Discover the story behind BondEd, our mission to revolutionize student collaborative learning with AI.',
}

export default function AboutUs() {
  const values = [
    {
      icon: Users,
      title: "Peer-Powered Growth",
      description: "We believe students learn best when studying together. Collaboration fosters deeper understanding and long-term retention."
    },
    {
      icon: Sparkles,
      title: "AI-Enhanced Efficiency",
      description: "Our AI assistant handles tedious note-taking and flashcard creation so students can focus on active learning and problem solving."
    },
    {
      icon: HeartHandshake,
      title: "Inclusivity & Accessibility",
      description: "Every student deserves access to ideal study partners regardless of background, location, or institution."
    },
    {
      icon: Zap,
      title: "Continuous Innovation",
      description: "We constantly refine our matching algorithms and voice-assistant features based on empirical educational research."
    }
  ]

  const stats = [
    { label: "Accurate Matching", value: "95%" },
    { label: "Study Hours Saved", value: "50,000+" },
    { label: "Study Sessions Held", value: "25,000+" },
    { label: "Satisfaction Rate", value: "99.2%" }
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
              <GraduationCap className="w-4 h-4 text-[#A855F7]" /> Our Story & Mission
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Empowering Students to Learn Smarter, Together
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              BondEd was born out of a simple observation: solo studying is inefficient, but finding the right study partner is hard. We built an AI-powered ecosystem that connects compatible learners and supercharges their study sessions.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center border border-gray-200 shadow-sm">
                <div className="text-3xl sm:text-4xl font-bold text-violet-600 mb-2">{stat.value}</div>
                <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To eliminate academic isolation by providing intelligent matching algorithms and automated study tools that enable every student worldwide to achieve academic excellence.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                A world where learning is collaborative, engaging, and frictionless. Where students seamlessly connect with peers across disciplines to solve complex problems together.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Drives Us</h2>
            <p className="text-gray-500 mt-2">The principles guiding everything we build at BondEd.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col items-start">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-linear rounded-2xl p-10 text-white text-center max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">Ready to Join the Learning Revolution?</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8 text-sm sm:text-base">
            Start matching with compatible study partners today and supercharge your academic journey.
          </p>
          <Link href="/Register" className="inline-block bg-white text-violet-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
            Get Started Free
          </Link>
        </section>
      </main>

      <Footer />
    </>
  )
}
