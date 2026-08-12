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

    // 2. Polish raw spoken text/request using Gemini into an optimized visual diagram prompt
    let finalPrompt = `High quality crisp educational diagram, clear vector flowchart, readable text labels, HD: ${prompt}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const polishInstruction = `You are an expert AI prompt engineer for educational graphic design and visual diagrams.
Given the student request or conversational prompt below, transform it into a 1-sentence prompt for a modern, flat-vector educational infographic diagram.
Rules:
1. Describe a clean 2D vector graphic with vibrant colored rectangular blocks on a clean light background.
2. Specify clear structural layout (e.g. "3-column side-by-side comparison layout", "stacked horizontal cards in top-to-bottom order").
3. DO NOT use words like "tree", "plant", or botanical terms—use "hierarchy chart", "nested boxes", or "block diagram".
4. Keep labels minimal, bold, and in plain English (e.g. HTML, CSS, STYLED PAGE).
5. Avoid requesting long code snippets or nested paragraph text inside the image.
6. Output ONLY the polished prompt string without quotes, markdown, or extra commentary.

User Request: "${prompt}"`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: polishInstruction }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 120 }
          })
        });

        if (geminiRes.ok) {
          const geminiJson: any = await geminiRes.json();
          const polishedText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (polishedText) {
            finalPrompt = `Modern flat vector educational infographic, clean studio graphic design, minimalist 2D vector, high contrast: ${polishedText.replace(/["']/g, '')}`;
            console.log("[ImageController] Polished Prompt:", finalPrompt);
          }
        }
      } catch (polishErr) {
        console.error("[ImageController] Failed to polish prompt with Gemini, using fallback:", polishErr);
      }
    }

    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=flux&width=1280&height=720&nologo=true&seed=${seed}`;

    const response = await fetch(pollinationsUrl);

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
