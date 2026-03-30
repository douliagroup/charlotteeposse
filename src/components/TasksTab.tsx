'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/AppContext';

export const TasksTab = () => {
  const { tasks, addTask, toggleTask, deleteTask } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTag, setNewTaskTag] = useState('RECHERCHE');
  const [newTaskDate, setNewTaskDate] = useState('');

  const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask(newTaskTitle, newTaskTag, newTaskDate || "À DÉFINIR");
    setNewTaskTitle('');
    setNewTaskDate('');
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-10 bg-[#F5F4F0] h-full overflow-y-auto pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10 gap-4">
        <div className="mt-10 lg:mt-0">
          <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">Gestionnaire de Tâches</h2>
          <p className="text-xs md:text-sm text-gray-400 font-medium">Suivez l&apos;avancement de vos projets de recherche et académiques</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-black/10"
        >
          <Plus size={18} /> Nouvelle tâche
        </button>
      </div>

      {/* Modal Ajout Tâche */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-6">Nouvelle Tâche</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">INTITULÉ DE LA TÂCHE</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Rédaction article..."
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">CATÉGORIE</label>
                <select 
                  value={newTaskTag}
                  onChange={(e) => setNewTaskTag(e.target.value)}
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                >
                  <option value="RECHERCHE">RECHERCHE</option>
                  <option value="AGRÉGATION">AGRÉGATION</option>
                  <option value="ENSEIGNEMENT">ENSEIGNEMENT</option>
                  <option value="CLINIQUE">CLINIQUE</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ÉCHÉANCE</label>
                <input 
                  type="text" 
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  placeholder={`Ex: 15 ${currentMonthName}`}
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
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
                  onClick={handleAddTask}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold bg-[#008080] text-white hover:bg-black transition-all"
                >
                  CRÉER
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
        {[
          { label: 'À FAIRE', value: tasks.filter(t => !t.completed).length.toString().padStart(2, '0'), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'EN COURS', value: tasks.filter(t => t.progress > 0 && t.progress < 100).length.toString().padStart(2, '0'), icon: Zap, color: 'text-[#008080]', bg: 'bg-[#E6F2F2]' },
          { label: 'TERMINÉES', value: tasks.filter(t => t.completed).length.toString().padStart(2, '0'), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'URGENT', value: tasks.filter(t => !t.completed && (t.date.includes('DEMAIN') || t.date.includes(currentMonthName))).length.toString().padStart(2, '0'), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-[#E8E5E0] shadow-sm">
            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4", stat.bg)}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-xl md:text-3xl font-bold text-[#1A1A1A] mb-1">{stat.value}</p>
            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl md:rounded-[32px] border border-[#E8E5E0] shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-[#F5F4F0] flex items-center justify-between">
          <h3 className="font-bold text-sm md:text-base text-[#1A1A1A]">Tâches prioritaires</h3>
          <button className="text-[#008080] text-[10px] md:text-xs font-bold hover:underline tracking-widest uppercase">VOIR TOUT</button>
        </div>
        <div className="divide-y divide-[#F5F4F0]">
          {tasks.length === 0 ? (
            <div className="p-10 md:p-20 text-center">
              <p className="text-xs md:text-sm text-gray-400 font-medium italic">Aucune tâche enregistrée. Commencez par en créer une.</p>
            </div>
          ) : (
            tasks.map((task, i) => (
              <div key={task.id} className={cn("p-5 md:p-8 hover:bg-[#F5F4F0]/30 transition-colors", task.completed && "opacity-60")}>
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-3">
                  <div className="flex items-start gap-3 md:gap-4">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        task.completed ? "bg-[#008080] border-[#008080]" : "border-[#008080]"
                      )}
                    >
                      {task.completed && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                    <div>
                      <h4 className={cn("font-bold text-sm text-[#1A1A1A] mb-1", task.completed && "line-through")}>{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#E6F2F2] text-[#008080] text-[9px] font-bold rounded uppercase tracking-widest">{task.tag}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Supprimer cette tâche ?')) {
                              deleteTask(task.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <AlertCircle size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">ÉCHÉANCE : {task.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-[#F5F4F0] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-[#008080] rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#008080]">{task.progress}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
