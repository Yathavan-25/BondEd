import type { Request, Response } from 'express';
import { SessionModel } from "../models/sessionModel.js";
import prisma from '../config/prisma.js';

interface DailyAPIResponse {
    data?: { url: string };
    url?: string;
}

const getStringParam = (param: string | string[] | undefined): string | null => {
    if (Array.isArray(param)) return param[0] || null;
    return (param !== undefined && param !== "") ? param : null;
};

export const joinRoom = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.params.sessionId as string;

    try {
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        
        if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        if (session.dailyRoomUrl) {
            res.status(200).json({ url: session.dailyRoomUrl });
            return; 
        }

        const response = await fetch('https://api.daily.co/v1/rooms/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties: { exp: Math.floor(Date.now() / 1000) + 3600 } })
        });

        const data = (await response.json()) as { url?: string; data?: { url: string } };
        const roomUrl = data.url || data.data?.url;

        if (!roomUrl) {
            res.status(500).json({ error: "Failed to provision room" });
            return;
        }

        await prisma.session.update({
            where: { id: sessionId },
            data: { dailyRoomUrl: roomUrl }
        });

        res.status(200).json({ url: roomUrl });
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
                properties: { exp: Math.floor(Date.now() / 1000) + 86400 } 
            })
        });

        const dailyData = (await dailyResponse.json()) as DailyAPIResponse;
        
        if (!dailyResponse.ok) {
            console.error("Daily.co API Error Details:", dailyData);
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
            include: { host: { include: { profile: true } }, participants: true },
            orderBy: { startTime: 'desc' }
        });

        const now = new Date().getTime();

        const formattedSessions = sessions.map(session => {
            const startTime = new Date(session.startTime).getTime();
            const status = session.status.toLowerCase();
            
            let uiStatus = "upcoming";
            if (status === "live") uiStatus = "live";
            if (status === "completed") uiStatus = "past";
            
            const startsInMin = uiStatus === "upcoming" ? Math.max(0, Math.floor((startTime - now) / 60000)) : undefined;

            const avatars = session.participants.map(p => 
                p.firstName ? `${p.firstName.charAt(0)}${p.lastName?.charAt(0) || ''}`.toUpperCase() : p.email.substring(0,2).toUpperCase()
            );

            const safeSession = session as any;

            return {
                id: session.id,
                title: safeSession.title || "Collaborative Study Session",
                subject: safeSession.subject || session.host.profile?.subjects[0] || "General",
                duration: session.endTime ? `${Math.floor((new Date(session.endTime).getTime() - startTime) / 60000)} mins` : "60 mins",
                type: safeSession.recordingUrl ? "Recorded" : "Live",
                date: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                time: new Date(session.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                status: uiStatus,
                color: "from-[#1363CB] to-[#4f55ee]",
                avatars: avatars.length > 0 ? avatars : ["ST"],
                host: `${session.host.firstName || ''} ${session.host.lastName || ''}`.trim(),
                startsInMin: startsInMin
            };
        });

        res.status(200).json(formattedSessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
};

export const getSummaries = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = getStringParam(req.params.studentId);
        if (!studentId) { res.status(400).json({ error: "Student ID is missing" }); return; }
        const summaries = await SessionModel.getUserSummaries(studentId);
        res.json(summaries);
    } catch (error) {
        console.error("Failed to fetch summaries:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = getStringParam(req.params.studentId);
        if (!studentId) { res.status(400).json({ error: "Student ID is missing" }); return; }
        const analytics = await SessionModel.getUserAnalytics(studentId);
        res.json(analytics);
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// No more polling Vapi's analysis endpoint. Structured data now arrives
// directly from the frontend — either captured live from the
// submitSessionAnalysis tool call during the conversation, or a safe
// fallback object if that tool call never fired in time. The only thing
// we still optionally reach out to Vapi for is the recording URL, and
// that's a single best-effort attempt that never blocks the response.
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