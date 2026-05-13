import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Configuration obligatoire pour Next.js 15 sur Vercel Free
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, history, sessionContext, sourcesContext, tasksContext, webContext, file } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
       return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // On utilise 1.5-flash : c'est le plus rapide pour éviter les Timeouts sur ton plan Free
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: `TU ES DOULIAMED. Ton : Expert et Académique. 
      Règles : Pas d'astérisques (*), utilise __gras__. 
      Contexte : ${sourcesContext || ""} ${webContext || ""}`
    });

    const contents: any[] = [];
    if (history) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        });
      });
    }

    const userParts: any[] = [{ text: message || "Analyse ce document." }];

    if (file) {
      if (file.extractedText) {
        userParts[0].text += `\n\nCONTENU DU DOCUMENT :\n${file.extractedText.substring(0, 4000)}`;
      } else if (file.data) {
        // Extraction propre du Base64
        const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
        userParts.push({
          inlineData: { data: base64Data, mimeType: file.mimeType || 'application/pdf' }
        });
      }
    }

    contents.push({ role: 'user', parts: userParts });

    const result = await model.generateContent({
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
    });

    return NextResponse.json({ text: result.response.text() });

  } catch (error: any) {
    console.error("DouliaMed Error:", error);
    return NextResponse.json({ error: "Erreur technique : " + error.message }, { status: 500 });
  }
}