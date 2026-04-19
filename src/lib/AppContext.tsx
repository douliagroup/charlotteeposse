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
  source_type: string;
  source: string;
  content?: string;
  file_path?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  activity?: string;
  date: string;
  desc: string;
  status: string;
  color: string;
  created_at: string;
}

export interface AcademicDocument {
  id: string;
  title: string;
  content: string;
  font_family: string;
  font_size: string;
  last_modified: string;
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
  updateTask: (id: string, title: string, tag: string, date: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  sources: Source[];
  addSource: (title: string, type: string, cat: string, source_type: string, source: string, content?: string, file_path?: string) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;
  events: TimelineEvent[];
  addEvent: (title: string, activity: string, date: string, desc: string, status: string, color: string) => Promise<void>;
  updateEvent: (id: string, title: string, activity: string, date: string, desc: string, status: string, color: string) => Promise<void>;
  documents: AcademicDocument[];
  addDocument: (title: string, content: string) => Promise<string>;
  updateDocument: (id: string, title: string, content: string, font_family?: string, font_size?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  isLoading: boolean;
  user: { email: string } | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  const login = (email: string, pass: string) => {
    const authorized = [
      { email: 'douliagroup@gmail.com', pass: '01234567' },
      { email: 'eposseek@gmail.com', pass: '01234567' }
    ];
    
    const found = authorized.find(u => u.email === email && u.pass === pass);
    if (found) {
      const userData = { email: found.email };
      setUser(userData);
      localStorage.setItem('douliamed_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('douliamed_user');
  };

  const fetchSupabaseData = async () => {
    try {
      const fetchTable = async (table: string) => {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        if (error) {
          console.warn(`Error fetching ${table}:`, error.message);
          return null;
        }
        return data;
      };

      const [sessionsData, tasksData, sourcesData, eventsData, documentsData] = await Promise.all([
        fetchTable('sessions'),
        fetchTable('taches'),
        fetchTable('sources'),
        fetchTable('chronogram'),
        fetchTable('documents')
      ]);

      if (tasksData) {
        const mappedTasks = tasksData.map((t: any) => ({
          ...t,
          completed: t.is_completed ?? false,
          progress: t.is_completed ? 100 : 0
        }));
        setTasks(mappedTasks);
      }
      if (sourcesData) setSources(sourcesData);
      if (eventsData) {
        const mappedEvents = (eventsData as any[]).map(e => ({
          id: e.id,
          title: e.activity || e.title || '',
          date: e.date || '',
          desc: e.notes || e.desc || '',
          status: e.is_completed ? "COMPLÉTÉ" : "À VENIR",
          color: e.color || 'bg-blue-400',
          created_at: e.created_at
        }));
        setEvents(mappedEvents);
      }
      if (documentsData) setDocuments(documentsData);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (sessionsData) {
        const sessionsWithMessages = (sessionsData as Session[]).map(session => ({
          ...session,
          messages: (!messagesError && messagesData) 
            ? messagesData
                .filter((m: any) => m.session_id === session.id)
                .map((m: any) => ({
                  id: m.id,
                  text: m.content,
                  sender: (m.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
                  timestamp: m.created_at,
                  file: m.file
                }))
            : []
        }));
        setSessions(sessionsWithMessages);
      }
    } catch (e) {
      console.warn("Supabase fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. SYSTÈME D'AUTO-RÉPARATION (RESET)
  useEffect(() => {
    const performAutoReset = () => {
      const VERSION_KEY = 'douliamed_app_version_v3_stable';
      try {
        const hasBeenReset = localStorage.getItem(VERSION_KEY);
        if (!hasBeenReset) {
          console.log("Mise à jour détectée ou mémoire saturée. Nettoyage automatique en cours...");
          // On vide complètement la mémoire corrompue
          localStorage.clear();
          // On marque que l'appareil a été nettoyé
          localStorage.setItem(VERSION_KEY, 'true');
          // On force le rechargement de la page pour repartir à zéro
          window.location.reload();
        }
      } catch (e) {
        console.warn("Système de reset local indisponible.", e);
      }
    };
    
    performAutoReset();
  }, []);

  // 2. CHARGEMENT INITIAL (Sécurisé)
  useEffect(() => {
    const load = (key: string, setter: any) => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          setter(JSON.parse(data));
        }
      } catch (e) {
        console.warn(`Erreur de lecture locale pour ${key}. Ignoré.`, e);
      }
    };

    load('douliamed_sessions', setSessions);
    load('douliamed_tasks', setTasks);
    load('douliamed_sources', setSources);
    load('douliamed_events', setEvents);
    load('douliamed_documents', setDocuments);
    load('douliamed_user', setUser);

    fetchSupabaseData();
  }, []);

  // 3. SAUVEGARDE EN TEMPS RÉEL (Sécurisée contre la saturation)
  useEffect(() => {
    if (!isLoading) {
      // Protection des Sessions (Enlever les fichiers Base64 trop lourds)
      try {
        const lightweightSessions = sessions.map(session => ({
          ...session,
          messages: session.messages.map(msg => ({
            ...msg,
            // Si le message contient un fichier, on garde le nom mais on vide les données Base64 (data: "")
            file: msg.file ? { name: msg.file.name, mimeType: msg.file.mimeType, data: "" } : undefined
          }))
        }));
        localStorage.setItem('douliamed_sessions', JSON.stringify(lightweightSessions));
      } catch (error) {
        console.warn("Stockage local des sessions saturé. Vidage préventif.");
        localStorage.removeItem('douliamed_sessions');
      }

      // Protection des autres données avec des try/catch individuels
      try { localStorage.setItem('douliamed_tasks', JSON.stringify(tasks)); } catch (e) {}
      try { localStorage.setItem('douliamed_sources', JSON.stringify(sources)); } catch (e) {}
      try { localStorage.setItem('douliamed_events', JSON.stringify(events)); } catch (e) {}
      try { localStorage.setItem('douliamed_documents', JSON.stringify(documents)); } catch (e) {}
    }
  }, [sessions, tasks, sources, events, documents, isLoading]);

  // FONCTIONS CRUD ET ACTIONS UTILISATEUR
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
      }
    } catch (e: any) { 
      console.error("Erreur inattendue lors de l'enregistrement du message:", e.message || e); 
    }
  };

  const addTask = async (title: string, tag: string, date: string) => {
    const newTask: Task = { id: crypto.randomUUID(), title, tag, progress: 0, date, completed: false, created_at: new Date().toISOString() };
    setTasks(prev => [newTask, ...prev]);
    try { 
      const { error } = await supabase.from('taches').insert([{
        id: newTask.id,
        title: newTask.title,
        is_completed: newTask.completed,
        date: newTask.date
      }]); 
      if (error) throw error;
    } catch (e: any) { 
      console.error("Error adding task to Supabase:", e.message || e); 
    }
  };

  const updateTask = async (id: string, title: string, tag: string, date: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title, tag, date } : t));
    try {
      const { error } = await supabase.from('taches').update({ title, date }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Error updating task:", e);
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
      try { 
        await supabase.from('taches').update({ is_completed: updated.completed }).eq('id', id); 
      } catch (e) { 
        console.error(e); 
      }
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await supabase.from('taches').delete().eq('id', id);
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  const addSource = async (title: string, type: string, cat: string, source_type: string, source: string, content?: string, file_path?: string) => {
    const newSource: Source = { id: crypto.randomUUID(), title, type, cat, source_type, source, content, file_path, created_at: new Date().toISOString() };
    setSources(prev => [newSource, ...prev]);
    try { 
      const { error } = await supabase.from('sources').insert([newSource]); 
      if (error) throw error;
    } catch (e: any) { 
      console.error("Error adding source to Supabase:", e.message || e); 
    }
  };

  const deleteSource = async (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    try { await supabase.from('sources').delete().eq('id', id); } catch (e) { console.error(e); }
  };

  const addEvent = async (title: string, activity: string, date: string, desc: string, status: string, color: string) => {
    const newEvent: TimelineEvent = { id: crypto.randomUUID(), title, activity, date, desc, status, color, created_at: new Date().toISOString() };
    setEvents(prev => [newEvent, ...prev]);
    try { 
      const { error } = await supabase.from('chronogram').insert([{
        id: newEvent.id, activity: newEvent.activity || newEvent.title, date: newEvent.date, notes: newEvent.desc, is_completed: newEvent.status === "COMPLÉTÉ", color: newEvent.color, created_at: newEvent.created_at
      }]); 
      if (error) throw error;
    } catch (e: any) { 
      console.error("Error adding event to Supabase:", e.message || e); 
    }
  };

  const updateEvent = async (id: string, title: string, activity: string, date: string, desc: string, status: string, color: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, title, activity, date, desc, status, color } : e));
    try {
      const { error } = await supabase.from('chronogram').update({
        activity: activity || title, date, notes: desc, is_completed: status === "COMPLÉTÉ", color
      }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Error updating event:", e);
    }
  };

  const addDocument = async (title: string, content: string) => {
    const now = new Date().toISOString();
    const newDoc: AcademicDocument = { id: crypto.randomUUID(), title, content, font_family: 'font-serif', font_size: 'text-base', last_modified: now, created_at: now };
    setDocuments(prev => [newDoc, ...prev]);
    try {
      const { error } = await supabase.from('documents').insert([newDoc]);
      if (error) throw error;
    } catch (e) {
      console.error("Error adding document:", e);
      throw e;
    }
    return newDoc.id;
  };

  const updateDocument = async (id: string, title: string, content: string, font_family?: string, font_size?: string) => {
    const now = new Date().toISOString();
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title, content, font_family: font_family || d.font_family, font_size: font_size || d.font_size, last_modified: now } : d));
    try {
      const { error } = await supabase.from('documents').update({ title, content, font_family, font_size, last_modified: now }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Error updating document:", e);
      throw e;
    }
  };

  const deleteDocument = async (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    try { await supabase.from('documents').delete().eq('id', id); } catch (e) { console.error("Error deleting document:", e); }
  };

  return (
    <AppContext.Provider value={{ 
      activeTab, setActiveTab, sessions, activeSessionId, setActiveSessionId, addSession, addMessageToSession,
      tasks, addTask, updateTask, toggleTask, deleteTask, sources, addSource, deleteSource, events, addEvent, updateEvent,
      documents, addDocument, updateDocument, deleteDocument,
      isLoading, user, login, logout
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