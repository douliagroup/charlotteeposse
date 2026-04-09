'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Trash2, 
  Plus, 
  FileText, 
  Sparkles, 
  Type, 
  Download, 
  Loader2,
  CheckCircle2,
  History,
  ChevronRight,
  ChevronLeft,
  Search,
  Languages,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, AcademicDocument } from '@/lib/AppContext';
import { cn } from '@/lib/utils';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jsPDF } from "jspdf";

const FONTS = [
  { id: 'font-serif', name: 'Serif (Académique)', class: 'font-serif' },
  { id: 'font-sans', name: 'Sans (Moderne)', class: 'font-sans' },
  { id: 'font-mono', name: 'Mono (Technique)', class: 'font-mono' },
];

const SIZES = [
  { id: 'text-xs', name: 'Très Petit', class: 'text-xs' },
  { id: 'text-sm', name: 'Petit', class: 'text-sm' },
  { id: 'text-base', name: 'Normal', class: 'text-base' },
  { id: 'text-lg', name: 'Grand', class: 'text-lg' },
  { id: 'text-xl', name: 'Très Grand', class: 'text-xl' },
];

export const RedactionTab = () => {
  const { documents, addDocument, updateDocument, deleteDocument } = useAppContext();
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fontFamily, setFontFamily] = useState('font-serif');
  const [fontSize, setFontSize] = useState('text-base');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);

  const activeDoc = documents.find(d => d.id === activeDocId);

  useEffect(() => {
    if (activeDoc && activeDoc.id !== loadedDocId) {
      setTitle(activeDoc.title);
      setContent(activeDoc.content);
      setFontFamily(activeDoc.font_family);
      setFontSize(activeDoc.font_size);
      setLoadedDocId(activeDoc.id);
    } else if (documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [activeDoc, activeDocId, documents, loadedDocId]);

  const handleSave = async () => {
    if (!activeDocId) return;
    setIsSaving(true);
    setSaveStatus('saving');
    await updateDocument(activeDocId, title, content, fontFamily, fontSize);
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleCreate = async () => {
    const newTitle = "Nouveau Brouillon " + (documents.length + 1);
    const newId = await addDocument(newTitle, "");
    setActiveDocId(newId);
  };

  const handleAiAction = async (action: 'correct' | 'improve' | 'summarize') => {
    if (!content.trim()) return;
    setIsAiProcessing(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const ai = new GoogleGenerativeAI(apiKey);
      
      const systemInstruction = `Tu es un assistant de rédaction académique d'élite pour le Docteur Eposse, pédiatre. 
      Ton rôle est d'améliorer la qualité scientifique et linguistique de ses brouillons.
      Réponds UNIQUEMENT avec le texte corrigé ou amélioré, sans commentaires.
      Respecte le ton académique rigoureux.`;

      let prompt = "";
      if (action === 'correct') {
        prompt = `Corrige les fautes d'orthographe, de grammaire et de ponctuation dans ce texte médical, tout en préservant le sens exact :\n\n${content}`;
      } else if (action === 'improve') {
        prompt = `Améliore le style académique et la précision scientifique de ce texte pour une publication internationale :\n\n${content}`;
      } else if (action === 'summarize') {
        prompt = `Génère un résumé (Abstract) académique structuré basé sur ce texte :\n\n${content}`;
      }

      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        setContent(text);
      }
    } catch (error) {
      console.error("AI Redaction Error:", error);
      alert("Erreur lors de l'appel à l'IA. Veuillez vérifier votre connexion.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, 35);
    
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex h-full bg-[#F5F4F0] overflow-hidden">
      {/* Sidebar - Document List */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-r border-[#E8E5E0] flex flex-col h-full overflow-hidden"
          >
            <div className="p-6 border-b border-[#F5F4F0] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1A1A1A]">Mes Brouillons</h3>
              <button 
                onClick={handleCreate}
                className="p-1.5 bg-[#008080]/10 text-[#008080] rounded-lg hover:bg-[#008080] hover:text-white transition-all"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all group relative",
                    activeDocId === doc.id 
                      ? "bg-[#008080] text-white shadow-lg shadow-[#008080]/20" 
                      : "bg-white border border-[#F5F4F0] text-gray-600 hover:border-[#008080]/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <FileText size={18} className={activeDocId === doc.id ? "text-white" : "text-[#008080]"} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold truncate">{doc.title}</p>
                      <p className={cn(
                        "text-[10px] mt-1 truncate",
                        activeDocId === doc.id ? "text-white/70" : "text-gray-400"
                      )}>
                        {new Date(doc.last_modified).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {activeDocId !== doc.id && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDocument(doc.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </button>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-10">
                  <FileText size={32} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aucun brouillon</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-[#E8E5E0] p-1 rounded-r-lg text-gray-400 hover:text-[#008080] shadow-sm"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-[#E8E5E0] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du document..."
              className="bg-transparent border-none font-bold text-lg text-[#1A1A1A] focus:ring-0 outline-none w-64"
            />
            <div className="h-6 w-px bg-gray-200 mx-2" />
            
            {/* Font Selector */}
            <div className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-xl">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.class)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                    fontFamily === f.class ? "bg-white text-[#008080] shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {f.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Size Selector */}
            <select 
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="bg-[#F5F4F0] border-none rounded-xl px-3 py-1.5 text-[10px] font-bold text-gray-600 outline-none focus:ring-1 focus:ring-[#008080]"
            >
              {SIZES.map(s => <option key={s.id} value={s.class}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4">
              <button 
                onClick={() => handleAiAction('correct')}
                disabled={isAiProcessing || !content}
                className="flex items-center gap-2 bg-white border border-[#E8E5E0] px-4 py-2 rounded-xl text-[11px] font-bold text-gray-600 hover:border-[#008080] hover:text-[#008080] transition-all disabled:opacity-50"
                title="Correction orthographique IA"
              >
                {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                CORRIGER
              </button>
              <button 
                onClick={() => handleAiAction('improve')}
                disabled={isAiProcessing || !content}
                className="flex items-center gap-2 bg-[#008080]/10 text-[#008080] px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-[#008080] hover:text-white transition-all disabled:opacity-50"
                title="Améliorer le style académique"
              >
                {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                OPTIMISER
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !activeDocId}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-bold transition-all shadow-lg",
                saveStatus === 'saved' 
                  ? "bg-green-500 text-white shadow-green-500/20" 
                  : "bg-[#1A1A1A] text-white shadow-black/10 hover:bg-black"
              )}
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saveStatus === 'saved' ? "ENREGISTRÉ" : "SAUVEGARDER"}
            </button>
            
            <button 
              onClick={exportPDF}
              className="p-2 bg-white border border-[#E8E5E0] text-gray-400 hover:text-[#008080] rounded-xl transition-all"
              title="Exporter en PDF"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-10 overflow-y-auto bg-white/30">
          <div className="max-w-4xl mx-auto bg-white min-h-[1000px] shadow-2xl shadow-black/5 rounded-sm p-16 border border-[#E8E5E0]">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Commencez à rédiger votre brouillon officiel ici..."
              className={cn(
                "w-full h-full min-h-[800px] border-none focus:ring-0 outline-none resize-none leading-relaxed text-[#1A1A1A] placeholder:text-gray-200",
                fontFamily,
                fontSize
              )}
            />
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-white border-t border-[#E8E5E0] px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>{content.split(/\s+/).filter(x => x).length} MOTS</span>
            <span>{content.length} CARACTÈRES</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connecté à Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
