import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { BookOpen, Calendar, Clock, User, ArrowRight, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Blogs & Articles | BondEd',
  description: 'Read the latest insights on AI in education, study techniques, and collaborative learning.',
}

export default function Blogs() {
  const posts = [
    {
      title: "How Active Recall & Peer Discussion Double Information Retention",
      excerpt: "Discover why studying in pairs while engaging in active recall dramatically improves exam performance compared to passive reading.",
      category: "Study Techniques",
      date: "August 3, 2026",
      readTime: "5 min read",
      author: "Dr. Sarah Jenkins"
    },
    {
      title: "Using AI to Generate Instant Flashcards During Live Audio Sessions",
      excerpt: "A deep dive into how BondEd’s Vapi voice assistant listens in real-time to generate structured flashcards without interrupting flow.",
      category: "Product & AI",
      date: "July 28, 2026",
      readTime: "4 min read",
      author: "Alex Morgan"
    },
    {
      title: "Finding the Right Study Partner: What Personality & Style Metrics Matter",
      excerpt: "Not all study buddies are created equal. Learn how our 95% accurate matching engine aligns learning styles and availability.",
      category: "Community",
      date: "July 20, 2026",
      readTime: "6 min read",
      author: "Elena Rostova"
    },
    {
      title: "5 Strategies to Beat Academic Burnout and Stay Motivated",
      excerpt: "Practical tips for pacing study schedules, organizing breaks, and staying accountable with peer study partners.",
      category: "Wellness & Productivity",
      date: "July 12, 2026",
      readTime: "7 min read",
      author: "Marcus Chen"
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
              <BookOpen className="w-4 h-4 text-[#A855F7]" /> Insights & Research
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              The BondEd Blog
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              Latest news, study strategies, and deep dives into AI technology driving collaborative learning.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post, i) => (
              <article key={i} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">{post.category}</span>
                    <span className="text-gray-400 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 hover:text-violet-600 cursor-pointer transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{post.author}</span>
                    <span>•</span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{post.date}</span>
                  </div>

                  <button className="text-violet-600 hover:text-violet-800 text-sm font-semibold flex items-center gap-1">
                    Read Article <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
