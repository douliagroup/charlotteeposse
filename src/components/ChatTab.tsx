'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Mic, 
  Upload, 
  Volume2, 
  FileText, 
  Send, 
  Loader2,
  Info,
  MessageSquare,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from "jspdf";
import { cn } from '@/lib/utils';
import { useAppContext, Message } from '@/lib/AppContext';
import { searchTavily } from '@/lib/tavilyClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';

export const ChatTab = () => {
  const context = useAppContext();
  
  // Sécurité : Extraction des variables avec replis par défaut (fallbacks)
  const activeSessionId = context?.activeSessionId || null;
  const sessions = context?.sessions || [];
  const sources = context?.sources || [];
  const tasks = context?.tasks || [];
  const addMessageToSession = context?.addMessageToSession;
  const setActiveTab = context?.setActiveTab;

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || []; // Protection cruciale ici
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string; extractedText?: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedFile) || isLoading || !activeSessionId || !addMessageToSession) return;
    
    const userMsg: Message = { 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      text: attachedFile ? `[Document: ${attachedFile.name}] ${inputValue}` : inputValue, 
      sender: 'user',
      timestamp: new Date().toISOString(),
      file: attachedFile || undefined
    };
    
    await addMessageToSession(activeSessionId, userMsg);
    
    const currentInput = inputValue;
    const currentFile = attachedFile;
    
    setInputValue('');
    setAttachedFile(null);
    setIsLoading(true);
    setStatusMessage("DouliaMed consulte vos sources et le web...");

    try {
      let webContext = '';
      if (currentInput.trim().length > 5) {
        let searchQuery = currentInput.trim().replace(/test d'actualité\s*:\s*/gi, '');
        if (searchQuery.length > 200) searchQuery = searchQuery.substring(0, 200);
        
        setStatusMessage("DouliaMed effectue une veille scientifique...");
        webContext = await searchTavily(searchQuery);
      }

      const sourcesContext = sources.length > 0 
        ? `\n\n--- SOURCES ---\n${sources.map(s => `- ${s.title}: ${s.cat}`).join('\n')}\n`
        : '';
      
      const tasksContext = tasks.length > 0
        ? `\n\n--- TÂCHES ---\n${tasks.filter(t => t && !t.completed).map(t => `- ${t.title}`).join('\n')}\n`
        : '';

      const sessionContext = activeSession?.note ? `CONTEXTE : ${activeSession.note}\n\n` : '';

      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          })),
          sessionContext,
          sourcesContext,
          tasksContext,
          webContext,
          file: currentFile
        })
      });

      if (!apiResponse.ok) throw new Error("Erreur API");
      
      const data = await apiResponse.json();
      const aiMsg: Message = { 
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        text: data.text || "Désolé, je n'ai pas pu générer de réponse.", 
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      await addMessageToSession(activeSessionId, aiMsg);
    } catch (error: any) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  const handleSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.start();
  };

  const handleTTS = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
  };

  const handlePDF = (text: string) => {
    const doc = new jsPDF();
    doc.text(text, 20, 30, { maxWidth: 170 });
    doc.save(`DouliaMed_Export.pdf`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        data: result.split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  if (!activeSessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F5F4F0] p-10 text-center">
        <MessageSquare size={40} className="text-[#008080] mb-6 opacity-20" />
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">DouliaMed est prêt</h2>
        <p className="text-sm text-gray-400 mb-8">Sélectionnez une session pour commencer.</p>
        <button onClick={() => setActiveTab && setActiveTab('sessions')} className="bg-[#008080] text-white px-8 py-3 rounded-xl text-sm font-bold">ALLER AUX SESSIONS</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F4F0]">
      {/* Header */}
      <div className="bg-white/40 backdrop-blur-md px-6 py-3 border-b border-[#008080]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">{activeSession?.title || "Session"}</h3>
            <span className="text-[10px] text-[#008080] font-bold uppercase">{activeSession?.tag || "Général"}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("flex", msg.sender === 'ai' ? "justify-start" : "justify-end")}>
            <div className={cn("max-w-[75%] p-6 rounded-2xl shadow-sm", msg.sender === 'ai' ? "bg-white border text-[#1A1A1A]" : "bg-[#008080] text-white")}>
              <div className="text-[13px] leading-relaxed markdown-body">
                {msg.sender === 'ai' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown> : <p className="whitespace-pre-wrap">{msg.text}</p>}
              </div>
              {msg.sender === 'ai' && (
                <div className="mt-4 flex gap-4 border-t pt-3">
                  <button onClick={() => handleTTS(msg.text)} className="text-[10px] font-bold text-[#008080]">ÉCOUTER</button>
                  <button onClick={() => handlePDF(msg.text)} className="text-[10px] font-bold text-[#008080]">PDF</button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm border">
              <Loader2 size={16} className="text-[#008080] animate-spin" />
              <p className="text-xs font-bold text-gray-500 italic">{statusMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-white/40 backdrop-blur-xl border-t border-[#008080]/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
            {attachedFile ? (
              <div className="bg-[#008080]/10 text-[#008080] text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2">
                <span className="max-w-[120px] truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="text-xs">×</button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="text-[#008080] text-[10px] font-bold">TÉLÉVERSER DOCUMENTS</button>
            )}
          </div>
          <div className="relative flex items-start gap-2">
            <textarea 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Question médicale..." 
              className="w-full bg-white/50 border border-[#008080]/10 rounded-xl py-3 px-4 text-[13px] outline-none" 
            />
            <button onClick={handleSend} disabled={isLoading} className="bg-[#008080] text-white p-3 rounded-xl">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};