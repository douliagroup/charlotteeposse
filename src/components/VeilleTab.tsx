'use client';

import React, { useState } from 'react';
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

interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  translatedTitle?: string;
  translatedSummary?: string;
  isTranslating?: boolean;
}

const initialArticles: Article[] = [
  {
    id: '1',
    title: 'New insights into the management of pediatric neuroblastoma',
    summary: 'This study explores novel targeted therapies and immunotherapy approaches for high-risk neuroblastoma in children, showing promising survival rates in recent clinical trials.',
    source: 'Journal of Clinical Oncology',
    date: 'March 2026',
    url: 'https://pubmed.ncbi.nlm.nih.gov/'
  },
  {
    id: '2',
    title: 'Impact of gut microbiome on early childhood development',
    summary: 'A comprehensive longitudinal study identifying specific microbial signatures associated with cognitive and motor development milestones in infants aged 0-24 months.',
    source: 'Pediatrics International',
    date: 'February 2026',
    url: 'https://pubmed.ncbi.nlm.nih.gov/'
  },
  {
    id: '3',
    title: 'Advances in neonatal respiratory distress syndrome treatment',
    summary: 'Evaluation of less invasive surfactant administration (LISA) techniques compared to traditional intubation in preterm infants, focusing on long-term pulmonary outcomes.',
    source: 'The Lancet Child & Adolescent Health',
    date: 'January 2026',
    url: 'https://pubmed.ncbi.nlm.nih.gov/'
  },
  {
    id: '4',
    title: 'Genetic markers for early detection of pediatric leukemia',
    summary: 'Identification of novel germline mutations that predispose children to acute lymphoblastic leukemia, enabling earlier screening and personalized monitoring protocols.',
    source: 'Nature Communications',
    date: 'March 2026',
    url: 'https://pubmed.ncbi.nlm.nih.gov/'
  }
];

export const VeilleTab = () => {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTranslate = async (id: string) => {
    setArticles(prev => prev.map(art => 
      art.id === id ? { ...art, isTranslating: true } : art
    ));

    // Simulate translation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setArticles(prev => prev.map(art => {
      if (art.id === id) {
        // Mock translation logic
        const translations: Record<string, { title: string; summary: string }> = {
          '1': { 
            title: 'Nouvelles perspectives dans la prise en charge du neuroblastome pédiatrique', 
            summary: 'Cette étude explore de nouvelles thérapies ciblées et des approches d\'immunothérapie pour le neuroblastome à haut risque chez l\'enfant, montrant des taux de survie prometteurs dans les essais cliniques récents.' 
          },
          '2': { 
            title: 'Impact du microbiome intestinal sur le développement de la petite enfance', 
            summary: 'Une étude longitudinale complète identifiant des signatures microbiennes spécifiques associées aux étapes du développement cognitif et moteur chez les nourrissons âgés de 0 à 24 mois.' 
          },
          '3': { 
            title: 'Progrès dans le traitement du syndrome de détresse respiratoire néonatale', 
            summary: 'Évaluation des techniques d\'administration de surfactant moins invasives (LISA) par rapport à l\'intubation traditionnelle chez les prématurés, en se concentrant sur les résultats pulmonaires à long terme.' 
          },
          '4': { 
            title: 'Marqueurs génétiques pour la détection précoce de la leucémie pédiatrique', 
            summary: 'Identification de nouvelles mutations germinales qui prédisposent les enfants à la leucémie aiguë lymphoblastique, permettant un dépistage plus précoce et des protocoles de surveillance personnalisés.' 
          }
        };

        return { 
          ...art, 
          translatedTitle: translations[id].title, 
          translatedSummary: translations[id].summary, 
          isTranslating: false 
        };
      }
      return art;
    }));
  };

  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10 bg-[#F5F4F0] h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-3">
            <Microscope className="text-[#008080]" size={28} />
            Veille Pédiatrique
          </h2>
          <p className="text-sm text-gray-400 font-medium">Dernières publications scientifiques et actualités académiques</p>
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
          {filteredArticles.map((article, i) => (
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
                  {article.source}
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{article.date}</span>
              </div>

              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 leading-tight">
                {article.translatedTitle || article.title}
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed font-medium mb-8 flex-1">
                {article.translatedSummary || article.summary}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-[#F5F4F0] mt-auto">
                <button 
                  onClick={() => handleTranslate(article.id)}
                  disabled={article.isTranslating || !!article.translatedTitle}
                  className={cn(
                    "flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-all",
                    article.translatedTitle 
                      ? "text-green-500 cursor-default" 
                      : "text-[#008080] hover:text-black"
                  )}
                >
                  {article.isTranslating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      TRADUCTION...
                    </>
                  ) : article.translatedTitle ? (
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
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[11px] font-bold text-gray-400 hover:text-[#1A1A1A] uppercase tracking-widest transition-all"
                >
                  PUBMED
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredArticles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Newspaper size={64} className="text-gray-400 mb-4" />
          <p className="text-lg font-bold text-gray-500">Aucun article trouvé pour votre recherche.</p>
        </div>
      )}
    </div>
  );
};
