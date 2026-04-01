'use client';

import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Search, 
  ExternalLink, 
  Languages,
  Loader2,
  BookOpen,
  Microscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/AppContext';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleState {
  id: string;
  translatedTitle?: string;
  translatedSummary?: string;
  isTranslating?: boolean;
}

export const VeilleTab = () => {
  const { sources } = useAppContext();
  const [articleStates, setArticleStates] = useState<Record<string, ArticleState>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const veilleArticles = sources.filter(s => s.source_type === 'VEILLE');

  const handleTranslate = async (id: string, title: string, content: string) => {
    setArticleStates(prev => ({
      ...prev,
      [id]: { ...prev[id], id, isTranslating: true }
    }));

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Traduis le titre et le résumé médical suivant en français. 
      Le résumé doit être structuré sous forme de tableau Markdown pour une lecture rapide (Colonnes: Aspect, Détails).
      
      TITRE: ${title}
      RÉSUMÉ: ${content}
      
      Réponds UNIQUEMENT au format JSON:
      {
        "title": "Titre traduit",
        "summary": "Résumé en tableau Markdown"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");

      setArticleStates(prev => ({
        ...prev,
        [id]: { 
          ...prev[id], 
          translatedTitle: result.title, 
          translatedSummary: result.summary, 
          isTranslating: false 
        }
      }));
    } catch (error) {
      console.error("Translation error:", error);
      setArticleStates(prev => ({
        ...prev,
        [id]: { ...prev[id], isTranslating: false }
      }));
    }
  };

  const filteredArticles = veilleArticles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.source_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10 bg-[#F5F4F0] h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-3">
            <Microscope className="text-[#008080]" size={28} />
            Veille Pédiatrique
          </h2>
          <p className="text-sm text-gray-400 font-medium">Dernières publications scientifiques et actualités académiques (Sources Supabase)</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un article..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, i) => {
            const state = articleStates[article.id] || {};
            return (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[32px] p-8 border border-[#E8E5E0] shadow-sm hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#E6F2F2] text-[#008080] rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <BookOpen size={12} />
                    {article.source_type}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {new Date(article.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 leading-tight">
                  {state.translatedTitle || article.title}
                </h3>

                <div className="text-sm text-gray-500 leading-relaxed font-medium mb-8 flex-1 markdown-body">
                  {state.translatedSummary ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {state.translatedSummary}
                    </ReactMarkdown>
                  ) : (
                    <p>{article.content}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#F5F4F0] mt-auto">
                  <button 
                    onClick={() => handleTranslate(article.id, article.title, article.content || "")}
                    disabled={state.isTranslating || !!state.translatedTitle}
                    className={cn(
                      "flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all",
                      state.translatedTitle 
                        ? "text-green-500 cursor-default" 
                        : "text-[#008080] hover:text-black"
                    )}
                  >
                    {state.isTranslating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        TRADUCTION...
                      </>
                    ) : state.translatedTitle ? (
                      <>
                        <Languages size={14} />
                        TRADUIT EN FRANÇAIS
                      </>
                    ) : (
                      <>
                        <Languages size={14} />
                        TRADUIRE EN FRANÇAIS
                      </>
                    )}
                  </button>

                  <a 
                    href={article.file_path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] font-bold text-gray-400 hover:text-[#1A1A1A] uppercase tracking-widest transition-all"
                  >
                    SOURCE
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredArticles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Newspaper size={64} className="text-gray-400 mb-4" />
          <p className="text-lg font-bold text-gray-500">Aucun article trouvé dans votre base de données.</p>
        </div>
      )}
    </div>
  );
};
