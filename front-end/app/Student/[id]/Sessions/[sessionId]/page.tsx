/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from "react";
import { DotsRing } from "@/components/ui/dots-ring";
import { useParams, useRouter } from "next/navigation";
import DailyIframe from "@daily-co/daily-js";
import Vapi from "@vapi-ai/web";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, PhoneMissed, MessageSquare, X, Square, Pause, Users,
  Sparkles, Radio, AlertTriangle, Clock, ChevronLeft,
  Power, ShieldCheck, Copy, Check, Bot, MicOff
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_COLLAB_ASSISTANT_ID || process.env.NEXT_PUBLIC_VAPI_PERSONALIZED_ASSISTANT_ID || "";

type VapiAIState = "idle" | "connecting" | "active" | "muted";
type TranscriptMessage = { id: string; who: string; initials: string; time: string; msg: string; self: boolean; };

type SessionDetails = {
  id: string;
  title: string;
  subject: string;
  hostId: string;
  hostName: string;
  status: string;
  isHost: boolean;
};

export default function ActiveSessionRoom() {
  const params = useParams<{ sessionId: string, id: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId;
  const studentId = params?.id;

  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState(() => Array.from({ length: 22 }, () => 0.25));

  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [isFetchingRoom, setIsFetchingRoom] = useState(true);
  const callContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Real-time credits & tracking
  const callFrameRef = useRef<any>(null);
  const hasDeductedRef = useRef(false);
  const [availableMinutes, setAvailableMinutes] = useState<number>(0);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  // Vapi Voice Assistant integration
  const vapiRef = useRef<any>(null);
  const [vapiState, setVapiState] = useState<VapiAIState>("idle");

  // Side Panel state: "none" | "transcript" | "ai"
  const [activeTab, setActiveTab] = useState<"none" | "transcript" | "ai">("none");
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Fetch Room URL, Session Info, AND Credits
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) setIsFetchingRoom(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
        
        // Check Credits First
        const credRes = await fetch(`${baseUrl}/api/payments/credits/${studentId}`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (credRes.ok) {
          const credData = await credRes.json();
          const minutesLeft = credData.dailyMinutesRemaining || 0;
          if (isMounted) setAvailableMinutes(minutesLeft);
          
          if (minutesLeft <= 0) {
            toast.error("You are out of Live Collaboration minutes! Please add more credits to join.");
            router.push(`/Student/${studentId}/Pricing`);
            return;
          }
        }

        // Fetch Room & Session info
        const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/join`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ studentId })
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRoomUrl(data.url);
            if (data.session) {
              setSessionDetails(data.session);
            }
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || "Failed to join session.");
          router.push(`/Student/${studentId}/Sessions`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsFetchingRoom(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [sessionId, studentId, router]);

  // 2. Initialize Vapi AI Voice Assistant Instance
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) return;
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setVapiState("active");
    });

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setTranscripts((prev) => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          who: msg.role === "assistant" ? "BondEd AI" : "You (to AI)",
          initials: msg.role === "assistant" ? "AI" : "YOU",
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          msg: msg.transcript,
          self: msg.role !== "assistant",
        }]);
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

      if ((toolName === "collabSessionUpdate" || toolName === "submitSessionUpdate") && toolArgs) {
        try {
          const parsedData = typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs;
          handleCollabToolCall(parsedData);
        } catch (e) {
          console.error("Failed to parse collabSessionUpdate tool call:", e);
        }
      }
    });

    vapi.on("call-end", () => {
      setVapiState("idle");
    });

    vapi.on("error", (err: any) => {
      console.error("Vapi Error:", err);
      setVapiState("idle");
    });

    return () => {
      try {
        vapi.removeAllListeners();
        vapi.stop();
      } catch (e) {}
    };
  }, []);

  // 3. Init Daily Iframe
  useEffect(() => {
    if (!roomUrl || isFetchingRoom || availableMinutes <= 0) return;

    const container = callContainerRef.current;
    if (!container) return;

    if (callFrameRef.current) {
      try { callFrameRef.current.destroy(); } catch (e) {}
      callFrameRef.current = null;
    }

    container.innerHTML = "";

    let frame: any = null;
    try {
      frame = DailyIframe.createFrame(container, {
        iframeStyle: { width: "100%", height: "100%", border: "0", borderRadius: "0px" },
        showLeaveButton: false,
        showParticipantsBar: true,
      });
      callFrameRef.current = frame;
    } catch (err) {
      console.error("Error embedding Daily iframe:", err);
      return;
    }

    const handleAppMessage = (event: any) => {
      if (event.fromId === 'transcription' && event.data?.is_final) {
        const { user_id, text } = event.data;
        const participants = frame.participants ? frame.participants() : {};
        const participant = participants[user_id] || participants.local;
        const isSelf = participant?.local;
        const name = participant?.user_name || "Student";
        
        setTranscripts((prev) => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          who: isSelf ? "You" : name,
          initials: name.substring(0, 2).toUpperCase(),
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          msg: text,
          self: isSelf,
        }]);
      }
    };

    const handleLeftMeeting = () => {
      handleLeave(false);
    };

    frame.on('app-message', handleAppMessage);
    frame.on('left-meeting', handleLeftMeeting);

    frame.join({ url: roomUrl }).then(() => {
      try { frame.startTranscription(); } catch (err) {}
    }).catch((err: any) => {
      console.error("Daily join failed:", err);
    });

    return () => {
      try {
        frame.off('app-message', handleAppMessage);
        frame.off('left-meeting', handleLeftMeeting);
        frame.leave().catch(() => {}).finally(() => {
          try { frame.destroy(); } catch (e) {}
        });
      } catch (e) {}
      callFrameRef.current = null;
    };
  }, [roomUrl, isFetchingRoom, availableMinutes]);

  // 4. Real-Time Timer & Credits check
  useEffect(() => {
    if (!roomUrl || availableMinutes <= 0) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [roomUrl, availableMinutes]);

  useEffect(() => {
    if (elapsed === 0 || availableMinutes <= 0) return;
    const leftSec = availableMinutes * 60 - elapsed;
    
    if (leftSec <= 0) {
      setTimeWarning("Out of credits! Ending session.");
      handleLeave(true);
    } else if (leftSec <= 120) {
      setTimeWarning(`Only ${Math.ceil(leftSec / 60)} minute(s) left! Call will end automatically.`);
    } else {
      setTimeWarning(null);
    }
  }, [elapsed, availableMinutes]);

  // AI Waveform animation
  useEffect(() => {
    if (vapiState !== "active") {
      setWaveform((w) => w.map(() => 0.2));
      return;
    }
    const id = setInterval(
      () => setWaveform((prev) => prev.map(() => 0.2 + Math.random() * 0.8)),
      110
    );
    return () => clearInterval(id);
  }, [vapiState]);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts, activeTab]);

  // Handle Vapi collabSessionUpdate Tool Call
  const handleCollabToolCall = async (structuredData: any) => {
    if (hasDeductedRef.current) return;
    hasDeductedRef.current = true;

    try {
      vapiRef.current?.stop();
    } catch (e) {}

    try {
      await callFrameRef.current?.leave();
      callFrameRef.current?.destroy();
    } catch (e) {}

    const durationMins = Math.max(1, Math.ceil(elapsed / 60));

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:5000'}/api/sessions/${sessionId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          studentId, 
          durationMins,
          structuredData,
          summary: structuredData?.sessionSummary,
          transcripts,
          selectedTopic: sessionDetails?.subject || sessionDetails?.title || "Collaborative Session"
        })
      });
    } catch(err) { console.error("Error finalizing collab tool call:", err); }

    router.push(`/Student/${studentId}/Summary`);
  };

  // Vapi AI Control Handlers
  const startAiAssistant = async () => {
    if (!vapiRef.current || !ASSISTANT_ID) {
      toast.error("Vapi AI Voice Assistant credentials missing in environment variables.");
      return;
    }
    setVapiState("connecting");
    try {
      await vapiRef.current.start(ASSISTANT_ID, {
        variableValues: {
          selectedTopic: sessionDetails?.subject || sessionDetails?.title || "Collaborative Session",
          studentName: "Student"
        }
      });
    } catch (err) {
      console.error("Vapi start failed:", err);
      setVapiState("idle");
    }
  };

  const stopAiAssistant = () => {
    try {
      vapiRef.current?.stop();
    } catch (e) {}
    setVapiState("idle");
  };

  const toggleAiMute = () => {
    if (vapiState === "active") {
      try { vapiRef.current?.setMuted(true); } catch (e) {}
      setVapiState("muted");
    } else if (vapiState === "muted") {
      try { vapiRef.current?.setMuted(false); } catch (e) {}
      setVapiState("active");
    }
  };

  // Leave Room (Participant action)
  const handleLeave = async (forced = false) => {
    if (hasDeductedRef.current) return;
    hasDeductedRef.current = true;

    try {
      vapiRef.current?.stop();
    } catch(e) {}

    try {
      await callFrameRef.current?.leave();
      callFrameRef.current?.destroy();
    } catch(e) {}

    const durationMins = Math.max(1, Math.ceil(elapsed / 60));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:5000'}/api/sessions/${sessionId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ studentId, sessionId, durationMins })
      });
    } catch(err) { console.error(err); }

    router.push(`/Student/${studentId}/Sessions`);
  };

  // End Session for Everyone (Host action)
  const handleEndSession = async () => {
    if (hasDeductedRef.current || isEnding) return;
    setIsEnding(true);
    hasDeductedRef.current = true;

    try {
      vapiRef.current?.stop();
    } catch(e) {}

    try {
      await callFrameRef.current?.leave();
      callFrameRef.current?.destroy();
    } catch(e) {}

    const durationMins = Math.max(1, Math.ceil(elapsed / 60));

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:5000'}/api/sessions/${sessionId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ studentId, durationMins })
      });
    } catch(err) { console.error(err); }

    router.push(`/Student/${studentId}/Sessions`);
  };

  const copyRoomLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const minutesRemaining = Math.max(0, availableMinutes - Math.floor(elapsed / 60));

  const isHost = sessionDetails?.isHost ?? false;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* TIME WARNING NOTIFICATION */}
      <AnimatePresence>
        {timeWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -40 }} 
            className="fixed top-16 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/50 text-red-200 px-5 py-2.5 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-2xl z-50 backdrop-blur-md"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
            {timeWarning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVBAR */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        
        {/* Left: Branding & Session Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => handleLeave(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/50 shrink-0"
            title="Leave room"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </button>

          <div className="h-5 w-px bg-slate-800 shrink-0 hidden sm:block" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-[#1363CB] to-[#9C2FDF] grid place-items-center shadow-lg shadow-[#9C2FDF]/20 shrink-0">
              <Users className="h-4 w-4 text-white" />
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="truncate text-sm sm:text-base font-bold text-slate-100 leading-snug">
                  {sessionDetails?.title || "Collaborative Study Session"}
                </h1>
                
                {/* Live Indicator */}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="truncate">{sessionDetails?.subject || "General Study"}</span>
                {sessionDetails?.hostName && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-purple-300 font-medium truncate">
                      {isHost ? <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" /> : null}
                      Host: {sessionDetails.hostName} {isHost && "(You)"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Timer & Credits Display */}
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="text-slate-200 font-semibold">{mm}:{ss}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${minutesRemaining <= 2 ? 'text-red-400 animate-bounce' : 'text-purple-400'}`} />
            <span className={minutesRemaining <= 2 ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {minutesRemaining}m credits left
            </span>
          </div>
        </div>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Share Room Button */}
          <button
            onClick={copyRoomLink}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-700/50"
            title="Copy room link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Toggle Transcript */}
          <button
            onClick={() => setActiveTab(activeTab === "transcript" ? "none" : "transcript")}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
              activeTab === "transcript"
                ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/50"
            }`}
            title="Live Transcript"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Transcript</span>
            {transcripts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-purple-300 font-bold">
                {transcripts.length}
              </span>
            )}
          </button>

          {/* Toggle BondEd AI (Vapi Voice Assistant) */}
          <button
            onClick={() => {
              const next = activeTab === "ai" ? "none" : "ai";
              setActiveTab(next);
              if (next === "ai" && vapiState === "idle") {
                startAiAssistant();
              }
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
              activeTab === "ai" || vapiState === "active"
                ? "bg-linear-to-r from-[#1363CB] to-[#9C2FDF] text-white border-purple-400 shadow-lg shadow-[#9C2FDF]/30"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/50"
            }`}
            title="BondEd AI Voice Assistant"
          >
            <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
            <span className="hidden lg:inline">BondEd AI</span>
            {vapiState === "active" && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <div className="h-6 w-px bg-slate-800" />

          {/* HOST: End Session vs PARTICIPANT: Leave Room */}
          {isHost ? (
            <button
              onClick={() => setShowEndModal(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition hover:scale-105 active:scale-95 border border-red-500/30"
              title="End session for all participants"
            >
              <Power className="w-4 h-4 shrink-0" />
              <span>End Session</span>
            </button>
          ) : (
            <button
              onClick={() => handleLeave(false)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-600/90 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition border border-slate-700 hover:border-red-500"
              title="Leave this room"
            >
              <PhoneMissed className="w-4 h-4 shrink-0 text-red-400" />
              <span>Leave</span>
            </button>
          )}

        </div>
      </header>

      {/* MAIN VIEWPORT STAGE */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden bg-slate-950">
        
        {/* VIDEO CALL CONTAINER */}
        <div className="flex-1 h-full min-h-0 relative flex flex-col p-2 sm:p-3 overflow-hidden">
          
          <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800/80 shadow-2xl relative flex flex-col">
            
            {/* Loading Indicator Overlay while room is provisioning */}
            {isFetchingRoom && (
              <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-center p-6 backdrop-blur-md">
                <div className="relative mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-[#1363CB] to-[#9C2FDF] grid place-items-center shadow-xl shadow-[#9C2FDF]/30 animate-pulse">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <DotsRing className="text-purple-400 absolute -bottom-2 -right-2 w-8 h-8"  />
                </div>
                <h2 className="text-xl font-bold text-slate-100">Connecting to Collaborative Room</h2>
                <p className="text-sm text-slate-400 mt-1">Preparing high-definition video stage & AI voice copilot…</p>
              </div>
            )}

            {/* Daily Iframe Container - strictly 100% width and height */}
            <div ref={callContainerRef} className="w-full h-full min-h-0 flex-1 relative bg-slate-950" />

          </div>

        </div>

        {/* SIDE PANELS (TRANSCRIPT / AI) */}
        <AnimatePresence mode="wait">
          {activeTab !== "none" && (
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full sm:w-96 h-full border-l border-slate-800/80 bg-slate-900/95 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden shadow-2xl z-30 relative"
            >
              {/* TAB 1: LIVE TRANSCRIPT */}
              {activeTab === "transcript" && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 grid place-items-center">
                        <MessageSquare className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm text-slate-100">Live Transcript</h2>
                        <p className="text-[11px] text-slate-400">Real-time speech-to-text</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("none")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div ref={transcriptScrollRef} className="flex-1 p-4 space-y-3.5 overflow-y-auto min-h-0 scroll-smooth">
                    {transcripts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <Bot className="w-10 h-10 mb-2 opacity-40 text-purple-400" />
                        <p className="text-sm font-medium text-slate-400">Transcript is ready</p>
                        <p className="text-xs text-slate-500 mt-1">Speak into your microphone or ask Vapi AI to generate real-time captions.</p>
                      </div>
                    ) : (
                      transcripts.map((t) => (
                        <div key={t.id} className={`flex gap-3 ${t.self ? "flex-row-reverse" : ""}`}>
                          <div className={`h-8 w-8 shrink-0 rounded-full grid place-items-center text-xs font-bold ${
                            t.self 
                              ? "bg-linear-to-br from-[#1363CB] to-[#9C2FDF] text-white" 
                              : "bg-slate-800 border border-slate-700 text-slate-300"
                          }`}>
                            {t.initials}
                          </div>
                          <div className={`min-w-0 max-w-[80%] p-3 rounded-2xl text-xs ${
                            t.self 
                              ? "bg-purple-600/30 border border-purple-500/30 text-purple-100 rounded-tr-none" 
                              : "bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none"
                          }`}>
                            <div className="flex items-center justify-between gap-2 mb-1 text-[10px] text-slate-400 font-medium">
                              <span>{t.who}</span>
                              <span>{t.time}</span>
                            </div>
                            <p className="leading-relaxed">{t.msg}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BONDED AI VOICE COPILOT (POWERED BY VAPI) */}
              {activeTab === "ai" && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-linear-to-br from-[#1363CB] to-[#9C2FDF] grid place-items-center shadow-md">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm text-slate-100">BondEd AI Assistant</h2>
                        <p className="text-[11px] text-purple-400 font-medium">
                          {vapiState === "connecting" && "Connecting to Vapi AI…"}
                          {vapiState === "active" && "Vapi Voice Active · Listening"}
                          {vapiState === "muted" && "Microphone Muted"}
                          {vapiState === "idle" && "Offline · Click to start"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("none")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
                    
                    {/* Visual Waveform & Status */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 grid place-items-center">
                          {vapiState === "connecting" ? (
                            <DotsRing className="text-purple-400 w-8 h-8"  />
                          ) : vapiState === "muted" ? (
                            <MicOff className="w-7 h-7 text-amber-400" />
                          ) : (
                            <Mic className={`w-7 h-7 ${vapiState === 'active' ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
                          )}
                        </div>
                        {vapiState === "active" && (
                          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-ping" />
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 mb-1">Vapi Voice AI Partner</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                        {vapiState === "active" 
                          ? "I'm listening and speaking with you in real-time. Ask me any study question!" 
                          : "Start BondEd AI to converse in real-time during your study session."}
                      </p>

                      {/* Waveform bars */}
                      <div className="mt-4 flex items-end justify-center gap-1.5 h-10 w-full px-4">
                        {waveform.map((v, i) => (
                          <span
                            key={i}
                            className="w-1 rounded-full bg-linear-to-t from-[#1363CB] to-[#9C2FDF] transition-all duration-100"
                            style={{ height: `${Math.max(15, v * 100)}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Vapi Controls */}
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BondEd AI Controls</p>
                      
                      {vapiState === "idle" ? (
                        <button 
                          onClick={startAiAssistant}
                          className="w-full py-3 rounded-xl bg-linear-to-r from-[#1363CB] to-[#9C2FDF] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#9C2FDF]/30 transition hover:scale-102 active:scale-98"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Start Vapi Voice Assistant</span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={toggleAiMute}
                            className={`py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                              vapiState === "muted"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                            }`}
                          >
                            {vapiState === "muted" ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            <span>{vapiState === "muted" ? "Unmute Mic" : "Mute Mic"}</span>
                          </button>

                          <button 
                            onClick={stopAiAssistant}
                            className="py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <Square className="w-4 h-4" />
                            <span>Stop Assistant</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* HOST END SESSION CONFIRMATION MODAL */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 grid place-items-center mx-auto mb-4 text-red-400">
                <Power className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">End Session for Everyone?</h3>
              
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                As the host, ending this meeting will disconnect all participants, stop cloud recording, and mark the study session as completed.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
                >
                  Cancel
                </button>

                <button
                  onClick={handleEndSession}
                  disabled={isEnding}
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition disabled:opacity-50"
                >
                  {isEnding ? (
                    <DotsRing className=" w-8 h-8"  />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                  <span>{isEnding ? "Ending…" : "End Session"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}