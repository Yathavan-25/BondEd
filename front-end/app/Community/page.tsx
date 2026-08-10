import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Users, MessageSquare, Award, Flame, Globe, Sparkles, ExternalLink } from 'lucide-react'

export const metadata = {
  title: 'Community | BondEd',
  description: 'Join the global student community on Discord, participate in study marathons, and climb the leaderboard.',
}

export default function Community() {
  const channels = [
    {
      title: "Discord Study Server",
      description: "Join over 15,000+ students in 24/7 quiet study channels, subject assistance rooms, and general banter.",
      members: "15,000+ Members",
      linkText: "Join Discord",
      href: "#"
    },
    {
      title: "Global Study Marathons",
      description: "Participate in weekly 4-hour focus sessions hosted every weekend with live AI note takeaways.",
      members: "Every Saturday",
      linkText: "View Schedule",
      href: "#"
    },
    {
      title: "Campus Ambassador Program",
      description: "Represent BondEd on your university campus, host local study meetups, and earn exclusive perks.",
      members: "50+ Campuses",
      linkText: "Apply as Ambassador",
      href: "#"
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
              <Globe className="w-4 h-4 text-[#A855F7]" /> Global Peer Network
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              Connect With Learners Worldwide
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              Study is better together. Engage in active discussions, join focus groups, and build lifelong academic connections.
            </p>
          </div>
        </section>

        {/* Community Channels */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {channels.map((chan, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">{chan.members}</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-4 mb-3">{chan.title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{chan.description}</p>
                </div>

                <a 
                  href={chan.href}
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white hover:bg-violet-600 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  {chan.linkText} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
