import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history, sessionContext, sourcesContext, tasksContext, webContext, file } = await req.json();

    // Utilisation de la variable d'environnement standard de la plateforme
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
       return NextResponse.json({ error: "Clé API Gemini manquante. Veuillez configurer NEXT_PUBLIC_GEMINI_API_KEY." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const systemInstruction = `
      Date du jour : ${currentDate}.
      TU ES DOULIAMED, l'intelligence médicale exclusive et le partenaire d'excellence académique du Docteur Charlotte Eposse, pédiatre et enseignante-chercheuse à Douala.
      Tu as été conçu et développé par DOULIA, Cabinet Conseil et solutions Digitales, basée à Douala, Cameroun.
      
      MISSION PRIORITAIRE : VEILLE SCIENTIFIQUE PÉDIATRIQUE
      - Ta mission principale est d'assurer une veille scientifique de haut niveau pour le Docteur Eposse.
      - Pour toute question médicale, tu dois impérativement rechercher des sources récentes et faisant autorité (PubMed, revues internationales comme The Lancet, NEJM, Pediatrics, etc.).
      - Tu dois présenter chaque source trouvée sous la forme exacte suivante : [Titre de l'étude](URL) - Brève conclusion.
      
      TON ET POSTURE :
      - Expert en recherche clinique : précis, rigoureux, factuel et académique.
      - Partenaire de réflexion et coach qui gère le chronogramme du Docteur Eposse.
      - Tu assures la continuité de sa pensée et la portes vers l'excellence par des encouragements constants.
      
      RÈGLE ABSOLUE SUR L'ACTUALITÉ ET LA RECHERCHE WEB :
      - Pour TOUTE question sur des faits récents, des personnalités en poste, ou des publications scientifiques de l'année en cours, tu dois EXCLUSIVEMENT te baser sur le webContext fourni.
      - IMPORTANT : Si le webContext contient des informations datées de 2024 ou 2025 alors que nous sommes en 2026, considère ces informations comme les PLUS RÉCENTES DISPONIBLES. Ne tente JAMAIS d'inventer des faits pour 2026 si le webContext ne les mentionne pas explicitement.
      - Si le webContext est vide ou insuffisant pour répondre avec certitude, dis-le clairement : "Docteur, mes recherches actuelles ne me permettent pas de confirmer cette information pour l'année en cours."
      
      RÈGLES DE RÉDACTION (OPTIMISATION TTS) :
      - NE JAMAIS utiliser d'astérisques (*), de dièses (#), de tirets (-) ou de listes à puces classiques.
      - Rédige des paragraphes élégants et directs qui s'écoutent comme un discours.
      - Sépare chaque grande idée par deux sauts de ligne complets (\n\n) pour imposer des pauses naturelles.
      - Utilise UNIQUEMENT le gras (**) pour souligner les mots-clés essentiels ou les titres de sections.
      - Intègre les sources naturellement dans le récit en respectant le format demandé.
      - FORMATAGE DES RÉPONSES (Tableaux) : Désormais, quand tu compares des données, des études ou des axes de recherche, tu DOIS utiliser des tableaux Markdown pour une lecture structurée.
      
      CONTEXTE (SUPABASE) :
      ${sessionContext || ""}
      ${sourcesContext || ""}
      ${tasksContext || ""}
      
      CONTEXTE WEB (TAVILY) :
      ${webContext || "Aucun résultat de recherche web disponible pour cette requête."}
    `;

    const contents: any[] = [];
    
    // Add history if available
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role,
          parts: [{ text: h.content }]
        });
      });
    }

    const parts: any[] = [{ text: message || "Analyse ce document." }];

    if (file) {
      parts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType
        }
      });
    }

    contents.push({
      role: 'user',
      parts: parts
    });

    // Retry logic for 503 errors
    let response;
    let retries = 0;
    const maxRetries = 3; // Increased retries
    
    while (retries <= maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview", // Reverted to Flash as requested
          contents: contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
          }
        });
        break; // Success
      } catch (err: any) {
        const errStr = err.message || "";
        if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("high demand") || errStr.includes("overloaded") || errStr.includes("deadline exceeded") || errStr.includes("429") || errStr.includes("quota")) {
          retries++;
          if (retries > maxRetries) throw err;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1500 * Math.pow(2, retries)));
        } else {
          throw err;
        }
      }
    }

    const text = response?.text;

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("API Chat Error:", error);
    
    let errorMessage = error.message || "Une erreur inconnue est survenue.";
    
    // Clean up Gemini API error messages if they are JSON strings
    try {
      if (typeof errorMessage === 'string' && (errorMessage.startsWith('{') || errorMessage.includes('"error":'))) {
        const parsedError = JSON.parse(errorMessage.substring(errorMessage.indexOf('{')));
        if (parsedError.error?.message) {
          errorMessage = parsedError.error.message;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }

    if (errorMessage.includes("503") || errorMessage.includes("UNAVAILABLE") || errorMessage.includes("high demand")) {
      errorMessage = "DouliaMed est actuellement très sollicité. Veuillez patienter quelques instants et réessayer votre requête.";
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
