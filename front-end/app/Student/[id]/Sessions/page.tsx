/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';
// import { useState, useMemo, useEffect } from "react";
// import { useParams } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { Search, Calendar, Clock, Video, Play, Sparkles, TrendingUp, CalendarDays,  ChevronRight, Bookmark,  Radio, Loader2, Plus } from "lucide-react";
// import Link from "next/link";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "@/lib/firebase";

// type SessionStatus = "upcoming" | "live" | "past";

// type Session = {
//   id: string;
//   title: string;
//   subject: string;
//   duration: string;
//   type: "Live" | "Recorded";
//   date: string;
//   time: string;
//   status: SessionStatus;
//   color: string;
//   ring: string;
//   avatars: string[];
//   host: string;
//   startsInMin?: number;
//   progress?: number;
// };

// const TABS = [
//   { key: "Upcoming", icon: CalendarDays },
//   { key: "Past Sessions", icon: Clock },
//   { key: "Saved", icon: Bookmark },
// ] as const;

// export default function SessionsPage() {
//   const params = useParams<{ id: string }>();
//   const studentId = params?.id;

//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("Upcoming");
//   const [query, setQuery] = useState("");
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     const fetchSessions = async () => {
//       try {
//         onAuthStateChanged(auth, async (user) => {
//           if (user && studentId) {
//             const token = await user.getIdToken();
//             const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sessions/student/${studentId}`, {
//               headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (res.ok) {
//               const data = await res.json();
//               setSessions(data);
//             }
//           }
//           setLoading(false);
//         });
//       } catch (err) {
//         console.error(err);
//         setLoading(false);
//       }
//     };
//     fetchSessions();
//   }, [studentId]);

//   const filtered = useMemo(() => {
//     const base = sessions.filter((s) =>
//       activeTab === "Upcoming"
//         ? s.status === "upcoming" || s.status === "live"
//         : activeTab === "Past Sessions"
//           ? s.status === "past"
//           : false,
//     );
//     if (!query.trim()) return base;
//     const q = query.toLowerCase();
//     return base.filter(
//       (s) =>
//         s.title.toLowerCase().includes(q) ||
//         s.subject.toLowerCase().includes(q) ||
//         s.host.toLowerCase().includes(q),
//     );
//   }, [activeTab, query, sessions]);

//   const upcomingCount = sessions.filter((s) => s.status === "upcoming" || s.status === "live").length;
//   const pastCount = sessions.filter((s) => s.status === "past").length;
//   const liveCount = sessions.filter((s) => s.status === "live").length;

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#f7f7fb]">
//         <Loader2 className="w-10 h-10 animate-spin text-[#1363CB]" />
//       </div>
//     );
//   }
  

//   return (
//     <div className="min-h-screen bg-[#f7f7fb]">
//       <div className="pointer-events-none fixed inset-0 overflow-hidden">
//         <div className="absolute -top-40 -left-32 w-130 h-130 rounded-full bg-[#1363CB]/10 blur-3xl" />
//         <div className="absolute top-40 -right-32 w-105 h-105 rounded-full bg-[#9C2FDF]/10 blur-3xl" />
//       </div>

//       <div className="relative max-w-6xl mx-auto px-4 md:px-6 space-y-8">
//       <button 
//             onClick={() => setIsModalOpen(true)}
//             className="flex items-center gap-2 bg-[#1363CB] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1054a8] transition-all shadow-md relative left-[80%]"
//           >
//             <Plus className="w-4 h-4" /> Create Session
//           </button>
//           <AnimatePresence>
//             {isModalOpen && <CreateSessionModal studentId={studentId!} onClose={() => setIsModalOpen(false)} onSuccess={() => window.location.reload()} />}
//         </AnimatePresence>
      
//         {/* HEADER */}
//         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
//           <div>
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-gray-200 text-xs font-semibold text-gray-600 mb-3">
//               <Sparkles className="w-3.5 h-3.5 text-[#1363CB]" /> Your study schedule
//             </div>
//             <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Sessions</h1>
//             <p className="text-sm md:text-base text-gray-500 mt-2 max-w-lg">
//               Join upcoming sessions, jump into live rooms, or revisit past recordings.
//             </p>
//           </div>

//           <div className="grid grid-cols-3 gap-3 md:gap-4 w-full md:w-auto">
//             <StatPill label="Upcoming" value={upcomingCount} icon={CalendarDays} accent="from-[#1363CB] to-[#4f55ee]" />
//             <StatPill label="Live now" value={liveCount} icon={Radio} accent="from-[#15c126] to-[#0ea5a4]" pulse={liveCount > 0} />
//             <StatPill label="Recorded" value={pastCount} icon={Play} accent="from-[#9C2FDF] to-[#c026d3]" />
//           </div>
//         </motion.div>

//         {/* FILTERS & SEARCH */}
//         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white/70 backdrop-blur p-2 rounded-2xl border border-gray-200 shadow-sm">
//           <div className="flex w-full md:w-auto gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100 relative">
//             {TABS.map((tab) => {
//               const Icon = tab.icon;
//               const active = activeTab === tab.key;
//               return (
//                 <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none ${active ? "text-[#1363CB]" : "text-gray-500 hover:text-gray-900"}`}>
//                   {active && <motion.span layoutId="tab-pill" className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
//                   <span className="relative flex items-center gap-2"><Icon className="w-4 h-4" />{tab.key}</span>
//                 </button>
//               );
//             })}
//           </div>

//           <div className="flex items-center gap-2 w-full md:w-auto">
//             <div className="relative flex-1 md:w-72">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sessions..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/20 outline-none text-sm transition-all" />
//             </div>
//           </div>
//         </motion.div>

//         {/* SESSION LIST */}
//         <div className="space-y-4">
//           <AnimatePresence mode="popLayout">
//             {filtered.length === 0 ? (
//               <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white/70 backdrop-blur border border-dashed border-gray-300 rounded-2xl p-12 text-center">
//                 <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4"><CalendarDays className="w-5 h-5 text-gray-400" /></div>
//                 <h3 className="text-base font-semibold text-gray-900">Nothing here yet</h3>
//                 <p className="text-sm text-gray-500 mt-1">Try a different filter or search term.</p>
//               </motion.div>
//             ) : (
//               filtered.map((session, idx) => (
//                 <SessionCard key={session.id} session={session} index={idx} studentId={studentId as string} />
//               ))
//             )}
//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatPill({ label, value, icon: Icon, accent, pulse }: any) {
//   return (
//     <div className="relative bg-white/70 backdrop-blur border border-gray-200 rounded-2xl p-3 md:px-4 md:py-3 flex items-center gap-3 shadow-sm">
//       <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${accent} text-white flex items-center justify-center shadow-md relative`}>
//         <Icon className="w-4 h-4" />
//         {pulse && <span className="absolute -top-0.5 -right-0.5 flex w-2.5 h-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#15c126] opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#15c126] ring-2 ring-white" /></span>}
//       </div>
//       <div className="leading-tight">
//         <div className="text-lg font-bold text-gray-900">{value}</div>
//         <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
//       </div>
//     </div>
//   );
// }

// function SessionCard({ session, index, studentId }: { session: Session; index: number; studentId: string }) {
//   const isLive = session.status === "live";
//   const isPast = session.status === "past";

//   return (
//     <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, delay: index * 0.05 }} whileHover={{ y: -2 }} className={`group relative bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all overflow-hidden`}>
//       <div className={`absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b ${session.color}`} />
//       <div className={`absolute -right-20 -top-20 w-56 h-56 rounded-full bg-linear-to-br ${session.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`} />

//       <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
//         <div className="flex items-start gap-4 flex-1 min-w-0">
//           <div className={`shrink-0 w-12 h-12 rounded-xl bg-linear-to-br ${session.color} text-white flex items-center justify-center shadow-md`}>
//             {isLive ? <Radio className="w-5 h-5" /> : isPast ? <Play className="w-5 h-5" /> : <Video className="w-5 h-5" />}
//           </div>

//           <div className="min-w-0 flex-1">
//             <div className="flex items-center gap-2 flex-wrap">
//               <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">{session.title}</h3>
//               {isLive && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#15c126]/10 text-[#0a7f1a] text-[11px] font-bold uppercase tracking-wider">Live</span>}
//             </div>

//             <div className="flex flex-wrap items-center gap-2 mt-2.5">
//               <Chip icon={Calendar} accent="text-[#1363CB]">{session.date}</Chip>
//               <Chip icon={Clock} accent="text-[#15c126]">{session.time}</Chip>
//               <Chip icon={TrendingUp} accent="text-[#9C2FDF]">{session.subject}</Chip>
//               <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">· {session.duration} · {session.type}</span>
//             </div>

//             {!isPast && !isLive && session.startsInMin !== undefined && (
//               <div className="mt-3 text-xs font-semibold text-gray-500">Starts in <span className="text-gray-900">{formatCountdown(session.startsInMin)}</span></div>
//             )}
//           </div>
//         </div>

//         <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t border-gray-100 md:border-t-0 pt-4 md:pt-0">
//           <div className="flex items-center gap-2">
//             <div className="flex -space-x-2">
//               {session.avatars.map((av, i) => (
//                 <div key={i} className={`w-9 h-9 rounded-full bg-linear-to-br ${session.color} text-white border-2 border-white flex items-center justify-center text-[11px] font-bold shadow-sm`}>{av}</div>
//               ))}
//             </div>
//           </div>

//           {/* DYNAMIC ROUTING TO THE SPECIFIC SESSION ROOM */}
          // <Link href={`/Student/${studentId}/Sessions/${session.id}`}>
          //   <button className={`group/btn relative bg-linear-to-r ${isPast ? "bg-gray-900 text-white" : session.color + " text-white"} px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2`}>
          //     {isLive ? <Radio className="w-4 h-4" /> : isPast ? <Play className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          //     {isLive ? "Join Live" : isPast ? "Watch" : "Join Room"}
          //     <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          //   </button>
          // </Link>
//         </div>
//       </div>
//     </motion.div>
//   );
// }

// function Chip({ icon: Icon, accent, children }: any) {
//   return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100"><Icon className={`w-3.5 h-3.5 ${accent}`} /> {children}</span>;
// }

// function formatCountdown(min: number) {
//   if (min < 60) return `${min} min`;
//   const h = Math.floor(min / 60);
//   const m = min % 60;
//   if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
//   const d = Math.floor(h / 24);
//   return `${d}d ${h % 24}h`;
// }

// // NEW COMPONENT: Create Session Modal
// function CreateSessionModal({ studentId, onClose, onSuccess }: { studentId: string, onClose: () => void, onSuccess: () => void }) {
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//       e.preventDefault();
//       setLoading(true);
//       const formData = new FormData(e.currentTarget);
      
//       try {
//           const token = await auth.currentUser?.getIdToken();
//           await fetch(`http://localhost:5000/api/sessions/create`, {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//               body: JSON.stringify({
//                   hostId: studentId,
//                   title: formData.get('title'),
//                   startTime: formData.get('date'),
//                   subject: formData.get('subject')
//               })
//           });
//           onSuccess();
//       } catch (err) { console.error(err); } finally { setLoading(false); }
//   };

//   return (
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
//           <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
//               <h2 className="text-xl font-bold mb-4">Schedule Session</h2>
//               <input name="title" placeholder="Session Title" className="w-full p-3 mb-3 border rounded-lg" required />
//               <input name="subject" placeholder="Subject" className="w-full p-3 mb-3 border rounded-lg" required />
//               <input name="date" type="datetime-local" className="w-full p-3 mb-4 border rounded-lg" required />
//               <div className="flex gap-3">
//                   <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100">Cancel</button>
//                   <button type="submit" className="flex-1 py-2 rounded-lg bg-[#1363CB] text-white font-bold">
//                       {loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Create"}
//                   </button>
//               </div>
//           </motion.form>
//       </motion.div>
//   );
// }



/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Clock, Video, Play, Sparkles, TrendingUp, CalendarDays,
  ChevronRight, Bookmark, Radio, Loader2, Plus, X, Users, BookOpen, Type,
  AlignLeft, Timer, Check, UserPlus, Trash2, Mail,
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type SessionStatus = "upcoming" | "live" | "past";

type Session = {
  id: string;
  title: string;
  subject: string;
  duration: string;
  type: "Live" | "Recorded";
  date: string;
  time: string;
  status: SessionStatus;
  color: string;
  ring: string;
  avatars: string[];
  host: string;
  startsInMin?: number;
  progress?: number;
};

type Friend = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

const TABS = [
  { key: "Upcoming", icon: CalendarDays },
  { key: "Past Sessions", icon: Clock },
  { key: "Saved", icon: Bookmark },
] as const;

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "English", "History", "Economics", "Other",
];

const DURATIONS = ["30 min", "45 min", "1 hour", "1.5 hours", "2 hours", "3 hours"];

export default function SessionsPage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("Upcoming");
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user && studentId) {
            const token = await user.getIdToken();
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_URL}/api/sessions/student/${studentId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
              const data = await res.json();
              setSessions(data);
            }
          }
          setLoading(false);
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchSessions();
  }, [studentId]);

  const filtered = useMemo(() => {
    const base = sessions.filter((s) =>
      activeTab === "Upcoming"
        ? s.status === "upcoming" || s.status === "live"
        : activeTab === "Past Sessions"
        ? s.status === "past"
        : false
    );
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.host.toLowerCase().includes(q)
    );
  }, [activeTab, query, sessions]);

  const upcomingCount = sessions.filter((s) => s.status === "upcoming" || s.status === "live").length;
  const pastCount = sessions.filter((s) => s.status === "past").length;
  const liveCount = sessions.filter((s) => s.status === "live").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="size-10 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* TOP BAR */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1363CB] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#1054a8] transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Session
          </button>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <CreateSessionModal
              studentId={studentId}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                setIsModalOpen(false);
                window.location.reload();
              }}
            />
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#1363CB] font-semibold mb-2">
              <Sparkles className="w-4 h-4" /> Your study schedule
            </div>
            <h1 className="text-4xl font-black text-gray-900">Sessions</h1>
            <p className="text-gray-500 mt-2 max-w-xl">
              Join upcoming sessions, jump into live rooms, or revisit past recordings.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <StatPill label="Upcoming" value={upcomingCount} icon={CalendarDays} accent="#1363CB" />
            <StatPill label="Past" value={pastCount} icon={Clock} accent="#6b7280" />
            <StatPill label="Live now" value={liveCount} icon={Radio} accent="#ef4444" pulse={liveCount > 0} />
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 flex-1 md:flex-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none ${
                    active ? "text-[#1363CB]" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-tab-bg"
                      className="absolute inset-0 bg-[#1363CB]/10 rounded-lg"
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.key}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/20 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* SESSION LIST */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold">Nothing here yet</p>
                <p className="text-gray-400 text-sm">Try a different filter or search term.</p>
              </div>
            ) : (
              filtered.map((session, idx) => (
                <SessionCard key={session.id} session={session} index={idx} studentId={studentId} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, icon: Icon, accent, pulse }: any) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
      <div className="relative">
        <Icon className="w-5 h-5" style={{ color: accent }} />
        {pulse && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: accent }}
          />
        )}
      </div>
      <div>
        <div className="text-lg font-black leading-none text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function SessionCard({ session, index, studentId }: { session: Session; index: number; studentId: string }) {
  const isLive = session.status === "live";
  const isPast = session.status === "past";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: session.color }}
        >
          {isLive ? <Radio className="w-5 h-5" /> : isPast ? <Play className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">{session.title}</h3>
            {isLive && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <Chip icon={Calendar}>{session.date}</Chip>
            <Chip icon={Clock}>{session.time}</Chip>
            <Chip icon={BookOpen}>{session.subject}</Chip>
            <span className="text-gray-400">· {session.duration} · {session.type}</span>
          </div>

          {!isPast && !isLive && session.startsInMin !== undefined && (
            <p className="text-xs text-[#1363CB] font-semibold mt-2">
              Starts in {formatCountdown(session.startsInMin)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {session.avatars.map((av, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-linear-to-br from-[#1363CB] to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
              >
                {av}
              </div>
            ))}
          </div>

          <Link href={`/Student/${studentId}/Sessions/${session.id}`}>
            <button className={`group/btn relative bg-linear-to-r ${isPast ? "bg-gray-900 text-white" : session.color + " text-white"} px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2`}>
              {isLive ? <Radio className="w-4 h-4" /> : isPast ? <Play className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              {isLive ? "Join Live" : isPast ? "Watch" : "Join Room"}
              <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function Chip({ icon: Icon, children }: any) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">
      <Icon className="w-3 h-3" />
      {children}
    </span>
  );
}

function formatCountdown(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/* ------------------------------------------------------------------ */
/*                     CREATE SESSION MODAL (rich)                    */
/* ------------------------------------------------------------------ */

function CreateSessionModal({
  studentId,
  onClose,
  onSuccess,
}: {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(DURATIONS[2]);
  const [type, setType] = useState<"Live" | "Recorded">("Live");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  // friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [extraEmails, setExtraEmails] = useState<string[]>([]);

  // fetch friends
  useEffect(() => {
    const load = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_URL}/api/friends/${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setFriends(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFriendsLoading(false);
      }
    };
    load();
  }, [studentId]);

  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends;
    const q = friendSearch.toLowerCase();
    return friends.filter(
      (f) => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
    );
  }, [friends, friendSearch]);

  const toggleFriend = (id: string) =>
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const addEmail = () => {
    const v = inviteEmail.trim().toLowerCase();
    if (!v) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(v)) {
      setError("Enter a valid email address");
      return;
    }
    if (extraEmails.includes(v)) return;
    setExtraEmails((prev) => [...prev, v]);
    setInviteEmail("");
    setError(null);
  };

  const canProceed = title.trim() && date && time;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      onAuthStateChanged(auth, async(user) => {
        if(user){
          const token = await user.getIdToken();
          const startTime = new Date(`${date}T${time}`).toISOString();
          const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sessions/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              hostId: studentId,
              title: title.trim(),
              subject,
              description: description.trim(),
              startTime,
              duration,
              type,
              visibility,
              invitedFriendIds: selectedFriends,
              invitedEmails: extraEmails,
            }),
          });
    
          if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Failed to create session");
          }
          onSuccess();
        }
      })
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="relative bg-linear-to-br from-[#1363CB] via-[#1a75e0] to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Schedule a Session</h2>
              <p className="text-white/80 text-sm">
                {step === 1 ? "Set the basics" : "Invite people & finish"}
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-5">
            {[1, 2].map((n) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= n ? "bg-white text-[#1363CB]" : "bg-white/20 text-white/70"
                  }`}
                >
                  {step > n ? <Check className="w-4 h-4" /> : n}
                </div>
                <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: step > n ? "100%" : step === n ? "50%" : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Title */}
                <Field icon={Type} label="Title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Calculus mid-term prep"
                    className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-gray-400"
                  />
                </Field>

                {/* Subject */}
                <Field icon={BookOpen} label="Subject">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-medium"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                {/* Description */}
                <Field icon={AlignLeft} label="Description (optional)">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What will you cover?"
                    className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-gray-400"
                  />
                </Field>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={Calendar} label="Date">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm font-medium"
                    />
                  </Field>
                  <Field icon={Clock} label="Time">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-transparent outline-none text-sm font-medium"
                    />
                  </Field>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Timer className="w-3.5 h-3.5" /> Duration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          duration === d
                            ? "bg-[#1363CB] text-white border-[#1363CB]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#1363CB]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Friends */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5" /> Invite friends
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      placeholder="Search friends..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/20 outline-none text-sm"
                    />
                  </div>

                  <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {friendsLoading ? (
                      <div className="p-6 flex justify-center">
                        <Loader2 className="size-10 text-violet-600 animate-spin" />
                      </div>
                    ) : filteredFriends.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        No friends found
                      </div>
                    ) : (
                      filteredFriends.map((f) => {
                        const selected = selectedFriends.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() => toggleFriend(f.id)}
                            className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                              selected ? "bg-[#1363CB]/5" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#1363CB] to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                              {f.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{f.name}</div>
                              <div className="text-xs text-gray-500 truncate">{f.email}</div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                selected
                                  ? "bg-[#1363CB] border-[#1363CB]"
                                  : "border-gray-300"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {selectedFriends.length > 0 && (
                    <p className="text-xs text-[#1363CB] font-semibold mt-2">
                      {selectedFriends.length} friend{selectedFriends.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                {/* Invite by email */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Mail className="w-3.5 h-3.5" /> Invite by email
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                      type="email"
                      placeholder="friend@example.com"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1363CB]/20 outline-none text-sm"
                    />
                    <button
                      onClick={addEmail}
                      className="px-4 py-2.5 rounded-xl bg-[#1363CB]/10 text-[#1363CB] font-semibold text-sm hover:bg-[#1363CB]/20 flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {extraEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {extraEmails.map((em) => (
                        <span
                          key={em}
                          className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 rounded-full pl-3 pr-1 py-1 text-xs font-medium"
                        >
                          {em}
                          <button
                            onClick={() => setExtraEmails((p) => p.filter((x) => x !== em))}
                            className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-linear-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Summary
                  </div>
                  <div className="space-y-2 text-sm">
                    <SummaryRow label="Title" value={title || "—"} />
                    <SummaryRow label="Subject" value={subject} />
                    <SummaryRow
                      label="When"
                      value={date && time ? `${date} at ${time}` : "—"}
                    />
                    <SummaryRow label="Duration" value={duration} />
                    <SummaryRow label="Type" value={type} />
                    <SummaryRow
                      label="Invitees"
                      value={`${selectedFriends.length + extraEmails.length} people`}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step === 1 ? (
            <button
              disabled={!canProceed}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1363CB] text-white text-sm font-bold hover:bg-[#1054a8] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1363CB] text-white text-sm font-bold hover:bg-[#1054a8] disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 className="size-10 animate-spin text-violet-600" /> : <Check className="w-4 h-4" />}
              {loading ? "Creating..." : "Create Session"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ icon: Icon, label, children }: any) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-[#1363CB]/20 focus-within:border-[#1363CB] transition-all">
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide px-3 pt-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="px-3 pb-2.5 pt-1">{children}</div>
    </div>
  );
}

function TypeOption({ active, onClick, icon: Icon, title, desc, accent }: any) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-xl border-2 transition-all ${
        active ? "border-[#1363CB] bg-[#1363CB]/5" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <span className="font-bold text-sm text-gray-900">{title}</span>
      </div>
      <p className="text-xs text-gray-500">{desc}</p>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right truncate">{value}</span>
    </div>
  );
}
