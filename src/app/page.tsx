'use client';

import React from 'react';
import { AppProvider, useAppContext } from '@/lib/AppContext';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';
import { DashboardTab } from '@/components/DashboardTab';
import { ChatTab } from '@/components/ChatTab';
import { SessionsTab } from '@/components/SessionsTab';
import { SourcesTab } from '@/components/SourcesTab';
import { TasksTab } from '@/components/TasksTab';
import { TimelineTab } from '@/components/TimelineTab';
import { VisualisationTab } from '@/components/VisualisationTab';
import { SettingsTab } from '@/components/SettingsTab';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const { activeTab, setActiveTab } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab setActiveTab={setActiveTab} />;
      case 'chat':
        return <ChatTab />;
      case 'sessions':
        return <SessionsTab />;
      case 'sources':
        return <SourcesTab />;
      case 'tasks':
        return <TasksTab />;
      case 'timeline':
        return <TimelineTab />;
      case 'viz':
        return <VisualisationTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab setActiveTab={setActiveTab} />;
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F4F0] flex relative overflow-hidden">
      {/* Creative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#008080]/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#008080]/10 rounded-full blur-[140px] pointer-events-none animate-pulse delay-1000" />
      <div className="absolute top-[15%] right-[15%] w-32 h-32 border border-[#008080]/20 rounded-full blur-md pointer-events-none animate-bounce duration-[10s]" />
      <div className="absolute bottom-[20%] left-[10%] w-20 h-20 border border-[#008080]/20 rounded-full blur-md pointer-events-none animate-bounce duration-[8s] delay-500" />
      <div className="absolute top-[40%] left-[30%] w-2 h-2 bg-[#008080]/30 rounded-full blur-sm pointer-events-none animate-ping" />
      <div className="absolute bottom-[40%] right-[30%] w-3 h-3 bg-[#008080]/30 rounded-full blur-sm pointer-events-none animate-ping delay-1000" />
      
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-xl border border-[#E8E5E0] shadow-sm text-[#008080]"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }} 
        />
      </div>
      
      <div className="flex-1 h-screen overflow-hidden relative">
        {renderContent()}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
