import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

//Helper function to calculate the overlap between two arrays (eg : subject overlap )
const calculateMatch = (arr1 : string[], arr2 : string[]) => {
    if(!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    //filters any values that are on array one from array two
    const overlap = arr1.filter( value => arr2.includes(value));
    return overlap.length / Math.max(arr1.length, arr2.length);
    // returns the match between both students
    // eg : user1 = 3 subject user2 = 4 subject and 2 topic match = 2 / 4 = 0.5 //
}

//Helper function to match topics
const calculateAbsMatch = (arr1 : string[], arr2 : string[]) =>{
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;

    const normalize = (str : string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalArr = arr2.map(normalize);

    let matchCount = 0;
    
    for(const t1 of arr1){
        const n1 = normalize(t1);
        const isMatch = normalArr.some(n2 => n1.includes(n2) || n2.includes(n1));
        if(isMatch) matchCount++;
    }
    return matchCount / Math.max(arr1.length, arr2.length);
}

// Helper 3: Advanced Psychological Big Five Matching
const calculateBigFiveScore = (p1: any, p2: any): number => {
    // If profiles are missing (legacy users), return a neutral 0.5
    if (!p1 || !p2) return 0.5;

    const getScore = (p: any, trait: string) => {
        if (!p || !p[trait]) return null;
        return typeof p[trait] === 'object' ? p[trait].score : p[trait];
    };

    const c1 = getScore(p1, 'conscientiousness');
    const c2 = getScore(p2, 'conscientiousness');
    if (c1 === null || c2 === null) return 0.5;

    const e1 = getScore(p1, 'extraversion') || 50;
    const e2 = getScore(p2, 'extraversion') || 50;
    
    const o1 = getScore(p1, 'openness') || 50;
    const o2 = getScore(p2, 'openness') || 50;
    
    const a1 = getScore(p1, 'agreeableness') || 50;
    const a2 = getScore(p2, 'agreeableness') || 50;

    // 1. Conscientiousness (Highest Weight for Study Partners - Work Ethic)
    const cMatch = 1 - (Math.abs(c1 - c2) / 100);

    // 2. Extraversion (Medium Weight - Social Energy)
    const eMatch = 1 - (Math.abs(e1 - e2) / 100);

    // 3. Openness (Medium Weight - Abstract vs Concrete thinking)
    const oMatch = 1 - (Math.abs(o1 - o2) / 100);

    // 4. Agreeableness (Bonus - highly agreeable people work well with everyone)
    const aBonus = ((a1 + a2) / 200) * 0.2; // Max 0.2 bump

    // Weighted Average of the core traits
    let finalPsychScore = (cMatch * 0.5) + (eMatch * 0.25) + (oMatch * 0.25);
    
    // Add Agreeableness bonus and cap at 1.0 (100%)
    return Math.min(1.0, finalPsychScore + aBonus);
}

export const getMatches = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId as string;

    try {
        const currentUser = await prisma.profile.findUnique({
            where : { userId },
            include : { user : true}
        });

        if(!currentUser) {
            res.status(400).json({ error : "Profile not found" });
            return;
        }

        // 1. Fetch Existing Connections & Requests to Filter Them Out
        const existingConnections = await prisma.connection.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] }
        });
        const existingRequests = await prisma.request.findMany({
            where: { senderId: userId }
        });

        const excludedUserIds = [
            userId, // Exclude self
            ...existingConnections.map(c => c.user1Id === userId ? c.user2Id : c.user1Id), // Exclude friends
            ...existingRequests.map(r => r.receiverId) // Exclude pending requests
        ];

        // 2. Fetch Potential Partners (excluding the ones above)
        const potentialPartners = await prisma.profile.findMany({
            where : {
                userId: { notIn: excludedUserIds }, // THE MAGIC FILTER!
                OR : [
                    { topics : { hasSome : currentUser.topics }},
                    { subjects : { hasSome : currentUser.subjects }}
                ],
            },
            include : { user : true }
        });

        const matches = potentialPartners.map( partner => {
            let score = 0;

            // ----- HIGHEST PRIORITY MATCH ( TOPIC, SUBJECT ) ( 40% ) ----- 
            const topicMatch = calculateAbsMatch(currentUser.topics, partner.topics);
            score += topicMatch * 25; 
            const subjectMatch = calculateAbsMatch(currentUser.subjects, partner.subjects);
            score += subjectMatch * 15;

            // ----- SECOND HIGHEST PRIORITY MATCH PERSONALITY MATCH ( 25% ) -----
            const bigFiveMatch = calculateBigFiveScore(currentUser.personality, partner.personality);
            score += bigFiveMatch * 25;

            // ----- KNOWLEDGE MATCH ( 15% ) ----- 
            const currentUserKnowledge = ( currentUser.knowledgeLevel as any )?.score || 0;
            const partnerKnowledge = ( partner.knowledgeLevel as any )?.score || 0;
            score += Math.max(0, 15 - (Math.abs(currentUserKnowledge - partnerKnowledge) / 15));

            // ----- AVAILABILITY MATCH ( 10% ) -----
            const currenUserAvail = ( currentUser.availability as any )?.times || [];
            const partnerAvail = ( partner.availability as any )?.times || [];
            const availabilityMatch = calculateMatch( currenUserAvail, partnerAvail );
            score += availabilityMatch * 10;

            // ----- LEARNING STYLE MATCH ( 10% ) -----
            const styleMatch = calculateMatch( currentUser.learningStyle, partner.learningStyle );
            score += styleMatch * 10

            const breakdown = (partner.knowledgeLevel as any)?.topicBreakdown || [];
            const unifiedTopics = partner.topics.map(topicName => {
                const normName = topicName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const found = breakdown.find((b: any) => b.topic.toLowerCase().replace(/[^a-z0-9]/g, '') === normName);
                return {
                    name: topicName,
                    score: found ? found.score : partnerKnowledge, // Fallback to overall score if specific isn't found
                    subject: found ? found.subject : (partner.subjects[0] || "General Studies")
                };
            });
            // Sort topics from highest score to lowest score
            unifiedTopics.sort((a, b) => b.score - a.score);

            return {
                id : partner.userId,
                //if partners firstname doesn't exist use the email before the @ 
                name : partner.user.firstName ? `${partner.user.firstName} ${partner.user.lastName || ''}`.trim() : partner.user.email.split('@')[0],
                initials : (partner.user.firstName && partner.user.lastName) ? `${partner.user.firstName.charAt(0)}${partner.user.lastName.charAt(0)}`.toUpperCase() : partner.user.email.substring(0, 2).toUpperCase(),
                match : Math.round(score),
                lookingForTopic : unifiedTopics,
                lookingForSubject : partner.subjects,
                availability : partnerAvail.join(", ") || "Flexible",
                avatarBg: "from-[#1363CB] to-[#9C2FDF]",
                avatarUrl: partner.avatarUrl || null,
                learningStyle: partner.learningStyle,
                personality: partner.personality, // The JSON object
                knowledgeLevel: partner.knowledgeLevel, // The JSON object containing topicBreakdown
            }
        });

        matches.sort((a,b) => b.match - a.match );
        const topMatches = matches.slice( 0, 10 );
        res.status(200).json(topMatches);

    } catch (error) {
        console.error("Match Engine Error:", error);
        res.status(500).json({ error: "Failed to calculate matches" });
    }

}