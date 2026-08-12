import type { Request, Response } from 'express';
import prisma from '../config/prisma.js';

export const generateImage = async (req: Request, res: Response) => {
  try {
    const { prompt, topic = 'general', subject = 'general' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 1. Check Cache
    // We do a simple case-insensitive check on the prompt as a keyword
    const cachedImage = await prisma.cachedImage.findFirst({
      where: {
        keywords: {
          has: prompt.toLowerCase().trim()
        }
      }
    });

    if (cachedImage) {
      // Increment usage count
      await prisma.cachedImage.update({
        where: { id: cachedImage.id },
        data: { usageCount: cachedImage.usageCount + 1 }
      });

      return res.status(200).json({
        imageUrl: cachedImage.imageUrl,
        cached: true
      });
    }

    // 2. Intelligently analyze & polish raw spoken request using Gemini into a subject-tailored visual prompt
    let finalPrompt = `High quality crisp educational diagram, clear 2D graphic, readable text labels, HD: ${prompt}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const polishInstruction = `You are an expert AI educational visualization prompt engineer for text-to-image models (SANA/FLUX).
Analyze the student request or conversational prompt below and generate a 1-sentence prompt for an HD educational visual diagram or graphic.

Analysis & Disambiguation Rules:
1. IDENTIFY THE SUBJECT & CONTEXT:
   - If Computer Science / Web Dev / Coding (e.g. "DOM tree", "binary tree", "HTML nesting"): Disambiguate technical metaphors (e.g. use "hierarchical block diagram with parent and child node boxes" or "nested container cards").
   - If Biology / Botany / Environmental Science (e.g. "oak tree", "plant cell", "photosynthesis"): Describe a detailed 2D vector scientific diagram of the actual botanical tree, plant anatomy, or biological system.
   - If Chemistry / Physics / Math / History: Adapt the visual layout naturally (e.g., molecular structure diagram, physics force vector chart, coordinate plane, or chronological timeline).

2. DETERMINE OPTIMAL VISUAL STRUCTURE DYNAMICALLY:
   - Choose the best structural layout for the specific topic (flowchart, side-by-side comparison, block diagram, timeline, or vector illustration). Do not force a static layout.

3. OPTIMIZE FOR TEXT & LEGIBILITY:
   - Request clean typography with minimal, bold, plain English labels (e.g. "HTML", "CSS", "Nucleus", "Photosynthesis").
   - Avoid requesting long code paragraphs or dense multi-line text blocks inside the image.

Output ONLY the polished prompt string without quotes, markdown, or commentary.

User Request: "${prompt}"`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: polishInstruction }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 140 }
          })
        });

        if (geminiRes.ok) {
          const geminiJson: any = await geminiRes.json();
          const polishedText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (polishedText) {
            finalPrompt = `Modern flat vector educational infographic, clean studio graphic design, high resolution: ${polishedText.replace(/["']/g, '')}`;
            console.log("[ImageController] Polished Prompt:", finalPrompt);
          }
        }
      } catch (polishErr) {
        console.error("[ImageController] Failed to polish prompt with Gemini, using fallback:", polishErr);
      }
    }

    // 3. Not in cache -> Call Pollinations SANA Engine (Nvidia linear-attention HD model optimized for diagrams/typography)
    const seed = Math.floor(Math.random() * 1000000);
    let pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=sana&width=1280&height=720&nologo=true&seed=${seed}`;

    let response = await fetch(pollinationsUrl);

    // Fallback to FLUX model if SANA engine is busy
    if (!response.ok) {
      console.warn("Pollinations SANA engine response not ok, falling back to FLUX...");
      pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=flux&width=1280&height=720&nologo=true&seed=${seed}`;
      response = await fetch(pollinationsUrl);
    }

    if (!response.ok) {
      console.error('Pollinations API Error:', response.statusText);
      return res.status(500).json({ error: 'Failed to generate image from Pollinations' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // 3. Save to Cache
    await prisma.cachedImage.create({
      data: {
        topic,
        subject,
        imageUrl: dataUrl,
        source: 'pollinations',
        keywords: [prompt.toLowerCase().trim()]
      }
    });

    return res.status(200).json({
      imageUrl: dataUrl,
      cached: false
    });

  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
