import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Shield, Lock, Eye, FileText, Database, UserCheck, Bell, RefreshCw } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | BondEd',
  description: 'Learn how BondEd collects, uses, and protects your personal data and AI study session information.',
}

export default function PrivacyPolicy() {
  const lastUpdated = "August 5, 2026"

  const sections = [
    {
      icon: Database,
      title: "1. Information We Collect",
      content: `We collect information to provide better study matching, AI assistance, and session notes:
      • Account Data: Your name, email address, and profile information upon registration.
      • Learning Profile: Your study subjects, availability, learning style preferences, and target academic goals.
      • Session Data: Transcripts, audio summaries, and flashcards generated during collaborative AI-powered study sessions.
      • Usage & Analytics: Technical data such as IP address, browser type, device information, and platform interaction logs.`
    },
    {
      icon: Eye,
      title: "2. How We Use Your Data",
      content: `Your data is strictly used to enhance your educational experience:
      • Algorithmic Matching: Pair you with compatible study partners using our 95% accurate matching engine.
      • AI Study Notes & Summaries: Generate personalized study materials, flashcards, and automated session summaries.
      • Platform Operations: Manage user accounts, process credit subscriptions, and ensure platform security.
      • Service Improvements: Analyze aggregated, non-identifiable usage trends to optimize study algorithms.`
    },
    {
      icon: Lock,
      title: "3. Data Security & AI Confidentiality",
      content: `We prioritize student data privacy above all else:
      • Encryption: All data in transit is encrypted via TLS 1.3, and data at rest is secured using AES-256 encryption.
      • AI Model Safety: Your private study notes and voice recordings are NEVER used to train external public foundation models.
      • Access Control: Strict role-based access control prevents unauthorized internal or external access to your study rooms.`
    },
    {
      icon: UserCheck,
      title: "4. Sharing & Disclosure",
      content: `BondEd does not sell your personal data to third parties or advertisers:
      • Peer Match Disclosure: Only your public profile information (first name, subjects, learning style) is shared with matched study partners.
      • Service Providers: Trusted infrastructure providers (e.g., cloud hosting, payment processors) handle data under strict data protection agreements.
      • Legal Compliance: We may disclose data if required by law or to protect student safety and platform integrity.`
    },
    {
      icon: FileText,
      title: "5. Your Data Rights & Choices",
      content: `You maintain complete control over your academic data:
      • Access & Export: Download a copy of your session notes, flashcards, and profile information anytime.
      • Correction & Deletion: Edit your profile details or request full deletion of your account and session history.
      • Consent Withdrawal: Opt out of non-essential communications or data collection features in your account settings.`
    },
    {
      icon: Bell,
      title: "6. Updates to This Policy",
      content: `We may update this Privacy Policy periodically to reflect new features or regulations. We will notify you of material changes via email or prominent platform announcements.`
    }
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen lg:mx-20 mx-2 my-8 font-geist">
        {/* Header Hero */}
        <section className="bg-black text-white rounded-2xl p-8 sm:p-12 md:p-16 mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-linear opacity-20 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 text-violet-300 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6 border border-white/10">
              <Shield className="w-4 h-4 text-[#A855F7]" /> Trust & Data Privacy
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              At BondEd, we are committed to protecting your academic privacy and personal information. This policy outlines how your data is collected, processed, and safeguarded.
            </p>
            <p className="text-xs text-gray-500 mt-6 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Last updated: {lastUpdated}
            </p>
          </div>
        </section>

        {/* Policy Content Sections */}
        <section className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 gap-8">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                  <div className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line pl-0 sm:pl-13">
                    {section.content}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contact Box */}
          <div className="mt-12 bg-gray-900 text-white rounded-xl p-8 text-center border border-gray-800">
            <h3 className="text-xl font-bold mb-2">Have Questions About Your Privacy?</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
              If you have any questions, concerns, or requests regarding your personal data, our Privacy Officer is here to help.
            </p>
            <a
              href="mailto:privacy@bonded.edu"
              className="inline-block bg-primary-linear text-white font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Privacy Team
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
