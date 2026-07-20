import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Force TypeScript to treat this strictly as a string
    const userId = req.params.userId as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // 1. Fetch User, Profile, and all associated sessions
    // Using the correct schema relations: "sessions" and "participants"
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        sessions: { 
          include: { 
            participants: { 
              include: { profile: true } 
            } 
          } 
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const allSessions = user.sessions;

    // 2. CALCULATE STATS
    const completedSessions = allSessions.filter(s => s.status === "completed");
    
    // Calculate total hours from completed sessions
    const totalHours = completedSessions.reduce((acc, s) => {
      if (s.startTime && s.endTime) {
        const diffInMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        return acc + (diffInMs / (1000 * 60 * 60)); // Convert to hours
      }
      return acc;
    }, 0);

    // Count unique partners (anyone in the same completed session who is not the user)
    const uniquePartnersSet = new Set<string>();
    completedSessions.forEach(session => {
      session.participants.forEach(participant => {
        if (participant.id !== userId) {
          uniquePartnersSet.add(participant.id);
        }
      });
    });
    const uniquePartners = uniquePartnersSet.size;

    // Extract Knowledge Score (Safely cast the JsonValue)
    const knowledgeLevel = user.profile?.knowledgeLevel as Record<string, any> | null;
    const avgScore = knowledgeLevel?.score || 0;

    const stats = {
      streak: 0, // Implement daily login streak logic here if needed
      hours: Number(totalHours.toFixed(1)),
      partners: uniquePartners,
      score: avgScore
    };

    // 3. FETCH UPCOMING SESSIONS
    const now = new Date();
    const upcomingSessions = allSessions
      .filter(s => s.status === "scheduled" && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3) // Get next 3
      .map(s => {
        // Find other participants in the session
        const otherParticipants = s.participants.filter(p => p.id !== userId);
        const avatars = otherParticipants.map(p => 
          p.email ? p.email.charAt(0).toUpperCase() : "?"
        );
        
        return {
          id: s.id,
          title: "Study Session", 
          time: new Date(s.startTime).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
          startTime: s.startTime,
          avatars: avatars.length > 0 ? avatars : ["?"]
        };
      });

    // 4. FETCH SUGGESTED PARTNERS
    const userSubjects = user.profile?.subjects || [];
    
    // Explicitly define the type to fix the implicit 'any[]' error
    let suggestedPartners: Array<{
      id: string;
      initials: string;
      name: string;
      subject: string;
      match: string;
      gradient: string;
    }> = [];

    if (userSubjects.length > 0) {
      const matches = await prisma.profile.findMany({
        where: {
          userId: { not: userId }, // Don't match with self
          subjects: { hasSome: userSubjects } // Has at least one common subject
        },
        include: { user: true },
        take: 3
      });

      suggestedPartners = matches.map(p => {
        // 1. Force extraction with explicit fallbacks
        const email = p.user.email || "student@example.com";
        const emailPrefix = email.split('@')[0] || "Student";
        
        // 2. Safely construct the name and initials
        const firstName = p.user.firstName ?? "";
        const lastName = p.user.lastName ?? "";
        const fullName = (firstName || lastName) 
          ? `${firstName} ${lastName}`.trim() 
          : emailPrefix;
          
        const initials = (firstName || lastName) 
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() 
          : emailPrefix.substring(0, 2).toUpperCase();

        // 3. Return the object with explicit type casting
        return {
          id: p.userId as string,
          initials: initials as string,
          name: fullName as string,
          subject: (p.subjects[0] || "General") as string,
          match: "Match" as string,
          gradient: "from-blue-500 to-cyan-500" as string
        };
      });
    }

    // Determine display name
    const userName = user.firstName 
      ? `${user.firstName} ${user.lastName || ''}`.trim() 
      : user.email.split('@')[0];

    // Return final dynamic payload
    res.status(200).json({
      user: { 
        name: userName,
        sessionsThisWeek: upcomingSessions.length,
        pendingRequests: 0 
      },
      stats,
      sessions: upcomingSessions,
      goals: [], // Goals can be fetched from a DB model later
      suggestedPartners
    });

  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};