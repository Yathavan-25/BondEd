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

    logCollabSessionUsage: async (userId: string, sessionId: string, durationMins: number) => {
        return await prisma.$transaction([
            prisma.userCredits.update({
                where: { userId },
                data: { dailyMinutesRemaining: { decrement: durationMins } }
            }),
            prisma.usageLog.create({
                data: {
                    userId,
                    service: 'daily',
                    usage: durationMins,
                    cost: 0,
                    sessionId
                }
            })
        ]);
    },

    processVoiceSession: async ( 
        userId: string, 
        summary: string = "", 
        recordingUrl: string = "", 
        structuredData: any = {}, 
        selectedTopic: string = "General Review", 
        transcriptsArray: any[] = [], 
        sessionStartTime: Date = new Date(), 
        sessionEndTime: Date = new Date()
    ) => {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: { user: true }
        });
        if (!profile) throw new Error("Profile not found");

        const safeTopic = selectedTopic || "General Review";
        const startTime = sessionStartTime instanceof Date ? sessionStartTime : new Date(sessionStartTime || Date.now());
        const endTime = sessionEndTime instanceof Date ? sessionEndTime : new Date(sessionEndTime || Date.now());
    
        const durationMins = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / 60000));

        try {
            await prisma.$transaction([
                prisma.userCredits.update({
                    where: { userId },
                    data: { vapiMinutesRemaining: { decrement: durationMins } }
                }),
                prisma.usageLog.create({
                    data: { userId, service: 'vapi', usage: durationMins, cost: 0 }
                })
            ]);
        } catch (creditErr) {
            console.error("Failed to deduct VAPI credits:", creditErr);
        }

        const safeData = structuredData || {};
        const summaryText = safeData.sessionSummary || summary || "Collaborative study session completed.";
        const focusScore = safeData.groupFocusScore ?? safeData.focusScore ?? 85;
        const collaborationQuality = safeData.collaborationQuality ?? 85;
        const flashcards = Array.isArray(safeData.flashcards) ? safeData.flashcards : [];
        const actionItems = Array.isArray(safeData.actionItems) ? safeData.actionItems : [];
        const topics = Array.isArray(safeData.topicsCovered) && safeData.topicsCovered.length > 0 
            ? safeData.topicsCovered 
            : [safeTopic];

        // Extract participant assessment for current user if available
        const assessments = Array.isArray(safeData.participantAssessments) ? safeData.participantAssessments : [];
        const userFirstName = profile.user?.firstName?.toLowerCase() || "";
        const userAssessment = assessments.find((a: any) => a.name && a.name.toLowerCase() === userFirstName) || assessments[0] || {};

        const knowledgeScore = typeof userAssessment?.knowledgeScore === "number" 
            ? userAssessment.knowledgeScore 
            : (safeData.knowledgeScore ?? 85);

        const weeklyGoal = actionItems.length > 0 ? actionItems.join("; ") : (safeData.weeklyGoal || "Review session concepts.");
        const sessionInsight = userAssessment?.insight || safeData.sessionInsight || null;

        const priorPersonality = (profile.personality as any) || {};
        const newBigFive = (userAssessment?.bigFivePersonality || safeData.bigFivePersonality || {}) as Record<string, any>;
        const mergedPersonality: Record<string, any> = { ...priorPersonality };
    
        (["openness", "conscientiousness", "extraversion", "agreeableness"] as const).forEach((trait) => {
            if (typeof newBigFive[trait] === "number") {
                const prior = typeof priorPersonality[trait] === "number" ? priorPersonality[trait] : newBigFive[trait];
                mergedPersonality[trait] = Math.round((prior + newBigFive[trait]) / 2);
            }
        });
        if (safeData.personalityReasoning) mergedPersonality.reasoning = safeData.personalityReasoning;
        mergedPersonality.updatedAt = new Date().toISOString();
    
        let newLearningStyle = profile.learningStyle;
        const assessedPattern = userAssessment?.learningPattern || safeData.learningPattern;
        if (assessedPattern) newLearningStyle = [assessedPattern];
    
        // --- FORCE KNOWLEDGE LEVEL TO TRACK THE SELECTED TOPIC ---
        const currentKnowledge = (profile.knowledgeLevel as any) || { score: 50, topicBreakdown: [] };
        const mergedBreakdown: any[] = Array.isArray(currentKnowledge.topicBreakdown) ? [...currentKnowledge.topicBreakdown] : [];
        
        const existingIdx = mergedBreakdown.findIndex((b) => b.topic && b.topic.toLowerCase().trim() === safeTopic.toLowerCase().trim());
        
        if (existingIdx !== -1) {
            mergedBreakdown[existingIdx] = {
                ...mergedBreakdown[existingIdx],
                score: Math.round((mergedBreakdown[existingIdx].score + knowledgeScore) / 2),
                summary: safeData.knowledgeFeedback || mergedBreakdown[existingIdx].summary || ""
            };
        } else {
            mergedBreakdown.push({
                topic: safeTopic,
                subject: profile.subjects?.[0] || "General Studies",
                score: knowledgeScore,
                summary: safeData.knowledgeFeedback || ""
            });
        }
    
        const overallScore = mergedBreakdown.length > 0
            ? Math.round(mergedBreakdown.reduce((sum, b) => sum + (b.score || 0), 0) / mergedBreakdown.length)
            : knowledgeScore;
    
        const updatedKnowledge = {
            ...currentKnowledge,
            score: overallScore,
            topicBreakdown: mergedBreakdown,
            feedback: safeData.knowledgeFeedback || currentKnowledge.feedback || ""
        };
    
        const currentTopics = Array.isArray(profile.topics) ? profile.topics : [];
        const updatedTopics = currentTopics.includes(safeTopic) 
            ? currentTopics 
            : [...currentTopics, safeTopic];
    
        const currentGoals = profile.academicGoals || "";
        const updatedGoals = currentGoals 
            ? `${currentGoals}\n[Week of ${new Date().toLocaleDateString()}]: ${weeklyGoal}` 
            : `[Week of ${new Date().toLocaleDateString()}]: ${weeklyGoal}`;
    
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
    
        const exhibitedTraits = (typeof newBigFive === "object" && newBigFive !== null)
            ? Object.entries(newBigFive).filter(([, v]) => typeof v === "number").map(([trait, v]) => `${trait}: ${v}`)
            : [];

        const newSession = await prisma.session.create({
            data: {
                hostId: userId,
                status: "completed",
                startTime: startTime,
                endTime: endTime,
                title: `${safeTopic} AI Session`,
                subject: profile.subjects?.[0] || "General Review",
                recordingUrl: recordingUrl || "",
                analysis: {
                    create: {
                        transcriptUrl: JSON.stringify(transcriptsArray || []),
                        summary: summaryText,
                        topics: topics,
                        participantMetrics: { focus: focusScore, collaborationQuality, participation: userAssessment?.participationLevel || "Active", insight: sessionInsight, assessments },
                        knowledgeDemonstrated: { score: knowledgeScore, strengths: [{ subject: safeTopic, proficiency: knowledgeScore }] },
                        profileUpdates: {
                            nextSteps: weeklyGoal,
                            learningStyleHint: assessedPattern || "Adaptive",
                            exhibitedTraits
                        },
                        flashcardsGenerated: flashcards
                    }
                }
            },
            include: { analysis: true }
        });
    
        return { profile: updatedProfile, session: newSession };
    }
};