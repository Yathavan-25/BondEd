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
                OR: [{ hostId: userId }, { participants: { some: { id: userId } } }]
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
            const safeSession = session as any;
            const analysis = safeSession.analysis;
            const partMet = analysis?.participantMetrics || {};

            const isVoice = partMet?.sessionType === 'ai-voice' || safeSession.title?.includes("AI Session") || (!session.dailyRoomUrl && allUsers.size === 1);

            const durationMins = getDurationMins(session.startTime, session.endTime);

            const knowDem = analysis?.knowledgeDemonstrated || {};
            const profUpd = analysis?.profileUpdates || {};

            const parsedTranscript = parseTranscript(analysis?.transcriptUrl);
            const rawTraits = profUpd?.exhibitedTraits;
            const personalityTraits = (Array.isArray(rawTraits) && rawTraits.length > 0)
                ? rawTraits
                : ["Openness", "Conscientiousness", "Analytical", "Engaged"];

            const visualAssets = profUpd?.visualAssets || (profUpd?.visualAsset ? [profUpd.visualAsset] : (parsedTranscript.filter((t: any) => t.type === 'image').map((t: any) => t.text)));
            const visualAsset = profUpd?.visualAsset || partMet?.visualAsset || (visualAssets.length > 0 ? visualAssets[visualAssets.length - 1] : null);

            const formattedSession = {
                id: session.id,
                lesson: {
                    title: safeSession.title || (session.host.profile?.subjects[0] ? `${session.host.profile.subjects[0]} Session` : "Study Session"),
                    date: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    completedAt: session.endTime ? new Date(session.endTime).toISOString() : null,
                    duration: `${durationMins} mins`,
                    peers: isVoice ? undefined : Array.from(allUsers).filter(id => id !== userId).map(() => "Peer"),
                    topicsCovered: analysis?.topics || ["General Review"],
                    keyTakeaways: analysis?.summary ? analysis.summary.split('.').map((s: string) => s.trim()).filter(Boolean).slice(0, 4) : ["Session completed successfully."],
                    nextSteps: profUpd?.nextSteps || "Review notes before next session.",
                    flashcards: analysis?.flashcardsGenerated || [],
                    transcript: parsedTranscript,
                    visualAsset,
                    visualAssets
                },
                analytics: {
                    score: knowDem?.score || 85,
                    knowledgeStrengths: knowDem?.strengths || [{ subject: analysis?.topics?.[0] || "Core Concepts", proficiency: 85 }],
                    personalityTraits,
                    learningStyle: profUpd?.learningStyleHint || (session.host.profile?.learningStyle?.[0] || "Adaptive"),
                    aiInsight: partMet?.insight || "Great focus and active engagement during this session."
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
        const profile = await prisma.profile.findUnique({ where: { userId } });
        const userCredits = await prisma.userCredits.findUnique({ where: { userId } });

        const sessions = await prisma.session.findMany({
            where: {
                status: { in: ['completed', 'Completed'] },
                OR: [{ hostId: userId }, { participants: { some: { id: userId } } }]
            },
            include: { host: true, participants: true }
        });

        let totalMins = 0;
        const uniquePartners = new Set<string>();
        const partnerStats: Record<string, { name: string, initials: string, time: number, count: number, subjects: Record<string, number> }> = {};
        const dailyMins: Record<string, number> = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
        const topicMinsMap: Record<string, number> = {};

        sessions.forEach(session => {
            const mins = getDurationMins(session.startTime, session.endTime);
            totalMins += mins;

            const dayName = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short' });
            if (dayName in dailyMins) {
                dailyMins[dayName] = (dailyMins[dayName] ?? 0) + mins;
            }

            const safeSess = session as any;
            let sessionTopics: string[] = [];

            if (Array.isArray(safeSess.analysis?.topics) && safeSess.analysis.topics.length > 0) {
                sessionTopics = safeSess.analysis.topics.filter((t: string) => t && t.toLowerCase() !== "general study" && t.toLowerCase() !== "general review");
            }

            if (sessionTopics.length === 0 && safeSess.title) {
                const cleanedTitle = safeSess.title
                    .replace(/AI Session/i, '')
                    .replace(/Study Session/i, '')
                    .replace(/Session/i, '')
                    .trim();
                if (cleanedTitle && cleanedTitle.toLowerCase() !== "general") sessionTopics = [cleanedTitle];
            }

            if (sessionTopics.length === 0) {
                sessionTopics = ["General Topics"];
            }

            sessionTopics.forEach((topic: string) => {
                topicMinsMap[topic] = (topicMinsMap[topic] || 0) + Math.round(mins / sessionTopics.length);
            });

            const subj = session.subject || "General Study";

            const peers = session.participants.filter(p => p.id !== userId);
            if (session.hostId !== userId) peers.push(session.host);

            peers.forEach(peer => {
                uniquePartners.add(peer.id);
                let pStat = partnerStats[peer.id];
                if (!pStat) {
                    pStat = {
                        name: `${peer.firstName} ${peer.lastName || ''}`.trim(),
                        initials: `${peer.firstName?.[0] || ''}${peer.lastName?.[0] || ''}`,
                        time: 0,
                        count: 0,
                        subjects: {}
                    };
                    partnerStats[peer.id] = pStat;
                }
                pStat.time += mins;
                pStat.count += 1;
                pStat.subjects[subj] = (pStat.subjects[subj] || 0) + mins;
            });
        });

        const colors = [
            "bg-[#1363CB]", "bg-purple-600", "bg-emerald-500", "bg-amber-500",
            "bg-pink-500", "bg-indigo-500", "bg-cyan-500", "bg-rose-500"
        ];

        let timeByTopic = Object.entries(topicMinsMap).map(([topic, mins], idx) => {
            const percent = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
            return {
                topic,
                subject: topic, // Backwards compatibility
                hours: mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`,
                percent,
                color: colors[idx % colors.length]
            };
        }).sort((a, b) => b.percent - a.percent);

        if (timeByTopic.length === 0) {
            const userTopics = profile?.topics && profile.topics.length > 0 ? profile.topics : ["General Topics"];
            const equalShare = Math.floor(100 / userTopics.length);
            timeByTopic = userTopics.map((topic, idx) => ({
                topic,
                subject: topic,
                hours: "0.0h",
                percent: equalShare,
                color: colors[idx % colors.length]
            }));
        }

        const topPartners = Object.values(partnerStats)
            .sort((a, b) => b.time - a.time).slice(0, 5)
            .map((p, i) => {
                const topSubjEntry = Object.entries(p.subjects).sort((a, b) => b[1] - a[1])[0];
                const topSubj = topSubjEntry ? topSubjEntry[0] : "Collaborative Study";
                return {
                    id: i + 1,
                    name: p.name,
                    initials: p.initials,
                    sessions: p.count,
                    hours: p.time >= 60 ? `${(p.time / 60).toFixed(1)} hrs` : `${p.time} mins`,
                    topHours: `${Math.floor(p.time / 60)}h ${p.time % 60}m`,
                    subject: topSubj,
                    match: `${Math.min(99, 85 + (p.count * 3))}%`,
                    bg: ["from-indigo-500 to-purple-500", "from-orange-400 to-pink-500", "from-blue-400 to-cyan-500", "from-emerald-400 to-teal-500"][i % 4]
                };
            });

        const maxDailyMins = Math.max(...Object.values(dailyMins), 120);
        const chartData = Object.keys(dailyMins).map(day => {
            const mins = dailyMins[day] ?? 0;
            const height = mins > 0 ? Math.min(100, Math.max(12, Math.round((mins / maxDailyMins) * 100))) : 8;
            return {
                day,
                height,
                value: mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`,
                active: day === new Date().toLocaleDateString('en-US', { weekday: 'short' })
            };
        });

        const usageLogs = await prisma.usageLog.findMany({ where: { userId } });
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const sevenDaysMs = 7 * oneDayMs;

        let voiceDay = 0, voiceWeek = 0, voiceMonth = 0;
        let collabDay = 0, collabWeek = 0, collabMonth = 0;

        usageLogs.forEach(log => {
            const age = now - new Date(log.createdAt).getTime();
            const usageMins = Math.round(log.usage);

            if (log.service === 'vapi') {
                voiceMonth += usageMins;
                if (age <= sevenDaysMs) voiceWeek += usageMins;
                if (age <= oneDayMs) voiceDay += usageMins;
            } else if (log.service === 'daily') {
                collabMonth += usageMins;
                if (age <= sevenDaysMs) collabWeek += usageMins;
                if (age <= oneDayMs) collabDay += usageMins;
            }
        });

        const vapiRemaining = userCredits?.vapiMinutesRemaining ?? 60;
        const dailyRemaining = userCredits?.dailyMinutesRemaining ?? 300;

        const voiceTotal = Math.max(vapiRemaining + voiceMonth, 60);
        const collabTotal = Math.max(dailyRemaining + collabMonth, 300);

        const creditsData = {
            voice: {
                total: voiceTotal,
                used: {
                    Day: Math.round(voiceDay),
                    Week: Math.round(voiceWeek),
                    Month: Math.round(voiceMonth)
                }
            },
            collab: {
                total: collabTotal,
                used: {
                    Day: Math.round(collabDay),
                    Week: Math.round(collabWeek),
                    Month: Math.round(collabMonth)
                }
            }
        };

        const totalHoursVal = (totalMins / 60).toFixed(1);
        const avgSessionVal = sessions.length ? `${Math.round(totalMins / sessions.length)} min` : "0 min";

        const trendData = [0, 0, 0, 0, 0, 0, 0];
        const dayKeys = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        dayKeys.forEach((d, idx) => {
            trendData[idx] = dailyMins[d] || 0;
        });

        return {
            topPartners,
            timeByTopic,
            timeBySubject: timeByTopic,
            creditsData,
            chartData,
            stats: [
                {
                    title: "Total hours",
                    value: totalHoursVal,
                    subtitle: "TOTAL LOGGED",
                    subColor: "text-emerald-600",
                    stroke: "#10b981",
                    trend: trendData.some(v => v > 0) ? trendData : [0, 1, 2, 3, 5, 8, Math.round(totalMins / 60)]
                },
                {
                    title: "Avg session",
                    value: avgSessionVal,
                    subtitle: "AVERAGE TIME",
                    subColor: "text-emerald-600",
                    stroke: "#f97316",
                    trend: [30, 35, 40, 42, 45, 48, sessions.length ? Math.round(totalMins / sessions.length) : 0]
                },
                {
                    title: "Unique partners",
                    value: uniquePartners.size.toString(),
                    subtitle: "STUDY BUDDIES",
                    subColor: "text-blue-600",
                    stroke: "#2563eb",
                    trend: [0, 1, 1, 2, 2, 3, uniquePartners.size]
                },
                {
                    title: "Sessions Completed",
                    value: sessions.length.toString(),
                    subtitle: "ALL TIME",
                    subColor: "text-purple-600",
                    stroke: "#8b5cf6",
                    trend: [0, 1, 2, 4, 6, 8, sessions.length]
                }
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

    getLastSessionSummary: async (userId: string, topic?: string) => {
        let session = null;
        if (topic) {
            session = await prisma.session.findFirst({
                where: {
                    status: { in: ['completed', 'Completed'] },
                    OR: [{ hostId: userId }, { participants: { some: { id: userId } } }],
                    AND: [
                        {
                            OR: [
                                { title: { contains: topic, mode: 'insensitive' } },
                                { subject: { contains: topic, mode: 'insensitive' } },
                                { analysis: { topics: { has: topic } } }
                            ]
                        }
                    ]
                },
                include: { analysis: true },
                orderBy: { startTime: 'desc' }
            });
        }
        if (!session) {
            session = await prisma.session.findFirst({
                where: {
                    status: { in: ['completed', 'Completed'] },
                    OR: [{ hostId: userId }, { participants: { some: { id: userId } } }]
                },
                include: { analysis: true },
                orderBy: { startTime: 'desc' }
            });
        }
        if (!session || !session.analysis) return null;

        const analysis = session.analysis as any;
        const profUpd = analysis.profileUpdates || {};

        return {
            title: session.title,
            summary: analysis.summary || "Completed session",
            profileUpdates: {
                nextSteps: profUpd.nextSteps || "Review session concepts."
            }
        };
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

        let safeData = structuredData || {};

        const summaryText = safeData.summary || safeData.sessionSummary || summary || "Completed voice study session.";
        const focusScore = safeData.focusScore ?? 78;
        const knowledgeScore = safeData.knowledgeScore ?? 70;
        const weeklyGoal = safeData.weeklyGoal || "Review session concepts.";
        const flashcards = Array.isArray(safeData.flashcards) ? safeData.flashcards : [];
        const sessionInsight = safeData.sessionInsight || null;
        const newBigFive = (safeData.bigFivePersonality || {}) as Record<string, any>;
        const topics = Array.isArray(safeData.topicsCovered) && safeData.topicsCovered.length > 0
            ? safeData.topicsCovered
            : [safeTopic];

        const priorPersonality = (profile.personality as any) || {};
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
        if (safeData.learningPattern) newLearningStyle = [safeData.learningPattern];

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
        const updatedTopics = currentTopics.includes(safeTopic) ? currentTopics : [...currentTopics, safeTopic];

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

        const rawBigFiveEntries = Object.entries(newBigFive).filter(([, v]) => typeof v === "number");
        const exhibitedTraits = rawBigFiveEntries.length > 0
            ? rawBigFiveEntries.map(([trait, v]) => `${trait.charAt(0).toUpperCase() + trait.slice(1)}: ${v}%`)
            : [];

        const visualAssetsFromTranscripts = Array.isArray(transcriptsArray)
            ? transcriptsArray.filter((t: any) => t.type === 'image').map((t: any) => t.text)
            : [];
        const visualAssets = (Array.isArray(safeData.visualAssets) && safeData.visualAssets.length > 0)
            ? safeData.visualAssets
            : visualAssetsFromTranscripts;
        const visualAsset = visualAssets.length > 0 ? visualAssets[visualAssets.length - 1] : null;

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
                        participantMetrics: {
                            sessionType: "ai-voice",
                            focus: focusScore,
                            participation: "Active",
                            insight: sessionInsight
                        },
                        knowledgeDemonstrated: {
                            score: knowledgeScore,
                            strengths: mergedBreakdown.map((b) => ({ subject: b.topic, proficiency: b.score }))
                        },
                        profileUpdates: {
                            nextSteps: weeklyGoal,
                            learningStyleHint: safeData.learningPattern || (profile.learningStyle?.[0] || "Adaptive"),
                            exhibitedTraits,
                            visualAsset,
                            visualAssets
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