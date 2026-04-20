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
import { supabase } from '@/lib/supabaseClient'; // <-- IMPORT SUPABASE AJOUTÉ
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';

export const ChatTab = () => {
  const { activeSessionId, sessions, addMessageToSession, sources, tasks, setActiveTab } = useAppContext();
  
  // CORRECTION 1 : Sécuriser la recherche de la session (si sessions est undefined)
  const activeSession = (sessions || []).find(s => s.id === activeSessionId);
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; mimeType: string; extractedText?: string } | null>(null);
  
  // NOUVEL ÉTAT : Pour stocker le fichier brut avant de l'envoyer sur Supabase
  const [pendingFile, setPendingFile] = useState<File | null>(null); 

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
    // Sécurité modifiée pour inclure pendingFile
    if ((!inputValue.trim() && !attachedFile && !pendingFile) || isLoading || !activeSessionId) return;
    
    setIsLoading(true);
    setStatusMessage("DouliaMed prépare l'envoi...");

    let finalFileMeta = attachedFile;

    try {
      // --- NOUVELLE LOGIQUE D'UPLOAD SUPABASE ---
      if (pendingFile) {
        setStatusMessage("Téléchargement du document vers le Cloud...");
        const fileExt = pendingFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${activeSessionId}/${fileName}`;

        // Upload vers le bucket
        const { error: uploadError } = await supabase.storage
          .from('chat_documents')
          .upload(filePath, pendingFile);

        if (uploadError) {
           console.error("Erreur Upload Supabase:", uploadError);
           throw new Error("Échec de la sauvegarde du fichier sur le serveur.");
        }

        // Récupération de l'URL publique
        const { data: urlData } = supabase.storage
          .from('chat_documents')
          .getPublicUrl(filePath);

        // On remplace la donnée vide par l'URL publique de Supabase ! 
        // L'application va stocker une petite URL au lieu de 5 Mo de Base64.
        if (finalFileMeta) {
          finalFileMeta.data = urlData.publicUrl; 
        }
      }
      // ------------------------------------------

      const userMsg: Message = { 
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        text: finalFileMeta ? `[Document: ${finalFileMeta.name}] ${inputValue}` : inputValue, 
        sender: 'user',
        timestamp: new Date().toISOString(),
        file: finalFileMeta || undefined
      };
      
      await addMessageToSession(activeSessionId, userMsg);
      
      const currentInput = inputValue;
      const currentFile = finalFileMeta;
      
      setInputValue('');
      setAttachedFile(null);
      setPendingFile(null); // On vide le fichier en attente
      
      setStatusMessage("DouliaMed consulte vos sources et le web...");

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

      // CORRECTION 2 : Sécuriser la lecture des sources et des tâches
      const sourcesContext = (sources || []).length > 0 
        ? `\n\n--- BASE DE CONNAISSANCES (SOURCES) ---\n${(sources || []).map(s => `- ${s.title}: ${s.cat}`).join('\n')}\n`
        : '';
      
      const tasksContext = (tasks || []).length > 0
        ? `\n\n--- TÂCHES EN COURS ---\n${(tasks || []).filter(t => !t.completed).map(t => `- ${t.title} (Échéance: ${t.date})`).join('\n')}\n`
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
          // CORRECTION 3 : Sécuriser le mappage de l'historique
          history: (activeSession?.messages || []).map(m => ({
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
    doc.setTextColor(0, 128, 128);
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file); // ON CONSERVE LE FICHIER POUR SUPABASE
      const reader = new FileReader();
      
      if (file.name.endsWith('.docx')) {
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            setAttachedFile({
              name: file.name,
              data: "", // PLUS DE BASE 64 ! La mémoire respire.
              mimeType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              extractedText: result.value
            });
          } catch (error) {
            console.error("Word Extraction Error:", error);
            alert("Erreur lors de l'extraction du texte du fichier Word.");
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setAttachedFile({
            name: file.name,
            data: "", // PLUS DE BASE 64 !
            mimeType: 'text/csv',
            extractedText: text
          });
        };
        reader.readAsText(file);
      } else {
        // Pour les PDFs et Images, on configure juste les métadonnées sans Base64
        setAttachedFile({
          name: file.name,
          data: "", // PLUS DE BASE 64 ! L'URL Supabase prendra le relai.
          mimeType: file.type
        });
      }
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
        {/* CORRECTION 4 : Sécurisation de la longueur du tableau au cas où il serait undefined */}
        {(activeSession?.messages?.length || 0) === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="w-28 h-28 rounded-[32px] mb-6 overflow-hidden relative shadow-2xl bg-white border border-[#008080]/10 p-4">
              <Image 
                src="https://i.postimg.cc/KYPJ7KtG/Doulia_Med.png" 
                alt="DouliaMed" 
                fill
                className="object-contain p-2"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-sm font-bold text-[#1A1A1A] tracking-widest uppercase">DouliaMed est prêt pour l&apos;analyse.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {/* CORRECTION 5 : Sécurisation du mappage des messages */}
          {(activeSession?.messages || []).map((msg) => (
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
      <div className="p-6 bg-white/40 backdrop-blur-