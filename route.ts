import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, history, sessionContext, sourcesContext, tasksContext, webContext, file } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
       return NextResponse.json({ error: "Clé API Gemini manquante." }, { status: 500 });
    }

    // 1. Initialisation du SDK Officiel (présent dans ton package.json)
    const genAI = new GoogleGenerativeAI(apiKey);
    const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Reprise intégrale de tes instructions système (La personnalité DouliaMed)
    let systemInstruction = `
      Date du jour : ${currentDate}.
      TU ES DOULIAMED, l'intelligence médicale exclusive et le partenaire d'excellence académique du Docteur Charlotte Eposse, pédiatre et enseignante-chercheuse à Douala.
      Tu as été conçu et développé par DOULIA, Cabinet Conseil et solutions Digitales, basée à Douala, Cameroun.
      
      MISSION PRIORITAIRE : VEILLE SCIENTIFIQUE PÉDIATRIQUE
      - Ta mission principale est d'assurer une veille scientifique de haut niveau.
      - Pour toute question médicale, recherche des sources récentes (PubMed, The Lancet, NEJM).
      - Format source : [Titre de l'étude](URL) - Brève conclusion.
      
      TON ET POSTURE :
      - Expert en recherche clinique, rigoureux et académique.
      - Partenaire de réflexion et coach qui encourage le Docteur.
      
      RÈGLE ABSOLUE SUR L'ACTUALITÉ :
      - Utilise EXCLUSIVEMENT le webContext pour 2024, 2025 et 2026. 
      - Si le webContext est insuffisant, dis : "Docteur, mes recherches actuelles ne me permettent pas de confirmer cette information pour l'année en cours."
      
      RÈGLES DE RÉDACTION (TTS OPTIMISÉ) :
      - JAMAIS d'astérisques (*), de dièses (#) ou de listes à puces.
      - Utilise UNIQUEMENT le gras (__mot__) pour souligner.
      - Sépare chaque idée par deux sauts de ligne (\\n\\n).
      - Utilise des tableaux Markdown pour les comparaisons d'études.
      
      CONTEXTE (SUPABASE & WEB) :
      ${sessionContext || ""} ${sourcesContext || ""} ${tasksContext || ""}
      WEB : ${webContext || "Aucun résultat web disponible."}
    `;

    // 3. Action B : Optimisation Serveur
    let maxTokens = 8192;
    if (file) {
      systemInstruction += `\n\nATTENTION : Document joint. Sois extrêmement concis pour éviter un Timeout serveur.`;
      maxTokens = 1500;
    }

    // 4. Configuration Gemini 3 Flash Preview
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction 
    });

    // 5. Préparation des messages
    const contents: any[] = [];
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        });
      });
    }

    const userParts: any[] = [{ text: message || "Analyse ce document." }];

    // 6. Gestion du fichier (Conversion URL Supabase vers Base64)
    if (file) {
      if (file.extractedText) {
        userParts[0].text += `\n\nCONTENU DU DOCUMENT :\n${file.extractedText}`;
      } else if (file.data) {
        let base64Data = file.data;
        if (typeof file.data === 'string' && file.data.startsWith('http')) {
          const fileRes = await fetch(file.data);
          const arrayBuffer = await fileRes.arrayBuffer();
          base64Data = Buffer.from(arrayBuffer).toString('base64');
        } else if (file.data.includes(',')) {
          base64Data = file.data.split(',')[1];
        }

        userParts.push({
          inlineData: { data: base64Data, mimeType: file.mimeType || 'application/pdf' }
        });
      }
    }

    contents.push({ role: 'user', parts: userParts });

    // 7. Exécution avec gestion d'erreur simplifiée
    const result = await model.generateContent({
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
    });

    return NextResponse.json({ text: result.response.text() });

  } catch (error: any) {
    console.error("DouliaMed Engine Error:", error);
    return NextResponse.json(
      { error: "Docteur, le document est trop volumineux ou l'analyse a pris trop de temps. Essayez de poser une question plus ciblée." },
      { status: 500 }
    );
  }
}