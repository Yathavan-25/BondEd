import prisma from "../config/prisma.js";

export const RequestModel = {
    findSentByUserId: async (senderId: string) => {
        return await prisma.request.findMany({
            where: { senderId },
            orderBy: { createdAt: 'desc' },
            include: { receiver: { include: { user: true } } }
        });
    },

    findPendingReceivedByUserId: async (receiverId: string) => {
        return await prisma.request.findMany({
            where: { receiverId, status: "Pending" },
            orderBy: { createdAt: 'desc' },
            include: { sender: { include: { user: true } } }
        });
    },

    findAllMessagesByUserId: async (userId: string) => {
        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { include: { user: true } },
                receiver: { include: { user: true } }
            }
        });

        // Collapse to most recent message per conversation partner
        const seen = new Set<string>();
        const latestPerPartner = [];
        for (const m of messages) {
            const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
            if (seen.has(partnerId)) continue;
            seen.add(partnerId);
            latestPerPartner.push(m);
        }
        return latestPerPartner;
    },

    findConversation: async (userId: string, partnerId: string) => {
        return await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
    },

    areConnected: async (userIdA: string, userIdB: string) => {
        const accepted = await prisma.request.findFirst({
            where: {
                status: "Accepted",
                OR: [
                    { senderId: userIdA, receiverId: userIdB },
                    { senderId: userIdB, receiverId: userIdA }
                ]
            }
        });
        return !!accepted;
    },

    createRequest: async (senderId: string, receiverId: string, topic: string, message?: string) => {
        return await prisma.request.create({
            data: {
                senderId,
                receiverId,
                topic,
                message: message ?? null,
                status: "Pending"
            }
        });
    },

    cancelRequest: async (requestId: string, senderId: string) => {
        const existing = await prisma.request.findUnique({ where: { id: requestId } });
        if (!existing) return null;
        if (existing.senderId !== senderId) return "FORBIDDEN";
        if (existing.status !== "Pending") return "NOT_PENDING";
        return await prisma.request.delete({ where: { id: requestId } });
    },

    updateRequestStatus: async (requestId: string, status: "Accepted" | "Declined") => {
        return await prisma.request.update({ where: { id: requestId }, data: { status } });
    },

    createMessage: async (senderId: string, receiverId: string, content: string) => {
        return await prisma.message.create({
            data: { senderId, receiverId, content, read: false }
        });
    },

    markConversationRead: async (userId: string, partnerId: string) => {
        return await prisma.message.updateMany({
            where: { senderId: partnerId, receiverId: userId, read: false },
            data: { read: true }
        });
    }
};