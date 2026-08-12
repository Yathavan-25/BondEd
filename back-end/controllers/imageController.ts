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

    // 2. Not in cache -> Call Gemini Image Generation API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${geminiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `Educational diagram or visual aid: ${prompt}` }] }
        ],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Image API Error:', errorText);
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('limit: 0')) {
        return res.status(429).json({ error: 'Gemini image generation requires billing enabled on your Google Cloud project (free tier quota limit is 0).' });
      }
      return res.status(500).json({ error: 'Failed to generate image from Gemini' });
    }

    const data = await response.json() as any;

    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
      return res.status(500).json({ error: 'No image data returned from Gemini' });
    }

    const mimeType = inlineData.mimeType || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${inlineData.data}`;

    // 3. Save to Cache
    await prisma.cachedImage.create({
      data: {
        topic,
        subject,
        imageUrl: dataUrl,
        source: 'gemini-imagen-3',
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
