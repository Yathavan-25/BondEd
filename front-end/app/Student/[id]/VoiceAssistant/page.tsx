/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from "react";
import { DotsRing } from "@/components/ui/dots-ring";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Vapi from "@vapi-ai/web";
import { Mic, Square, Pause, Sparkles, Volume2, CheckCircle, Activity, Clock, Waves, BookOpen, AlertTriangle, Image as ImageIcon, Maximize2, Download, X, PhoneOff } from "lucide-react";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import MermaidDiagram from "@/components/MermaidDiagram";
const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_PERSONALIZED_ASSISTANT_ID || "";

type AssistantState = "idle" | "loading" | "listening" | "paused" | "stopped" | "analyzing";
type TranscriptMessage = { role: "user" | "ai"; text: string; type?: "text" | "image" };
type VisualAidItem = { id: string; url: string; prompt?: string };

export default function VoiceAssistantPage() {
  const params = useParams<{ id: string }>();
  const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [assistantState, setAssistantState] = useState<AssistantState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(() => Array.from({ length: 28 }, () => 0.2));

  const [profile, setProfile] = useState<any>(null);
  const [memory, setMemory] = useState<string>("");
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const [liveMessage, setLiveMessage] = useState<{ role: string, text: string } | null>(null);

  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");

  // Real-time credits & warnings
  const [availableMinutes, setAvailableMinutes] = useState<number>(0);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);

  // Visual aids panel and fullscreen lightbox
  const [visualAids, setVisualAids] = useState<VisualAidItem[]>([]);
  const visualAidsRef = useRef<VisualAidItem[]>([]);
  const [activeVisualIndex, setActiveVisualIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const vapiRef = useRef<any>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const finalTopicRef = useRef<string>("");
  const currentCallIdRef = useRef<string | null>(null);
  const hasFinalizedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptsRef = useRef<TranscriptMessage[]>([]);

  useEffect(() => {
    finalTopicRef.current = customTopic.trim() || selectedTopic;
  }, [customTopic, selectedTopic]);

  useEffect(() => {
    currentCallIdRef.current = currentCallId;
  }, [currentCallId]);

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts, liveMessage]);

  useEffect(() => {
    const fetchContext = async () => {
      if (!studentId) return;
      try {
        onAuthStateChanged(auth, async (user) => {
          const token = await user?.getIdToken();
          const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';

          // Fetch Profile
          const res = await fetch(`${baseUrl}/api/profile/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setProfile(data.profile || data);
            if (data.profile?.topics?.length > 0) {
              setSelectedTopic(data.profile.topics[0]);
            }
          }

          // Fetch Last Session Memory
          const memRes = await fetch(`${baseUrl}/api/summary/last/${studentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (memRes.ok) {
            const memData = await memRes.json();
            if (memData.lastSession) {
              setMemory(`Last session summary: ${memData.lastSession.summary}. Next steps requested: ${memData.lastSession.profileUpdates?.nextSteps}`);
            }
          }

          // Fetch Actual Credits Remaining
          const credRes = await fetch(`${baseUrl}/api/payments/credits/${studentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (credRes.ok) {
            const credData = await credRes.json();
            setAvailableMinutes(credData.vapiMinutesRemaining || 0);
          }
        })
      } catch (err) { console.error("Failed to load context", err); }
    };
    fetchContext();
  }, [studentId]);

  const handleGenerateVisualAid = async (prompt: string) => {
    setGeneratingImage(true);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
      const finalTopic = customTopic.trim() || selectedTopic;
      const subject = profile?.subjects?.[0] || finalTopic || "General";

      const res = await fetch(`${baseUrl}/api/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ prompt, topic: finalTopic, subject }),
      });

      if (res.ok) {
        const data = await res.json();
        const newItem: VisualAidItem = { id: Math.random().toString(36).substring(2, 9), url: data.imageUrl, prompt };
        setVisualAids((prev) => {
          const next = [...prev, newItem];
          visualAidsRef.current = next;
          setActiveVisualIndex(next.length - 1);
          return next;
        });
        toast.success("New visual aid generated!");
      } else {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Image generation failed:", errData);
        toast.error("Couldn't generate image right now.");
      }
    } catch (err) {
      console.error("Failed to generate visual aid:", err);
      toast.error("Network error generating image.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const finalizeSession = async (structuredData: any, summary?: string) => {
    if (hasFinalizedRef.current) return;
    hasFinalizedRef.current = true;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    setAssistantState("analyzing");
    try { vapiRef.current?.stop(); } catch { /* already stopped, ignore */ }

    const finalTopic = finalTopicRef.current || "General Study";
    const callId = currentCallIdRef.current;
    const startTime = sessionStartRef.current?.toISOString() || new Date().toISOString();
    const endTime = new Date().toISOString();

    const imageTranscripts = visualAidsRef.current.map((v: VisualAidItem) => ({ role: "ai" as const, text: v.url, type: "image" as const }));
    const mergedTranscripts = [...transcriptsRef.current, ...imageTranscripts];

    try {
      const token = await getAuth().currentUser?.getIdToken();
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';

      fetch(`${baseUrl}/api/sessions/voice/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          studentId,
          callId,
          selectedTopic: finalTopic,
          transcripts: mergedTranscripts,
          structuredData,
          summary,
          startTime,
          endTime
        })
      }).catch((err) => console.error("Background session save failed:", err));
    } catch (err) {
      console.error("Failed to get auth token for session save:", err);
    }

    sessionStorage.setItem("pendingSessionSince", Date.now().toString());
    router.push(`/Student/${studentId}/Summary?pending=1`);
  };

  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    const onMessage = (msg: any) => {
      if (msg.type === "transcript") {
        if (msg.transcriptType === "partial") {
          setLiveMessage({ role: msg.role, text: msg.transcript });
        } else if (msg.transcriptType === "final") {
          setTranscripts((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === msg.role && lastMsg.text === msg.transcript) return prev;
            return [...prev, { role: msg.role, text: msg.transcript }];
          });
          setLiveMessage(null);
        }
        return;
      }

      let toolName: string | undefined;
      let toolArgs: any;

      if (msg.type === "tool-calls" && msg.toolCallList?.[0]?.function?.name) {
        toolName = msg.toolCallList[0].function.name;
        toolArgs = msg.toolCallList[0].function.arguments;
      } else if (msg.type === "function-call" && msg.functionCall?.name) {
        toolName = msg.functionCall.name;
        toolArgs = msg.functionCall.parameters;
      }

      if (typeof toolArgs === "string") {
        try { toolArgs = JSON.parse(toolArgs); } catch (e) { console.error("Failed to parse toolArgs", e); toolArgs = {}; }
      }

      if (toolName === "submitSessionUpdate" && toolArgs) {
        // Cancel the call-end fallback timer — submitSessionUpdate arrived in time
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        finalizeSession(toolArgs, toolArgs.summary);
      } else if (toolName === "generateVisualAid" && toolArgs?.prompt) {
        handleGenerateVisualAid(toolArgs.prompt);
      }
    };

    vapi.on("call-start", () => {
      setAssistantState("listening");
      sessionStartRef.current = new Date();
    });
    vapi.on("message", onMessage);
    vapi.on("call-end", () => {
      // Give the submitSessionUpdate tool-call message 3 seconds to arrive before
      // falling back to empty data. Without this delay, call-end wins the race.
      if (!hasFinalizedRef.current) {
        fallbackTimerRef.current = setTimeout(() => {
          if (!hasFinalizedRef.current) finalizeSession({}, undefined);
        }, 3000);
      }
    });
    vapi.on("error", (e: any) => {
      console.error("VAPI ERROR:", e);
      if (!hasFinalizedRef.current) setAssistantState("idle");
    });

    return () => {
      vapi.removeAllListeners();
      vapi.stop();
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  // Interval for counting seconds and animating waves
  useEffect(() => {
    if (assistantState !== "listening") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    const waveId = setInterval(() => setWaveform((prev) => prev.map(() => 0.2 + Math.random() * 0.8)), 140);
    return () => { clearInterval(interval); clearInterval(waveId); };
  }, [assistantState]);

  // Real-time minutes check (Checks limits every second)
  useEffect(() => {
    if (assistantState !== "listening") return;
    const leftSec = availableMinutes * 60 - seconds;

    if (leftSec <= 0) {
      setTimeWarning("Out of credits! Ending session.");
      stopSession();
    } else if (leftSec <= 120) {
      setTimeWarning(`Only ${Math.ceil(leftSec / 60)} minute(s) left! Session will end automatically.`);
    } else {
      setTimeWarning(null);
    }
  }, [seconds, availableMinutes, assistantState]);

  const toggleStart = async () => {
    const finalTopic = customTopic.trim() || selectedTopic;
    if (!finalTopic) return toast.error("Please select or type a topic first!");

    // Prevent starting if no minutes left
    if (availableMinutes <= 0) {
      return toast.error("You are out of AI Voice minutes! Please add more credits to your account to start a session.");
    }

    if (assistantState === "idle" || assistantState === "stopped") {
      setAssistantState("loading");
      setSeconds(0);
      setTranscripts([]);
      setLiveMessage(null);
      setTimeWarning(null);
      hasFinalizedRef.current = false;

      try {
        let currentMemory = memory;
        try {
          const user = auth.currentUser;
          const token = await user?.getIdToken();
          const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
          const memRes = await fetch(`${baseUrl}/api/summary/last/${studentId}?topic=${encodeURIComponent(finalTopic)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (memRes.ok) {
            const memData = await memRes.json();
            if (memData.lastSession) {
              currentMemory = `Last session summary: ${memData.lastSession.summary}. Next steps requested: ${memData.lastSession.profileUpdates?.nextSteps}`;
            } else {
              currentMemory = "No previous session on this topic.";
            }
          }
        } catch (mErr) {
          console.error("Failed to fetch fresh memory for topic", mErr);
        }

        const variableValues = {
          learningStyle: Array.isArray(profile?.learningStyle) ? profile.learningStyle.join(", ") : (profile?.learningStyle || "Adaptive"),
          currentTopic: finalTopic,
          academicGoals: profile?.academicGoals || "Improve understanding.",
          pastSessionMemory: currentMemory || "No previous session."
        };

        const call = await vapiRef.current.start(ASSISTANT_ID, { variableValues });

        if (call && call.id) {
          setCurrentCallId(call.id);
        } else {
          setAssistantState("idle");
        }
      } catch (err) {
        console.error("Vapi Start Error", err);
        setAssistantState("idle");
      }
    }
  };

  function stopSession() {
    setAssistantState("analyzing");

    try {
      vapiRef.current?.send({
        type: "add-message",
        message: {
          role: "system",
          content: "The student has indicated they want to end the session now. Give a short, natural closing line referencing what you covered today, then silently call the submitSessionUpdate tool with your evaluation of the full conversation. Do not say anything after that."
        },
        triggerResponseEnabled: true
      });
    } catch (err) {
      console.error("Failed to send end-session nudge:", err);
    }

    fallbackTimerRef.current = setTimeout(() => {
      if (!hasFinalizedRef.current) {
        console.warn("submitSessionUpdate never fired — finalizing with fallback data.");
        finalizeSession({}, undefined);
      }
    }, 20000);
  };

  const formattedTime = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const minutesUsed = Math.floor(seconds / 60);
  const minutesRemaining = Math.max(0, availableMinutes - minutesUsed);
  const focusScore = Math.min(100, 60 + Math.round(Math.sin(seconds / 6) * 12) + Math.min(28, seconds / 4));

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-10 px-4 md:px-6 pt-6 relative">

      {/* Time Warning Toast */}
      <AnimatePresence>
        {timeWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg z-50"
          >
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {timeWarning}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="relative inline-flex"><span className="absolute inset-0 rounded-full bg-[#9C2FDF]/20 blur-lg" /><Mic className="relative w-8 h-8 text-[#9C2FDF]" /></span>
            AI Voice Assistant
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Select a topic and start your personalized voice session.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 px-2"><Activity className="w-4 h-4 text-[#1363CB]" /><span className="text-xs font-semibold text-gray-700">{focusScore}% focus</span></div>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center gap-2 px-2">
            <Clock className={`w-4 h-4 ${minutesRemaining <= 2 ? 'text-red-500 animate-pulse' : 'text-[#9C2FDF]'}`} />
            <span className={`text-xs font-semibold ${minutesRemaining <= 2 ? 'text-red-600' : 'text-gray-700'}`}>{minutesRemaining}m left</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 relative rounded-[28px] border border-gray-200/80 bg-white shadow-sm p-6 md:p-8 flex flex-col overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#9C2FDF]/10 blur-3xl" />

          <div className="relative flex justify-between items-start mb-8">
            <div className="w-full max-w-sm">
              {assistantState === "idle" && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2"><BookOpen className="w-3.5 h-3.5" /> Today&apos;s Topic</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTopic}
                      onChange={(e) => { setSelectedTopic(e.target.value); setCustomTopic(""); }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1363CB]"
                    >
                      {profile?.topics?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                      <option value="custom">-- Type Custom Topic --</option>
                    </select>
                  </div>
                  {selectedTopic === "custom" && (
                    <input
                      type="text"
                      placeholder="E.g. Binary Trees"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full mt-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1363CB]"
                    />
                  )}
                </div>
              )}
            </div>

            {assistantState !== "idle" && (
              <AnimatePresence mode="wait">
                <motion.div key={assistantState} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1">
                  <Waves className="w-3.5 h-3.5 text-[#1363CB]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                    {assistantState === "analyzing" ? "Wrapping Up" : assistantState}
                  </span>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center w-56 h-56">
              <motion.div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from 0deg, ${minutesRemaining <= 2 ? '#ef4444' : '#1363CB'}, #9C2FDF, ${minutesRemaining <= 2 ? '#ef4444' : '#1363CB'})`, WebkitMask: "radial-gradient(circle, transparent 58%, black 60%)", mask: "radial-gradient(circle, transparent 58%, black 60%)", opacity: assistantState === "listening" ? 0.9 : 0.25 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: assistantState === "listening" ? 6 : 22, ease: "linear" }} />
              {assistantState === "listening" && [0, 0.6, 1.2].map((delay, i) => <motion.div key={i} className={`absolute inset-2 rounded-full border ${minutesRemaining <= 2 ? 'border-red-500/40' : 'border-[#9C2FDF]/40'}`} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1.3, opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeOut" }} />)}
              <motion.div animate={{ scale: assistantState === "listening" ? [1, 1.05, 1] : 1 }} transition={{ repeat: assistantState === "listening" ? Infinity : 0, duration: 1.8, ease: "easeInOut" }} className={`absolute w-28 h-28 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${assistantState === "idle" || assistantState === "stopped" ? "bg-gray-100 shadow-inner" : minutesRemaining <= 2 ? "bg-linear-to-br from-red-500 to-[#9C2FDF] shadow-[0_0_50px_rgba(239,68,68,0.55)]" : "bg-linear-to-br from-[#1363CB] to-[#9C2FDF] shadow-[0_0_50px_rgba(156,47,223,0.55)]"}`}>
                {assistantState === "loading" || assistantState === "analyzing" ? <DotsRing className="text-white" /> : assistantState === "stopped" ? <CheckCircle className="w-10 h-10 text-gray-400" /> : <Volume2 className={`w-10 h-10 ${assistantState === "idle" ? "text-gray-400" : "text-white"}`} />}
              </motion.div>
            </div>

            <div className="mt-8 h-12 w-full max-w-md flex items-center justify-center gap-0.75">
              {waveform.map((h, i) => <motion.span key={i} className={`w-0.75 rounded-full ${minutesRemaining <= 2 ? 'bg-linear-to-t from-red-500 to-[#9C2FDF]' : 'bg-linear-to-t from-[#1363CB] to-[#9C2FDF]'}`} animate={{ height: assistantState === "listening" ? `${h * 100}%` : assistantState === "paused" ? "20%" : "8%", opacity: assistantState === "idle" ? 0.25 : 1 }} transition={{ duration: 0.18, ease: "easeOut" }} style={{ minHeight: 4 }} />)}
            </div>

            <div className="mt-6 text-center">
              <motion.span key={formattedTime} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className={`text-4xl font-black font-mono tracking-wider ${minutesRemaining <= 2 ? 'text-red-600' : 'text-gray-900'}`}>{formattedTime}</motion.span>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">/ {availableMinutes}m available</p>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
              {(assistantState === "idle" || assistantState === "stopped") && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleStart}
                  className="px-8 py-4 rounded-2xl bg-linear-to-r from-[#1363CB] to-[#9C2FDF] text-white font-bold text-base shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <Mic className="w-5 h-5" /> Start Voice Session
                </motion.button>
              )}

              {assistantState === "loading" && (
                <button
                  disabled
                  className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold text-base flex items-center gap-3 cursor-not-allowed border border-gray-200"
                >
                  <DotsRing className="text-[#9C2FDF]" dotScale={0.12} radiusScale={0.25} /> Connecting to AI...
                </button>
              )}

              {(assistantState === "listening" || (assistantState as string) === "speaking" || assistantState === "paused") && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={stopSession}
                  className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-base shadow-lg shadow-red-500/20 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <PhoneOff className="w-5 h-5" /> End Session
                </motion.button>
              )}

              {assistantState === "analyzing" && (
                <div className="px-8 py-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-[#1363CB] font-bold text-base flex items-center gap-3 animate-pulse">
                  <DotsRing className="text-[#1363CB]" dotScale={0.12} radiusScale={0.25} /> Wrapping up & saving session...
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-6 lg:space-y-8 h-full">
          <div className="relative bg-white rounded-[28px] border border-gray-200/80 shadow-[0_8px_40px_-12px_rgba(19,99,203,0.12)] p-6 flex flex-col h-150 overflow-hidden">
            <h2 className="relative text-lg font-bold text-gray-900 tracking-wide mb-6">Live Transcript</h2>
            <div className="w-full h-px bg-gray-100 my-2" />
            <div className="relative flex-1 flex flex-col min-h-0">
              <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence mode="popLayout">
                  {transcripts.length === 0 ? (
                    <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-gray-400 italic">Select a topic and press the mic to start studying.</motion.p>
                  ) : (
                    transcripts.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[16px] p-4 flex items-start gap-4 border ${msg.role === 'user' ? 'bg-gray-50 border-gray-100' : 'bg-linear-to-br from-indigo-50/70 to-purple-50/40 border-[#1363CB]/20'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 ${msg.role === 'user' ? 'bg-gray-800' : 'bg-linear-to-br from-[#1363CB] to-[#9C2FDF]'}`}>
                          {msg.role === 'user' ? <span className="text-xs font-bold">ME</span> : <Sparkles className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'text-gray-800' : 'text-[#1363CB]'}`}>{msg.text}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                {generatingImage && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] p-4 flex items-start gap-4 border bg-linear-to-br from-indigo-50/70 to-purple-50/40 border-[#1363CB]/20">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 bg-linear-to-br from-[#1363CB] to-[#9C2FDF]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-3">
                      <DotsRing className="text-[#9C2FDF]" dotScale={0.12} radiusScale={0.25} />
                      <p className="text-sm font-bold text-[#1363CB] animate-pulse">Generating visual aid diagram...</p>
                    </div>
                  </motion.div>
                )}
                {liveMessage && (
                  <div className={`flex flex-col ${liveMessage.role === "user" ? "items-end" : "items-start"}`}>
                    <span className={`text-[10px] font-bold uppercase mb-1 ${liveMessage.role === "user" ? "text-blue-500" : "text-violet-500"}`}>
                      {liveMessage.role === "user" ? "You" : "BondEd AI"}
                    </span>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm opacity-70 ${liveMessage.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                      {liveMessage.text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full-Width Visual Aid Panel (Spans across Voice Assistant and Transcript) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full bg-white rounded-[28px] border border-gray-200/80 shadow-[0_8px_40px_-12px_rgba(19,99,203,0.12)] p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9C2FDF]" />
              Generated Visual Aids
              {visualAids.length > 0 && <span className="ml-2 text-xs font-extrabold bg-[#9C2FDF]/10 text-[#9C2FDF] px-2.5 py-1 rounded-full">{visualAids.length}</span>}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">High-definition diagrams generated live during your tutoring session.</p>
          </div>
          {visualAids.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Visual {activeVisualIndex + 1} of {visualAids.length}</span>
            </div>
          )}
        </div>

        {visualAids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-gray-50/50 border border-dashed border-gray-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#9C2FDF]/10 flex items-center justify-center text-[#9C2FDF] mb-3">
              <ImageIcon className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">No Visual Aids Generated Yet</p>
            <p className="text-xs text-gray-500 max-w-md">Ask BondEd AI to &quot;show a visual diagram&quot; or &quot;generate an image&quot; at any time during your conversation, and HD diagrams will pin here for your study session.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Featured Image Card */}
            <div className="relative rounded-2xl border border-gray-200/80 bg-gray-900 overflow-hidden group shadow-lg min-h-[400px]">
              {visualAids[activeVisualIndex]?.url.startsWith('mermaid:') ? (
                <div className="w-full h-full p-4">
                  <MermaidDiagram chart={visualAids[activeVisualIndex].url.substring(8)} />
                </div>
              ) : (
                <img
                  src={visualAids[activeVisualIndex]?.url}
                  alt={visualAids[activeVisualIndex]?.prompt || "Visual Aid"}
                  className="w-full max-h-[500px] object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                <p className="text-sm font-semibold text-white truncate max-w-lg">{visualAids[activeVisualIndex]?.prompt || "Generated Educational Diagram"}</p>
                <div className="flex items-center gap-3">
                  {!visualAids[activeVisualIndex]?.url.startsWith('mermaid:') && (
                    <button
                      onClick={() => setLightboxImage(visualAids[activeVisualIndex]?.url)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-gray-900 font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" /> Full Resolution
                    </button>
                  )}
                  {!visualAids[activeVisualIndex]?.url.startsWith('mermaid:') && (
                    <a
                      href={visualAids[activeVisualIndex]?.url}
                      download="visual-aid.png"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1363CB] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery Thumbnails Selector for Previous Images */}
            {visualAids.length > 1 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Previous Visual Aids in this session:</p>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
                  {visualAids.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveVisualIndex(index)}
                      className={`relative rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-white ${activeVisualIndex === index ? 'border-[#9C2FDF] ring-2 ring-[#9C2FDF]/30 scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                    >
                      {item.url.startsWith('mermaid:') ? (
                        <div className="w-28 h-20 flex items-center justify-center bg-gray-50 text-gray-400 text-xs font-bold">Mermaid Diagram</div>
                      ) : (
                        <img src={item.url} alt="Thumbnail" className="w-28 h-20 object-cover" />
                      )}
                      <span className="absolute bottom-1 right-1 text-[10px] font-extrabold bg-black/70 text-white px-1.5 py-0.5 rounded">#{index + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
                <a
                  href={lightboxImage}
                  download="visual-aid.png"
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-colors"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-colors cursor-pointer"
                  title="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img
                src={lightboxImage}
                alt="Full resolution visual aid"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}