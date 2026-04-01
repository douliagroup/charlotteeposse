'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Zap,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useAppContext } from '@/lib/AppContext';

export const TimelineTab = () => {
  const { events, addEvent } = useAppContext();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust for Monday start (0=Sun, 1=Mon, ..., 6=Sat)
  // If firstDayOfMonth is 0 (Sun), it should be 6. If 1 (Mon), it should be 0.
  const emptySlots = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"
  ];

  const handleAddEvent = async () => {
    if (!newTitle.trim()) return;
    await addEvent(
      newTitle,
      newActivity || "RECHERCHE",
      newDate || "À DÉFINIR",
      newDesc || "Planification ajoutée au chronogramme stratégique.",
      "À VENIR",
      "bg-blue-400"
    );
    setNewTitle('');
    setNewActivity('');
    setNewDate('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  return (
    <div className="p-10 bg-[#F5F4F0] h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Chronogramme Académique</h2>
          <p className="text-sm text-gray-400 font-medium">Planification stratégique vers l&apos;agrégation</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all"
        >
          <Plus size={18} /> Ajouter un événement
        </button>
      </div>

      {/* Modal Ajout Événement */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-6">Nouvel Événement</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TITRE</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Soumission article..."
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ACTIVITÉ / TYPE</label>
                <input 
                  type="text" 
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Ex: RECHERCHE, AGRÉGATION..."
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">DATE / PÉRIODE</label>
                <input 
                  type="text" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="Ex: 15 MARS"
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">DESCRIPTION</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Détails de l'événement..."
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none min-h-[100px]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold text-gray-400 hover:bg-[#F5F4F0] transition-all"
                >
                  ANNULER
                </button>
                <button 
                  onClick={handleAddEvent}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold bg-[#008080] text-white hover:bg-black transition-all"
                >
                  AJOUTER
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex gap-10">
        <div className="flex-1 space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E5E0]">
          {events.length === 0 ? (
            <div className="pl-16 py-10">
              <p className="text-sm text-gray-400 font-medium italic">Aucun événement planifié.</p>
            </div>
          ) : (
            events.map((event, i) => (
              <motion.div 
                key={event.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-16"
              >
                <div className={cn("absolute left-0 top-1 w-12 h-12 rounded-2xl flex items-center justify-center text-white z-10 shadow-lg", event.color)}>
                  <Zap size={20} />
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-base text-[#1A1A1A] mb-1">{event.title}</h3>
                      <p className="text-[10px] text-[#008080] font-bold uppercase tracking-widest">{event.date}</p>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-bold tracking-widest", 
                      event.status === "COMPLÉTÉ" ? "bg-green-50 text-green-600" : "bg-[#E6F2F2] text-[#008080]"
                    )}>{event.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{event.desc}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="w-[340px] space-y-8 text-black">
          <div className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <button className="text-gray-400 hover:text-[#1A1A1A]">{'<'}</button>
              <p className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest">{monthNames[currentMonth]} {currentYear}</p>
              <button className="text-gray-400 hover:text-[#1A1A1A]">{'>'}</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={`${d}-${i}`} className="text-[10px] font-bold text-gray-400">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {/* Empty slots for the start of the month */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedDay(i + 1)}
                  className={cn(
                    "aspect-square flex items-center justify-center text-[11px] font-bold rounded-xl transition-all cursor-pointer",
                    i + 1 === selectedDay ? "bg-[#008080] text-white shadow-lg shadow-[#008080]/30" : "hover:bg-[#F5F4F0] text-gray-600",
                    i + 1 === currentDay && i + 1 !== selectedDay && "border border-[#008080] text-[#008080]"
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-8 rounded-[32px] text-white shadow-xl">
            <h3 className="text-[10px] font-bold text-[#008080] uppercase tracking-widest mb-4">COACHING DOULIAMED</h3>
            <p className="text-xs leading-relaxed font-medium italic mb-6">
              &quot;Docteur Eposse, vous êtes en avance sur votre chronogramme de 3 jours. Profitez-en pour approfondir la section discussion de votre article.&quot;
            </p>
            <button className="w-full bg-[#008080] text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#00A3A3] transition-all">
              VOIR LES CONSEILS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
