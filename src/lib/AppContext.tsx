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
        if (error) {
          console.warn(`Error fetching ${table}:`, error.message);
          return null;
        }
        if (data) setter(data);
        return data;
      };

      const [sessionsData] = await Promise.all([
        fetchTable('sessions', setSessions),
        fetchTable('tasks', setTasks),
        fetchTable('sources', setSources),
        fetchTable('events', setEvents)
      ]);

      // Fetch messages separately
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData && sessionsData) {
        const sessionsWithMessages = (sessionsData as Session[]).map(session => ({
          ...session,
          messages: messagesData
            .filter((m: any) => m.session_id === session.id)
            .map((m: any) => ({
              id: m.id,
              text: m.content,
              sender: (m.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
              timestamp: m.created_at,
              file: m.file
            }))
        }));
        setSessions(sessionsWithMessages);
      }
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
      id: crypto.randomUUID(),
      text: "Bonjour Docteur Eposse. Je suis DouliaMed, votre assistant de recherche d'élite. Je peux vous aider dans vos travaux de recherche, l'analyse de documents médicaux, la gestion de votre chronogramme d'agrégation et la rédaction scientifique. Comment puis-je vous accompagner aujourd'hui ?",
      sender: 'ai',
      timestamp: now.toISOString()
    };

    const newSession: Session = {
      id: crypto.randomUUID(),
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
      const { error: sessionError } = await supabase.from('sessions').insert([{
        id: newSession.id,
        title: newSession.title,
        tag: newSession.tag,
        date: newSession.date,
        desc: newSession.desc,
        note: newSession.note,
        created_at: newSession.created_at
      }]); 

      if (sessionError) throw sessionError;

      const { error: messageError } = await supabase.from('messages').insert([{
        session_id: newSession.id,
        content: welcomeMsg.text,
        role: 'assistant',
        created_at: welcomeMsg.timestamp
      }]);

      if (messageError) throw messageError;

      console.log("Supabase Insert Success (Session & Welcome Message):", newSession.id);
    } catch (e: any) { 
      console.error("Error adding session to Supabase:", e.message || e); 
    }
  };

  const addMessageToSession = async (sessionId: string, message: Message) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));
    try {
      const { error } = await supabase.from('messages').insert([{
        session_id: sessionId,
        content: message.text,
        role: message.sender === 'user' ? 'user' : 'assistant',
        created_at: message.timestamp,
        file: message.file
      }]);
      
      if (error) {
        console.error("ERREUR CRITIQUE SUPABASE INSERT (Messages):", error.message, error.details, error.hint);
      } else {
        console.log("SUCCÈS SUPABASE : Message enregistré dans la table messages");
      }
    } catch (e: any) { 
      console.error("Erreur inattendue lors de l'enregistrement du message:", e.message || e); 
    }
  };

  const addTask = async (title: string, tag: string, date: string) => {
    const newTask: Task = { id: crypto.randomUUID(), title, tag, progress: 0, date, completed: false, created_at: new Date().toISOString() };
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
      id: crypto.randomUUID(), 
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
    const newEvent: TimelineEvent = { id: crypto.randomUUID(), title, date, desc, status, color, created_at: new Date().toISOString() };
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
