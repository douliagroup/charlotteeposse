'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- TYPES ALIGNÉS SUR TA BASE SUPABASE ---
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  file?: any;
}

export interface Session {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

// --- INITIALISATION ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface AppContextType {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  addSession: (title: string) => Promise<string | null>;
  addMessageToSession: (sessionId: string, message: Message) => Promise<void>;
  documents: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- 1. CHARGEMENT INITIAL (SESSIONS + MESSAGES) ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // On récupère les sessions ET on inclut les messages liés via la FK session_id
        const { data: sessData, error } = await supabase
          .from('sessions')
          .select(`
            *,
            messages (*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transformation des données Supabase vers le format Frontend
        const formattedSessions: Session[] = (sessData || []).map(s => ({
          id: s.id,
          title: s.title || s.desc || "Nouvelle session", // Utilise tes colonnes identifiées
          timestamp: s.created_at,
          messages: (s.messages || [])
            .map((m: any) => ({
              id: m.id,
              text: m.content, // Mapping: 'content' -> 'text'
              sender: m.role === 'assistant' ? 'ai' : 'user', // Mapping: 'role' -> 'sender'
              timestamp: m.created_at,
              file: m.file
            }))
            .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        }));

        setSessions(formattedSessions);
        
        // Chargement des documents
        const { data: docData } = await supabase.from('documents').select('*');
        if (docData) setDocuments(docData);

      } catch (err) {
        console.error("Erreur technique de synchronisation:", err);
      }
    };
    loadAllData();
  }, []);

  // --- 2. CRÉATION DE SESSION ---
  const addSession = async (title: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ title, created_at: new Date().toISOString() }])
      .select();

    if (error || !data) return null;
    
    const newSess: Session = { 
      id: data[0].id, 
      title: data[0].title, 
      timestamp: data[0].created_at, 
      messages: [] 
    };
    setSessions(prev => [newSess, ...prev]);
    return data[0].id;
  };

  // --- 3. SAUVEGARDE D'UN MESSAGE ---
  const addMessageToSession = async (sessionId: string, message: Message) => {
    const { error } = await supabase
      .from('messages')
      .insert([{
        session_id: sessionId, // La clé étrangère cruciale
        content: message.text,
        role: message.sender === 'ai' ? 'assistant' : 'user',
        file: message.file,
        created_at: new Date().toISOString()
      }]);

    if (!error) {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      ));
    } else {
      console.error("Erreur lors de l'enregistrement du message:", error);
    }
  };

  return (
    <AppContext.Provider value={{ 
      sessions, activeSessionId, setActiveSessionId, addSession, addMessageToSession,
      documents, activeTab, setActiveTab
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext doit être utilisé dans un AppProvider');
  return context;
};