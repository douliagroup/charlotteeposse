'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload,   Library, 
  FileText, 
  MoreHorizontal,
  Search,
  Plus,
  Loader2,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/lib/AppContext';

export const SourcesTab = () => {
  const { sources, addSource, deleteSource, updateSource } = useAppContext(); // Assure-toi que updateSource existe dans ton Context
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceType, setNewSourceType] = useState('LIEN');
  const [newSourceCat, setNewSourceCat] = useState('RECHERCHE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour traduire le contenu d'une source via Gemini
  const handleTranslate = async (sourceId: string, content: string, title: string) => {
    if (!content || content.length < 5) return;
    
    setTranslatingId(sourceId);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Traduis le texte suivant en français médical fluide et professionnel. Garde une structure claire. Voici le texte : \n\n${content}`,
          history: []
        }),
      });

      const data = await response.json();
      if (data.text && updateSource) {
        // On met à jour la source avec le texte traduit
        await updateSource(sourceId, { 
          content: data.text,
          title: `(FR) ${title}` 
        });
      }
    } catch (error) {
      console.error("Erreur de traduction:", error);
    } finally {
      setTranslatingId(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await addSource(
        file.name,
        file.type.split('/')[1]?.toUpperCase() || "DOC",
        "RECHERCHE",
        "RECHERCHE",
        "Source locale",
        "Importée aujourd'hui",
        ""
      );
    }
  };

  const handleAddManualSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTitle.trim()) return;
    
    const isUrl = newSourceContent.startsWith('http');
    await addSource(
      newSourceTitle, 
      newSourceType, 
      newSourceCat, 
      newSourceCat, 
      "Manuel", 
      isUrl ? "" : newSourceContent,
      isUrl ? newSourceContent : ""
    );
    setIsModalOpen(false);
    setNewSourceTitle('');
    setNewSourceContent('');
  };

  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 bg-[#F5F4F0] h-full overflow-y-auto pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10 gap-4">
        <div className="mt-10 lg:mt-0">
          <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">Bibliothèque de Sources</h2>
          <p className="text-xs md:text-sm text-gray-400 font-medium">Base documentaire exclusive du Docteur Eposse</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E8E5E0] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#008080] transition-all" 
            />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
          <button onClick={() => setIsModalOpen(true)} className="bg-[#1A1A1A] text-white px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-black transition-all">
            <Plus size={18} /> Nouvelle
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-[#008080] text-white px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-[#006666] transition-all shadow-lg shadow-[#008080]/20">
            <Upload size={18} /> Importer
          </button>
        </div>
      </div>

      {/* Zone de Drop (Visuelle) */}
      <div onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-dashed border-[#E8E5E0] rounded-[24px] md:rounded-[40px] p-8 md:p-16 text-center mb-8 md:mb-12 group hover:border-[#008080] transition-all cursor-pointer">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-[#E6F2F2] rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
          <Library className="text-[#008080]" size={24} />
        </div>
        <h3 className="text-base md:text-lg font-bold text-[#1A1A1A] mb-2">Glissez vos documents ici</h3>
        <p className="text-xs md:text-sm text-gray-400 font-medium max-w-xs mx-auto">PDF, DOCX ou Liens. Vos sources seront indexées pour vos recherches.</p>
      </div>

      {/* Liste des Sources */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {filteredSources.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[32px] border border-[#E8E5E0] border-dashed">
              <p className="text-sm text-gray-400 font-medium italic">Aucune source trouvée.</p>
            </div>
          ) : (
            filteredSources.map((source) => (
              <motion.div 
                key={source.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[24px] border border-[#E8E5E0] shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F5F4F0] rounded-xl flex items-center justify-center text-[#008080]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase tracking-widest">{source.type}</span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded uppercase tracking-widest">{source.cat}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1A1A1A]">{source.title}</h4>
                    </div>
                  </div>
                  <button onClick={() => deleteSource(source.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Affichage du contenu/résumé si disponible */}
                {source.content && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {source.content}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#F5F4F0]">
                  <p className="text-[10px] text-[#008080] font-bold uppercase tracking-widest">{source.source || "Source externe"}</p>
                  <div className="flex gap-2">
                    {/* LE BOUTON DE TRADUCTION */}
                    {source.content && !source.title.includes("(FR)") && (
                      <button 
                        onClick={() => handleTranslate(source.id, source.content, source.title)}
                        disabled={translatingId === source.id}
                        className="px-4 py-2 bg-[#F5F4F0] text-gray-600 rounded-lg text-[10px] font-bold hover:bg-[#008080] hover:text-white transition-all flex items-center gap-2 uppercase"
                      >
                        {translatingId === source.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Languages size={12} />
                        )}
                        Traduire en français
                      </button>
                    )}
                    <button className="px-4 py-2 bg-[#E6F2F2] text-[#008080] rounded-lg text-[10px] font-bold hover:bg-[#008080] hover:text-white transition-all uppercase tracking-widest">
                      CITER
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal d'ajout manuel (simplifié pour l'exemple) */}
      {/* ... (le reste du code de ta modal est identique) ... */}
    </div>
  );
};