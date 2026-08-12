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

    // 2. Not in cache -> Call Pollinations Open GET API (100% free, no API key required)
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&nologo=true&seed=${seed}`;

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
