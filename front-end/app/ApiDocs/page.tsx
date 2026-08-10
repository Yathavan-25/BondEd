import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Code, } from 'lucide-react'

export const metadata = {
  title: 'API Documentation | BondEd',
  description: 'Integrate BondEd study sessions, user sync, and summary services into your applications.',
}

export default function ApiDocs() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/auth/sync",
      description: "Sync or register a verified Firebase user with BondEd PostgreSQL database.",
      headers: "Authorization: Bearer <Firebase_ID_Token>",
      body: `{
  "firstName": "Jane",
  "lastName": "Doe"
}`,
      response: `{
  "message": "User synced successfully",
  "user": { "id": "usr_123", "email": "jane@university.edu" }
}`
    },
    {
      method: "GET",
      path: "/api/auth/count",
      description: "Get current total registered student count on the platform.",
      headers: "None (Public)",
      body: "None",
      response: `{
  "count": 12450
}`
    },
    {
      method: "GET",
      path: "/api/matches/recommendations",
      description: "Fetch top 5 algorithmically matched study partners for the authenticated student.",
      headers: "Authorization: Bearer <Firebase_ID_Token>",
      body: "None",
      response: `{
  "matches": [
    { "userId": "usr_456", "matchScore": 96, "subjects": ["Computer Science"] }
  ]
}`
    },
    {
      method: "POST",
      path: "/api/summary/generate",
      description: "Generate structured study notes and flashcards from an AI study room audio transcript.",
      headers: "Authorization: Bearer <Firebase_ID_Token>",
      body: `{
  "sessionId": "sess_789",
  "transcript": "Student A: Let us review backpropagation..."
}`,
      response: `{
  "summary": "concepts covering gradient descent...",
  "flashcards": [
    { "front": "What is backpropagation?", "back": "An algorithm for..." }
  ]
}`
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
              <Code className="w-4 h-4 text-[#A855F7]" /> REST API Reference
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
              BondEd Developer API
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              Integrate BondEd’s peer matching, session synchronization, and AI study note endpoints into your educational tools.
            </p>
          </div>
        </section>

        {/* Endpoints Documentation */}
        <section className="max-w-5xl mx-auto px-4 mb-20">
          <div className="space-y-8">
            {endpoints.map((ep, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold ${
                    ep.method === 'GET' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-gray-900 font-bold text-base sm:text-lg">{ep.path}</span>
                </div>

                <p className="text-gray-600 text-sm mb-6">{ep.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <div className="text-gray-500 font-sans font-semibold text-xs mb-2">Request Headers & Body</div>
                    <pre className="bg-gray-900 text-gray-200 p-4 rounded-xl overflow-x-auto">
                      {`// Headers\n${ep.headers}\n\n// Body\n${ep.body}`}
                    </pre>
                  </div>

                  <div>
                    <div className="text-gray-500 font-sans font-semibold text-xs mb-2">Response JSON</div>
                    <pre className="bg-gray-900 text-emerald-400 p-4 rounded-xl overflow-x-auto">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
