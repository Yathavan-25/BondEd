import prisma from "../config/prisma.js";

const getDurationMins = (start: Date, end: Date | null) => {
    if (!end) return 30; 
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
};

const parseTranscript = (raw: string | null | undefined): any[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const SessionModel = {
    getUserSummaries: async (userId: string) => {
        const sessions = await prisma.session.findMany({
            where: {
                status: { in: ['completed', 'Completed'] },
                OR: [ { hostId: userId }, { participants: { some: { id: userId } } } ]
            },
            include: {
                host: { include: { profile: true } },
                participants: true,
                analysis: true
            },
            orderBy: { startTime: 'desc' }
        });

        const voice: any[] = [];
        const collaborative: any[] = [];

        for (const session of sessions) {
            const allUsers = new Set([session.hostId, ...session.participants.map(p => p.id)]);
            const isVoice = allUsers.size === 1;

            const durationMins = getDurationMins(session.startTime, session.endTime);
            const safeSession = session as any;
            const analysis = safeSession.analysis;
            
            const knowDem = analysis?.knowledgeDemonstrated || {};
            const profUpd = analysis?.profileUpdates || {};
            const partMet = analysis?.participantMetrics || {};

            const parsedTranscript = parseTranscript(analysis?.transcriptUrl);

            const formattedSession = {
                id: session.id,
                lesson: {
                    title: safeSession.title || (session.host.profile?.subjects[0] ? `${session.host.profile.subjects[0]} Session` : "Study Session"),
                    date: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    completedAt: session.endTime ? new Date(session.endTime).toISOString() : null,
                    duration: `${durationMins} mins`,
                    peers: isVoice ? undefined : Array.from(allUsers).filter(id => id !== userId).map(() => "Peer"), 
                    topicsCovered: analysis?.topics || ["General Review"],
                    keyTakeaways: analysis?.summary ? analysis.summary.split('.').filter(Boolean).slice(0, 3) : ["Session completed successfully."],
                    nextSteps: profUpd?.nextSteps || "Review notes before next session.",
                    flashcards: analysis?.flashcardsGenerated || [],
                    transcript: parsedTranscript
                },
                analytics: {
                    score: knowDem?.score || 85,
                    knowledgeStrengths: knowDem?.strengths || [{ subject: analysis?.topics?.[0] || "Core Concepts", proficiency: 85 }],
                    personalityTraits: profUpd?.exhibitedTraits || ["Focused", "Engaged"],
                    learningStyle: profUpd?.learningStyleHint || "Adaptive",
                    aiInsight: partMet?.insight || "Great focus during this session."
                }
            };

            if (!isVoice) {
                const peers = session.participants.filter(p => p.id !== userId);
                if (session.hostId !== userId) peers.push(session.host);
                formattedSession.lesson.peers = peers.map(p => `${p.firstName} ${p.lastName?.charAt(0) || ''}.`.trim());
                collaborative.push(formattedSession);
            } else {
                voice.push(formattedSession);
            }
        }

        return { voice, collaborative };
    },

    getUserAnalytics: async (userId: string) => {
        const sessions = await prisma.session.findMany({
            where: {
                status: { in: ['completed', 'Completed'] },
                OR: [ { hostId: userId }, { participants: { some: { id: userId } } } ]
            },
            include: { host: true, participants: true }
        });

        let totalMins = 0;
        const uniquePartners = new Set<string>();
        const partnerStats: Record<string, { name: string, initials: string, time: number, count: number }> = {};
        const dailyMins: Record<string, number> = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };

        sessions.forEach(session => {
            const mins = getDurationMins(session.startTime, session.endTime);
            totalMins += mins;

            const dayName = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short' });
            if (dayName in dailyMins) {
                dailyMins[dayName] = (dailyMins[dayName] ?? 0) + mins;
            }

            const peers = session.participants.filter(p => p.id !== userId);
            if (session.hostId !== userId) peers.push(session.host);
            
            peers.forEach(peer => {
                uniquePartners.add(peer.id);
                let pStat = partnerStats[peer.id];
                if (!pStat) {
                    pStat = { name: `${peer.firstName} ${peer.lastName || ''}`.trim(), initials: `${peer.firstName?.[0] || ''}${peer.lastName?.[0] || ''}`, time: 0, count: 0 };
                    partnerStats[peer.id] = pStat;
                }
                pStat.time += mins;
                pStat.count += 1;
            });
        });

        const topPartners = Object.values(partnerStats)
            .sort((a, b) => b.time - a.time).slice(0, 3)
            .map((p, i) => ({
                id: i + 1, name: p.name, initials: p.initials, sessions: p.count, hours: `${(p.time / 60).toFixed(1)} hrs`, topHours: `${Math.floor(p.time / 60)}h ${p.time % 60}m`, subject: "Collaborative Study", match: "90%+", bg: ["from-indigo-500 to-purple-500", "from-orange-400 to-pink-500", "from-blue-400 to-cyan-500"][i % 3]
            }));

        const chartData = Object.keys(dailyMins).map(day => {
            const mins = dailyMins[day] ?? 0;
            return { day, height: Math.min(100, Math.max(10, (mins / 120) * 100)), value: `${(mins / 60).toFixed(1)}h`, active: day === new Date().toLocaleDateString('en-US', { weekday: 'short' }) };
        });

        const usageLogs = await prisma.usageLog.findMany({ where: { userId } });
        let voiceMins = 0; let collabMins = 0;
        usageLogs.forEach(log => {
            if (log.service === 'vapi') voiceMins += log.usage;
            if (log.service === 'daily') collabMins += log.usage;
        });

        return {
            topPartners,
            timeBySubject: [{ subject: "Core Subjects", hours: `${(totalMins / 60).toFixed(1)}h`, percent: 100, color: "bg-[#1363CB]" }],
            creditsData: {
                voice: { total: 500, used: { Day: Math.floor(voiceMins/30), Week: Math.floor(voiceMins/4), Month: Math.floor(voiceMins) } },
                collab: { total: 1000, used: { Day: Math.floor(collabMins/30), Week: Math.floor(collabMins/4), Month: Math.floor(collabMins) } },
            },
            chartData,
            stats: [
                { title: "Total hours", value: Math.floor(totalMins / 60).toString(), subtitle: "TOTAL LOGGED", subColor: "text-emerald-600", stroke: "#10b981", trend: [10, 20, 30, 40, 50, 60, totalMins] },
                { title: "Avg session", value: sessions.length ? `${Math.floor(totalMins / sessions.length)} min` : "0 min", subtitle: "AVERAGE TIME", subColor: "text-emerald-600", stroke: "#f97316", trend: [40, 42, 45, 48, 50, 52, 55] },
                { title: "Unique partners", value: uniquePartners.size.toString(), subtitle: "STUDY BUDDIES", subColor: "text-blue-600", stroke: "#2563eb", trend: [1, 2, 2, 3, 3, 4, uniquePartners.size] },
                { title: "Sessions Completed", value: sessions.length.toString(), subtitle: "ALL TIME", subColor: "text-blue-600", stroke: "#8b5cf6", trend: [1, 5, 10, 15, 20, 22, sessions.length] },
            ]
        };
    },

    processVoiceSession: async ( 
        userId: string, 
        summary: string, 
        recordingUrl: string, 
        structuredData: any, 
        selectedTopic: string, 
        transcriptsArray: any[],
        sessionStartTime: Date,
        sessionEndTime: Date) => {
        const profile = await prisma.profile.findUnique({ where: { userId } });
        if (!profile) throw new Error("Profile not found");
    
        const focusScore = structuredData?.focusScore ?? 85;
        const knowledgeScore = structuredData?.knowledgeScore ?? 85;
        const weeklyGoal = structuredData?.weeklyGoal || "Review session concepts.";
        const flashcards = structuredData?.flashcards || [];
        const topicAssessments = Array.isArray(structuredData?.topicAssessments) ? structuredData.topicAssessments : [];
        const sessionInsight = structuredData?.sessionInsight || null;
    
        // --- 1. Merge Big Five personality (running average with prior scores) ---
        const priorPersonality = (profile.personality as any) || {};
        const newBigFive = structuredData?.bigFivePersonality || {};
        const mergedPersonality = { ...priorPersonality };
    
        (["openness", "conscientiousness", "extraversion", "agreeableness"] as const).forEach((trait) => {
            if (typeof newBigFive[trait] === "number") {
                const prior = typeof priorPersonality[trait] === "number" ? priorPersonality[trait] : newBigFive[trait];
                mergedPersonality[trait] = Math.round((prior + newBigFive[trait]) / 2);
            }
        });
    
        if (structuredData?.personalityReasoning) {
            mergedPersonality.reasoning = structuredData.personalityReasoning;
        }
        mergedPersonality.updatedAt = new Date().toISOString();
    
        // --- 2. Merge learning style ---
        let newLearningStyle = profile.learningStyle;
        if (structuredData?.learningPattern) {
            newLearningStyle = [structuredData.learningPattern];
        }
    
        // --- 3. Merge knowledgeLevel (overall score + per-topic breakdown) ---
        const currentKnowledge = (profile.knowledgeLevel as any) || { score: 50, topicBreakdown: [] };
        const priorBreakdown: any[] = Array.isArray(currentKnowledge.topicBreakdown) ? currentKnowledge.topicBreakdown : [];
    
        const mergedBreakdown = [...priorBreakdown];
        const sessionTopics = topicAssessments.length > 0
            ? topicAssessments
            : [{ topic: selectedTopic, subject: selectedTopic, score: knowledgeScore, summary: structuredData?.knowledgeFeedback || "" }];
    
        sessionTopics.forEach((ta: any) => {
            const existingIdx = mergedBreakdown.findIndex((b) => b.topic === ta.topic);
            if (existingIdx !== -1) {
                // Running average against the prior score for this specific topic
                mergedBreakdown[existingIdx] = {
                    ...mergedBreakdown[existingIdx],
                    score: Math.round((mergedBreakdown[existingIdx].score + ta.score) / 2),
                    summary: ta.summary,
                    subject: ta.subject || mergedBreakdown[existingIdx].subject
                };
            } else {
                mergedBreakdown.push(ta);
            }
        });
    
        const overallScore = mergedBreakdown.length > 0
            ? Math.round(mergedBreakdown.reduce((sum, b) => sum + (b.score || 0), 0) / mergedBreakdown.length)
            : knowledgeScore;
    
        const updatedKnowledge = {
            ...currentKnowledge,
            score: overallScore,
            topicBreakdown: mergedBreakdown,
            feedback: structuredData?.knowledgeFeedback || currentKnowledge.feedback
        };
    
        // --- 4. Topics list ---
        const updatedTopics = profile.topics.includes(selectedTopic) ? profile.topics : [...profile.topics, selectedTopic];
    
        // --- 5. Weekly goal (academicGoals field doubles as the rolling weekly-goal log) ---
        const updatedGoals = `${profile.academicGoals}\n[Week of ${new Date().toLocaleDateString()}]: ${weeklyGoal}`;
    
        const updatedProfile = await prisma.profile.update({
            where: { userId },
            data: {
                academicGoals: updatedGoals,
                topics: updatedTopics,
                knowledgeLevel: updatedKnowledge,
                learningStyle: newLearningStyle,
                personality: mergedPersonality,
                updatedAt: new Date()
            }
        });
    
        // --- 6. Save session + analysis record ---
        const newSession = await prisma.session.create({
            data: {
                hostId: userId,
                status: "completed",
                startTime: sessionStartTime,
                endTime: sessionEndTime,
                title: `${selectedTopic} AI Session`,
                subject: profile.subjects[0] || "General Review",
                recordingUrl: recordingUrl,
                analysis: {
                    create: {
                        transcriptUrl: JSON.stringify(transcriptsArray),
                        summary: summary,
                        topics: [selectedTopic],
                        participantMetrics: { 
                            focus: focusScore, 
                            participation: "Active",
                            insight: sessionInsight
                        },
                        knowledgeDemonstrated: {
                            score: knowledgeScore,
                            strengths: sessionTopics.map((ta: any) => ({ subject: ta.topic, proficiency: ta.score }))
                        },
                        profileUpdates: {
                            nextSteps: weeklyGoal,
                            learningStyleHint: structuredData?.learningPattern || "Adaptive",
                            exhibitedTraits: Object.entries(newBigFive)
                                .filter(([, v]) => typeof v === "number")
                                .map(([trait, v]) => `${trait}: ${v}`)
                        },
                        flashcardsGenerated: flashcards
                    }
                }
            },
            include: {
                analysis: true
            }
        });
    
        return { profile: updatedProfile, session: newSession };
    }
};