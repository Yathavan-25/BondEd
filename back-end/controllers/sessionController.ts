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
            body: JSON.stringify({ 
                properties: { 
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    enable_recording: "cloud" // Force cloud recording
                } 
            })
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
                properties: { 
                    exp: Math.floor(Date.now() / 1000) + 86400,
                    enable_recording: "cloud" // Force cloud recording
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
        
        if (!studentId || !sessionId || durationMins === undefined) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        if (durationMins > 0) {
            await SessionModel.logCollabSessionUsage(studentId, sessionId, durationMins);
        }
        
        // Ensure the session is marked as completed when everyone leaves
        await prisma.session.update({
            where: { id: sessionId },
            data: { status: "completed", endTime: new Date() }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error logging collab session:", error);
        res.status(500).json({ error: "Failed to log session" });
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

        // Extract the raw room name from the URL (e.g., https://yourapp.daily.co/xyz123 -> xyz123)
        const roomName = session.dailyRoomUrl.split('/').pop();
        
        // Ask Daily if a recording exists for this room
        const response = await fetch(`https://api.daily.co/v1/recordings?room_name=${roomName}`, {
            headers: { 'Authorization': `Bearer ${process.env.DAILY_API_KEY}` }
        });
        
        const data = (await response.json()) as DailyRecordingsResponse;

        if (data && data.data && data.data.length > 0) {
            // FIX: Assign to a variable first to satisfy noUncheckedIndexedAccess
            const firstRecording = data.data[0];
            
            if (firstRecording) {
                const recordingId = firstRecording.id;
                
                // Ask Daily to generate a fresh, temporary access-link
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
            include: { host: { include: { profile: true } }, participants: true },
            orderBy: { startTime: 'desc' }
        });

        const now = new Date().getTime();

        const formattedSessions = sessions.map(session => {
            const startTime = new Date(session.startTime).getTime();
            // Estimate a 1-hour expiration if no end time was captured
            const estimatedEndTime = session.endTime ? new Date(session.endTime).getTime() : startTime + (60 * 60000);
            
            let status = session.status.toLowerCase();
            
            // Push old sessions into the past dynamically!
            if (status === 'scheduled' || status === 'live') {
                if (now > estimatedEndTime) status = 'completed'; 
                else if (now >= startTime && now <= estimatedEndTime) status = 'live'; 
            }

            let uiStatus = "upcoming";
            if (status === "live") uiStatus = "live";
            if (status === "completed") uiStatus = "past";
            
            const startsInMin = uiStatus === "upcoming" ? Math.max(0, Math.floor((startTime - now) / 60000)) : undefined;

            const avatars = session.participants.map(p => 
                p.firstName ? `${p.firstName.charAt(0)}${p.lastName?.charAt(0) || ''}`.toUpperCase() : p.email.substring(0,2).toUpperCase()
            );

            if (session.hostId !== studentId) {
                const hostInitial = session.host.firstName ? `${session.host.firstName.charAt(0)}${session.host.lastName?.charAt(0) || ''}`.toUpperCase() : session.host.email.substring(0,2).toUpperCase();
                if(!avatars.includes(hostInitial)) avatars.push(hostInitial);
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