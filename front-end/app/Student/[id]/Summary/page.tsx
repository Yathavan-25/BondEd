/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, Users, BookOpen, Brain, Target, 
  Sparkles, Clock, TrendingUp, CheckCircle2, 
  MessageSquare, Zap, CalendarDays, Loader2, Layers
} from 'lucide-react'

const POLL_INTERVAL_MS = 3000;

export default function SessionSummaryPage() {
  const [activeTab, setActiveTab] = useState<'voice' | 'collaborative'>('voice')
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0)
  
  const [data, setData] = useState<{ voice: any[], collaborative: any[] } | null>(null)
  const [loading, setLoading] = useState(true)

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const isPending = searchParams.get('pending') === '1'
  // Whether the newest (in-progress) voice session has shown up in the data yet.
  const [pendingResolved, setPendingResolved] = useState(!isPending)
  const [stillPending, setStillPending] = useState(isPending)

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoSelectedRef = useRef(false)
  const userInteractedRef = useRef(false)

  const fetchSummaries = async (): Promise<{ voice: any[], collaborative: any[] } | null> => {
    if (!studentId) return null;
    const token = await getAuth().currentUser?.getIdToken()
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000'
    const res = await fetch(`${baseUrl}/api/summary/${studentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) return null;
    return await res.json();
  };

  // Initial load — always runs, regardless of pending state, so the rest
  // of the page (older sessions, other tab) is usable immediately.
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await fetchSummaries();
        if (result) setData(result);
      } catch (err) {
        console.error("Failed to fetch summaries", err)
      } finally {
        setLoading(false)
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  // Background poll — only runs while we're waiting on the newest session's
  // analysis to be saved. Does NOT block the rest of the UI.
  useEffect(() => {
    if (!isPending || pendingResolved) return;

    const pendingSinceStr = sessionStorage.getItem('pendingSessionSince');
    const pendingSince = pendingSinceStr ? parseInt(pendingSinceStr, 10) : Date.now();

    const poll = async () => {
      try {
        const result = await fetchSummaries();
        if (result) {
          const newSessionIndex = result.voice.findIndex((s: any) => {
            const completedAt = s.lesson?.completedAt ? new Date(s.lesson.completedAt).getTime() : 0;
            return completedAt >= pendingSince - 5000; // buffer for clock skew
          });

          if (newSessionIndex !== -1) {
            setData(result);
            setPendingResolved(true);
            setStillPending(false);
            sessionStorage.removeItem('pendingSessionSince');

            if (!hasAutoSelectedRef.current && !userInteractedRef.current) {
              hasAutoSelectedRef.current = true;
              setActiveTab('voice');
              setSelectedSessionIndex(newSessionIndex);
            }

            router.replace(`/Student/${studentId}/Summary`);
            return;
          }

          // Keep other data (older sessions) fresh even while still waiting.
          setData(result);
        }
      } catch (err) {
        console.error("Polling for new session failed:", err);
      }

      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, pendingResolved, studentId]);

  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleTabSwitch = (tab: 'voice' | 'collaborative') => {
    userInteractedRef.current = true;
    setActiveTab(tab)
    setSelectedSessionIndex(0)
  }

  const handleSelectSession = (index: number) => {
    userInteractedRef.current = true;
    setSelectedSessionIndex(index);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1363CB]"/> 
        <p className="font-semibold text-lg">Loading Summaries...</p>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-red-500 font-semibold">Failed to load data. Please try again.</div>

  const rawSessions = data[activeTab] || []

  // Filter sessions by date range and search query
  const filteredSessions = rawSessions.filter((session: any) => {
    const title = session.lesson?.title || '';
    const topics = (session.lesson?.topicsCovered || []).join(' ');
    const matchesSearch = searchQuery === '' || 
      title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      topics.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (dateFilter === 'all') return true;

    const sessionDate = session.lesson?.completedAt ? new Date(session.lesson.completedAt) : new Date(session.lesson?.date);
    const now = new Date();
    const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dateFilter === '7days') return diffDays <= 7;
    if (dateFilter === '30days') return diffDays <= 30;
    return true;
  });

  const currentData = filteredSessions[selectedSessionIndex]
  const showPendingCard = stillPending && !pendingResolved && activeTab === 'voice';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 pt-8 min-h-screen bg-[#fafafb]">
      
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Session Summaries</h1>
        <p className="text-gray-500 mt-1 text-sm">Review your recent learning progress, AI-generated insights, and flashcards.</p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex p-1 bg-gray-100 rounded-2xl w-fit border border-gray-200 shadow-sm">
            <button onClick={() => handleTabSwitch('voice')} className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${activeTab === 'voice' ? 'text-[#9C2FDF]' : 'text-gray-500 hover:text-gray-700'}`}>
              {activeTab === 'voice' && <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <Mic className="w-4 h-4" /> AI Voice Assistant
              {showPendingCard && <span className="w-2 h-2 rounded-full bg-[#9C2FDF] animate-pulse ml-1" />}
            </button>
            <button onClick={() => handleTabSwitch('collaborative')} className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${activeTab === 'collaborative' ? 'text-[#1363CB]' : 'text-gray-500 hover:text-gray-700'}`}>
              {activeTab === 'collaborative' && <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <Users className="w-4 h-4" /> Collaborative Sessions
            </button>
          </div>

          {/* Date Range & Search Filters */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search topics or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#1363CB] transition-colors w-full sm:w-48 shadow-sm"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#1363CB] transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              <option value="all">📅 All Time</option>
              <option value="7days">⚡ Last 7 Days</option>
              <option value="30days">🗓️ Last 30 Days</option>
            </select>
          </div>
        </div>

        {(filteredSessions.length > 0 || showPendingCard) ? (
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide">
            {showPendingCard && (
              <div className="flex flex-col items-start px-5 py-3.5 rounded-xl border border-dashed border-[#9C2FDF]/40 bg-[#9C2FDF]/5 text-left min-w-50 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#9C2FDF] flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Generating
                </span>
                <span className="text-sm font-bold truncate w-full text-gray-500">Recent Session</span>
              </div>
            )}
            {filteredSessions.map((session: any, index: number) => (
              <button key={session.id} onClick={() => handleSelectSession(index)} className={`flex flex-col items-start px-5 py-3.5 rounded-xl border text-left min-w-50 shrink-0 transition-all ${selectedSessionIndex === index ? activeTab === 'voice' ? 'bg-[#9C2FDF]/5 border-[#9C2FDF]/30 shadow-sm' : 'bg-[#1363CB]/5 border-[#1363CB]/30 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${selectedSessionIndex === index ? (activeTab === 'voice' ? 'text-[#9C2FDF]' : 'text-[#1363CB]') : 'text-gray-400'}`}>{session.lesson.date}</span>
                <span className={`text-sm font-bold truncate w-full ${selectedSessionIndex === index ? 'text-gray-900' : 'text-gray-600'}`}>{session.lesson.title.split(':')[0]}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No {activeTab} sessions found.</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your date filter or search query.</p>
          </div>
        )}
      </div>

      {/* If this is the very first session ever and it's still generating,
          show an inline placeholder in the main content area instead of the
          normal session detail (since currentData will be undefined). */}
      {!currentData && showPendingCard && (
        <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
          <div className="relative w-14 h-14 mx-auto mb-5">
            <motion.div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, #1363CB, #9C2FDF, #1363CB)", WebkitMask: "radial-gradient(circle, transparent 58%, black 60%)", mask: "radial-gradient(circle, transparent 58%, black 60%)" }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} />
            <div className="absolute inset-1.5 rounded-full bg-white shadow-inner flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#9C2FDF]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Your summary is being prepared</h3>
          <p className="text-gray-500 text-sm mt-1">This will update automatically — no need to refresh.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentData && (
          <motion.div key={currentData.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3, ease: "easeOut" }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${activeTab === 'voice' ? 'bg-[#9C2FDF]/10 text-[#9C2FDF]' : 'bg-[#1363CB]/10 text-[#1363CB]'}`}>{activeTab === 'voice' ? '1-on-1 AI Session' : 'Group Session'}</span>
                      <span className="text-sm font-semibold text-gray-400 flex items-center gap-1"><Clock className="w-4 h-4" /> {currentData.lesson.duration}</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{currentData.lesson.title}</h2>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5 font-medium"><CalendarDays className="w-4 h-4" /> {currentData.lesson.date}</p>
                  </div>
                  {'peers' in currentData.lesson && currentData.lesson.peers && (
                    <div className="flex -space-x-2">
                      {currentData.lesson.peers.map((peer: string, i: number) => (
                        <div key={i} title={peer} className="w-10 h-10 rounded-full bg-linear-to-br from-[#1363CB] to-purple-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm">{peer.charAt(0)}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-gray-100 my-6" />

                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> AI Summary & Takeaways</h3>
                    <ul className="space-y-4">
                      {currentData.lesson.keyTakeaways.map((takeaway: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${activeTab === 'voice' ? 'text-[#9C2FDF]' : 'text-[#1363CB]'}`} />
                          <span className="text-gray-700 font-medium leading-relaxed text-[15px]">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-5 rounded-2xl border ${activeTab === 'voice' ? 'bg-[#9C2FDF]/5 border-[#9C2FDF]/20' : 'bg-[#1363CB]/5 border-[#1363CB]/20'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${activeTab === 'voice' ? 'text-[#9C2FDF]' : 'text-[#1363CB]'}`}><Zap className="w-4 h-4" /> Goal For Next Session</h3>
                    <p className={`text-[15px] font-medium leading-relaxed ${activeTab === 'voice' ? 'text-purple-900' : 'text-blue-900'}`}>{currentData.lesson.nextSteps}</p>
                  </div>
                </div>
              </div>

              {currentData.lesson.flashcards && currentData.lesson.flashcards.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6"><Layers className={`w-5 h-5 ${activeTab === 'voice' ? 'text-[#9C2FDF]' : 'text-[#1363CB]'}`} /> Generated Flashcards</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentData.lesson.flashcards.map((card: string, idx: number) => {
                      const parts = card.split('A:');
                      const question = parts[0]?.replace('Q:', '').trim() || card;
                      const answer = parts[1]?.trim() || '';
                      return (
                        <div key={idx} className="group relative bg-gray-50 border border-gray-200 rounded-2xl p-5 hover:border-[#1363CB] hover:shadow-md transition-all">
                          <p className="text-sm font-bold text-gray-900 mb-2">{question}</p>
                          {answer && <p className="text-sm text-gray-600 font-medium">{answer}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {currentData.lesson.transcript && currentData.lesson.transcript.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6"><BookOpen className={`w-5 h-5 ${activeTab === 'voice' ? 'text-[#9C2FDF]' : 'text-[#1363CB]'}`} /> Session Transcript</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-96 pr-2">
                      {currentData.lesson.transcript.map((msg: any, i: number) => (
                          <div key={i} className={`rounded-[16px] p-4 flex items-start gap-4 border ${msg.role === 'user' ? 'bg-gray-50 border-gray-100' : 'bg-linear-to-br from-indigo-50/70 to-purple-50/40 border-[#1363CB]/20'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 ${msg.role === 'user' ? 'bg-gray-800' : 'bg-linear-to-br from-[#1363CB] to-[#9C2FDF]'}`}>
                              {msg.role === 'user' ? <span className="text-xs font-bold">ME</span> : <Sparkles className="w-4 h-4" />}
                            </div>
                            <p className={`text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'text-gray-800' : 'text-[#1363CB]'}`}>{msg.text}</p>
                          </div>
                      ))}
                  </div>
                </div>
              )}

            </div>

            <div className="space-y-6">
              
              <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10"><Sparkles className="w-5 h-5 text-amber-300" /></div>
                    <h3 className="font-bold tracking-wide text-white">AI Profile Insight</h3>
                  </div>
                  <p className="text-[15px] text-white/90 leading-relaxed font-medium">&quot;{currentData.analytics.aiInsight}&quot;</p>
                </div>
                <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${activeTab === 'voice' ? 'bg-[#9C2FDF]/40' : 'bg-[#1363CB]/40'}`}></div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400" /> Topic Mastery</h3>
                <div className="space-y-5">
                  {currentData.analytics.knowledgeStrengths.map((skill: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold text-gray-800">{skill.subject}</span><span className="text-gray-500 font-bold">{skill.proficiency}%</span></div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${skill.proficiency}%` }} transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }} className={`h-full rounded-full ${activeTab === 'voice' ? 'bg-linear-to-r from-[#9C2FDF] to-purple-400' : 'bg-linear-to-r from-[#1363CB] to-blue-400'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-gray-400" /> Exhibited Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentData.analytics.personalityTraits.map((trait: string, i: number) => (
                      <span key={i} className="px-3.5 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">{trait}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-gray-400" /> Learning Mode</h3>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl inline-flex items-center gap-2.5">
                     <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
                     <span className="text-sm font-bold text-gray-800">{currentData.analytics.learningStyle}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}