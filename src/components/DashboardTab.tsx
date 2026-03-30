'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Microscope,
  BookOpen
} from 'lucide-react';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/AppContext';

const vizData = [
  { name: 'Jan', value: 420 },
  { name: 'Fév', value: 380 },
  { name: 'Mar', value: 590 },
  { name: 'Avr', value: 720 },
  { name: 'Mai', value: 850 },
  { name: 'Juin', value: 910 },
];

export const DashboardTab = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { tasks, sessions, setActiveSessionId, sources } = useAppContext();
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }));
  }, []);

  const urgentTasks = tasks
    .filter(t => !t.completed)
    .slice(0, 2);

  const latestSessions = sessions.slice(0, 2);

  const latestPublications = sources
    .filter(s => s.category === 'VEILLE')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 3);

  const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();

  const stats = [
    { label: 'À FAIRE', value: tasks.filter(t => !t.completed).length.toString().padStart(2, '0'), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'EN COURS', value: tasks.filter(t => t.progress > 0 && t.progress < 100).length.toString().padStart(2, '0'), icon: Zap, color: 'text-[#008080]', bg: 'bg-[#E6F2F2]' },
    { label: 'TERMINÉES', value: tasks.filter(t => t.completed).length.toString().padStart(2, '0'), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'URGENT', value: tasks.filter(t => !t.completed && (t.date.includes('DEMAIN') || t.date.includes(currentMonthName))).length.toString().padStart(2, '0'), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="p-6 md:p-8 bg-[#F5F4F0] h-full overflow-y-auto">
      <div className="mb-8 md:mb-10 mt-12 lg:mt-0">
        <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A]">Tableau de bord</h2>
        <p className="text-xs md:text-sm text-gray-400 font-medium">
          Bienvenue, Docteur Eposse. {currentDate && `Nous sommes le ${currentDate}. `}Voici un aperçu de vos activités.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/60 backdrop-blur-sm p-3 md:p-4 rounded-[18px] md:rounded-[20px] border border-[#008080]/10 shadow-sm hover:shadow-md transition-all"
          >
            <div className={cn("w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center mb-2", stat.bg)}>
              <stat.icon className={stat.color} size={16} />
            </div>
            <p className="text-lg md:text-xl font-bold text-[#1A1A1A] mb-0.5">{stat.value}</p>
            <p className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-5">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm p-4 md:p-5 rounded-[20px] md:rounded-[24px] border border-[#008080]/10 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#008080]/5 rounded-full blur-2xl -mr-12 -mt-12" />
          <div className="flex items-center justify-between mb-3 md:mb-5 relative z-10">
            <h3 className="font-bold text-[11px] md:text-xs text-[#1A1A1A]">Progression de la recherche</h3>
            <button onClick={() => setActiveTab('viz')} className="text-[#008080] text-[8px] md:text-[9px] font-bold hover:underline flex items-center gap-1">
              VOIR PLUS <ArrowRight size={10} />
            </button>
          </div>
          <div className="h-[200px] md:h-[240px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vizData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F4F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'bold', fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="value" stroke="#008080" strokeWidth={2} dot={{ r: 3, fill: '#008080', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar in Dashboard */}
        <div className="space-y-4 md:space-y-5">
          {/* Urgent Tasks */}
          <div className="bg-white/60 backdrop-blur-sm p-4 md:p-5 rounded-[18px] md:rounded-[20px] border border-[#008080]/10 shadow-sm">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h3 className="font-bold text-[10px] md:text-[11px] text-[#1A1A1A]">Tâches urgentes</h3>
              <button onClick={() => setActiveTab('tasks')} className="text-gray-400 hover:text-[#008080]">
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              {urgentTasks.length === 0 ? (
                <p className="text-[9px] text-gray-400 italic">Aucune tâche urgente.</p>
              ) : (
                urgentTasks.map((task) => (
                  <div key={task.id} onClick={() => setActiveTab('tasks')} className="flex items-start gap-2 p-2 rounded-lg md:rounded-xl hover:bg-[#F5F4F0] transition-colors cursor-pointer">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <div>
                      <p className="text-[10px] md:text-[11px] font-bold text-[#1A1A1A] line-clamp-1">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[7px] md:text-[8px] font-bold text-[#008080] uppercase">{task.tag}</span>
                        <span className="text-[7px] md:text-[8px] text-gray-400 font-bold uppercase">{task.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest Sessions */}
          <div className="bg-[#1A1A1A] p-4 md:p-5 rounded-[18px] md:rounded-[20px] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#008080]/20 rounded-full blur-xl" />
            <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
              <h3 className="font-bold text-[10px] md:text-[11px]">Dernières sessions</h3>
              <button onClick={() => setActiveTab('sessions')} className="text-[#008080] hover:text-white">
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-1.5 md:space-y-2 relative z-10">
              {latestSessions.length === 0 ? (
                <p className="text-[8px] text-gray-400 italic">Aucune session récente.</p>
              ) : (
                latestSessions.map((session, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setActiveTab('chat');
                    }}
                    className="group cursor-pointer"
                  >
                    <p className="text-[9px] md:text-[10px] font-bold group-hover:text-[#008080] transition-colors line-clamp-1">{session.title}</p>
                    <p className="text-[7px] md:text-[7px] text-gray-400 mt-0.5 font-bold uppercase">{session.date}</p>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setActiveTab('chat')}
              className="w-full mt-3 md:mt-4 bg-[#008080] text-white py-2 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-[#00A3A3] transition-all flex items-center justify-center gap-2 relative z-10"
            >
              <MessageSquare size={10} />
              CONTINUER LE CHAT
            </button>
          </div>

          {/* Latest Publications (Veille Pédiatrique) */}
          <div className="bg-white/60 backdrop-blur-sm p-4 md:p-5 rounded-[18px] md:rounded-[20px] border border-[#008080]/10 shadow-sm">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="flex items-center gap-2">
                <Microscope size={14} className="text-[#008080]" />
                <h3 className="font-bold text-[10px] md:text-[11px] text-[#1A1A1A]">Veille Pédiatrique</h3>
              </div>
              <button onClick={() => setActiveTab('veille')} className="text-gray-400 hover:text-[#008080]">
                <ArrowRight size={12} />
              </button>
            </div>
            <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-3">Dernières publications PubMed</p>
            <div className="space-y-3">
              {latestPublications.length === 0 ? (
                <p className="text-[8px] text-gray-400 italic">Aucune publication récente.</p>
              ) : (
                latestPublications.map((pub, i) => (
                  <div key={i} onClick={() => setActiveTab('veille')} className="group cursor-pointer border-l-2 border-[#008080]/20 pl-3 hover:border-[#008080] transition-all">
                    <p className="text-[9px] md:text-[10px] font-bold text-[#1A1A1A] line-clamp-2 group-hover:text-[#008080] transition-colors">{pub.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <BookOpen size={8} className="text-[#008080]" />
                      <span className="text-[7px] md:text-[8px] text-gray-400 font-bold uppercase truncate">{pub.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
