import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Augmente la durée autorisée sur Vercel Pro si besoin

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history, sessionContext, sourcesContext, webContext, file } = body;

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API manquante dans l'environnement." }, { status: 500 });
    }

    // 1. Initialisation Gemini 3 Flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Plus stable pour éviter les Timeouts, change en "gemini-3-flash-preview" si tu as l'accès confirmé
      systemInstruction: `TU ES DOULIAMED. Réponds en français. Pas d'astérisques (*). Utilise __gras__. 
      CONTEXTE SUPABASE: ${sourcesContext || ""}
      CONTEXTE WEB: ${webContext || ""}
      ${sessionContext || ""}`
    });

    // 2. Préparation des messages
    const contents: any[] = [];
    if (history) {
      history.forEach((h: any) => contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));
    }

    const userParts: any[] = [{ text: message || "Analyse ce document." }];

    // 3. Gestion ultra-rapide des fichiers
    if (file) {
      if (file.extractedText) {
        userParts[0].text += `\n\nDOC: ${file.extractedText.substring(0, 5000)}`;
      } else if (file.data) {
        const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
        userParts.push({ inlineData: { data: base64Data, mimeType: file.mimeType || 'application/pdf' } });
      }
    }

    contents.push({ role: 'user', parts: userParts });

    // 4. Appel avec limite de temps
    const result = await model.generateContent({
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.5 }
    });

    return NextResponse.json({ text: result.response.text() });

  } catch (error: any) {
    console.error("ERREUR DOULIAMED:", error);
    // On renvoie l'erreur réelle pour comprendre le blocage
    return NextResponse.json(
      { error: `Erreur Technique: ${error.message}` },
      { status: 500 }
    );
  }
}