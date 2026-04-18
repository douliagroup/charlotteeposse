'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Calendar, 
  Tag, 
  Trash2, 
  ChevronRight,
  Filter,
  MoreVertical,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/lib/AppContext';
import { cn } from '@/lib/utils';

export const SessionsTab = () => {
  const { sessions, activeSessionId, setActiveSessionId, setActiveTab, addSession, deleteSession } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Sécurité : Protection contre sessions undefined ou null
  const safeSessions = sessions || [];

  const filteredSessions = safeSessions.filter(s => 
    s && (
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tag?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const newId = await addSession("Nouvelle Analyse Médicale", "Général");
      if (newId) {
        setActiveSessionId(newId);
        setActiveTab('chat');
      }
    } catch (error) {
      console.error("Erreur création session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectSession = (id: string) => {
    if (!id) return;
    setActiveSessionId(id);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F4F0] p-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Sessions d&apos;Analyse</h2>
          <p className="text-sm text-gray-500">Gérez l&apos;historique de vos consultations IA</p>
        </div>
        
        <button 
          onClick={handleCreateSession}
          disabled={isCreating}
          className="bg-[#008080] text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-[#008080]/20 hover:bg-[#006666] transition-all disabled:opacity-50"
        >
          {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          NOUVELLE SESSION
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#008080]/10 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher une pathologie, un patient ou une date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#008080]/20 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 p-3 rounded-xl text-gray-500 hover:border-[#008080] hover:text-[#008080] transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                layoutId={session.id}
                onClick={() => selectSession(session.id)}
                className={cn(
                  "bg-white p-6 rounded-3xl border transition-all cursor-pointer group relative",
                  activeSessionId === session.id 
                    ? "border-[#008080] shadow-xl shadow-[#008080]/5 ring-1 ring-[#008080]" 
                    : "border-transparent hover:border-[#008080]/30 shadow-sm"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    activeSessionId === session.id ? "bg-[#008080] text-white" : "bg-[#F5F4F0] text-[#008080]"
                  )}>
                    <MessageSquare size={20} />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm("Supprimer cette session ?")) deleteSession(session.id);
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="font-bold text-[#1A1A1A] mb-1 line-clamp-1">{session.title}</h3>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F5F4F0]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                    <Calendar size={12} />
                    {session.timestamp ? new Date(session.timestamp).toLocaleDateString('fr-FR') : 'Date inconnue'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#008080] uppercase bg-[#008080]/5 px-2 py-0.5 rounded-md">
                    <Tag size={12} />
                    {session.tag || 'Général'}
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 text-[#008080] opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                  <ChevronRight size={20} />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Aucune session trouvée</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">
              Commencez une nouvelle analyse pour voir vos sessions s&apos;afficher ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};