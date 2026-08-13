/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { DotsRing } from "@/components/ui/dots-ring";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Code, Atom, Calculator, BrainCircuit, LineChart,
  ArrowRight, Sparkles, Plus, Mic, AlertCircle, Clock, Lightbulb, Brain, Target
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip
} from "recharts";
import Vapi from "@vapi-ai/web";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

let vapi: any = null;
if (typeof window !== "undefined") {
  vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
}

const VAST_SUBJECTS = [
  { id: "cs", label: "Computer Science", icon: Code },
  { id: "math", label: "Mathematics", icon: Calculator },
  { id: "science", label: "Natural Sciences", icon: Atom },
  { id: "business", label: "Business & Finance", icon: LineChart },
  { id: "humanities", label: "Humanities", icon: BookOpen },
  { id: "psych", label: "Psychology", icon: BrainCircuit },
];

const SUBJECT_TOPICS: Record<string, string[]> = {
  cs: ["Data Structures & Algorithms", "Machine Learning", "Web Development", "Cybersecurity", "Cloud Computing"],
  math: ["Linear Algebra", "Calculus", "Probability & Statistics", "Discrete Mathematics", "Differential Equations"],
  science: ["Organic Chemistry", "Quantum Mechanics", "Genetics", "Thermodynamics", "Neuroscience"],
  business: ["Macroeconomics", "Financial Accounting", "Corporate Finance", "Marketing Strategy", "Supply Chain"],
  humanities: ["Modern History", "Philosophy of Mind", "Linguistics", "World Literature", "Ethics"],
  psych: ["Cognitive Behavioral Therapy", "Neuropsychology", "Developmental Psychology", "Clinical Psychology", "Social Psychology"],
};

// Custom Tooltip for the Radar Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl">
        {payload[0].payload.metric}: <span className="text-blue-400">{payload[0].value}%</span>
      </div>
    );
  }
  return null;
};

export default function OnboardingFlow() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const studentId = params?.id;

  const [step, setStep] = useState(1);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  const [transcript, setTranscript] = useState<{ role: string, text: string }[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const [dynamicProfile, setDynamicProfile] = useState<any>(null);

  const availableTopics = Array.from(new Set(selectedSubjects.flatMap(sub => SUBJECT_TOPICS[sub] || [])));

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  // Check if profile is already completed — if so, redirect directly to Dashboard to prevent duplicate onboarding!
  useEffect(() => {
    if (!studentId) return;
    const checkProfileCompleted = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/profile/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.subjects && data.profile.subjects.length > 0) {
            router.replace(`/Student/${studentId}/Dashboard`);
          }
        }
      } catch (err) {
        console.error("Error checking existing onboarding status:", err);
      }
    };
    checkProfileCompleted();
  }, [studentId, router]);

  const getAuthToken = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!auth) {
        resolve(null);
        return;
      }
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const token = await user.getIdToken();
            resolve(token);
          } catch (error) {
            console.error("Error fetching Firebase token:", error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  };

  const getSubjectLabel = (id: string) =>
    VAST_SUBJECTS.find((s) => s.id === id)?.label || id;

  // Groups selectedTopics under their owning subject, e.g.
  // "Computer Science: Web Development, Cloud Computing | Mathematics: Calculus"
  const getTopicsBySubjectString = () => {
    const groups: Record<string, string[]> = {};

    selectedTopics.forEach((topic) => {
      let ownerId = selectedSubjects.find((subId) =>
        (SUBJECT_TOPICS[subId] || []).includes(topic)
      );

      if (!ownerId) {
        // custom topic with no predefined subject match
        ownerId = selectedSubjects.length === 1 ? selectedSubjects[0] : "general";
      }

      const label = ownerId === "general" ? "General" : getSubjectLabel(ownerId);
      if (!groups[label]) groups[label] = [];
      groups[label].push(topic);
    });

    return Object.entries(groups)
      .map(([subject, topics]) => `${subject}: ${topics.join(", ")}`)
      .join(" | ");
  };

  useEffect(() => {
    if (!vapi) return;

    const onCallStart = () => {
      setIsConnecting(false);
      setIsConnected(true);
      setTranscript([]);
    };

    const onError = (error: any) => {
      console.error("Vapi Error:", error);
      setIsConnecting(false);
      setIsConnected(false);
    };

    const onCallEnd = () => {
      setIsConnected(false);
      setIsAssistantSpeaking(false);

      setStep((currentStep) => {
        if (currentStep === 3) {
          toast.error("The connection was lost. Please try the exam again.");
          return 1;
        }
        return currentStep;
      });
    };

    const onSpeechStart = () => setIsAssistantSpeaking(true);
    const onSpeechEnd = () => setIsAssistantSpeaking(false);

    const onMessage = async (msg: any) => {
      console.log("Vapi Message Received:", msg);

      if (msg.type === "transcript" && msg.transcriptType === "final") {
        setTranscript((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === msg.role && lastMsg.text === msg.transcript) {
            return prev;
          }
          return [...prev, { role: msg.role, text: msg.transcript }];
        });
      }

      let isProfileCall = false;
      let rawData: any = null;

      // Extract tool call object across all Vapi event shapes
      const toolCallObj =
        msg.toolCallList?.[0] ||
        msg.toolCalls?.[0] ||
        msg.message?.toolCalls?.[0] ||
        msg.message?.toolCallList?.[0];

      if (toolCallObj && (toolCallObj.function?.name === "submitProfile" || toolCallObj.name === "submitProfile")) {
        isProfileCall = true;
        rawData = toolCallObj.function?.arguments || toolCallObj.arguments;
      } else if (msg.type === "function-call" && msg.functionCall?.name === "submitProfile") {
        isProfileCall = true;
        rawData = msg.functionCall.parameters || msg.functionCall.arguments;
      } else if (msg.functionCall?.name === "submitProfile") {
        isProfileCall = true;
        rawData = msg.functionCall.parameters || msg.functionCall.arguments;
      }

      if (isProfileCall && rawData) {
        console.log("Captured submitProfile tool call payload:", rawData);
        setStep(4);
        try {
          vapi.stop();
        } catch (e) {
          console.error("vapi.stop error:", e);
        }

        let profileData: any = rawData;
        if (typeof rawData === "string") {
          try {
            profileData = JSON.parse(rawData);
          } catch (e) {
            console.error("Failed to parse rawData string:", e);
          }
        }

        let topicAssessments = profileData.topicAssessments;
        if (typeof topicAssessments === "string") {
          try {
            topicAssessments = JSON.parse(topicAssessments);
          } catch {
            topicAssessments = [];
          }
        }
        if (!Array.isArray(topicAssessments)) topicAssessments = [];

        const extractedTopics = topicAssessments.map((t: any) => t.topic).filter(Boolean);
        const extractedSubjects = topicAssessments.map((s: any) => s.subject).filter(Boolean);

        const finalSubjects = Array.from(new Set([...extractedSubjects, ...selectedSubjects]));

        try {
          const token = await getAuthToken();

          if (!token) {
            toast.error("Security Error: You are not logged in or your token expired.");
            setStep(1);
            return;
          }

          const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:5000';
          const res = await fetch(`${baseUrl}/api/profile/questionnaire`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: studentId,
              personality: profileData.bigFivePersonality || {
                openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0
              },
              learningStyle: profileData.learningPattern ? [profileData.learningPattern] : [],
              knowledgeLevel: {
                score: profileData.knowledgeScore || 50,
                feedback: profileData.knowledgeFeedback || "Pending assessment",
                topicBreakdown: topicAssessments
              },
              topics: selectedTopics.length > 0 ? selectedTopics : extractedTopics,
              subjects: finalSubjects,
              availability: {
                times: Array.isArray(profileData.availabilityPref)
                  ? profileData.availabilityPref
                  : profileData.availabilityPref
                    ? [profileData.availabilityPref]
                    : ["Any"]
              },
              academicGoals: profileData.academicGoals || "Improve grades"
            })
          });

          if (res.ok) {
            setDynamicProfile({ ...profileData, topicAssessments });
            setTimeout(() => setStep(5), 2500);
          } else {
            console.error("Backend rejected the save. Status:", res.status);
            toast.error("The server rejected your profile. Please check your authentication.");
            setStep(1);
          }
        } catch (error: any) {
          console.error("Failed to connect to backend:", error);
          toast.error(`Network error connecting to backend: ${error?.message || "Check if Express server is running on port 5000"}`);
          setStep(1);
        }
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("error", onError);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("error", onError);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
      vapi.stop();
    };
  }, [selectedSubjects, selectedTopics, studentId]);

  // CHANGED LIMIT TO 2
  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
    setSelectedTopics([]);
  };

  // CHANGED LIMIT TO 2
  const handleAddCustomSubject = () => {
    if (customSubject && selectedSubjects.length < 2) {
      setSelectedSubjects(prev => [...prev, customSubject]);
      setCustomSubject("");
    }
  };

  // CHANGED LIMIT TO 2
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) return prev.filter(t => t !== topic);
      if (prev.length >= 2) return prev;
      return [...prev, topic];
    });
  };

  // CHANGED LIMIT TO 2
  const handleAddCustomTopic = () => {
    if (customTopic && selectedTopics.length < 2) {
      setSelectedTopics(prev => [...prev, customTopic]);
      setCustomTopic("");
    }
  };

  const startVoiceExam = async () => {
    if (isConnected) vapi.stop();
    else {
      setIsConnecting(true);
      try {
        const topicsBySub = getTopicsBySubjectString();
        // Derive active subjects strictly from topicsBySub so unused subjects aren't passed to Vapi
        const activeSubjectLabels = topicsBySub 
          ? topicsBySub.split(" | ").map(s => s.split(":")[0].trim()) 
          : selectedSubjects.map(id => VAST_SUBJECTS.find(s => s.id === id)?.label || id);

        const subjectNames = Array.from(new Set(activeSubjectLabels)).join(", ");

        await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
          variableValues: {
            subjects: subjectNames,
            topics: selectedTopics.join(", "),
            topicsBySubject: topicsBySub
          }
        });
      } catch (e) {
        console.error(e);
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-[32px] border border-gray-100 shadow-2xl overflow-hidden relative min-h-150 flex flex-col">

        {step < 5 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
            <motion.div className="h-full bg-blue-600" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} />
          </div>
        )}

        <div className="p-8 md:p-12 flex-1 flex flex-col relative z-10">
          <AnimatePresence mode="wait">

            {/* STEP 1: SUBJECTS */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">What are you studying?</h2>
                  <p className="text-gray-500">Select or type the broad subjects you&apos;re focusing on. <span className="font-bold text-blue-600">(Max 2)</span></p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {VAST_SUBJECTS.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub.id);
                    return (
                      <button key={sub.id} onClick={() => toggleSubject(sub.id)} className={`p-5 rounded-2xl border-2 text-left transition-all ${isSelected ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                        <span className={`font-semibold ${isSelected ? "text-blue-600" : "text-gray-700"}`}>{sub.label}</span>
                      </button>
                    )
                  })}
                  {selectedSubjects.filter(sub => !VAST_SUBJECTS.some(v => v.id === sub)).map(customSub => (
                    <button key={customSub} onClick={() => toggleSubject(customSub)} className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50 text-left">
                      <span className="font-semibold text-blue-600">{customSub}</span>
                    </button>
                  ))}
                </div>

                <div className="mb-8">
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Don&apos;t see your subject?</label>
                  <div className="flex gap-2">
                    <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="e.g. Graphic Design" className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 outline-none" />
                    <button onClick={handleAddCustomSubject} className="w-12 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="mt-auto flex justify-end">
                  <button onClick={() => setStep(2)} disabled={selectedSubjects.length === 0} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">Continue <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: TOPICS */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Pinpoint your topics</h2>
                  <p className="text-gray-500">Select specific areas to refine your matches. <span className="font-bold text-blue-600">(Max 2)</span></p>
                </div>

                {availableTopics.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                    <p className="text-amber-800 text-sm font-medium">Couldn&apos;t find predefined major topics for your custom subjects. Please type in the specific topics you want to discuss below.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 mb-8">
                    {availableTopics.map(topic => {
                      const isSelected = selectedTopics.includes(topic);
                      return (
                        <button key={topic} onClick={() => toggleTopic(topic)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isSelected ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-100 text-gray-600"}`}>
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mb-8">
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Add custom topic</label>
                  <div className="flex gap-2">
                    <input type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} placeholder="e.g. Advanced Thermodynamics" className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 outline-none" />
                    <button onClick={handleAddCustomTopic} className="w-12 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedTopics.filter(t => !availableTopics.includes(t)).map(t => (
                    <span key={t} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold flex items-center gap-2">
                      {t} <button onClick={() => toggleTopic(t)} className="hover:text-blue-900"><Plus className="w-4 h-4 rotate-45" /></button>
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-gray-500 font-semibold hover:text-gray-900">Back</button>
                  <button onClick={() => setStep(3)} disabled={selectedTopics.length === 0} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold disabled:opacity-50">Next Step <ArrowRight className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: EXAM */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-[24px] flex items-center justify-center mb-6 relative shrink-0">
                  <Sparkles className="w-10 h-10 text-blue-600 relative z-10" />
                  {isConnected && isAssistantSpeaking && <span className="absolute inset-0 rounded-[24px] border-4 border-blue-600/50 animate-ping" />}
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2 shrink-0">
                  {isConnected ? "Exam in Progress" : "Let's find your baseline"}
                </h2>

                {!isConnected ? (
                  <>
                    <p className="text-gray-500 max-w-md mx-auto mb-10">
                      BondEd&apos;s AI Voice Assistant will now conduct a 3-minute oral diagnostic to map your knowledge level and learning personality.
                    </p>
                    <div className="flex gap-4">
                      <button onClick={() => setStep(2)} className="px-8 py-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                        Go Back
                      </button>
                      <button onClick={startVoiceExam} disabled={isConnecting} className="flex items-center gap-2 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg bg-blue-600 hover:bg-blue-700">
                        {isConnecting ? <><DotsRing className=" w-8 h-8"  /> Connecting...</> : <><Mic className="w-5 h-5" /> Start Voice Exam</>}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col h-64 mt-4">
                    <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Live Transcript</span>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-4">
                      {transcript.length === 0 && (
                        <p className="text-gray-400 text-sm text-center mt-8 italic">BondEd is listening...</p>
                      )}
                      {transcript.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                          <span className={`text-[10px] font-bold uppercase mb-1 ${msg.role === "user" ? "text-blue-500" : "text-violet-500"}`}>
                            {msg.role === "user" ? "You" : "BondEd"}
                          </span>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: LOADING */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <DotsRing className="text-violet-600 mb-6 w-8 h-8"  />
                <h3 className="text-2xl font-bold text-gray-900">Finalizing your profile...</h3>
                <p className="text-gray-500 mt-2 font-medium">Extracting personality traits & mapping cognitive patterns</p>
              </motion.div>
            )}

            {/* STEP 5: REVAMPED DETAILED RESULTS */}
            {step === 5 && dynamicProfile && (
              <motion.div key="s5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col h-full">

                {/* Top Status Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Your Cognitive Profile</h2>
                    <p className="text-gray-500 mt-1">Based on your 3-minute oral diagnostic</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Knowledge Score</p>
                      <div className="text-3xl font-black text-blue-600">{dynamicProfile.knowledgeScore || 0}<span className="text-lg text-gray-400">/100</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 mb-8">

                  {/* Visual Analytics Column (Left) */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex flex-col items-center justify-center h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                          { metric: "Extroversion", value: dynamicProfile.bigFivePersonality?.extraversion ?? dynamicProfile.extroversionScore ?? 0 },
                          { metric: "Analytical", value: dynamicProfile.analyticalScore || 0 },
                          { metric: "Theoretical", value: dynamicProfile.theoreticalScore || 0 },
                          { metric: "Hands-on", value: dynamicProfile.handsOnScore || 0 }
                        ]}>
                          <defs>
                            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Radar name="Student" dataKey="value" stroke="#2563eb" strokeWidth={3} fill="url(#radarGradient)" />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {dynamicProfile.topicAssessments && dynamicProfile.topicAssessments.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {dynamicProfile.topicAssessments.map((ta: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-start gap-4"
                          >
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                              <Target className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-gray-900">{ta.topic}</h4>
                                <span className="text-sm font-black text-blue-600">
                                  {ta.score}
                                  <span className="text-xs text-gray-400">/100</span>
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{ta.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Target className="w-6 h-6" /></div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">Knowledge Feedback</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{dynamicProfile.knowledgeFeedback}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Reasoning Column (Right) */}
                  <div className="flex flex-col gap-4">

                    {/* Learning Style Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Lightbulb className="w-5 h-5" /></div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Primary Learning Style</h4>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-sm capitalize">{dynamicProfile.learningPattern}</span>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                          <span className="font-bold text-gray-900">Why?</span> {dynamicProfile.learningStyleReasoning || "Based on your answers, this is the most effective way for you to absorb information."}
                        </p>
                      </div>
                    </div>

                    {/* Personality Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-100 text-violet-600 rounded-lg"><Brain className="w-5 h-5" /></div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Social Temperament</h4>
                        </div>
                        <span className="px-3 py-1 bg-violet-50 text-violet-700 font-bold rounded-lg text-sm capitalize">
                          {dynamicProfile.socialTemperament || (dynamicProfile.bigFivePersonality?.extraversion > 50 ? "Extroverted" : "Balanced")}
                        </span>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                          <span className="font-bold text-gray-900">Why?</span> {dynamicProfile.personalityReasoning || "Your communication style aligns perfectly with this temperament for group collaborations."}
                        </p>
                      </div>
                    </div>

                    {/* Availability Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Study Availability</h4>
                          <p className="text-sm font-bold text-gray-900">{dynamicProfile.availabilityPref || "Flexible / Not Specified"}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> You can update these preferences later in settings.
                  </p>
                  <button
                    onClick={() => router.replace(`/Student/${studentId}/Dashboard`)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all hover:shadow-xl hover:-translate-y-0.5">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}