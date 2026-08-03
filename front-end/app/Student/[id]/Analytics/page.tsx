/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { motion } from "framer-motion";
import {
  Download, Flame, Clock, Users, Target, ChevronDown, MoreHorizontal,
  Zap, Mic, Video, BookOpen, TrendingUp, Sparkles, Loader2
} from "lucide-react";

// ---------- motion helpers ----------
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [creditFilter, setCreditFilter] = useState<"Day" | "Week" | "Month">("Week");
  const [selectedDay, setSelectedDay] = useState("");

  const params = useParams();
  // FIX: Properly extract 'id' from Next.js dynamic routing
  const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      try {
        setLoading(true);
        const token = await getAuth().currentUser?.getIdToken();
        const res = await fetch(`http://localhost:5000/api/summary/analytics/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const fetched = await res.json();
            setData(fetched);
            // Default select the active day from chart data
            const activeDay = fetched.chartData.find((d: any) => d.active)?.day || fetched.chartData[0]?.day;
            setSelectedDay(activeDay);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
            <Loader2 className="size-10 animate-spin mb-4 text-violet-600"/> 
            <p className="font-semibold text-lg">Loading Analytics...</p>
        </div>
      )
  }
  
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data. Please try again.</div>;

  const selectedValue = data.chartData.find((d: any) => d.day === selectedDay)?.value ?? "—";
  const voicePct = (data.creditsData.voice.used[creditFilter] / data.creditsData.voice.total) * 100;
  const collabPct = (data.creditsData.collab.used[creditFilter] / data.creditsData.collab.total) * 100;

  // Icon mapping for dynamic backend stats
  const ICONS = { Clock, Flame, Users, Target };
  const getIcon = (title: string) => {
    if (title.toLowerCase().includes("hour")) return ICONS.Clock;
    if (title.toLowerCase().includes("session")) return ICONS.Target;
    if (title.toLowerCase().includes("avg")) return ICONS.Flame;
    return ICONS.Users;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 md:px-8 pb-16">
        
        {/* HEADER */}
        <motion.header
          initial="hidden" animate="show" variants={fadeUp}
          className="mb-10 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Current Activity
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Analytics</h1>
            <p className="mt-2 max-w-xl text-[15px] text-gray-500">
              How you&apos;re studying, growing, and showing up this month.
            </p>
          </div>

          <motion.button
            whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_12px_28px_-12px_rgba(0,0,0,0.5)]"
          >
            <Download className="h-4 w-4" />
            Download Report
          </motion.button>
        </motion.header>

        {/* STATS ROW */}
        <motion.section
          variants={stagger} initial="hidden" animate="show"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {data.stats.map((s: any) => (
            <StatCard key={s.title} {...s} icon={getIcon(s.title)} />
          ))}
        </motion.section>

        {/* CHART */}
        <motion.section
          variants={fadeUp} initial="hidden" animate="show"
          className="mb-8 rounded-3xl border border-black/5 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-20px_rgba(15,23,42,0.15)]"
        >
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-gray-700" /> Study Hours
              </h2>
              <p className="mt-1 text-sm text-gray-500">Daily breakdown of your focus time</p>
            </div>

            <div className="relative">
              <select
                value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-black/10 bg-white py-2 pl-4 pr-9 text-sm font-medium text-gray-700 outline-none transition-colors hover:bg-gray-50"
              >
                <option>This Week</option><option>Last Week</option><option>This Month</option><option>Last Month</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex h-64 items-stretch justify-between gap-3 sm:gap-6">
            {data.chartData.map((b: any, i: number) => (
              <ChartBar
                key={b.day} {...b} delay={i * 0.06}
                selected={selectedDay === b.day}
                onSelect={() => setSelectedDay(b.day)}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4 text-sm">
            <span className="text-gray-500">
              Selected: <span className="font-semibold text-gray-900">{selectedDay}</span>
            </span>
            <span className="text-gray-500">
              Focus time: <span className="font-semibold text-gray-900">{selectedValue}</span>
            </span>
          </div>
        </motion.section>

        {/* CREDITS + SUBJECTS */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Credits */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-3xl border border-black/5 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-20px_rgba(15,23,42,0.15)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Zap className="h-5 w-5 text-amber-500" /> Credits Usage
              </h3>

              <div className="relative flex rounded-xl bg-gray-100 p-1">
                {(["Day", "Week", "Month"] as const).map((f) => (
                  <button
                    key={f} onClick={() => setCreditFilter(f)}
                    className={`relative z-10 px-4 py-1.5 text-sm font-medium transition-colors ${creditFilter === f ? "text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {creditFilter === f && (
                      <motion.span layoutId="credit-pill" className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <UsageBar
                icon={<Mic className="h-4 w-4 text-indigo-600" />} iconBg="bg-indigo-50" label="Voice Assistant"
                used={data.creditsData.voice.used[creditFilter]} total={data.creditsData.voice.total} percent={voicePct} barClass="bg-gradient-to-r from-indigo-500 to-purple-500"
              />
              <UsageBar
                icon={<Video className="h-4 w-4 text-emerald-600" />} iconBg="bg-emerald-50" label="Live Collab Rooms"
                used={data.creditsData.collab.used[creditFilter]} total={data.creditsData.collab.total} percent={collabPct} barClass="bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
          </motion.div>

          {/* Subjects */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-3xl border border-black/5 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-20px_rgba(15,23,42,0.15)]">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BookOpen className="h-5 w-5 text-gray-700" /> Time by Subject
            </h3>

            <div className="space-y-5">
              {data.timeBySubject.map((item: any, i: number) => (
                <div key={item.subject} className="group cursor-pointer">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="font-medium text-gray-800 transition-colors group-hover:text-gray-950">{item.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">{item.percent}%</span>
                      <span className="font-semibold text-gray-900">{item.hours}</span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${item.color} transition-all group-hover:brightness-110`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* PARTNERS TABLE */}
        <motion.section variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-20px_rgba(15,23,42,0.15)]">
          <div className="flex items-center justify-between border-b border-black/5 px-7 py-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5 text-gray-700" /> Top Study Partners
            </h3>
            <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-7 py-3.5">Partner</th>
                  <th className="px-4 py-3.5">Top Subject</th>
                  <th className="px-4 py-3.5">Sessions</th>
                  <th className="px-4 py-3.5">Highest Collab</th>
                  <th className="px-4 py-3.5">Match</th>
                  <th className="px-7 py-3.5 text-right">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {data.topPartners.map((p: any, i: number) => (
                  <motion.tr
                    key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                    className="border-t border-black/5 transition-colors hover:bg-gray-50/60"
                  >
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white shadow-sm ${p.bg}`}>
                          {p.initials}
                        </div>
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{p.subject}</td>
                    <td className="px-4 py-4 text-gray-600">{p.sessions}</td>
                    <td className="px-4 py-4 text-gray-600">{p.topHours}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        {p.match}
                      </span>
                    </td>
                    <td className="px-7 py-4 text-right font-semibold text-gray-900">{p.hours}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

// ---------- subcomponents ----------
function StatCard({ title, value, subtitle, subColor, icon: Icon, stroke, trend }: any) {
  const W = 220; const H = 56;
  const min = Math.min(...trend); const max = Math.max(...trend);
  const range = max - min || 1; const step = W / (trend.length - 1);
  
  const points = trend.map((v: number, i: number) => {
    const x = i * step;
    const y = H - ((v - min) / range) * (H - 6) - 3;
    return [x, y] as const;
  });
  
  const line = points.map(([x, y]: any, i: number) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const gradId = `spark-${title.replace(/\s+/g, "-")}`;

  return (
    <motion.div
      variants={fadeUp} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white pt-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.28)]"
    >
      <div className="px-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5" style={{ background: `${stroke}14`, color: stroke }}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
        </div>
        <p className={`mt-1 text-xs font-medium ${subColor}`}>{subtitle}</p>
      </div>

      <div className="relative mt-3 h-14 w-full">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={area} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
          <motion.path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }} />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-0.5 opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${stroke}, transparent)` }} />
      </div>
    </motion.div>
  );
}

// ---------- subcomponents ----------
function ChartBar({ day, height, value, active = false, selected = false, delay = 0, onSelect }: any) {
  const highlight = selected || active;
  return (
    <button type="button" onClick={onSelect} className="group flex h-full flex-1 cursor-pointer flex-col items-center gap-3 outline-none">
      <div className="relative flex w-full flex-1 items-end justify-center">
        <div className={`pointer-events-none absolute -top-8 rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {value}
        </div>
        <motion.div
          initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }} whileHover={{ scaleY: 1.03 }} style={{ transformOrigin: "bottom" }}
          // FIX: Corrected tailwind gradient syntax!
          className={`w-full max-w-11 rounded-t-xl transition-colors ${highlight ? "bg-linear-to-t from-[#1363CB] to-gray-700 shadow-[0_6px_20px_-8px_rgba(15,23,42,0.5)]" : "bg-linear-to-t from-[#1363CB] to-gray-100 group-hover:from-[#526186] group-hover:to-gray-200"}`}
        />
      </div>
      <span className={`text-xs font-medium ${highlight ? "text-gray-900" : "text-gray-500"}`}>{day}</span>
    </button>
  );
}

function UsageBar({ icon, iconBg, label, used, total, percent, barClass }: any) {
  // Prevent NaN if total is 0
  const safePercent = total > 0 ? percent : 0;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
          <span className="text-sm font-medium text-gray-800">{label}</span>
        </div>
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{used}</span>
          <span className="text-gray-400"> / {total}m</span>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
        <motion.div
          key={`${label}-${used}`} initial={{ width: 0 }} animate={{ width: `${safePercent}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>
    </div>
  );
}