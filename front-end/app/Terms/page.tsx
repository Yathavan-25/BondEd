import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Scale, CheckCircle2, AlertTriangle, CreditCard, ShieldAlert, FileText, UserCheck } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | BondEd',
  description: 'Read the terms and conditions governing your use of BondEd platform and AI study services.',
}

export default function TermsOfService() {
  const lastUpdated = "August 5, 2026"

  const sections = [
    {
      icon: UserCheck,
      title: "1. Acceptance of Terms",
      content: `By registering for, accessing, or using BondEd ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services. These terms apply to all registered students, tutors, and visitors.`
    },
    {
      icon: CheckCircle2,
      title: "2. Student Code of Conduct",
      content: `BondEd is an inclusive academic environment built on mutual respect and collaborative learning:
      • Academic Integrity: You agree to use AI note-taking and study sessions to supplement, not replace, honest academic work. Cheating or submitting AI content as original academic coursework without authorization is strictly prohibited.
      • Respectful Collaboration: Harassment, hate speech, bullying, or discrimination during live study sessions will result in immediate suspension.
      • Account Security: You are responsible for maintaining the confidentiality of your account credentials.`
    },
    {
      icon: FileText,
      title: "3. AI Study Assistant & Notes",
      content: `• Automated Note Generation: Our AI assistant records and transcribes study sessions to generate summaries and flashcards. By entering a shared study session, you consent to AI audio processing.
      • Content Ownership: You retain ownership of your original study notes and contributions. You grant BondEd a non-exclusive license to process your content solely to deliver platform features.`
    },
    {
      icon: CreditCard,
      title: "4. Credits, Subscriptions & Payments",
      content: `• Credit System: AI session recording and automated summary generation consume Vapi and daily minute credits.
      • Subscriptions & Refunds: Paid tier subscriptions auto-renew monthly unless cancelled prior to the billing cycle. Refund requests are handled according to our standard Billing Policy within 7 days of purchase.
      • Service Availability: We strive for 99.9% uptime but do not guarantee uninterrupted access during maintenance windows.`
    },
    {
      icon: ShieldAlert,
      title: "5. Limitation of Liability",
      content: `To the maximum extent permitted by applicable law, BondEd and its affiliates shall not be liable for indirect, incidental, special, or consequential damages resulting from your use or inability to use the platform or AI-generated study materials.`
    },
    {
      icon: AlertTriangle,
      title: "6. Account Termination",
      content: `We reserve the right to suspend or terminate accounts that violate our Student Code of Conduct, misuse AI credits, or engage in unauthorized platform scraping or reverse engineering.`
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
              <Scale className="w-4 h-4 text-[#A855F7]" /> Legal Agreement
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              Please read these Terms of Service carefully before using BondEd. They govern your access to our peer matching and AI collaborative learning platform.
            </p>
            <p className="text-xs text-gray-500 mt-6">
              Last updated: {lastUpdated}
            </p>
          </div>
        </section>

        {/* Terms Sections */}
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

          {/* Questions Banner */}
          <div className="mt-12 bg-gray-900 text-white rounded-xl p-8 text-center border border-gray-800">
            <h3 className="text-xl font-bold mb-2">Need Clarification?</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
              If you have any questions regarding our terms and student agreements, please reach out to our legal support team.
            </p>
            <a 
              href="mailto:support@bonded.edu" 
              className="inline-block bg-primary-linear text-white font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Legal Support
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
