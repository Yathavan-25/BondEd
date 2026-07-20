import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding test users with detailed topic assessments...");

  // 1. THE MAIN USER (You)
  await prisma.user.create({
    data: {
      id: "test-user-1",
      firebaseUid: "firebase-1",
      email: "johndoe@university.edu",
      firstName: "John",
      lastName: "Doe",
      profile: {
        create: {
          topics: ["React", "Node.js"],
          subjects: ["Computer Science"],
          learningStyle: ["Visual"],
          availability: { times: ["Weekends", "Evenings"] },
          academicGoals: "Build full-stack apps",
          knowledgeLevel: { 
            score: 75, 
            feedback: "Solid basics",
            topicBreakdown: [
              { topic: "React", subject: "Computer Science", score: 85, summary: "Mastered hooks and props." },
              { topic: "Node.js", subject: "Computer Science", score: 65, summary: "Good with basics, struggling with async." }
            ]
          },
          personality: { openness: 80, conscientiousness: 85, extraversion: 60, agreeableness: 75 }
        }
      }
    }
  });

  // 2. THE "EXPERT" MATCH (High Mastery)
  await prisma.user.create({
    data: {
      id: "test-user-2",
      firebaseUid: "firebase-2",
      email: "jane@university.edu",
      firstName: "Jane",
      lastName: "Wilson",
      profile: {
        create: {
          topics: ["React", "TypeScript"],
          subjects: ["Computer Science"],
          learningStyle: ["Visual"],
          availability: { times: ["Weekends"] },
          academicGoals: "Master frontend",
          knowledgeLevel: { 
            score: 92, 
            feedback: "Advanced knowledge",
            topicBreakdown: [
              { topic: "React", subject: "Computer Science", score: 95, summary: "Deep mastery of state management." },
              { topic: "TypeScript", subject: "Computer Science", score: 90, summary: "Highly disciplined." }
            ]
          },
          personality: { openness: 75, conscientiousness: 90, extraversion: 65, agreeableness: 80 }
        }
      }
    }
  });

  // 3. THE "BEGINNER" STUDENT (Low scores, bars will be Red)
  await prisma.user.create({
    data: {
      id: "test-user-3",
      firebaseUid: "firebase-3",
      email: "sam@university.edu",
      firstName: "Sam",
      lastName: "Beginner",
      profile: {
        create: {
          topics: ["React", "HTML"],
          subjects: ["Computer Science"],
          learningStyle: ["Aural"],
          availability: { times: ["Weekdays"] },
          academicGoals: "Learn to code",
          knowledgeLevel: { 
            score: 35, 
            feedback: "Still finding their feet.",
            topicBreakdown: [
              { topic: "React", subject: "Computer Science", score: 30, summary: "Foundations are shaky." },
              { topic: "HTML", subject: "Computer Science", score: 40, summary: "Basic tags understood." }
            ]
          },
          personality: { openness: 50, conscientiousness: 40, extraversion: 50, agreeableness: 60 }
        }
      }
    }
  });

  // 4. THE "OVERLOADED" STUDENT (Too many topics, testing the tag fallback)
  await prisma.user.create({
    data: {
      id: "test-user-4",
      firebaseUid: "firebase-4",
      email: "alex@university.edu",
      firstName: "Alex",
      lastName: "Multitasker",
      profile: {
        create: {
          topics: ["React", "Node.js", "Docker", "AWS", "SQL"],
          subjects: ["Computer Science"],
          learningStyle: ["Read/Write"],
          availability: { times: ["Evenings"] },
          academicGoals: "DevOps mastery",
          knowledgeLevel: { 
            score: 65, 
            feedback: "Wide breadth, shallow depth.",
            topicBreakdown: [
              { topic: "React", subject: "Computer Science", score: 70, summary: "Okay." },
              { topic: "Node.js", subject: "Computer Science", score: 65, summary: "Average." },
              { topic: "Docker", subject: "Computer Science", score: 55, summary: "Basic containers." },
              { topic: "AWS", subject: "Computer Science", score: 50, summary: "Concepts only." }
            ]
          },
          personality: { openness: 90, conscientiousness: 50, extraversion: 80, agreeableness: 70 }
        }
      }
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });