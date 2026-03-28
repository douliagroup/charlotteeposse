'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Library, 
  FileText, 
  MoreHorizontal,
  Search,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/lib/AppContext';

export const SourcesTab = () => {
  const { sources, addSource, deleteSource } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceType, setNewSourceType] = useState('LIEN');
  const [newSourceCat, setNewSourceCat] = useState('RECHERCHE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await addSource(
        file.name,
        file.type.split('/')[1]?.toUpperCase() || "DOC",
        "RECHERCHE",
        "Source locale — Importée aujourd'hui"
      );
    }
  };

  const handleAddManualSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTitle.trim()) return;
    
    await addSource(newSourceTitle, newSourceType, newSourceCat, newSourceContent);
    setIsModalOpen(false);
    setNewSourceTitle('');
    setNewSourceContent('');
  };

  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10 bg-[#F5F4F0] h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Bibliothèque de Sources</h2>
          <p className="text-sm text-gray-400 font-medium">Base documentaire exclusive du Docteur Eposse</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#E8E5E0] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#008080] transition-all" 
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleUpload}
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={18} /> Nouvelle
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#008080] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#006666] transition-all shadow-lg shadow-[#008080]/20"
          >
            <Upload size={18} /> Importer
          </button>
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-dashed border-[#E8E5E0] rounded-[40px] p-16 text-center mb-12 group hover:border-[#008080] transition-all cursor-pointer"
      >
        <div className="w-16 h-16 bg-[#E6F2F2] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
          <Library className="text-[#008080]" size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">Glissez vos documents ici</h3>
        <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">PDF, DOCX, BibTeX ou RIS. Vos sources seront indexées par l&apos;IA pour vos recherches.</p>
      </div>

      {/* Modal for New Source */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#F5F4F0] rounded-xl transition-all text-gray-400"
              >
                <Plus className="rotate-45" size={20} />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 bg-[#E6F2F2] rounded-2xl flex items-center justify-center text-[#008080] mb-4">
                  <Library size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">Nouvelle Source</h3>
                <p className="text-sm text-gray-400 font-medium">Ajoutez manuellement une source ou un lien.</p>
              </div>

              <form onSubmit={handleAddManualSource} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Titre de la Source</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                    placeholder="Ex: Protocole OMS Néphroblastome"
                    className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Type</label>
                    <select 
                      value={newSourceType}
                      onChange={(e) => setNewSourceType(e.target.value)}
                      className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all"
                    >
                      <option value="LIEN">LIEN</option>
                      <option value="NOTE">NOTE</option>
                      <option value="ARTICLE">ARTICLE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                    <select 
                      value={newSourceCat}
                      onChange={(e) => setNewSourceCat(e.target.value)}
                      className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all"
                    >
                      <option value="RECHERCHE">RECHERCHE</option>
                      <option value="CLINIQUE">CLINIQUE</option>
                      <option value="BIBLIO">BIBLIO</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contenu ou URL</label>
                  <textarea 
                    value={newSourceContent}
                    onChange={(e) => setNewSourceContent(e.target.value)}
                    placeholder="Collez le lien ou le résumé ici..."
                    className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all h-24 resize-none" 
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#008080] text-white py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-[#008080]/20"
                >
                  AJOUTER À LA BIBLIOTHÈQUE
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredSources.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[32px] border border-[#E8E5E0] border-dashed">
              <p className="text-sm text-gray-400 font-medium italic">Aucune source trouvée.</p>
            </div>
          ) : (
            filteredSources.map((source) => (
              <motion.div 
                key={source.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[24px] border border-[#E8E5E0] shadow-sm flex items-center justify-between hover:bg-[#F5F4F0]/50 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#F5F4F0] rounded-xl flex items-center justify-center text-[#008080]">
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="flex gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase tracking-widest">{source.type}</span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded uppercase tracking-widest">{source.cat}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1A1A1A]">{source.title}</h4>
                    <p className="text-[11px] text-[#008080] font-bold mt-1 uppercase tracking-tighter">{source.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => console.log(`Cité : ${source.title}`)}
                    className="px-4 py-2 bg-[#E6F2F2] text-[#008080] rounded-lg text-[10px] font-bold hover:bg-[#008080] hover:text-white transition-all uppercase tracking-widest"
                  >
                    CITER
                  </button>
                  <button 
                    onClick={() => deleteSource(source.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
