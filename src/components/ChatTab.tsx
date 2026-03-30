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
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from "jspdf";
import { cn } from '@/lib/utils';
import { useAppContext, Message } from '@/lib/AppContext';
import { searchTavily } from '@/lib/tavilyClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatTab = () => {
  const { activeSessionId, sessions, addMessageToSession, sources, tasks, setActiveTab } = useAppContext();
  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedFile) || isLoading || !activeSessionId) return;
    
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
      // Step 1: Web Research with Tavily
      let webContext = '';
      if (currentInput.trim().length > 5) {
        // Clean query for better search results
        let searchQuery = currentInput.trim();
        // Remove common test prefixes
        searchQuery = searchQuery.replace(/test d'actualité\s*:\s*/gi, '');
        // If it's very long, take the first 100 characters to avoid confusing Tavily
        if (searchQuery.length > 200) {
          searchQuery = searchQuery.substring(0, 200);
        }
        
        setStatusMessage("DouliaMed effectue une veille scientifique et d'actualité...");
        webContext = await searchTavily(searchQuery);
      }

      setStatusMessage("DouliaMed synthétise les données pour le Docteur Eposse...");

      // Step 2: Knowledge Base Context (RAG)
      const sourcesContext = sources.length > 0 
        ? `\n\n--- BASE DE CONNAISSANCES (SOURCES) ---\n${sources.map(s => `- ${s.title}: ${s.source}`).join('\n')}\n`
        : '';
      
      const tasksContext = tasks.length > 0
        ? `\n\n--- TÂCHES EN COURS ---\n${tasks.filter(t => !t.completed).map(t => `- ${t.title} (Échéance: ${t.date})`).join('\n')}\n`
        : '';

      const sessionContext = activeSession?.note 
        ? `CONTEXTE DE LA SESSION : ${activeSession.note}\n\n` 
        : '';

      // Step 3: Call API Route
      const apiResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: activeSession?.messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            content: m.text
          })) || [],
          sessionContext,
          sourcesContext,
          tasksContext,
          webContext,
          file: currentFile
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || "Erreur lors de l'appel API");
      }
      
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
      const errorMsg: Message = { 
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        text: `ERREUR : ${error.message || "Une erreur est survenue lors de l'analyse. Veuillez vérifier votre connexion ou le format du fichier."}`, 
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      await addMessageToSession(activeSessionId, errorMsg);
    } finally {
      setIsLoading(false);
      setStatusMessage(null);
    }
  };

  const recognitionRef = useRef<any>(null);

  const handleSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      // If we are still supposed to be listening, restart it
      // This ensures it doesn't stop "tout seul"
      if (isListening) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputValue(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleTTS = (text: string) => {
    if (!window.speechSynthesis) {
      console.warn("Votre navigateur ne supporte pas la synthèse vocale.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handlePDF = (text: string) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 128, 128); // Teal color
    doc.text("DouliaMed - Rapport Médical", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré pour le Dr. Charlotte Eposse le ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    
    doc.setDrawColor(232, 229, 224);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 45);
    
    doc.save(`DouliaMed_Analyse_${Date.now()}.pdf`);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setAttachedFile({
          name: file.name,
          data: base64,
          mimeType: file.type
        });
        
        // Logic for Supabase Storage would go here:
        // const { data, error } = await supabase.storage.from('documents').upload(`sessions/${activeSessionId}/${file.name}`, file);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!activeSessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F5F4F0] p-10 text-center">
        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-sm mb-6">
          <MessageSquare size={40} className="text-[#008080]" />
        </div>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Aucune session active</h2>
        <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8">Veuillez sélectionner une session existante ou en créer une nouvelle pour démarrer le chat.</p>
        <button 
          onClick={() => setActiveTab('sessions')}
          className="bg-[#008080] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all"
        >
          ALLER AUX SESSIONS
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F4F0]">
      {/* Chat Header */}
      <div className="bg-white/40 backdrop-blur-md px-6 py-3 border-b border-[#008080]/10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">{activeSession?.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#008080] font-bold uppercase tracking-widest">{activeSession?.tag}</span>
              <span className="text-[10px] text-gray-400 font-bold">• {activeSession?.date}</span>
            </div>
          </div>
        </div>
        {activeSession?.note && (
          <div className="flex items-center gap-2 bg-[#F5F4F0] px-4 py-2 rounded-xl max-w-md">
            <Info size={14} className="text-[#008080] shrink-0" />
            <p className="text-[10px] text-gray-500 font-medium line-clamp-1 italic">{activeSession.note}</p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 scroll-smooth">
        {activeSession?.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale">
            <div className="w-24 h-24 rounded-full mb-4 overflow-hidden relative shadow-2xl">
              <Image 
                src="https://picsum.photos/seed/medical/200/200" 
                alt="DouliaMed" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-sm font-bold text-[#1A1A1A]">DouliaMed est prêt pour l&apos;analyse.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {activeSession?.messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("flex", msg.sender === 'ai' ? "justify-start" : "justify-end")}
            >
              <div className={cn(
                "max-w-[75%] p-6 rounded-2xl shadow-sm relative group font-sans",
                msg.sender === 'ai' 
                  ? "bg-white border border-[#E8E5E0] text-[#1A1A1A] rounded-tl-none" 
                  : "bg-[#008080] text-white rounded-tr-none"
              )}>
                <div className="text-[13px] leading-relaxed font-medium markdown-body">
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => <a {...props} className="text-blue-600 underline hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer" />,
                        table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table {...props} className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" /></div>,
                        thead: ({ node, ...props }) => <thead {...props} className="bg-gray-50" />,
                        th: ({ node, ...props }) => <th {...props} className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b" />,
                        td: ({ node, ...props }) => <td {...props} className="px-4 py-2 text-[11px] text-gray-700 border-b" />,
                        tr: ({ node, ...props }) => <tr {...props} className="hover:bg-gray-50 transition-colors" />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
                
                {msg.sender === 'ai' && (
                  <div className="mt-4 flex items-center gap-4 border-t border-[#F5F4F0] pt-3">
                    <button 
                      onClick={() => handleTTS(msg.text)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-[#008080] hover:bg-[#E6F2F2] px-2 py-1 rounded-lg transition-all"
                    >
                      <Volume2 size={12} />
                      ÉCOUTER
                    </button>
                    <button 
                      onClick={() => handlePDF(msg.text)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-[#008080] hover:bg-[#E6F2F2] px-2 py-1 rounded-lg transition-all"
                    >
                      <FileText size={12} />
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && statusMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-[#E8E5E0] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                <Loader2 size={16} className="text-[#008080] animate-spin" />
                <p className="text-xs font-bold text-gray-500 italic">{statusMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/40 backdrop-blur-xl border-t border-[#008080]/10 shadow-[0_-4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleUpload}
              accept="image/*,application/pdf"
            />
            {attachedFile ? (
              <div className="flex items-center gap-2 bg-[#008080]/10 text-[#008080] text-[10px] font-bold px-3 py-1 rounded-full border border-[#008080]/20">
                <FileText size={12} />
                <span className="max-w-[120px] truncate">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="hover:text-red-500 ml-1 text-xs">×</button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-[#008080] text-[10px] font-bold hover:bg-[#008080]/10 px-3 py-1 rounded-full transition-all border border-[#008080]/10"
              >
                <Upload size={12} />
                TÉLÉVERSER DOCUMENTS
              </button>
            )}
          </div>

          <div className="relative flex items-start gap-2">
            <div className="relative flex-1">
              <textarea 
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    if (textareaRef.current) textareaRef.current.style.height = 'auto';
                  }
                }}
                placeholder="Posez votre question médicale..." 
                rows={1}
                className="w-full bg-white/50 border border-[#008080]/10 rounded-xl py-3 px-4 pr-10 text-[13px] font-medium focus:ring-2 focus:ring-[#008080] outline-none transition-all placeholder:text-gray-400 shadow-inner resize-none min-h-[46px] max-h-[300px] overflow-y-auto"
              />
              <button 
                onClick={handleSTT}
                className={cn(
                  "absolute right-2.5 top-[13px] p-1 rounded-lg transition-all",
                  isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-[#008080] hover:bg-white"
                )}
              >
                <Mic size={16} />
              </button>
            </div>
            <button 
              onClick={() => {
                handleSend();
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
              }}
              disabled={(!inputValue.trim() && !attachedFile) || isLoading}
              className="bg-[#008080] text-white p-3 rounded-xl hover:bg-black transition-all shadow-lg shadow-[#008080]/20 disabled:opacity-50 disabled:shadow-none min-w-[46px] flex items-center justify-center mt-0.5"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center mt-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">propulsé par doulia</p>
        </div>
      </div>
    </div>
  );
};
