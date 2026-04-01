'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  MoreHorizontal,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/lib/AppContext';

export const SessionsTab = () => {
  const { sessions, addSession, setActiveSessionId, setActiveTab } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionNote, setNewSessionNote] = useState('');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;
    
    await addSession(newSessionTitle, newSessionNote);
    setIsModalOpen(false);
    setNewSessionTitle('');
    setNewSessionNote('');
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 bg-[#F5F4F0] h-full overflow-y-auto pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10 gap-4">
        <div className="mt-10 lg:mt-0">
          <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">Sessions de Recherche</h2>
          <p className="text-xs md:text-sm text-gray-400 font-medium">Retrouvez l&apos;historique de vos réflexions académiques</p>
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={18} /> Nouvelle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <AnimatePresence>
          {filteredSessions.map((session) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              onClick={() => {
                setActiveSessionId(session.id);
                setActiveTab('chat');
              }}
              className="bg-white p-6 rounded-[32px] border border-[#E8E5E0] shadow-sm hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-[#E6F2F2] text-[#008080] text-[10px] font-bold rounded-full uppercase tracking-widest">{session.tag}</span>
                <span className="text-[10px] text-gray-400 font-bold">{session.date}</span>
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A] mb-3 group-hover:text-[#008080] transition-colors">{session.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-3 mb-8 leading-relaxed font-medium">{session.desc}</p>
              <div className="items-center flex justify-between pt-5 border-t border-[#F5F4F0]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F5F4F0] flex items-center justify-center">
                    <MessageSquare size={12} className="text-gray-400" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{session.messages.length} MESSAGES</span>
                </div>
                <button className="text-[#008080] text-[11px] font-bold hover:underline tracking-widest">OUVRIR</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal for New Session */}
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
                <X size={20} />
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-[#008080]/10 shadow-sm overflow-hidden relative shrink-0">
                  <Image 
                    src="https://i.postimg.cc/KYPJ7KtG/Doulia_Med.png" 
                    alt="DouliaMed Logo" 
                    fill
                    className="object-contain p-1.5"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Nouvelle Session</h3>
                  <p className="text-sm text-gray-400 font-medium">Définissez le contexte de votre recherche médicale.</p>
                </div>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de la Session</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="Ex: Analyse Néphroblastome 2026"
                    className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Note de contexte (Optionnel)</label>
                  <textarea 
                    value={newSessionNote}
                    onChange={(e) => setNewSessionNote(e.target.value)}
                    placeholder="Précisez vos objectifs ou hypothèses..."
                    className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all h-24 resize-none" 
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#008080] text-white py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-[#008080]/20"
                >
                  DÉMARRER LA SESSION
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
