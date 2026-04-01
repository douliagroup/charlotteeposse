'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Plus, 
  MessageSquare, 
  Layers, 
  Library, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings,
  ChevronLeft,
  LogOut,
  Search,
  LayoutDashboard,
  Microscope
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- NAVIGATION CONFIG ---
const navigation = [
  { id: 'dashboard', name: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'chat', name: 'Chat IA', icon: MessageSquare },
  { id: 'sessions', name: 'Sessions', icon: Layers },
  { id: 'sources', name: 'Sources', icon: Library },
  { id: 'tasks', name: 'Tâches', icon: CheckSquare },
  { id: 'veille', name: 'Veille Pédiatrique', icon: Microscope },
  { id: 'outils', name: 'Outils & Recherche', icon: Search },
  { id: 'timeline', name: 'Chronogramme', icon: Calendar },
  { id: 'viz', name: 'Visualisation', icon: BarChart3 },
  { id: 'settings', name: 'Paramètres', icon: Settings },
];

// --- MOCK DATA ---
const history = [
  { id: 1, title: 'Hypertension artérielle résistante', date: '2026-03-24' },
  { id: 2, title: 'Microbiote intestinal et maladies inflam...', date: '2026-03-23' },
  { id: 3, title: 'Oncologie pédiatrique : protocoles 2026', date: '2026-03-22' },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

import { useAppContext } from '@/lib/AppContext';

export const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const { logout } = useAppContext();
  
  return (
    <>
      {/* Desktop & Mobile Sidebar */}
      <aside className={cn(
        "flex h-screen bg-white/10 backdrop-blur-2xl border-r border-[#008080]/10 flex-col shadow-2xl transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[240px]",
        "w-[240px] md:w-auto" // Ensure fixed width on mobile when open
      )}>
        {/* Header */}
        <div className={cn("p-5 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#008080]/10 shadow-sm shrink-0 bg-white">
              <Image 
                src="https://i.postimg.cc/KYPJ7KtG/Doulia_Med.png" 
                alt="DouliaMed Logo" 
                fill
                className="object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            {(!isCollapsed || typeof window !== 'undefined' && window.innerWidth < 768) && (
              <div>
                <h1 className="font-bold text-sm leading-tight text-[#1A1A1A]">DouliaMed</h1>
                <p className="text-[10px] text-[#008080] font-bold uppercase tracking-wider">Assistant Médical</p>
              </div>
            )}
          </div>
          
          {/* Collapse toggle (Desktop only) */}
          <div className="hidden md:block">
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(true)}
                className="text-gray-400 hover:text-[#008080] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(false)}
                className="absolute -right-3 top-7 w-6 h-6 bg-white border border-[#008080]/20 rounded-full flex items-center justify-center text-[#008080] shadow-sm z-50 hover:bg-[#008080] hover:text-white transition-all"
              >
                <Plus size={14} className="rotate-45" />
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 mb-4">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "bg-[#1A1A1A] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all text-xs font-bold shadow-lg shadow-black/10",
              isCollapsed ? "w-10 h-10 mx-auto" : "w-full py-2.5"
            )}
          >
            <Plus size={18} />
            {!isCollapsed && "Nouvelle session"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-bold transition-all",
                activeTab === item.id 
                  ? "bg-[#008080]/10 text-[#008080] shadow-sm" 
                  : "text-gray-500 hover:bg-white/20 hover:text-[#1A1A1A]",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.name : ""}
            >
              <item.icon size={18} className={activeTab === item.id ? "text-[#008080]" : "text-gray-400"} />
              {!isCollapsed && item.name}
            </button>
          ))}

          {/* History Section */}
          {!isCollapsed && (
            <div className="mt-8 pt-8 border-t border-[#F5F4F0]">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Historique</p>
              <div className="px-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    className="w-full bg-[#F5F4F0] border-none rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-[#008080] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                {history.map((item) => (
                  <button key={item.id} className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F5F4F0] group transition-colors">
                    <p className="text-[11px] font-bold text-gray-700 truncate group-hover:text-[#1A1A1A]">{item.title}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{item.date}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer / Profile */}
        <div className="p-4 border-t border-[#F5F4F0]">
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#E6F2F2] shadow-sm shrink-0">
                <Image 
                  src="https://i.postimg.cc/Z5MH4cqY/Capture_d_e_cran_2026_02_24_a_12_47_09_PM.png" 
                  alt="Dr. Charlotte Eposse" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold truncate text-[#1A1A1A]">Dr. Charlotte Eposse</p>
                  <p className="text-[9px] text-[#008080] font-bold truncate uppercase tracking-tighter">Pédiatre - Chercheure</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button 
                onClick={() => logout()}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#008080]/10 flex items-center justify-around px-2 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navigation.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all",
              activeTab === item.id ? "text-[#008080]" : "text-gray-400"
            )}
          >
            <item.icon size={20} className={activeTab === item.id ? "text-[#008080]" : "text-gray-400"} />
            <span className="text-[8px] font-bold uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all",
            activeTab === 'settings' ? "text-[#008080]" : "text-gray-400"
          )}
        >
          <Settings size={20} />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Param.</span>
        </button>
      </nav>
    </>
  );
};
