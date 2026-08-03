import prisma from '../config/prisma.js';

export const RequestModel = {
    findSentByUserId: async (userId: string) => {
        return await prisma.request.findMany({
            where: { senderId: userId, status: "Pending" },
            include: { receiver: { include: { user: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },

    findPendingReceivedByUserId: async (userId: string) => {
        return await prisma.request.findMany({
            where: { receiverId: userId, status: "Pending" },
            include: { sender: { include: { user: true } } },
            orderBy: { createdAt: 'desc' }
        });
    },

    updateRequestStatus: async (requestId: string, status: string) => {
        const request = await prisma.request.update({
            where: { id: requestId },
            data: { status }
        });

        if (status === "Accepted") {
            // FIX: Assert strings to prevent "string | undefined" errors
            const sortedIds = [request.senderId, request.receiverId].sort();
            const u1 = sortedIds[0] as string;
            const u2 = sortedIds[1] as string;
            
            await prisma.connection.upsert({
                where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
                update: {},
                create: { user1Id: u1, user2Id: u2 }
            });
        }
        return request;
    },

    cancelRequest: async (requestId: string, userId: string) => {
        const req = await prisma.request.findUnique({ where: { id: requestId } });
        if (!req) return null;
        if (req.senderId !== userId) return "FORBIDDEN";
        if (req.status !== "Pending") return "NOT_PENDING";
        
        await prisma.request.delete({ where: { id: requestId } });
        return true;
    },

    areConnected: async (userA: string, userB: string) => {
        const sorted = [userA, userB].sort();
        const u1 = sorted[0] as string;
        const u2 = sorted[1] as string;

        const connection = await prisma.connection.findUnique({
            where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } }
        });
        return !!connection;
    },

    findUserConnections: async (userId: string) => {
        return await prisma.connection.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            include: {
                user1: { include: { user: true } },
                user2: { include: { user: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    createRequest: async (senderId: string, receiverId: string, topic: string, message?: string) => {
        return await prisma.request.create({
            data: { 
                senderId, 
                receiverId, 
                topic, 
                message: message || null, // FIX: Convert undefined to null
                status: "Pending" 
            }
        });
    },

    createMessage: async (senderId: string, receiverId: string, content: string) => {
        return await prisma.message.create({
            data: { senderId, receiverId, content }
        });
    },

    findConversation: async (user1: string, user2: string) => {
        return await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: user1, receiverId: user2 },
                    { senderId: user2, receiverId: user1 }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    },

    markConversationRead: async (userId: string, partnerId: string) => {
        await prisma.message.updateMany({
            where: { senderId: partnerId, receiverId: userId, read: false },
            data: { read: true }
        });
    }
};