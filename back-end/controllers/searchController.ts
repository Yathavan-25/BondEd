import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const query = (req.query.q as string || "").trim().toLowerCase();

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!query || query.length < 2) {
      res.json({ partners: [], sessions: [], summaries: [] });
      return;
    }

    // 1. Search Partners
    const partnerProfiles = await prisma.profile.findMany({
      where: {
        userId: { not: userId },
        OR: [
          { user: { firstName: { contains: query, mode: 'insensitive' } } },
          { user: { lastName: { contains: query, mode: 'insensitive' } } },
          { user: { email: { contains: query, mode: 'insensitive' } } },
          { subjects: { hasSome: [query] } },
          { topics: { hasSome: [query] } }
        ]
      },
      include: { user: true },
      take: 5
    });

    const partners = partnerProfiles.map(p => {
      const name = `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() || p.user.email.split('@')[0] || "User";
      const initials = (p.user.firstName ? p.user.firstName.charAt(0) : name.charAt(0) || "U").toUpperCase();
      return {
        id: p.userId,
        name,
        initials,
        avatarUrl: p.avatarUrl,
        subject: p.subjects[0] || "General Studies",
        topics: p.topics
      };
    });

    // 2. Search Sessions
    const matchedSessions = await prisma.session.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    const sessions = matchedSessions.map(s => ({
      id: s.id,
      title: s.title || "Study Session",
      subject: s.subject || "General",
      status: s.status,
      startTime: s.startTime
    }));

    // 3. Search Summaries
    const matchedSummaries = await prisma.sessionAnalysis.findMany({
      where: {
        OR: [
          { summary: { contains: query, mode: 'insensitive' } },
          { topics: { hasSome: [query] } }
        ]
      },
      include: { session: true },
      take: 5
    });

    const summaries = matchedSummaries.map(s => ({
      id: s.id,
      sessionId: s.sessionId,
      title: s.session.title || "Session Summary",
      summarySnippet: s.summary.length > 120 ? s.summary.substring(0, 120) + "..." : s.summary,
      topics: s.topics
    }));

    res.json({ partners, sessions, summaries });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
};
