/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DailyIframe from "@daily-co/daily-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, PhoneMissed, MessageSquare, X, Square, Pause, Users,
  Sparkles, Radio, Loader2
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type AIState = "idle" | "listening" | "paused";

// 1. Define the Transcript Type
type TranscriptMessage = {
  id: string;
  who: string;
  initials: string;
  time: string;
  msg: string;
  self: boolean;
};

export default function ActiveSessionRoom() {
  const params = useParams<{ sessionId: string, id: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId;
  const studentId = params?.id;

  const [aiState, setAiState] = useState<AIState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState(() => Array.from({ length: 22 }, () => 0.25));

  // 2. State for Live Transcripts
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isFetchingRoom, setIsFetchingRoom] = useState(true);
  const callContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch Room URL
  useEffect(() => {
    const fetchRoom = async () => {
      try {

        onAuthStateChanged(auth, async(user) =>{
          if(user) {
            const token = await user.getIdToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/sessions/${sessionId}/join`, {
              method: "POST",
              headers : {"Authorization" : `Bearer ${token}`} 
            });
            if (res.ok) {
              const data = await res.json();
              setRoomUrl(data.url);
            } else {
              console.error("Failed to fetch room");
            }
          }
          
        })
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingRoom(false);
      }
    };
    if (sessionId) fetchRoom();
  }, [sessionId]);

  // Init Daily & Transcription
  useEffect(() => {
    if (!roomUrl || !callContainerRef.current) return;

    const callFrame = DailyIframe.createFrame(callContainerRef.current, {
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "none",
      },
      showLeaveButton: true,
      showParticipantsBar: true,
      startVideoOff: false,
      startAudioOff: false,
    });

    // 3. Listen for Daily's Transcription Events
    const handleAppMessage = (event: any) => {
      // Daily sends transcriptions as app-messages from "transcription"
      if (event.fromId === 'transcription' && event.data?.is_final) {
        const { user_id, text } = event.data;
        
        // Get the participant's actual name
        const participants = callFrame.participants();
        const participant = participants[user_id] || participants.local;
        
        const isSelf = participant.local;
        const name = participant.user_name || "Student";
        const initials = name.substring(0, 2).toUpperCase();
        
        const time = new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });

        // Add the new message to the list
        setTranscripts((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            who: isSelf ? "You" : name,
            initials,
            time,
            msg: text,
            self: isSelf,
          }
        ]);
      }
    };

    callFrame.on('app-message', handleAppMessage);

    // Join the call, then start transcription
    callFrame.join({ url: roomUrl }).then(() => {
      try {
        // Automatically start transcription when joining
        callFrame.startTranscription();
      } catch (err) {
        console.log("Transcription not enabled or failed to start:", err);
      }
    });

    return () => {
      callFrame.off('app-message', handleAppMessage);
      callFrame.destroy();
    };
  }, [roomUrl]);

  // 4. Auto-Scroll to bottom when a new transcript arrives
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Waveform
  useEffect(() => {
    if (aiState !== "listening") {
      setWaveform((w) => w.map(() => 0.2));
      return;
    }
    const id = setInterval(
      () => setWaveform((prev) => prev.map(() => 0.2 + Math.random() * 0.8)),
      110
    );
    return () => clearInterval(id);
  }, [aiState]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const handleLeave = () => {
    router.push(`/Student/${studentId}/Sessions`);
  };

  if (isFetchingRoom) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-white text-center">
          <Loader2 className="size-10 animate-spin text-violet-600" />
          <p className="text-sm text-slate-300">Preparing your room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#9C2FDF]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#1363CB]/20 blur-3xl" />

      <div className="relative max-w-350 mx-auto px-4 sm:px-6 py-6">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-linear-to-br from-[#1363CB] to-[#9C2FDF] grid place-items-center shadow-lg shadow-[#9C2FDF]/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="truncate text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Active Study Session
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Session Live
                </span>
                <span className="hidden sm:inline">•</span>
                <span>Collaboration Room</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className={`grid gap-6 transition-[grid-template-columns] duration-500 ease-in-out ${aiState !== "idle" ? "lg:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}>
          
          <div className="flex flex-col gap-6 min-w-0">
            {/* VIDEO STAGE WRAPPER */}
            <div className="flex flex-col rounded-2xl overflow-hidden bg-slate-900 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <Radio className="h-3 w-3 animate-pulse" />
                  Recording · {mm}:{ss}
                </div>
              </div>

              {/* DAILY IFRAME */}
              <div ref={callContainerRef} className="w-full h-[55vh] min-h-100 md:h-[65vh] md:min-h-125" />

              <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-3 bg-slate-900 border-t border-slate-800">
                {aiState === "idle" && (
                  <button
                    onClick={() => setAiState("listening")}
                    className="flex-1 sm:flex-none max-w-50 h-11 px-4 rounded-xl flex items-center justify-center gap-2 bg-linear-to-r from-[#1363CB] to-[#9C2FDF] text-white font-semibold text-sm shadow-lg shadow-[#9C2FDF]/20 hover:shadow-xl transition"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="truncate">BondEd AI</span>
                  </button>
                )}
                <button
                  onClick={handleLeave}
                  className="flex-1 sm:flex-none max-w-50 h-11 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 font-semibold text-sm transition shadow-lg shadow-red-500/20"
                >
                  <PhoneMissed className="h-4 w-4 shrink-0" />
                  <span className="truncate">Leave Room</span>
                </button>
              </div>
            </div>

            {/* DYNAMIC TRANSCRIPT UI */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 grid place-items-center">
                    <MessageSquare className="h-4 w-4 text-slate-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900">Live Transcript</h2>
                </div>
                <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Auto-generated</span>
              </div>
              
              {/* Added the auto-scroll ref here */}
              <div 
                ref={transcriptScrollRef} 
                className="px-2 py-2 space-y-4 max-h-75 overflow-y-auto scroll-smooth"
              >
                {transcripts.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm italic">
                    Waiting for someone to speak...
                  </div>
                ) : (
                  transcripts.map((t) => (
                    <div key={t.id} className="flex gap-3">
                      <div className={`h-9 w-9 shrink-0 rounded-full grid place-items-center text-xs font-semibold ${t.self ? "bg-linear-to-br from-[#1363CB] to-[#9C2FDF] text-white" : "bg-slate-100 text-slate-700"}`}>
                        {t.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-slate-900">{t.who}</span>
                          <span className="text-xs text-slate-400">{t.time}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{t.msg}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: AI PANEL */}
          <AnimatePresence>
            {aiState !== "idle" && (
              <motion.aside
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20, y: 20 }}
                className="rounded-2xl bg-white border border-slate-200 shadow-xl p-5 h-fit lg:sticky lg:top-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-linear-to-br from-[#1363CB] to-[#9C2FDF] grid place-items-center shadow-lg shadow-[#9C2FDF]/30">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      {aiState === "listening" && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">BondEd AI</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        {aiState === "listening" ? <><Mic className="h-3 w-3" /> Listening…</> : <><Pause className="h-3 w-3" /> Paused</>}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiState("idle")}
                    className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 grid place-items-center transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5">
                  <div className="flex gap-2.5">
                    <Sparkles className="h-4 w-4 text-[#9C2FDF] shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      I&apos;m monitoring the session. Ask me to explain concepts or generate a quick quiz!
                    </p>
                  </div>

                  {/* Waveform */}
                  <div className="mt-5 flex items-end justify-center gap-1 h-10">
                    {waveform.map((v, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-linear-to-t from-[#1363CB] to-[#9C2FDF] transition-all duration-100"
                        style={{ height: `${v * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setAiState("idle")}
                    className="h-11 w-11 rounded-full bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 grid place-items-center transition-all hover:scale-105"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setAiState(aiState === "listening" ? "paused" : "listening")}
                    className="h-14 w-14 rounded-full bg-linear-to-br from-[#1363CB] to-[#9C2FDF] text-white grid place-items-center shadow-lg shadow-[#9C2FDF]/40 hover:scale-105 transition-transform"
                  >
                    {aiState === "listening" ? <Pause className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}