'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  file?: { name: string; data: string; mimeType: string };
}

export interface Session {
  id: string;
  title: string;
  tag: string;
  date: string;
  desc: string;
  note?: string;
  messages: Message[];
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  tag: string;
  progress: number;
  date: string;
  completed: boolean;
  created_at: string;
}

export interface Source {
  id: string;
  title: string;
  type: string;
  cat: string;
  source: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  desc: string;
  status: string;
  color: string;
  created_at: string;
}

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  addSession: (title: string, note: string) => Promise<void>;
  addMessageToSession: (sessionId: string, message: Message) => Promise<void>;
  tasks: Task[];
  addTask: (title: string, tag: string, date: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  sources: Source[];
  addSource: (title: string, type: string, cat: string, source: string) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  events: TimelineEvent[];
  addEvent: (title: string, date: string, desc: string, status: string, color: string) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSupabaseData = async () => {
    try {
      const fetchTable = async (table: string, setter: any) => {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        if (!error && data) setter(data);
      };

      await Promise.all([
        fetchTable('sessions', setSessions),
        fetchTable('tasks', setTasks),
        fetchTable('sources', setSources),
        fetchTable('events', setEvents)
      ]);
    } catch (e) {
      console.warn("Supabase fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from LocalStorage on mount
  useEffect(() => {
    const load = (key: string, setter: any) => {
      const data = localStorage.getItem(key);
      if (data) {
        try { setter(JSON.parse(data)); } catch (e) { console.error(`Error parsing ${key}`, e); }
      }
    };

    load('douliamed_sessions', setSessions);
    load('douliamed_tasks', setTasks);
    load('douliamed_sources', setSources);
    load('douliamed_events', setEvents);

    fetchSupabaseData();
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('douliamed_sessions', JSON.stringify(sessions));
      localStorage.setItem('douliamed_tasks', JSON.stringify(tasks));
      localStorage.setItem('douliamed_sources', JSON.stringify(sources));
      localStorage.setItem('douliamed_events', JSON.stringify(events));
    }
  }, [sessions, tasks, sources, events, isLoading]);

  const addSession = async (title: string, note: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    const welcomeMsg: Message = {
      id: `welcome-${Date.now()}`,
      text: "Bonjour Docteur Eposse. Je suis DouliaMed, votre assistant de recherche d'élite. Je peux vous aider dans vos travaux de recherche, l'analyse de documents médicaux, la gestion de votre chronogramme d'agrégation et la rédaction scientifique. Comment puis-je vous accompagner aujourd'hui ?",
      sender: 'ai',
      timestamp: now.toISOString()
    };

    const newSession: Session = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      tag: "RECHERCHE",
      date: dateStr,
      desc: note || "Nouvelle session de recherche initiée.",
      note,
      messages: [welcomeMsg],
      created_at: now.toISOString()
    };
    
    // Optimistic update
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');

    try { 
      const { error } = await supabase.from('sessions').insert([newSession]); 
      if (error) {
        console.error("Supabase Insert Error (Sessions):", error.message, error.details, error.hint);
        throw error;
      }
      console.log("Supabase Insert Success (Sessions):", newSession.id);
    } catch (e: any) { 
      console.error("Error adding session to Supabase:", e.message || e); 
    }
  };

  const addMessageToSession = async (sessionId: string, message: Message) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));
    try {
      const { data } = await supabase.from('sessions').select('messages').eq('id', sessionId).single();
      const updatedMessages = [...(data?.messages || []), message];
      await supabase.from('sessions').update({ messages: updatedMessages }).eq('id', sessionId);
    } catch (e) { console.error(e); }
  };

  const addTask = async (title: string, tag: string, date: string) => {
    const newTask: Task = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, title, tag, progress: 0, date, completed: false, created_at: new Date().toISOString() };
    setTasks(prev => [newTask, ...prev]);
    try { 
      const { error } = await supabase.from('tasks').insert([newTask]); 
      if (error) {
        console.error("Supabase Insert Error (Tasks):", error.message, error.details, error.hint);
        throw error;
      }
      console.log("Supabase Insert Success (Tasks):", newTask.id);
    } catch (e: any) { 
      console.error("Error adding task to Supabase:", e.message || e); 
    }
  };

  const toggleTask = async (id: string) => {
    let updated: Task | undefined;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        updated = { ...t, completed: !t.completed, progress: !t.completed ? 100 : 0 };
        return updated;
      }
      return t;
    }));
    if (updated) {
      try { await supabase.from('tasks').update({ completed: updated.completed, progress: updated.progress }).eq('id', id); } catch (e) { console.error(e); }
    }
  };

  const addSource = async (title: string, type: string, cat: string, source: string) => {
    const newSource: Source = { 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      title, 
      type, 
      cat, 
      source, 
      created_at: new Date().toISOString() 
    };
    setSources(prev => [newSource, ...prev]);
    try { 
      const { error } = await supabase.from('sources').insert([newSource]); 
      if (error) {
        console.error("Supabase Insert Error (Sources):", error.message, error.details, error.hint);
        throw error;
      }
      console.log("Supabase Insert Success (Sources):", newSource.id);
    } catch (e: any) { 
      console.error("Error adding source to Supabase:", e.message || e); 
    }
  };

  const deleteSource = async (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    try { await supabase.from('sources').delete().eq('id', id); } catch (e) { console.error(e); }
  };

  const addEvent = async (title: string, date: string, desc: string, status: string, color: string) => {
    const newEvent: TimelineEvent = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, title, date, desc, status, color, created_at: new Date().toISOString() };
    setEvents(prev => [newEvent, ...prev]);
    try { 
      const { error } = await supabase.from('events').insert([newEvent]); 
      if (error) {
        console.error("Supabase Insert Error (Events):", error.message, error.details, error.hint);
        throw error;
      }
      console.log("Supabase Insert Success (Events):", newEvent.id);
    } catch (e: any) { 
      console.error("Error adding event to Supabase:", e.message || e); 
    }
  };

  return (
    <AppContext.Provider value={{ 
      activeTab, setActiveTab, sessions, activeSessionId, setActiveSessionId, addSession, addMessageToSession,
      tasks, addTask, toggleTask, sources, addSource, deleteSource, events, addEvent, isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
