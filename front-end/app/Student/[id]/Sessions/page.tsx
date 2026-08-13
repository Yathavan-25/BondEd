/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useMemo, useEffect } from "react";
import { DotsRing } from "@/components/ui/dots-ring";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, Clock, Video, Play, Sparkles, CalendarDays,
  ChevronRight, Bookmark, Radio, Plus, X, Users, BookOpen, Type,
  AlignLeft, Timer, Check, UserPlus, Mail, Mic
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

type SessionStatus = "upcoming" | "live" | "past";

type Session = {
  id: string;
  title: string;
  subject: string;
  duration: string;
  type: string;
  date: string;
  time: string;
  status: SessionStatus;
  color: string;
  ring: string;
  avatars: string[];
  participantDetails?: { initials: string; avatarUrl: string | null }[];
  host: string;
  startsInMin?: number;
  progress?: number;
  isAISession?: boolean;
  recordingUrl?: string | null;
};

type Friend = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string | null;
};

const TABS = [
  { key: "Upcoming", icon: CalendarDays },
  { key: "Past Sessions", icon: Clock },
  { key: "Saved", icon: Bookmark },
] as const;

const DURATIONS = ["30 min", "45 min", "1 hour", "1.5 hours", "2 hours", "3 hours"];

export default function SessionsPage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id as string;

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
        <DotsRing className="w-16 h-16 text-[#1363CB]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

  const [loadingRec, setLoadingRec] = useState(false);

  const handleWatchCollab = async () => {
      setLoadingRec(true);
      try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sessions/${session.id}/recording`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.url) {
              window.open(data.url, '_blank');
          } else {
              toast.error(data.error || "Recording not found.");
          }
      } catch {
          toast.error("Network error fetching recording.");
      } finally {
          setLoadingRec(false);
      }
  };

  const renderActionButton = () => {
    if (isLive) {
       return (
        <Link href={`/Student/${studentId}/Sessions/${session.id}`}>
          <button className={`group/btn relative bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2`}>
            <Radio className="w-4 h-4 animate-pulse" />
            Join Live
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </Link>
       );
    }
    
    if (!isPast && !isLive) {
      return (
        <Link href={`/Student/${studentId}/Sessions/${session.id}`}>
          <button className={`group/btn relative bg-gradient-to-r from-[#1363CB] to-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2`}>
            <Video className="w-4 h-4" />
            Enter Room
            <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </Link>
      )
    }

    if (isPast) {
      if (session.isAISession) {
        return (
          <Link href={`/Student/${studentId}/Summary`}>
            <button className={`group/btn relative bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2`}>
              <Play className="w-4 h-4" />
              View Summary
              <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
            </button>
          </Link>
        )
      } else {
        return (
           <button 
             onClick={handleWatchCollab}
             disabled={loadingRec}
             className={`group/btn relative bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait`}>
            {loadingRec ? <DotsRing className=" w-8 h-8"  /> : <Video className="w-4 h-4" />}
            {loadingRec ? "Loading..." : "Watch Recording"}
            {!loadingRec && <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />}
          </button>
        )
      }
    }
  };

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
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md bg-gradient-to-br ${session.color}`}
        >
          {session.isAISession ? <Mic className="w-5 h-5"/> : isLive ? <Radio className="w-5 h-5" /> : isPast ? <Play className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">{session.title}</h3>
            {isLive && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
            {session.isAISession && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                AI Partner
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <Chip icon={Calendar}>{session.date}</Chip>
            <Chip icon={Clock}>{session.time}</Chip>
            <Chip icon={BookOpen}>{session.subject}</Chip>
            <span className="text-gray-400">· {session.duration}</span>
          </div>

          {!isPast && !isLive && session.startsInMin !== undefined && (
            <p className="text-xs text-[#1363CB] font-semibold mt-2">
              Starts in {formatCountdown(session.startsInMin)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex -space-x-2">
            {session.participantDetails && session.participantDetails.length > 0 ? (
              session.participantDetails.map((pd: any, i: number) => (
                pd.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={i} src={pd.avatarUrl} alt={pd.initials} className="w-8 h-8 rounded-full border-2 border-white object-cover -ml-2 first:ml-0" />
                ) : (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${session.color} border-2 border-white flex items-center justify-center text-white text-xs font-bold -ml-2 first:ml-0`}
                  >
                    {pd.initials}
                  </div>
                )
              ))
            ) : (
              session.avatars.map((av: string, i: number) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${session.color} border-2 border-white flex items-center justify-center text-white text-xs font-bold -ml-2 first:ml-0`}
                >
                  {av}
                </div>
              ))
            )}
          </div>
          {renderActionButton()}
        </div>
      </div>
    </motion.div>
  );
}

function Chip({ icon: Icon, children }: any) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">
      <Icon className="w-3 h-3 text-[#1363CB]" />
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
/* CREATE SESSION MODAL                                               */
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
  const [subject, setSubject] = useState(""); 
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(DURATIONS[2]);
  const [type] = useState<"Live" | "Recorded">("Live");
  const [visibility] = useState<"private" | "public">("private");

  // dynamic topics state
  const [userTopics, setUserTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  // friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [extraEmails, setExtraEmails] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch User's Topics
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/profile/${studentId}`, { headers });
        if (profileRes.ok) {
            const data = await profileRes.json();
            const profile = data.profile || data;
            const fetchedTopics = profile.topics || [];
            setUserTopics(fetchedTopics);
            if (fetchedTopics.length > 0) setSubject(fetchedTopics[0]);
        }

        // Fetch Accepted Friends
        const friendsRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/requests/friends/${studentId}`, { headers });
        if (friendsRes.ok) {
          const data = await friendsRes.json();
          setFriends(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTopicsLoading(false);
        setFriendsLoading(false);
      }
    };
    loadData();
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

  const canProceed = title.trim() && date && time && subject;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      onAuthStateChanged(auth, async(user) => {
        if(user){
          const token = await user.getIdToken();
          const startTime = new Date(`${date}T${time}`).toISOString();
          
          const payload = {
              hostId: studentId,
              participantIds: selectedFriends,
              title: title.trim(),
              subject,
              description: description.trim(),
              startTime,
              duration,
              type,
              visibility,
              invitedEmails: extraEmails,
          };

          const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sessions/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
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
        <div className="relative bg-gradient-to-br from-[#1363CB] via-[#1a75e0] to-purple-600 p-6 text-white">
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
                <Field icon={Type} label="Title">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Calculus mid-term prep"
                    className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-gray-400"
                  />
                </Field>

                <Field icon={BookOpen} label="Topic">
                  {topicsLoading ? (
                      <div className="text-sm text-gray-500 py-1">Loading your topics...</div>
                  ) : userTopics.length === 0 ? (
                      <input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Type a topic (e.g., Biology)"
                          className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-gray-400"
                      />
                  ) : (
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm font-medium"
                      >
                        {userTopics.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                  )}
                </Field>

                <Field icon={AlignLeft} label="Description (optional)">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What will you cover?"
                    className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-gray-400"
                  />
                </Field>

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
                        <DotsRing className="text-violet-600 w-8 h-8"  />
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
                            {f.avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={f.avatarUrl} alt={f.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1363CB] to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {f.avatar || f.name.charAt(0).toUpperCase()}
                              </div>
                            )}
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

                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-4 mt-6">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Summary
                  </div>
                  <div className="space-y-2 text-sm">
                    <SummaryRow label="Title" value={title || "—"} />
                    <SummaryRow label="Topic" value={subject} />
                    <SummaryRow
                      label="When"
                      value={date && time ? `${date} at ${time}` : "—"}
                    />
                    <SummaryRow label="Duration" value={duration} />
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
              {loading ? <DotsRing className="text-white w-8 h-8"  /> : <Check className="w-4 h-4" />}
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right truncate">{value}</span>
    </div>
  );
}