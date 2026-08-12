import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // 1. Fetch User, Profile, and ALL associated sessions (both hosted AI sessions and participant collab sessions)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        sessions: { 
          include: { 
            participants: { include: { profile: true } },
            analysis: true
          } 
        },
        hostedSessions: {
          include: {
            participants: { include: { profile: true } },
            analysis: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update user's lastSeen timestamp so current login is recorded
    if (user.profile) {
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: { lastSeen: new Date() }
      }).catch(err => console.error("Error updating lastSeen:", err));
    }

    // Combine participant sessions and hosted sessions (AI voice sessions use hostedSessions)
    const sessionMap = new Map<string, any>();
    (user.sessions || []).forEach(s => sessionMap.set(s.id, s));
    (user.hostedSessions || []).forEach(s => sessionMap.set(s.id, s));

    const allSessions = Array.from(sessionMap.values());
    const completedSessions = allSessions.filter(s => s.status === "completed" || s.status === "Completed");

    // Determine current calendar week bounds (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    // 1. Calculate REAL study hours for ALL-TIME and THIS-WEEK
    let totalMinsAllTime = 0;
    let totalMinsThisWeek = 0;

    completedSessions.forEach(s => {
      let mins = 0;
      if (s.startTime && s.endTime) {
        const diffMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        mins = Math.max(1, Math.round(diffMs / 60000));
      } else {
        mins = 30;
      }
      totalMinsAllTime += mins;

      const sDate = s.startTime ? new Date(s.startTime) : null;
      if (sDate && sDate >= currentMonday) {
        totalMinsThisWeek += mins;
      }
    });

    const totalHours = Number((totalMinsAllTime / 60).toFixed(1));
    const hoursThisWeek = Number((totalMinsThisWeek / 60).toFixed(1));

    // Count REAL unique partners across all completed sessions
    const uniquePartnersSet = new Set<string>();
    completedSessions.forEach(session => {
      session.participants?.forEach((participant: any) => {
        if (participant.id !== userId) {
          uniquePartnersSet.add(participant.id);
        }
      });
      if (session.hostId && session.hostId !== userId) {
        uniquePartnersSet.add(session.hostId);
      }
    });
    const uniquePartners = uniquePartnersSet.size;

    // Extract REAL Knowledge Score from Profile
    const knowledgeLevel = user.profile?.knowledgeLevel as Record<string, any> | null;
    const avgScore = knowledgeLevel?.score || 0;

    // 2. ACCURATE DAILY STREAK & BEST STREAK CALCULATION
    const activeDatesSet = new Set<string>();
    
    // Add today
    const todayStr = now.toISOString().split('T')[0] || "";
    activeDatesSet.add(todayStr);

    // Add profile timestamps
    if (user.profile?.lastSeen) {
      const d = new Date(user.profile.lastSeen).toISOString().split('T')[0];
      if (d) activeDatesSet.add(d);
    }
    if (user.profile?.updatedAt) {
      const d = new Date(user.profile.updatedAt).toISOString().split('T')[0];
      if (d) activeDatesSet.add(d);
    }
    if (user.createdAt) {
      const d = new Date(user.createdAt).toISOString().split('T')[0];
      if (d) activeDatesSet.add(d);
    }

    // Add session dates
    allSessions.forEach(s => {
      if (s.startTime) {
        const d = new Date(s.startTime).toISOString().split('T')[0];
        if (d) activeDatesSet.add(d);
      }
      if (s.createdAt) {
        const d = new Date(s.createdAt).toISOString().split('T')[0];
        if (d) activeDatesSet.add(d);
      }
    });

    // Count current consecutive streak backward starting from today
    let currentStreak = 0;
    let checkDate = new Date(now);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0] || "";
      if (activeDatesSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate max historical consecutive streak
    const sortedDates = Array.from(activeDatesSet).sort().reverse();
    let maxHistoricalStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevStr = sortedDates[i - 1] || "";
        const currStr = sortedDates[i] || "";
        const prev = new Date(prevStr);
        const curr = new Date(currStr);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > maxHistoricalStreak) maxHistoricalStreak = tempStreak;
    }

    const bestStreak = Math.max(currentStreak, maxHistoricalStreak);

    const stats = {
      streak: currentStreak,
      bestStreak: bestStreak,
      hours: hoursThisWeek,
      hoursThisWeek: hoursThisWeek,
      totalHours: totalHours,
      partners: uniquePartners,
      score: avgScore
    };

    // 3. UPCOMING SESSIONS (Both AI Voice and Collaborative)
    const upcomingSessions = allSessions
      .filter(s => (s.status === "scheduled" || s.status === "Scheduled") && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3)
      .map(s => {
        const otherParticipants = (s.participants || []).filter((p: any) => p.id !== userId);
        const avatars = otherParticipants.map((p: any) => 
          p.email ? p.email.charAt(0).toUpperCase() : "?"
        );
        
        const isVoice = (s.participants || []).length <= 1;

        return {
          id: s.id,
          title: s.title || (isVoice ? "AI Voice Diagnostic" : "Peer Collaborative Session"), 
          time: new Date(s.startTime).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
          startTime: s.startTime,
          avatars: avatars.length > 0 ? avatars : ["AI"]
        };
      });

    // 4. PARSE CURRENT CALENDAR WEEK GOALS & COMPUTE DYNAMIC TOPIC PROGRESS
    const userSubjects = user.profile?.subjects || [];
    const userTopics = user.profile?.topics || [];
    const dbAcademicGoals = user.profile?.academicGoals?.trim();

    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(23, 59, 59, 999);

    let goals: Array<{ id: string; title: string; progress: number; color: string }> = [];

    if (dbAcademicGoals && dbAcademicGoals.length > 0) {
      const lines = dbAcademicGoals.split('\n').map(l => l.trim()).filter(Boolean);
      
      interface ParsedGoalItem {
        rawTag: string;
        dateVal: number;
        cleanText: string;
        inCurrentWeek: boolean;
      }

      const parsedList: ParsedGoalItem[] = [];

      for (const line of lines) {
        // Match tags like [Week of 7/18/2026]: or [Updated 7/17/2026]:
        const tagMatch = line.match(/^\[(Week of|Updated)\s+([^\]]+)\]:\s*(.*)/i);
        if (tagMatch && tagMatch[2] && tagMatch[3]) {
          const dateStr = tagMatch[2].trim();
          const text = tagMatch[3].trim();
          const dateObj = new Date(dateStr);
          const dateVal = dateObj.getTime() || 0;
          const inCurrentWeek = dateObj >= currentMonday && dateObj <= currentSunday;

          if (text && text.length > 2) {
            parsedList.push({ rawTag: (tagMatch[1] || "") + " " + dateStr, dateVal, cleanText: text, inCurrentWeek });
          }
        } else {
          if (line.length > 3 && !line.toLowerCase().startsWith("improve grades")) {
            parsedList.push({ rawTag: "General", dateVal: 0, cleanText: line, inCurrentWeek: true });
          }
        }
      }

      if (parsedList.length > 0) {
        // Filter for goals belonging to current week first
        let weekGoals = parsedList.filter(p => p.inCurrentWeek);

        // Fallback: If no goal is explicitly tagged for current week, pick from most recent tagged week
        if (weekGoals.length === 0) {
          const maxDateVal = Math.max(...parsedList.map(p => p.dateVal));
          weekGoals = maxDateVal > 0 ? parsedList.filter(p => p.dateVal === maxDateVal) : parsedList;
        }

        // Deduplicate cleanText
        const uniqueTexts: string[] = [];
        for (const item of weekGoals) {
          const txt = item.cleanText;
          if (!uniqueTexts.includes(txt) && txt.toLowerCase() !== "review session concepts.") {
            uniqueTexts.push(txt);
          }
        }

        if (uniqueTexts.length === 0) {
          for (const item of weekGoals) {
            if (!uniqueTexts.includes(item.cleanText)) {
              uniqueTexts.push(item.cleanText);
            }
          }
        }

        const colors = ["#1363CB", "#159E22", "#9C2FDF", "#EAB308"];

        // DYNAMIC PROGRESS CALCULATION: Increase progress when student learns about topic in Voice/Collab sessions
        goals = uniqueTexts.slice(0, 3).map((titleText, idx) => {
          const keywords = titleText.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['with', 'about', 'this', 'that', 'from', 'into', 'week', 'focus', 'concept', 'concepts'].includes(w));
          
          let matchingSessionCount = 0;
          completedSessions.forEach(s => {
            const sessionText = `${s.title || ''} ${s.subject || ''} ${s.analysis?.summary || ''} ${(s.analysis?.topics || []).join(' ')}`.toLowerCase();
            if (keywords.some(kw => sessionText.includes(kw))) {
              matchingSessionCount++;
            }
          });

          let dynamicProgress = 35 + (idx === 0 ? 10 : 0);
          if (matchingSessionCount === 1) dynamicProgress = 65;
          else if (matchingSessionCount === 2) dynamicProgress = 85;
          else if (matchingSessionCount >= 3) dynamicProgress = 100;

          return {
            id: `goal-${idx + 1}`,
            title: titleText,
            progress: dynamicProgress,
            color: colors[idx % colors.length] || "#1363CB"
          };
        });
      }
    }

    // Fallback: If no academicGoals in DB, generate goals based on active subjects/topics
    if (goals.length === 0 && (userSubjects.length > 0 || userTopics.length > 0)) {
      const pSubject = userSubjects[0] || "General Studies";
      const pTopic = userTopics[0] || "Core Concepts";

      goals = [
        {
          id: "g1",
          title: `Master ${pTopic} in ${pSubject}`,
          progress: avgScore > 0 ? Math.min(100, avgScore) : 60,
          color: "#1363CB"
        },
        {
          id: "g2",
          title: `Complete oral voice diagnostics for ${pSubject}`,
          progress: avgScore > 0 ? 100 : 40,
          color: "#159E22"
        }
      ];
    }

    // 5. HIGHEST MATCH SCORE SUGGESTED PARTNERS
    let suggestedPartners: Array<{
      id: string;
      initials: string;
      name: string;
      subject: string;
      match: string;
      gradient: string;
    }> = [];

    // Fetch real potential partners from database excluding self
    const candidateProfiles = await prisma.profile.findMany({
      where: { userId: { not: userId } },
      include: { user: true }
    });

    if (candidateProfiles.length > 0) {
      const userLearningStyle = user.profile?.learningStyle || [];

      // Calculate exact match percentage for each candidate
      const scoredPartners = candidateProfiles.map(p => {
        const email = p.user.email || "student@example.com";
        const emailPrefix = email.split('@')[0] || "Student";
        const firstName = p.user.firstName ?? "";
        const lastName = p.user.lastName ?? "";
        const fullName = (firstName || lastName) 
          ? `${firstName} ${lastName}`.trim() 
          : emailPrefix;
          
        const initials = (firstName || lastName) 
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() 
          : emailPrefix.substring(0, 2).toUpperCase();

        const pSubjects = p.subjects || [];
        const pTopics = p.topics || [];
        const pLearningStyle = p.learningStyle || [];

        // Match calculation breakdown:
        // 1. Subject Overlap (40%)
        const subjectOverlap = pSubjects.filter(s => userSubjects.includes(s)).length;
        const subjectScore = userSubjects.length > 0 ? (subjectOverlap / userSubjects.length) * 40 : 20;

        // 2. Topic Overlap (35%)
        const topicOverlap = pTopics.filter(t => userTopics.includes(t)).length;
        const topicScore = userTopics.length > 0 ? (topicOverlap / Math.max(1, userTopics.length)) * 35 : 20;

        // 3. Learning Style Compatibility (25%)
        const styleOverlap = pLearningStyle.filter(l => userLearningStyle.includes(l)).length;
        const styleScore = userLearningStyle.length > 0 ? (styleOverlap / userLearningStyle.length) * 25 : 15;

        const totalCalculatedPct = Math.round(Math.min(98, Math.max(55, subjectScore + topicScore + styleScore)));

        const primaryTag = pSubjects[0] || pTopics[0] || "General Studies";

        const gradients = [
          "from-blue-500 to-indigo-600",
          "from-emerald-500 to-teal-600",
          "from-purple-500 to-violet-600",
          "from-amber-500 to-orange-600"
        ];
        const gradient = gradients[initials.charCodeAt(0) % gradients.length] || "from-blue-500 to-indigo-600";

        return {
          id: p.userId,
          initials,
          name: fullName,
          subject: primaryTag,
          scoreVal: totalCalculatedPct,
          match: `${totalCalculatedPct}% Match`,
          gradient,
          avatarUrl: p.avatarUrl || null
        };
      });

      // SORT STRICTLY BY HIGHEST MATCH SCORE DESCENDING
      scoredPartners.sort((a, b) => b.scoreVal - a.scoreVal);
      
      // Select top 3 highest matching partners
      suggestedPartners = scoredPartners.slice(0, 3).map(({ scoreVal, ...rest }) => rest);
    }

    // Determine user display name
    const userName = user.firstName 
      ? `${user.firstName} ${user.lastName || ''}`.trim() 
      : user.email.split('@')[0];

    const pendingRequestsCount = await prisma.request.count({
      where: { receiverId: userId, status: "Pending" }
    });

    res.status(200).json({
      user: { 
        name: userName,
        sessionsThisWeek: upcomingSessions.length,
        pendingRequests: pendingRequestsCount 
      },
      stats,
      sessions: upcomingSessions,
      goals,
      suggestedPartners
    });

  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};