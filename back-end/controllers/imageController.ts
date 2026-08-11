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

    // 2. Not in cache -> Call Gemini Imagen API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    // Google Generative AI Imagen 3 endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          { prompt: prompt }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9" // Good for educational diagrams
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return res.status(500).json({ error: 'Failed to generate image from Gemini' });
    }

    const data = await response.json() as any;
    
    if (!data.predictions || data.predictions.length === 0) {
      return res.status(500).json({ error: 'No predictions returned from Gemini' });
    }

    // Imagen returns raw base64 string in bytesBase64Encoded
    const base64Data = data.predictions[0].bytesBase64Encoded;
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;

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
