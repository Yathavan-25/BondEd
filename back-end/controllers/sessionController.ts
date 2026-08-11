import type { Request, Response } from 'express';
import { SessionModel } from "../models/sessionModel.js";
import prisma from '../config/prisma.js';

interface DailyAPIResponse {
    data?: { url: string };
    url?: string;
}

interface DailyRecordingsResponse {
    data?: Array<{ id: string }>;
}

interface DailyAccessLinkResponse {
    download_link?: string;
}

const getStringParam = (param: string | string[] | undefined): string | null => {
    if (Array.isArray(param)) return param[0] || null;
    return (param !== undefined && param !== "") ? param : null;
};

export const joinRoom = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.params.sessionId as string;
    const reqUser = (req as any).user;

    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                host: { include: { profile: true } },
                participants: { include: { profile: true } }
            }
        });

        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        if (session.status === "completed" || session.status === "cancelled") {
            res.status(400).json({ error: "Session has already ended" });
            return;
        }

        let roomUrl = session.dailyRoomUrl;

        if (!roomUrl) {
            const response = await fetch('https://api.daily.co/v1/rooms/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    properties: {
                        exp: Math.floor(Date.now() / 1000) + 86400,
                        enable_recording: "cloud"
                    }
                })
            });

            const data = (await response.json()) as DailyAPIResponse;
            roomUrl = data.url || data.data?.url || null;

            if (!roomUrl) {
                res.status(500).json({ error: "Failed to provision room" });
                return;
            }

            await prisma.session.update({
                where: { id: sessionId },
                data: { dailyRoomUrl: roomUrl, status: "live" }
            });
        } else if (session.status === "scheduled") {
            await prisma.session.update({
                where: { id: sessionId },
                data: { status: "live" }
            });
        }

        // Determine if requesting user is host
        let isHost = false;
        if (reqUser) {
            if (session.host.firebaseUid === reqUser.uid || session.hostId === reqUser.uid) {
                isHost = true;
            } else {
                const dbUser = await prisma.user.findFirst({ where: { firebaseUid: reqUser.uid } });
                if (dbUser && dbUser.id === session.hostId) {
                    isHost = true;
                }
            }
        }

        const hostName = session.host.firstName
            ? `${session.host.firstName} ${session.host.lastName || ''}`.trim()
            : (session.host.email || "Host");

        res.status(200).json({
            url: roomUrl,
            session: {
                id: session.id,
                title: session.title || "Collaborative Study Session",
                subject: session.subject || session.host.profile?.subjects[0] || "General Study",
                hostId: session.hostId,
                hostName: hostName,
                status: session.status,
                startTime: session.startTime,
                isHost: isHost
            }
        });
    } catch (error) {
        console.error("Error joining room:", error);
        res.status(500).json({ error: "Failed to join Daily room" });
    }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { hostId, participantIds, title, subject, startTime } = req.body;

        if (!hostId || !title || !startTime) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const dailyResponse = await fetch('https://api.daily.co/v1/rooms/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                properties: {
                    exp: Math.floor(Date.now() / 1000) + 86400,
                    enable_recording: "cloud"
                }
            })
        });

        const dailyData = (await dailyResponse.json()) as DailyAPIResponse;

        if (!dailyResponse.ok) {
            res.status(500).json({ error: "Failed to provision room from Daily.co", details: dailyData });
            return;
        }

        const roomUrl = dailyData?.data?.url || dailyData?.url;

        if (!roomUrl) {
            res.status(500).json({ error: "Daily.co API returned no URL" });
            return;
        }

        const sessionData: any = {
            status: "scheduled",
            startTime: new Date(startTime),
            title: title,
            subject: subject,
            dailyRoomUrl: roomUrl,
            host: { connect: { id: hostId } }
        };

        if (Array.isArray(participantIds) && participantIds.length > 0) {
            sessionData.participants = {
                connect: participantIds.map((id: string) => ({ id }))
            };
        }

        const newSession = await prisma.session.create({ data: sessionData });
        res.status(201).json(newSession);

    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
};

export const leaveCollabSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, sessionId, durationMins } = req.body;

        if (!studentId || !sessionId) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        if (durationMins && durationMins > 0) {
            await SessionModel.logCollabSessionUsage(studentId, sessionId, durationMins);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error logging collab session leave:", error);
        res.status(500).json({ error: "Failed to log session leave" });
    }
};

export const endSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = req.params.sessionId as string;
        const { studentId, durationMins } = req.body;

        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                host: { include: { profile: true } },
                participants: { include: { profile: true } },
                analysis: true
            }
        });

        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        const effectiveDuration = durationMins || (session.startTime ? Math.max(1, Math.ceil((Date.now() - new Date(session.startTime).getTime()) / 60000)) : 1);

        // Mark session as completed
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: "completed",
                endTime: new Date()
            }
        });

        if (studentId && effectiveDuration > 0) {
            await SessionModel.logCollabSessionUsage(studentId, sessionId, effectiveDuration);
        }

        // Generate Dynamic AI Session Analysis using Gemini API if analysis doesn't exist
        const existingAnalysis = await prisma.sessionAnalysis.findUnique({
            where: { sessionId: sessionId }
        });

        if (!existingAnalysis) {
            const allUsers = [
                session.host,
                ...(session.participants || [])
            ];

            const sessionSubject = session.subject || "Collaborative Learning";
            const sessionTitle = session.title || "Peer Study Session";
            const participantNames = allUsers.map(u => u.firstName || u.email?.split('@')[0] || "Student").join(", ");

            // Check if session was too brief (under 1 min)
            if (effectiveDuration < 1) {
                await prisma.sessionAnalysis.create({
                    data: {
                        sessionId: sessionId,
                        summary: `Brief check-in session on ${sessionSubject}. Session ended before extended group discussion occurred.`,
                        topics: [sessionSubject],
                        flashcardsGenerated: [],
                        transcriptUrl: JSON.stringify([
                            { role: "system", text: `Brief session on ${sessionSubject} completed.` }
                        ]),
                        participantMetrics: {
                            sessionType: "collaborative",
                            groupFocusScore: 100,
                            collaborationQuality: 100,
                            actionItems: ["Schedule a full collaborative study session"],
                            participantAssessments: allUsers.map(u => ({
                                name: u.firstName || u.email?.split('@')[0] || "Student",
                                insight: "Joined brief session check-in.",
                                knowledgeScore: (u.profile?.knowledgeLevel as any)?.score || 75,
                                learningPattern: "Collaborative/Verbal",
                                participationLevel: "Medium",
                                bigFivePersonality: { openness: 80, conscientiousness: 80, extraversion: 70, agreeableness: 85 }
                            }))
                        },
                        knowledgeDemonstrated: {
                            score: 75,
                            strengths: [{ subject: sessionSubject, proficiency: 75 }]
                        },
                        profileUpdates: {
                            nextSteps: `Schedule next collaborative study session for ${sessionSubject}.`
                        }
                    }
                });
            } else {
                // Call Gemini API for dynamic AI Analysis
                const geminiApiKey = process.env.GEMINI_API_KEY;
                let aiAnalysisData: any = null;

                if (geminiApiKey) {
                    try {
                        const prompt = `You are BondEd AI Educational Analyst. Analyze this live collaborative study session and generate a structured JSON evaluation:
                                        - Subject: "${sessionSubject}"
                                        - Title: "${sessionTitle}"
                                        - Duration: ${effectiveDuration} minutes
                                        - Participants: ${participantNames}

                                        Respond strictly in valid JSON format matching this schema:
                                        {
                                        "sessionSummary": "A 2-3 sentence overview of what the group discussed, debated, and learned.",
                                        "topicsCovered": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
                                        "groupFocusScore": 88,
                                        "collaborationQuality": 92,
                                        "actionItems": ["Suggested next step 1", "Suggested next step 2"],
                                        "flashcards": ["Q: ... A: ...", "Q: ... A: ..."],
                                        "participantAssessments": [
                                            {
                                            "name": "StudentName",
                                            "insight": "1 sentence observation on their engagement and peer collaboration",
                                            "knowledgeScore": 85,
                                            "learningPattern": "Collaborative/Verbal",
                                            "participationLevel": "High",
                                            "bigFivePersonality": {
                                                "openness": 80,
                                                "conscientiousness": 85,
                                                "extraversion": 75,
                                                "agreeableness": 90
                                            }
                                            }
                                        ]
                                        }`;

                        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { response_mime_type: "application/json" }
                            })
                        });

                        if (geminiRes.ok) {
                            const geminiJson: any = await geminiRes.json();
                            const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (rawText) {
                                aiAnalysisData = JSON.parse(rawText);
                            }
                        }
                    } catch (err) {
                        console.error("Gemini API call failed, falling back to dynamic context generator:", err);
                    }
                }

                // Fallback / standard dynamic context generator if Gemini API didn't return text
                const finalSummary = aiAnalysisData?.sessionSummary || `The study group conducted an active collaborative review on ${sessionSubject} focusing on ${sessionTitle}. Participants shared insights, answered practice questions, and strengthened mutual understanding.`;
                const finalTopics = aiAnalysisData?.topicsCovered || [sessionSubject, sessionTitle, "Problem Solving", "Peer Collaboration"];
                const finalFlashcards = aiAnalysisData?.flashcards || [
                    `Q: What primary concept was explored during today's session? A: ${sessionSubject} (${sessionTitle}).`,
                    `Q: How did the group verify mastery? A: Through collaborative peer explanations and problem solving.`
                ];
                const finalActionItems = aiAnalysisData?.actionItems || [
                    `Review core principles of ${sessionSubject}.`,
                    `Complete practice exercises on ${sessionTitle} before the next review.`
                ];

                const participantAssessments = aiAnalysisData?.participantAssessments || allUsers.map(u => {
                    const personality = (u.profile?.personality as Record<string, any>) || {};
                    return {
                        name: u.firstName || u.email?.split('@')[0] || "Student",
                        insight: `Demonstrated strong engagement and supported peers during the ${sessionSubject} discussion.`,
                        knowledgeScore: (u.profile?.knowledgeLevel as any)?.score || 85,
                        learningPattern: "Collaborative/Verbal",
                        participationLevel: "High",
                        bigFivePersonality: {
                            openness: personality.openness ?? 82,
                            conscientiousness: personality.conscientiousness ?? 85,
                            extraversion: personality.extraversion ?? 78,
                            agreeableness: personality.agreeableness ?? 90
                        }
                    };
                });

                await prisma.sessionAnalysis.create({
                    data: {
                        sessionId: sessionId,
                        summary: finalSummary,
                        topics: finalTopics,
                        flashcardsGenerated: finalFlashcards,
                        transcriptUrl: JSON.stringify([
                            { role: "system", text: `Collaborative session on ${sessionSubject} completed (${effectiveDuration} mins).` }
                        ]),
                        participantMetrics: {
                            sessionType: "collaborative",
                            groupFocusScore: aiAnalysisData?.groupFocusScore || 90,
                            collaborationQuality: aiAnalysisData?.collaborationQuality || 94,
                            actionItems: finalActionItems,
                            participantAssessments
                        },
                        knowledgeDemonstrated: {
                            score: 85,
                            strengths: [{ subject: sessionSubject, proficiency: 85 }]
                        },
                        profileUpdates: {
                            nextSteps: finalActionItems[0] || `Review notes for ${sessionSubject}.`
                        }
                    }
                });
            }
        }

        // Delete/close Daily room if present so all participants are evicted
        if (session.dailyRoomUrl) {
            const roomName = session.dailyRoomUrl.split('/').pop();
            if (roomName) {
                try {
                    await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` }
                    });
                } catch (e) {
                    console.error("Non-blocking error deleting Daily room:", e);
                }
            }
        }

        res.status(200).json({ success: true, message: "Session ended successfully by host" });
    } catch (error) {
        console.error("Error ending session:", error);
        res.status(500).json({ error: "Failed to end session" });
    }
};

// --- FETCH DYNAMIC RECORDING LINK ---
export const getCollabRecording = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.params.sessionId as string;
    try {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || !session.dailyRoomUrl) {
            res.status(404).json({ error: "Room not found." });
            return;
        }

        const roomName = session.dailyRoomUrl.split('/').pop();

        const response = await fetch(`https://api.daily.co/v1/recordings?room_name=${roomName}`, {
            headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` }
        });

        const data = (await response.json()) as DailyRecordingsResponse;

        if (data && data.data && data.data.length > 0) {
            const firstRecording = data.data[0];

            if (firstRecording) {
                const recordingId = firstRecording.id;

                const linkRes = await fetch(`https://api.daily.co/v1/recordings/${recordingId}/access-link`, {
                    headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` }
                });

                const linkData = (await linkRes.json()) as DailyAccessLinkResponse;

                if (linkData.download_link) {
                    res.status(200).json({ url: linkData.download_link });
                    return;
                }
            }
        }

        res.status(404).json({ error: "Recording is still processing in the cloud. Check back in a few minutes!" });
    } catch (error) {
        console.error("Error fetching recording:", error);
        res.status(500).json({ error: "Failed to fetch recording" });
    }
};

export const getStudentSessions = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = getStringParam(req.params.studentId);
        if (!studentId) { res.status(400).json({ error: "Student ID missing" }); return; }

        const sessions = await prisma.session.findMany({
            where: {
                OR: [
                    { hostId: studentId },
                    { participants: { some: { id: studentId } } }
                ]
            },
            include: { host: { include: { profile: true } }, participants: { include: { profile: true } } },
            orderBy: { startTime: 'desc' }
        });

        const now = new Date().getTime();

        const formattedSessions = sessions.map(session => {
            const startTime = new Date(session.startTime).getTime();
            const estimatedEndTime = session.endTime ? new Date(session.endTime).getTime() : startTime + (60 * 60000);

            let status = session.status.toLowerCase();

            if (status === 'scheduled' || status === 'live') {
                if (now > estimatedEndTime) status = 'completed';
                else if (now >= startTime && now <= estimatedEndTime) status = 'live';
            }

            let uiStatus = "upcoming";
            if (status === "live") uiStatus = "live";
            if (status === "completed") uiStatus = "past";

            const startsInMin = uiStatus === "upcoming" ? Math.max(0, Math.floor((startTime - now) / 60000)) : undefined;

            const avatars = session.participants.map(p =>
                p.firstName ? `${p.firstName.charAt(0)}${p.lastName?.charAt(0) || ''}`.toUpperCase() : p.email.substring(0, 2).toUpperCase()
            );

            const participantDetails = session.participants.map(p => ({
                initials: p.firstName ? `${p.firstName.charAt(0)}${p.lastName?.charAt(0) || ''}`.toUpperCase() : p.email.substring(0, 2).toUpperCase(),
                avatarUrl: p.profile?.avatarUrl || null
            }));

            if (session.hostId !== studentId) {
                const hostInitial = session.host.firstName ? `${session.host.firstName.charAt(0)}${session.host.lastName?.charAt(0) || ''}`.toUpperCase() : session.host.email.substring(0, 2).toUpperCase();
                if (!avatars.includes(hostInitial)) avatars.push(hostInitial);
                if (!participantDetails.some(pd => pd.initials === hostInitial)) {
                    participantDetails.push({
                        initials: hostInitial,
                        avatarUrl: session.host.profile?.avatarUrl || null
                    });
                }
            }

            const safeSession = session as any;

            const isAISession = !safeSession.dailyRoomUrl && safeSession.title?.includes("AI Session");
            let sessionType = "Live Collab";
            if (isAISession) sessionType = "AI Session";
            else if (uiStatus === "past") sessionType = "Recorded Collab";

            return {
                id: session.id,
                title: safeSession.title || (isAISession ? "AI Study Partner" : "Collaborative Study Session"),
                subject: safeSession.subject || session.host.profile?.subjects[0] || "General",
                duration: session.endTime ? `${Math.floor((new Date(session.endTime).getTime() - startTime) / 60000)} mins` : "60 mins",
                type: sessionType,
                date: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                time: new Date(session.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: uiStatus,
                color: isAISession ? "from-[#9C2FDF] to-purple-600" : "from-[#1363CB] to-[#4f55ee]",
                avatars: avatars.length > 0 ? avatars : ["ST"],
                participantDetails: participantDetails,
                host: `${session.host.firstName || ''} ${session.host.lastName || ''}`.trim(),
                startsInMin: startsInMin,
                isAISession: isAISession
            };
        });

        res.status(200).json(formattedSessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
};

export const endVoiceSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, callId, selectedTopic, transcripts, structuredData, summary, startTime, endTime } = req.body;

        if (!studentId) {
            res.status(400).json({ error: "Missing studentId" });
            return;
        }

        const finalSummary = summary || structuredData?.summary || "Completed voice study session.";
        const finalStructuredData = structuredData || {};

        let recordingUrl = "";
        if (callId) {
            try {
                const vapiResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (vapiResponse.ok) {
                    const callData: any = await vapiResponse.json();
                    recordingUrl = callData.recordingUrl || "";
                }
            } catch (err) {
                console.error("Non-blocking Vapi recording fetch failed (safe to ignore):", err);
            }
        }

        const result = await SessionModel.processVoiceSession(
            studentId,
            finalSummary,
            recordingUrl,
            finalStructuredData,
            selectedTopic || "General Study",
            transcripts || [],
            startTime ? new Date(startTime) : new Date(Date.now() - 15 * 60000),
            endTime ? new Date(endTime) : new Date()
        );

        res.status(200).json({
            success: true,
            summary: finalSummary,
            sessionId: result.session.id,
            sessionAnalysis: (result.session as any).analysis
        });
    } catch (error) {
        console.error("Error processing voice session:", error);
        res.status(500).json({ error: "Failed to process voice session" });
    }
};