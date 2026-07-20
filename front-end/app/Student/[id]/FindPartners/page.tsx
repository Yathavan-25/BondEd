/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";;
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Sparkles, Send, MessageCircleMore,
  Users, TrendingUp, Inbox, Check, X, Clock, ArrowUpRight, Sliders,
  BrainCircuit, Lightbulb, Loader2
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

// --- TYPES ---
interface TopicAssessment { topic: string; subject: string; score: number; summary: string; }
interface MatchData {
  id: string; name: string; initials: string; match: number;
  lookingForTopic?: string[]; topics?: string[]; lookingForSubject?: string[]; subjects?: string[];
  availability: string; avatarBg: string; learningStyle?: string[];
  personality?: { openness?: number; conscientiousness?: number; extraversion?: number; agreeableness?: number; };
  knowledgeLevel?: { score?: number; feedback?: string; topicBreakdown?: TopicAssessment[]; };
}
interface RequestData { id: string; name: string; initials: string; avatarBg: string; subject: string; sentAgo: string; status?: string; receiverId?: string; senderId?: string;}
interface MessageData { id: string; name: string; initials: string; avatarBg: string; preview: string; time: string; unread: number; partnerId: string;}
interface ChatMessage { id: string; senderId: string; receiverId: string; content: string; time: string; }

// --- VISUAL MOCK DATA (For Charts) ---
const sparkData = [ { v: 4 }, { v: 6 }, { v: 5 }, { v: 8 }, { v: 7 }, { v: 11 }, { v: 9 }, { v: 14 }, { v: 12 }, { v: 17 } ];

// --- HELPER FUNCTIONS ---
function getPersonalityLabels(p?: MatchData["personality"]) {
  if (!p) return ["Adaptable"];
  const labels: string[] = [];
  if (p.conscientiousness !== undefined) {
    if (p.conscientiousness >= 70) labels.push("Highly Organized");
    else if (p.conscientiousness <= 30) labels.push("Spontaneous");
  }
  if (p.extraversion !== undefined) {
    if (p.extraversion >= 70) labels.push("Extroverted");
    else if (p.extraversion <= 30) labels.push("Independent");
    else labels.push("Ambivert");
  }
  if (p.agreeableness !== undefined && p.agreeableness >= 70) labels.push("Team Player");
  if (p.openness !== undefined && p.openness >= 70) labels.push("Creative Thinker");
  return labels.length > 0 ? labels.slice(0, 2) : ["Balanced"]; 
}

function getLevelColors(score: number) {
  if (score >= 80) return { text: "Expert", bg: "bg-emerald-500", track: "bg-emerald-100" };
  if (score >= 40) return { text: "Intermediate", bg: "bg-amber-500", track: "bg-amber-100" };
  return { text: "Beginner", bg: "bg-red-500", track: "bg-red-100" };
}

// --- REUSABLE UI COMPONENTS ---
function KnowledgeBar({ topic, score }: { topic: string; score: number }) {
  const { text, bg, track } = getLevelColors(score);
  return (
    <div className="group relative w-full mb-3">
      <div className="flex justify-between items-end mb-1.5 px-0.5">
        <span className="text-xs font-bold text-gray-700 truncate pr-2">{topic}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${bg.replace("bg-", "text-")}`}>{text}</span>
      </div>
      <div className={`h-2 w-full rounded-full ${track} overflow-hidden`}>
        <div className={`h-full ${bg} rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-20 shadow-lg">
        {Math.round(score)}% Mastery
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, children, delay = 0 }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[22px] border border-[#00000010] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-16px_rgba(79,85,238,0.25)] transition-shadow duration-500">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-linear-to-br from-violet-100/60 to-indigo-100/0 blur-2xl pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-8 h-8 rounded-[10px] bg-linear-to-br from-violet-50 to-indigo-50 border border-violet-100/60 flex items-center justify-center"><Icon className="w-4 h-4 text-violet-600" /></div>
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</span>
            {trend && <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{trend}</span>}
          </div>
        </div>
        <div className="w-28 h-16">{children}</div>
      </div>
    </motion.div>
  );
}

function Sparkline({ color = "#4f55ee" }: { color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs><linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MatchRadial({ value }: { value: number }) {
  const color = value < 40 ? "#ef4444" : value < 75 ? "#f59e0b" : "#22c55e";
  return (
    <div className="w-16 h-16 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: "m", value, fill: color }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "#f1f1f7" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-[11px] font-bold tabular-nums" style={{ color: color }}>{value}%</span></div>
    </div>
  );
}

function Avatar({ initials, bg }: { initials: string; bg: string }) { return (<div className={`w-11 h-11 rounded-[12px] bg-linear-to-br ${bg} flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0`}>{initials}</div>); }
function ListShell({ children }: { children: React.ReactNode }) { return <div className="bg-white rounded-[22px] border border-[#00000010] shadow-sm divide-y divide-gray-100 overflow-hidden">{children}</div>; }
function Row({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) { return (<motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-4 p-4 md:p-5 hover:bg-gray-50/70 transition-colors">{children}</motion.div>); }

const TABS = [
  { id: "discover", label: "Discover", icon: Sparkles },
  { id: "sent", label: "Sent", icon: Send },
  { id: "received", label: "Received", icon: Inbox },
  { id: "messages", label: "Messages", icon: MessageCircleMore },
] as const;
type TabId = (typeof TABS)[number]["id"];

const API_BASE = "http://localhost:5000/api";

async function authHeaders(): Promise<HeadersInit> {
  let headers: HeadersInit = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) headers = { ...headers, 'Authorization': `Bearer ${await user.getIdToken()}` };
  return headers;
}

// --- MAIN COMPONENT ---
export default function FindPartnersPage() {
  const [tab, setTab] = useState<TabId>("discover");
  
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestData[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<RequestData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const params = useParams<{ id: string }>();
  const studentId = params?.id;

  // INTERACTIVE STATES
  const [activePartner, setActivePartner] = useState<MatchData | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isChatSlideOverOpen, setIsChatSlideOverOpen] = useState(false);

  // CHAT / CONVERSATION STATE
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const counts = useMemo(() => ({ sent: sentRequests.length, received: receivedRequests.length, messages: messages.reduce((a, m) => a + (m.unread || 0), 0) }), [sentRequests, receivedRequests, messages]);
  const avgCompatibility = useMemo(() => matches.length === 0 ? 0 : Math.round(matches.reduce((sum, match) => sum + match.match, 0) / matches.length), [matches]);
  const acceptanceRate = useMemo(() => sentRequests.length === 0 ? 0 : Math.round((sentRequests.filter(req => req.status === "Accepted").length / sentRequests.length) * 100), [sentRequests]);

  const fetchDashboardData = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      const headers = await authHeaders();

      const [matchesRes, sentRes, receivedRes, messagesRes] = await Promise.all([
        fetch(`${API_BASE}/matches/${studentId}`, { headers }),
        fetch(`${API_BASE}/requests/sent/${studentId}`, { headers }),
        fetch(`${API_BASE}/requests/received/${studentId}`, { headers }),
        fetch(`${API_BASE}/messages/${studentId}`, { headers })
      ]);

      if (matchesRes.ok) setMatches(await matchesRes.json());
      if (sentRes.ok) setSentRequests(await sentRes.json());
      if (receivedRes.ok) setReceivedRequests(await receivedRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // --- INTERACTION HANDLERS ---
  
  const openRequestModal = (partner: MatchData) => {
    setActivePartner(partner);
    setIsRequestModalOpen(true);
  };

  const openChatSlideOver = async (partnerId: string) => {
    // Find the partner info either from matches or messages
    let resolvedPartner: MatchData | null = null;
    const partnerFromMatches = matches.find(m => m.id === partnerId);
    if (partnerFromMatches) {
      resolvedPartner = partnerFromMatches;
    } else {
      const msgPartner = messages.find(m => m.partnerId === partnerId);
      if (msgPartner) {
        resolvedPartner = { id: msgPartner.partnerId, name: msgPartner.name, initials: msgPartner.initials, avatarBg: msgPartner.avatarBg, match: 0, availability: "Unknown" };
      }
    }
    setActivePartner(resolvedPartner);
    setIsChatSlideOverOpen(true);
    setChatMessages([]);
    setCanSendMessage(true);

    if (!studentId || !partnerId) return;

    setChatLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/messages/conversation/${studentId}/${partnerId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
        setCanSendMessage(!!data.canSend);
      }
    } catch (err) {
      console.error("Failed to load conversation", err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendStudyRequest = async (topic: string, note: string) => {
    if (!activePartner || !studentId) return;
    
    // 1. Optimistic UI Update (Shows immediately in Sent Tab)
    const newRequest: RequestData = {
        id: `temp-${Date.now()}`,
        name: activePartner.name,
        initials: activePartner.initials,
        avatarBg: activePartner.avatarBg,
        subject: `Wants to study: ${topic}`,
        sentAgo: "Just now",
        status: "Pending",
        receiverId: activePartner.id,
        senderId: studentId
    };
    setSentRequests(prev => [newRequest, ...prev]);
    setIsRequestModalOpen(false); // Close modal
    setTab("sent"); // Optional: Auto-switch to sent tab to show them it worked

    // 2. Real API Call
    try {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ senderId: studentId, receiverId: activePartner.id, topic, message: note })
        });
        if (!res.ok) throw new Error("Request failed");
        const saved = await res.json();
        // Swap the temp id for the real DB id so Cancel works afterward
        setSentRequests(prev => prev.map(r => r.id === newRequest.id ? { ...r, id: saved.id } : r));
    } catch (err) {
        console.error("Failed to send request", err);
        // Rollback on fail
        setSentRequests(prev => prev.filter(r => r.id !== newRequest.id));
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const prevRequests = sentRequests;
    setSentRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ senderId: studentId })
      });
      if (!res.ok) throw new Error("Failed to cancel");
    } catch (err) {
      console.error("Failed to cancel request", err);
      setSentRequests(prevRequests); // rollback
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const prevRequests = receivedRequests;
    setReceivedRequests(list => list.filter(r => r.id !== requestId));
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/requests/${requestId}/respond`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error("Failed to respond");
    } catch (err) {
      console.error("Failed to respond to request", err);
      setReceivedRequests(prevRequests); // rollback
    }
  };

  const handleSendChatMessage = async (content: string) => {
    if (!activePartner || !studentId || !canSendMessage) return;

    const tempId = `msg-${Date.now()}`;

    // 1. Optimistic UI Update
    setChatMessages(prev => [...prev, { id: tempId, senderId: studentId, receiverId: activePartner.id, content, time: "Just now" }]);
    setMessages(prev => {
        const filtered = prev.filter(m => m.partnerId !== activePartner.id);
        return [{ id: tempId, partnerId: activePartner.id, name: activePartner.name, initials: activePartner.initials, avatarBg: activePartner.avatarBg, preview: content, time: "Just now", unread: 0 }, ...filtered];
    });

    // 2. Real API Call
    try {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ senderId: studentId, receiverId: activePartner.id, content })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            // Roll back the optimistic message and lock the composer
            setChatMessages(prev => prev.filter(m => m.id !== tempId));
            setCanSendMessage(false);
            alert(err.error || "You can only send one message until they reply.");
        }
    } catch (err) {
        console.error("Failed to send message", err);
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 md:px-8 relative">
        {/* HEADER & STATS (Unchanged) */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Find Study Partners</h1>
              <span className="hidden md:flex items-center gap-1.5 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> {matches.length} matches found
              </span>
            </div>
            <p className="text-gray-500 text-sm md:text-base">Discover students with complementary skills and shared goals.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard icon={Users} label="Total Matches" value={matches.length.toString()} delay={0.05}><Sparkline color="#4f55ee" /></StatCard>
          <StatCard icon={TrendingUp} label="Acceptance Rate" value={`${acceptanceRate}%`} trend={sentRequests.length > 0 ? undefined : "0 requests"} delay={0.12}><Sparkline color="#9c2fdf" /></StatCard>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.19, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden rounded-[22px] border border-[#00000010] bg-linear-to-br from-[#1a1530] via-[#241a4a] to-[#3a1a5e] p-5 text-white shadow-[0_18px_40px_-16px_rgba(79,85,238,0.45)]">
            <div className="absolute -top-20 -right-10 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-violet-200/90">
                  <div className="w-8 h-8 rounded-[10px] bg-white/10 border border-white/15 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                  <span className="text-xs font-semibold uppercase tracking-wider">Avg Compatibility</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight tabular-nums">{avgCompatibility}%</span>
                  {avgCompatibility > 70 && <span className="text-xs font-semibold text-emerald-300 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />High</span>}
                </div>
                <p className="text-xs text-violet-200/70 mt-1">Across your {matches.length} matches</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="w-24 h-12 opacity-80"><Sparkline color="#c4b5fd" /></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* TABS MENU */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white border border-[#00000010] shadow-sm w-fit relative">
          {TABS.map((t) => {
            const active = tab === t.id;
            const badge = t.id === "sent" ? counts.sent : t.id === "received" ? counts.received : t.id === "messages" ? counts.messages : 0;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`relative px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${active ? "text-white" : "text-gray-600 hover:text-gray-900"}`}>
                {active && <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-linear-to-br from-[#4f55ee] to-[#9c2fdf] shadow-[0_6px_18px_-6px_rgba(79,85,238,0.5)]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative flex items-center gap-2">
                  <t.icon className="w-4 h-4" />{t.label}
                  {badge > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"}`}>{badge}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            {tab === "discover" && <DiscoverTab matches={matches} loading={loading} onOpenRequest={openRequestModal} onOpenChat={openChatSlideOver} />}
            {tab === "sent" && <SentTab requests={sentRequests} loading={loading} onCancel={handleCancelRequest} />}
            {tab === "received" && <ReceivedTab requests={receivedRequests} loading={loading} onRespond={handleRespondToRequest} />}
            {tab === "messages" && <MessagesTab messages={messages} loading={loading} onOpenChat={openChatSlideOver} />}
          </motion.div>
        </AnimatePresence>

        {/* --- MODALS OVERLAYS --- */}
        
        {/* 1. Request Modal (Centered Popup) */}
        <AnimatePresence>
            {isRequestModalOpen && activePartner && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRequestModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[24px] shadow-2xl z-50 overflow-hidden border border-gray-100">
                        {/* Modal Header */}
                        <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Send Study Request</h3>
                                <p className="text-sm text-gray-500">to {activePartner.name}</p>
                            </div>
                            <Avatar initials={activePartner.initials} bg={activePartner.avatarBg} />
                        </div>
                        {/* Modal Form */}
                        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleSendStudyRequest(fd.get('topic') as string, fd.get('note') as string); }} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">What do you want to study?</label>
                                <select name="topic" required className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium">
                                      {(activePartner.topics || activePartner.lookingForTopic || ["General Studies"]).map((t: any) => {
                                          // Safe extraction: if it's the rich object, grab .name. If it's a fallback string, just use it.
                                          const topicName = typeof t === 'string' ? t : t.name;
                                          return (
                                              <option key={topicName} value={topicName}>
                                                  {topicName}
                                              </option>
                                          );
                                      })}
                                  </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Add a quick note (Optional)</label>
                                <textarea name="note" rows={3} placeholder="Hey! Saw we both need help with..." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-linear-to-br from-[#4f55ee] to-[#9c2fdf] hover:shadow-lg transition-all">Send Request <Send className="w-4 h-4"/></button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        {/* 2. Direct Messaging Slide-over (Instagram style) */}
        <AnimatePresence>
            {isChatSlideOverOpen && activePartner && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChatSlideOverOpen(false)} className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40" />
                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100">
                        
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                            <div className="flex items-center gap-3">
                                <Avatar initials={activePartner.initials} bg={activePartner.avatarBg} />
                                <div>
                                    <h2 className="text-md font-bold text-gray-900 leading-tight">{activePartner.name}</h2>
                                    <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Online</p>
                                </div>
                            </div>
                            <button onClick={() => setIsChatSlideOverOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {/* Chat Body (Scrollable) - real conversation history, no fake auto-message */}
                        <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 flex flex-col gap-4">
                            <div className="text-center my-2">
                                <span className="px-3 py-1 bg-gray-200/50 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    {chatLoading ? "Loading..." : chatMessages.length === 0 ? "No messages yet" : "Conversation"}
                                </span>
                                {!chatLoading && !canSendMessage && chatMessages.length > 0 && (
                                    <p className="text-xs text-amber-500 mt-2 font-semibold">
                                        Waiting for {activePartner.name} to reply before you can send another message.
                                    </p>
                                )}
                                {!chatLoading && chatMessages.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Sending a message acts as an instant connection request &mdash; you can send one until they reply.
                                    </p>
                                )}
                            </div>

                            {chatLoading && (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 className="size-10 text-violet-600 animate-spin" />
                                </div>
                            )}

                            {!chatLoading && chatMessages.map((m) => {
                                const isMine = m.senderId === studentId;
                                return (
                                    <div key={m.id} className={`flex items-end gap-2 max-w-[85%] ${isMine ? "self-end flex-row-reverse" : ""}`}>
                                        {!isMine && <Avatar initials={activePartner.initials} bg={activePartner.avatarBg} />}
                                        <div className={`p-3 text-sm shadow-sm ${isMine ? "bg-violet-600 text-white rounded-2xl rounded-br-sm" : "bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm"}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Chat Input Area */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <form onSubmit={(e) => { e.preventDefault(); if (!canSendMessage) return; const el = e.currentTarget.elements.namedItem('msg') as HTMLInputElement; if(el.value.trim()) { handleSendChatMessage(el.value); el.value = ''; } }} className="flex items-end gap-2">
                                <textarea name="msg" rows={1} disabled={!canSendMessage} placeholder={canSendMessage ? "Type a message..." : "Waiting for reply..."} className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 rounded-[20px] px-4 py-3 text-sm outline-none resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                                <button type="submit" disabled={!canSendMessage} className="w-11 h-11 shrink-0 flex items-center justify-center bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// --- TAB COMPONENTS ---

// 1. DISCOVER TAB (Passed the new Interactive Handlers)
function DiscoverTab({ matches, loading, onOpenRequest, onOpenChat }: { matches: MatchData[], loading: boolean, onOpenRequest: (p: MatchData)=>void, onOpenChat: (id: string)=>void }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, subject, or skills..." className="w-full pl-11 pr-4 py-3 rounded-[15px] border border-[#00000020] bg-white focus:ring-2 focus:ring-[#4f55ee]/20 focus:border-[#4f55ee] outline-none text-sm font-medium transition-all shadow-sm" />
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 px-5 py-3 rounded-[15px] border border-[#00000020] bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm shrink-0">
            <Sliders className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-gray-500 space-y-4">
          <Loader2 className="size-10 text-violet-600 animate-spin" />
          <p className="font-semibold text-lg">Finding your best study partners...</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {matches.map((partner, idx) => {
            const personalityTraits = getPersonalityLabels(partner.personality);
            const primaryLearningStyle = partner.learningStyle?.[0] || "Adaptive";

            const rawTopics = partner.topics || partner.lookingForTopic || [];
            const rawSubjects = partner.subjects || partner.lookingForSubject || ["General Studies"];
            const baseScore = partner.knowledgeLevel?.score ?? 50;

            let allTopics: TopicAssessment[] = [];
            if (partner.knowledgeLevel?.topicBreakdown && Array.isArray(partner.knowledgeLevel.topicBreakdown) && partner.knowledgeLevel.topicBreakdown.length > 0) {
              allTopics = [...partner.knowledgeLevel.topicBreakdown].sort((a, b) => b.score - a.score);
            } else if (rawTopics.length > 0) {
              allTopics = rawTopics.map(topic => ({ topic, subject: rawSubjects[0], score: baseScore, summary: "" }));
            }
            const topTopicsForBars = allTopics.slice(0, 2);
            const remainingTopics = allTopics.slice(2);

            return (
              <motion.div key={partner.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -4 }} className="relative bg-white rounded-[22px] border border-[#00000010] p-6 shadow-sm hover:shadow-xl hover:border-[#4f55ee]/20 transition-all duration-500 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="relative flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={partner.initials} bg={partner.avatarBg} />
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">{partner.name}</h3>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5 truncate max-w-35">{rawSubjects.join(", ")}</p>
                    </div>
                  </div>
                  <MatchRadial value={partner.match} />
                </div>

                {/* Profile Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100"><Lightbulb className="w-3 h-3" /> {primaryLearningStyle}</span>
                  {personalityTraits.map((trait, i) => <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100"><BrainCircuit className="w-3 h-3" /> {trait}</span>)}
                </div>

                {/* Knowledge Levels */}
                <div className="flex-1 space-y-2">
                  {topTopicsForBars.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Strengths</p>
                      {topTopicsForBars.map((t, i) => <KnowledgeBar key={i} topic={t.topic} score={t.score} />)}
                    </div>
                  )}
                  {remainingTopics.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Other Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {remainingTopics.map((t, i) => (
                          <div key={`rem-${i}`} className="group relative">
                            <span className="px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 cursor-default inline-block">{t.topic}</span>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-20 shadow-lg">Score: {Math.round(t.score)}%<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* INTERACTIVE BUTTONS */}
                <div className="relative mt-5 pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 text-gray-500"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-sm font-medium">{partner.availability || "Flexible"}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => onOpenRequest(partner)} className="group border-2 bg-primary-linear w-full px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all rounded-xl">
                      <span className="group-hover:text-primary-linear flex gap-1 items-center justify-around font-semibold">Send Request <Send className="w-4 h-4 group-hover:text-primary-color" /> </span>
                    </button>
                    <button onClick={() => onOpenChat(partner.id)} className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-900 transition-colors shrink-0">
                      <MessageCircleMore className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SentTab({ requests, loading, onCancel }: { requests: RequestData[], loading: boolean, onCancel: (id: string) => void }) {
  if (loading) return <div className="py-10 text-center"><Loader2 className="size-10 text-violet-600 animate-spin mx-auto"/></div>;
  if (requests.length === 0) return (<div className="py-16 flex flex-col items-center justify-center text-gray-500 text-center"><Send className="w-10 h-10 text-gray-300 mb-3" /><p className="font-bold text-lg text-gray-800">No requests sent</p><p className="text-sm">When you reach out to study partners, they will appear here.</p></div>);
  return (
    <ListShell>
      {requests.map((r, i) => (
        <Row key={r.id} delay={i * 0.05}>
          <Avatar initials={r.initials} bg={r.avatarBg} />
          <div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 truncate">{r.name}</p><p className="text-sm text-gray-500 truncate">{r.subject}</p></div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium"><Clock className="w-3.5 h-3.5" /> {r.sentAgo}</div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${r.status === "Accepted" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>{r.status || "Pending"}</span>
          {(!r.status || r.status === "Pending") && (
            <button onClick={() => onCancel(r.id)} className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors">Cancel</button>
          )}
        </Row>
      ))}
    </ListShell>
  );
}

function ReceivedTab({ requests, loading, onRespond }: { requests: RequestData[], loading: boolean, onRespond: (id: string, action: 'accept' | 'decline') => void }) {
  if (loading) return <div className="py-10 text-center"><Loader2 className="size-10 text-violet-600 animate-spin mx-auto"/></div>;
  if (requests.length === 0) return (<div className="py-16 flex flex-col items-center justify-center text-gray-500 text-center"><Inbox className="w-10 h-10 text-gray-300 mb-3" /><p className="font-bold text-lg text-gray-800">Your inbox is clear</p><p className="text-sm">Study requests from other students will show up here.</p></div>);
  return (
    <ListShell>
      {requests.map((r, i) => (
        <Row key={r.id} delay={i * 0.05}>
          <Avatar initials={r.initials} bg={r.avatarBg} />
          <div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 truncate">{r.name}</p><p className="text-sm text-gray-500 truncate">{r.subject}</p></div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 font-medium"><Clock className="w-3.5 h-3.5" /> {r.sentAgo}</div>
          <div className="flex gap-2">
            <motion.button onClick={() => onRespond(r.id, 'accept')} whileTap={{ scale: 0.95 }} className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-linear-to-br from-[#4f55ee] to-[#9c2fdf] text-white shadow-[0_6px_16px_-6px_rgba(79,85,238,0.6)]"><Check className="w-4 h-4" /></motion.button>
            <button onClick={() => onRespond(r.id, 'decline')} className="w-9 h-9 flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </Row>
      ))}
    </ListShell>
  );
}

function MessagesTab({ messages, loading, onOpenChat }: { messages: MessageData[], loading: boolean, onOpenChat: (id: string)=>void }) {
  if (loading) return <div className="py-10 text-center"><Loader2 className="size-10 text-violet-600 animate-spin mx-auto"/></div>;
  if (messages.length === 0) return (<div className="py-16 flex flex-col items-center justify-center text-gray-500 text-center"><MessageCircleMore className="w-10 h-10 text-gray-300 mb-3" /><p className="font-bold text-lg text-gray-800">No messages yet</p><p className="text-sm">Start a conversation with a study partner to see it here.</p></div>);
  return (
    <ListShell>
      {messages.map((m, i) => (
        <Row key={m.id} delay={i * 0.05}>
          <Avatar initials={m.initials} bg={m.avatarBg} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><p className="font-semibold text-gray-900 truncate">{m.name}</p>{m.unread > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700">{m.unread}</span>}</div>
            <p className="text-sm text-gray-500 truncate">{m.preview}</p>
          </div>
          <span className="text-xs text-gray-400 font-medium shrink-0">{m.time}</span>
          {/* OPEN CHAT SLIDE-OVER */}
          <button onClick={() => onOpenChat(m.partnerId)} className="text-xs font-semibold text-violet-700 hover:text-violet-900 px-3 py-1.5 rounded-lg border border-violet-100 bg-violet-50 hover:bg-violet-100 transition-colors">Open</button>
        </Row>
      ))}
    </ListShell>
  );
}