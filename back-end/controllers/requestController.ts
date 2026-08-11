import type { Request, Response } from "express";
import { RequestModel } from "../models/requestModel.js";

// Helper to format timestamps into "2h ago" style strings
const formatTimeAgo = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const getStringParam = (param: string | string[] | undefined): string | null => {
    if (Array.isArray(param)) {
        return param[0] || null;
    }
    // Explicitly check if param is defined and not just an empty string
    return (param !== undefined && param !== "") ? param : null;
};

export const getSentRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getStringParam(req.params.userId);
        if (!userId) { res.status(400).json({ error: "User ID is missing" }); return; }

        const requests = await RequestModel.findSentByUserId(userId);
        res.json(requests.map(r => ({
            id: r.id,
            name: `${r.receiver.user.firstName} ${r.receiver.user.lastName || ''}`.trim(),
            initials: `${r.receiver.user.firstName?.[0] || ''}${r.receiver.user.lastName?.[0] || ''}`.toUpperCase(),
            avatarBg: "from-blue-400 to-indigo-500",
            avatarUrl: r.receiver.avatarUrl || null,
            subject: r.message || r.topic || "Study request",
            sentAgo: formatTimeAgo(r.createdAt),
            status: r.status,
            receiverId: r.receiverId,
            senderId: r.senderId
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch sent requests" });
    }
};

export const getReceivedRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getStringParam(req.params.userId);
        if (!userId) { res.status(400).json({ error: "User ID is missing" }); return; }

        const requests = await RequestModel.findPendingReceivedByUserId(userId);
        res.json(requests.map(r => ({
            id: r.id,
            name: `${r.sender.user.firstName} ${r.sender.user.lastName || ''}`.trim(),
            initials: `${r.sender.user.firstName?.[0] || ''}${r.sender.user.lastName?.[0] || ''}`.toUpperCase(),
            avatarBg: "from-emerald-400 to-teal-500",
            avatarUrl: r.sender.avatarUrl || null,
            subject: `Wants to study: ${r.topic || 'General'}`,
            sentAgo: formatTimeAgo(r.createdAt),
            senderId: r.senderId,
            receiverId: r.receiverId
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch received requests" });
    }
};

export const respondToRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestId = getStringParam(req.params.requestId);
        const { action } = req.body; 

        if (!requestId || !["accept", "decline"].includes(action)) {
            res.status(400).json({ error: "Invalid request or action" });
            return;
        }

        const updated = await RequestModel.updateRequestStatus(
            requestId,
            action === "accept" ? "Accepted" : "Declined"
        );
        res.json(updated);
    } catch (error) {
        console.error("Failed to respond to request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const cancelStudyRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const requestId = getStringParam(req.params.requestId);
        const { senderId } = req.body;

        if (!requestId || !senderId) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        
        const result = await RequestModel.cancelRequest(requestId, senderId);
        if (result === null) { res.status(404).json({ error: "Request not found" }); return; }
        if (result === "FORBIDDEN") { res.status(403).json({ error: "You cannot cancel this request" }); return; }
        if (result === "NOT_PENDING") { res.status(409).json({ error: "Only pending requests can be cancelled" }); return; }
        
        res.json({ success: true });
    } catch (error) {
        console.error("Failed to cancel request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getStringParam(req.params.userId);
        if (!userId) { res.status(400).json({ error: "User ID is missing" }); return; }

        // Fetch all established friends
        const connections = await RequestModel.findUserConnections(userId);
        
        const friendsData = await Promise.all(connections.map(async (c) => {
            const isUser1 = c.user1Id === userId;
            const friendProfile = isUser1 ? c.user2 : c.user1;
            const friendUser = friendProfile.user;
            const partnerId = isUser1 ? c.user2Id : c.user1Id;

            // Fetch latest message between them
            const conversation = await RequestModel.findConversation(userId, partnerId);
            const lastMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;
            const unreadCount = conversation.filter(m => m.receiverId === userId && !m.read).length;

            // Determine if online (Last seen within 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
            const isOnline = friendProfile.lastSeen > fiveMinutesAgo;

            // --- REPLICATE MATCH CONTROLLER TOPIC MAPPING ---
            const friendKnowledge = (friendProfile.knowledgeLevel as any)?.score || 50;
            const breakdown = (friendProfile.knowledgeLevel as any)?.topicBreakdown || [];
            
            const unifiedTopics = friendProfile.topics.map(topicName => {
                const normName = topicName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const found = breakdown.find((b: any) => b.topic.toLowerCase().replace(/[^a-z0-9]/g, '') === normName);
                
                return {
                    name: topicName,
                    score: found ? found.score : friendKnowledge,
                    subject: found ? found.subject : (friendProfile.subjects[0] || "General Studies")
                };
            });
            unifiedTopics.sort((a, b) => b.score - a.score);

            return {
                id: c.id,
                partnerId,
                name: `${friendUser.firstName} ${friendUser.lastName || ''}`.trim(),
                initials: `${friendUser.firstName?.[0] || ''}${friendUser.lastName?.[0] || ''}`.toUpperCase(),
                avatarBg: "from-[#1363CB] to-[#9C2FDF]", // Unified branding
                avatarUrl: friendProfile.avatarUrl || null,
                preview: lastMessage ? lastMessage.content : "You are now connected!",
                time: lastMessage ? formatTimeAgo(lastMessage.createdAt) : formatTimeAgo(c.createdAt),
                unread: unreadCount,
                isOnline,
                // --- PASS FULL PROFILE DATA TO FRONTEND ---
                lookingForTopic: unifiedTopics,
                learningStyle: friendProfile.learningStyle,
                personality: typeof friendProfile.personality === 'string' ? JSON.parse(friendProfile.personality) : friendProfile.personality,
                availability: (friendProfile.availability as any)?.times?.join(", ") || "Flexible",
                subjects: friendProfile.subjects
            };
        }));

        // Sort so unread messages and newest messages show up first
        friendsData.sort((a, b) => b.unread - a.unread);

        res.json(friendsData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch friends list" });
    }
};

export const getFriendsList = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getStringParam(req.params.userId);
        if (!userId) { res.status(400).json({ error: "User ID is missing" }); return; }

        const connections = await RequestModel.findUserConnections(userId);
        
        const friends = connections.map(c => {
            const isUser1 = c.user1Id === userId;
            const friendProfile = isUser1 ? c.user2 : c.user1;
            const friendUser = friendProfile.user;

            return {
                id: friendUser.id, // Using the internal user ID for session invites
                name: `${friendUser.firstName} ${friendUser.lastName || ''}`.trim(),
                email: friendUser.email,
                avatar: `${friendUser.firstName?.[0] || ''}${friendUser.lastName?.[0] || ''}`.toUpperCase(),
                avatarUrl: friendProfile.avatarUrl || null,
            };
        });

        res.json(friends);
    } catch (error) {
        console.error("Failed to fetch friends list:", error);
        res.status(500).json({ error: "Failed to fetch friends list" });
    }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = getStringParam(req.params.userId);
        const partnerId = getStringParam(req.params.partnerId);

        if (!userId || !partnerId) { res.status(400).json({ error: "Missing IDs" }); return; }

        const [conversation, connected] = await Promise.all([
            RequestModel.findConversation(userId, partnerId),
            RequestModel.areConnected(userId, partnerId)
        ]);

        const senderMessagesCount = conversation.filter(m => m.senderId === userId).length;
        const partnerHasReplied = conversation.some(m => m.senderId === partnerId);
        const canSend = connected || senderMessagesCount === 0 || partnerHasReplied;

        await RequestModel.markConversationRead(userId, partnerId);

        res.json({
            connected,
            canSend,
            messages: conversation.map(m => ({
                id: m.id,
                senderId: m.senderId,
                receiverId: m.receiverId,
                content: m.content,
                time: formatTimeAgo(m.createdAt)
            }))
        });
    } catch (error) {
        console.error("Failed to fetch conversation:", error);
        res.status(500).json({ error: "Failed to fetch conversation" });
    }
};

export const createStudyRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { senderId, receiverId, topic, message } = req.body;
        if (!senderId || !receiverId || !topic) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        const newRequest = await RequestModel.createRequest(senderId, receiverId, topic, message);
        res.status(201).json(newRequest);
    } catch (error) {
        console.error("Failed to create request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { senderId, receiverId, content } = req.body;
        if (!senderId || !receiverId || !content) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const connected = await RequestModel.areConnected(senderId, receiverId);
        if (!connected) {
            const conversation = await RequestModel.findConversation(senderId, receiverId);
            const senderMessages = conversation.filter(m => m.senderId === senderId);
            const partnerReplied = conversation.some(m => m.senderId === receiverId);
            if (senderMessages.length >= 1 && !partnerReplied) {
                res.status(403).json({ error: "Request pending. Wait for reply." });
                return;
            }
        }

        const newMessage = await RequestModel.createMessage(senderId, receiverId, content);
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Failed to send message:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};