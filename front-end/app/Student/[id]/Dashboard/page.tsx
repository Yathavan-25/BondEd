/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { DotsRing } from "@/components/ui/dots-ring";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Flame, Clock, Users, Target, CheckCircle2,
  ChevronRight, UserPlus, CalendarIcon, Search
} from "lucide-react";

// ── animated counter hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === undefined) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setValue(parseFloat((target * ease).toFixed(1)));
      if (t < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [start, target, duration]);
  return value;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const w = 120, h = 28, pad = 2;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
      const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}

function DonutChart({ pct, color = "#159E22" }: { pct: number; color?: string }) {
  const [animPct, setAnimPct] = useState(0);
  const circ = 2 * Math.PI * 30;
  useEffect(() => {
    const timeout = setTimeout(() => {
      let cur = 0;
      const step = () => {
        cur = Math.min(cur + 2, pct);
        setAnimPct(cur);
        if (cur < pct) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 400);
    return () => clearTimeout(timeout);
  }, [pct]);
  const offset = circ - (animPct / 100) * circ;
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      <circle cx="40" cy="40" r="30" fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }} />
      <text x="40" y="38" textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="500" fill="currentColor" className="text-gray-900">{animPct}%</text>
      <text x="40" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fill="#9ca3af">complete</text>
    </svg>
  );
}

function GoalItem({ title, progress, color, delay = 0 }: any) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(progress), delay);
    return () => clearTimeout(t);
  }, [progress, delay]);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs font-medium mb-2">
        <span className="text-gray-800 truncate mr-2">{title}</span>
        <span className="text-gray-400 shrink-0">{progress}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color, transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = params?.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const token = await user.getIdToken();
            const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
            const res = await fetch(`${baseUrl}/api/dashboard/${studentId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const json = await res.json();
              setData(json);
              setTimeout(() => setStarted(true), 100);
            }
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        setLoading(false);
      }
    };
    if (studentId) fetchDashboard();
  }, [studentId]);

  const streak = useCountUp(data?.stats?.streak || 0, 1000, started);
  const hours = useCountUp(data?.stats?.hours || 0, 1000, started);
  const partners = useCountUp(data?.stats?.partners || 0, 1000, started);
  const score = useCountUp(data?.stats?.score || 0, 1000, started);

  const formatStudyTime = (val: number) => {
    if (!val || val <= 0) return "0 mins";
    const totalMins = Math.round(val * 60);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0 && mins > 0) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'min' : 'mins'}`;
    if (hrs > 0) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
  };

  const averageGoalProgress = data?.goals?.length > 0
    ? Math.round(data.goals.reduce((acc: any, goal: any) => acc + goal.progress, 0) / data.goals.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <DotsRing className="text-[#9C2FDF] mb-4 w-8 h-8" />
        <p className="text-gray-500 font-medium text-sm">Loading Dashboard...</p>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500 font-bold">Failed to load data.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-7 pb-12 pt-2">

      {/* ── header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight capitalize">
            Welcome back, {data.user.name}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {data.user.sessionsThisWeek} sessions this week · {data.user.pendingRequests} pending requests
          </p>
        </div>
        <button
          onClick={() => router.push(`/Student/${studentId}/FindPartners`)}
          className="w-full sm:w-auto bg-[#1363CB] hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-[14px] font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Find a partner
        </button>
      </div>

      {/* ── stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Study streak" value={`${Math.round(streak)} ${Math.round(streak) === 1 ? "day" : "days"}`} sub={data?.stats?.streak > 0 ? "🔥 Keep it up!" : "Log in daily to build your streak!"} subColor={data?.stats?.streak > 0 ? "text-[#1363CB]" : "text-gray-400"} accentColor="#1363CB" iconBg="bg-blue-50" iconColor="text-[#1363CB]" icon={Flame} sparkData={data?.stats?.streak > 0 ? [1, 2, 2, 3, 3, streak, streak] : []} sparkColor="#1363CB" />
        <StatCard title="Hours this week" value={formatStudyTime(hours)} sub={data.stats.hours > 0 ? "Studied so far" : "Ready to study?"} subColor={data.stats.hours > 0 ? "text-[#159E22]" : "text-gray-400"} accentColor="#159E22" iconBg="bg-green-50" iconColor="text-[#159E22]" icon={Clock} sparkData={data.stats.hours > 0 ? [9, 11, 10, 12, 13, 14, 14.5] : []} sparkColor="#159E22" />
        <StatCard title="Active partners" value={`${Math.round(partners)}`} sub="Past collaborations" subColor="text-[#1492ab]" accentColor="#1492ab" iconBg="bg-cyan-50" iconColor="text-[#1492ab]" icon={Users} sparkData={data.stats.partners > 0 ? [3, 4, 4, 5, 5, 6, 7] : []} sparkColor="#1492ab" />
        <StatCard title="Avg session score" value={`${Math.round(score)}%`} sub="Current Knowledge Level" subColor="text-[#5114ab]" accentColor="#5114ab" iconBg="bg-purple-50" iconColor="text-[#5114ab]" icon={Target} sparkData={data.stats.score > 0 ? [80, 83, 85, 88, 87, 90, 92] : []} sparkColor="#5114ab" />
      </div>

      {/* ── main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* sessions */}
        <div className="lg:col-span-2 bg-white rounded-[22px] border border-black/[0.07] p-5 md:p-6 flex flex-col min-h-75">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="text-[#1363CB] w-4 h-4" /> Upcoming sessions
            </h2>
            {data.sessions.length > 0 && (
              <button
                onClick={() => router.push(`/Student/${studentId}/Sessions`)}
                className="text-xs font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3 flex-1 flex flex-col">
            {data.sessions.length > 0 ? (
              data.sessions.map((session: any) => (
                <SessionCard
                  key={session.id}
                  dotColor="#1363CB"
                  title={session.title}
                  avatars={session.avatars}
                  time={session.time}
                  badge="Scheduled"
                  badgeStyle="bg-blue-50 text-[#1363CB]"
                />
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">No upcoming sessions</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-50 text-center">You have no study sessions scheduled. Take a break or find a partner.</p>
              </div>
            )}
          </div>
        </div>

        {/* goals */}
        <div className="bg-white rounded-[22px] border border-black/[0.07] p-5 md:p-6 flex flex-col min-h-75">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="text-[#1363CB] w-4 h-4" /> Weekly goals
            </h2>
          </div>

          {data.goals.length > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <DonutChart pct={averageGoalProgress} color="#159E22" />
              </div>
              <div className="flex-1">
                {data.goals.map((goal: any, index: number) => (
                  <GoalItem key={goal.id} title={goal.title} progress={goal.progress} color={goal.color || "#1363CB"} delay={300 + (index * 200)} />
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl py-2.5 px-3 text-xs font-semibold text-[#159E22]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {averageGoalProgress}% of weekly goals complete
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">No goals set</h3>
              <p className="text-xs text-gray-500 mt-1 text-center">Set some goals to track your weekly progress.</p>
            </div>
          )}
        </div>

        {/* partners */}
        <div className="lg:col-span-3 bg-white rounded-[22px] border border-black/[0.07] p-5 md:p-6 min-h-50">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="text-[#1363CB] w-4 h-4" /> Suggested partners
            </h2>
            {data.suggestedPartners.length > 0 && (
              <button
                onClick={() => router.push(`/Student/${studentId}/FindPartners`)}
                className="text-xs font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Browse all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {data.suggestedPartners.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.suggestedPartners.map((partner: any) => (
                <PartnerCard key={partner.id} initials={partner.initials} name={partner.name} subject={partner.subject} match={partner.match} gradient={partner.gradient} avatarUrl={partner.avatarUrl} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">No matches found</h3>
              <p className="text-xs text-gray-500 mt-1">We couldn&apos;t find any partner recommendations at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------
// SUB COMPONENTS
// ----------------

function StatCard({ title, value, sub, subColor, accentColor, iconBg, iconColor, icon: Icon, sparkData, sparkColor }: any) {
  return (
    <div className="bg-white rounded-[22px] border border-black/[0.07] p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-200 relative overflow-hidden h-40">
      <div className="absolute bottom-0 left-0 right-0 h-0.75 rounded-b-[22px]" style={{ backgroundColor: accentColor }} />
      <div className="flex justify-between items-start">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-[10px] ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-[26px] font-semibold text-gray-900 tracking-tight leading-none mt-3">{value}</p>
        <p className={`text-[11px] font-semibold tracking-wide mt-1.5 ${subColor}`}>{sub}</p>
      </div>
      <div className="mt-3 h-8">
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
    </div>
  );
}

function SessionCard({ dotColor, title, avatars, time, badge, badgeStyle }: any) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-[14px] border border-gray-100 hover:bg-gray-50 hover:translate-x-0.5 transition-all duration-150 group">
      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
      </div>
      <div className="flex flex-row-reverse shrink-0">
        {avatars && [...avatars].reverse().map((av: string, i: number) => (
          <div key={i} className="w-7 h-7 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[#1363CB] text-[9px] font-bold -ml-1.5 first:ml-0">
            {av}
          </div>
        ))}
      </div>
      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeStyle}`}>{badge}</span>
    </div>
  );
}

function PartnerCard({ initials, name, subject, match, gradient, avatarUrl }: any) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-[16px] border border-gray-100 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-[12px] object-cover shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded-[12px] bg-linear-to-br ${gradient} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
            {initials}
          </div>
        )}
        <div className="truncate">
          <p className="text-sm font-semibold text-gray-900 truncate capitalize">{name}</p>
          <p className="text-xs text-gray-400 truncate">{subject}</p>
        </div>
      </div>
      <span className="bg-green-50 text-[#159E22] text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2">{match}</span>
    </div>
  );
}