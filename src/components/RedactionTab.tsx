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
  Wand2,
  Quote,
  Layout,
  Gauge,
  X,
  Copy,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, AcademicDocument } from '@/lib/AppContext';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';

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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<'citation' | 'outline' | 'readability' | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Tools specific state
  const [citationInput, setCitationInput] = useState('');
  const [citationResult, setCitationResult] = useState('');
  const [outlineResult, setOutlineResult] = useState('');
  const [readabilityResult, setReadabilityResult] = useState<any>(null);

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
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      alert("Configuration Supabase manquante. Veuillez configurer les secrets dans les paramètres d'AI Studio.");
      return;
    }

    console.log("Saving document:", activeDocId, title);
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await updateDocument(activeDocId, title, content, fontFamily, fontSize);
      console.log("Document saved successfully");
      setSaveStatus('saved');
    } catch (error: any) {
      console.error("Error saving document:", error);
      setSaveStatus('idle');
      alert(`Erreur lors de la sauvegarde : ${error.message || "Vérifiez votre configuration Supabase."}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleCreate = async () => {
    try {
      const newTitle = "Nouveau Brouillon " + (documents.length + 1);
      const newId = await addDocument(newTitle, "");
      setActiveDocId(newId);
    } catch (error: any) {
      alert("Erreur lors de la création du document. Vérifiez votre configuration Supabase.");
    }
  };

  const handleAiAction = async (action: 'correct' | 'improve' | 'summarize' | 'outline' | 'readability' | 'citation') => {
    if (!content.trim() && action !== 'citation') return;
    setIsAiProcessing(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === "TODO_KEYHERE") {
        throw new Error("Clé API Gemini manquante ou invalide. Veuillez configurer NEXT_PUBLIC_GEMINI_API_KEY dans les secrets d'AI Studio.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `Tu es un assistant de rédaction académique d'élite pour le Docteur Eposse, pédiatre. 
      Ton rôle est d'aider à la rédaction, la structuration et le référencement de travaux scientifiques.
      Respecte le ton académique rigoureux.`;

      let prompt = "";
      if (action === 'correct') {
        prompt = `Corrige les fautes d'orthographe, de grammaire et de ponctuation dans ce texte médical, tout en préservant le sens exact :\n\n${content}`;
      } else if (action === 'improve') {
        prompt = `Améliore le style académique et la précision scientifique de ce texte pour une publication internationale :\n\n${content}`;
      } else if (action === 'summarize') {
        prompt = `Génère un résumé (Abstract) académique structuré basé sur ce texte :\n\n${content}`;
      } else if (action === 'outline') {
        prompt = `En te basant sur le contenu actuel ou le titre "${title}", génère un plan détaillé (IMRAD ou autre structure académique pertinente) pour cet article médical. Utilise le format Markdown.`;
      } else if (action === 'readability') {
        prompt = `Analyse la lisibilité et la qualité académique de ce texte. Donne un score sur 100 et liste 3 points forts et 3 points d'amélioration. Réponds au format JSON: {"score": number, "pointsForts": [], "pointsAmelioration": [], "commentaire": ""}. Texte:\n\n${content}`;
      } else if (action === 'citation') {
        prompt = `Formate cette source en style Vancouver et APA. Source: "${citationInput}". Réponds uniquement avec les deux formats clairement identifiés.`;
      }

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = result.text;

      if (text) {
        if (action === 'outline') setOutlineResult(text);
        else if (action === 'readability') {
          try {
            const json = JSON.parse(text.replace(/```json|```/g, ''));
            setReadabilityResult(json);
          } catch (e) {
            setReadabilityResult({ score: 0, pointsForts: [], pointsAmelioration: [], commentaire: text });
          }
        }
        else if (action === 'citation') setCitationResult(text);
        else setContent(text);
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
                <div
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveDocId(doc.id);
                    }
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all group relative cursor-pointer outline-none",
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
                </div>
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
              <button 
                onClick={() => {
                  setIsToolsOpen(true);
                  if (!activeTool) setActiveTool('citation');
                }}
                className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-black transition-all"
                title="Outils académiques avancés"
              >
                <Wand2 size={14} />
                OUTILS
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
        <div className="flex-1 p-10 overflow-y-auto bg-white/30 relative">
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

        {/* Right Tools Sidebar */}
        <AnimatePresence>
          {isToolsOpen && (
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-[#E8E5E0] shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-[#F5F4F0] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1A1A1A]">Boîte à Outils Académiques</h3>
                <button 
                  onClick={() => setIsToolsOpen(false)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex border-b border-[#F5F4F0]">
                {[
                  { id: 'citation', icon: Quote, label: 'Citations' },
                  { id: 'outline', icon: Layout, label: 'Plan' },
                  { id: 'readability', icon: Gauge, label: 'Qualité' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id as any)}
                    className={cn(
                      "flex-1 py-4 flex flex-col items-center gap-1 transition-all border-b-2",
                      activeTool === t.id 
                        ? "border-[#008080] text-[#008080] bg-[#008080]/5" 
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <t.icon size={18} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTool === 'citation' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] mb-2">Assistant de Citation</h4>
                      <p className="text-[10px] text-gray-400 mb-4">Entrez le titre, l&apos;auteur ou le DOI pour générer une référence.</p>
                      <textarea 
                        value={citationInput}
                        onChange={(e) => setCitationInput(e.target.value)}
                        placeholder="Ex: Eposse et al. 2024, Néphroblastome au Cameroun..."
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none h-24"
                      />
                      <button 
                        onClick={() => handleAiAction('citation')}
                        disabled={isAiProcessing || !citationInput}
                        className="w-full mt-4 bg-[#008080] text-white py-3 rounded-xl text-[11px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                      >
                        {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        GÉNÉRER LA RÉFÉRENCE
                      </button>
                    </div>

                    {citationResult && (
                      <div className="bg-[#F5F4F0] p-4 rounded-2xl border border-[#E8E5E0] relative group">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(citationResult);
                            alert("Citations copiées !");
                          }}
                          className="absolute right-2 top-2 p-2 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all text-[#008080]"
                        >
                          <Copy size={12} />
                        </button>
                        <div className="text-[10px] text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
                          {citationResult}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTool === 'outline' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] mb-2">Générateur de Plan</h4>
                      <p className="text-[10px] text-gray-400 mb-4">Analyse votre contenu pour suggérer une structure académique.</p>
                      <button 
                        onClick={() => handleAiAction('outline')}
                        disabled={isAiProcessing}
                        className="w-full bg-[#008080] text-white py-3 rounded-xl text-[11px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                      >
                        {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Layout size={14} />}
                        GÉNÉRER LE PLAN
                      </button>
                    </div>

                    {outlineResult && (
                      <div className="bg-[#F5F4F0] p-6 rounded-2xl border border-[#E8E5E0] prose prose-xs max-w-none">
                        <ReactMarkdown>{outlineResult}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {activeTool === 'readability' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] mb-2">Analyse de Qualité</h4>
                      <p className="text-[10px] text-gray-400 mb-4">Évalue la rigueur et la clarté de votre rédaction.</p>
                      <button 
                        onClick={() => handleAiAction('readability')}
                        disabled={isAiProcessing || !content}
                        className="w-full bg-[#008080] text-white py-3 rounded-xl text-[11px] font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                      >
                        {isAiProcessing ? <Loader2 size={14} className="animate-spin" /> : <Gauge size={14} />}
                        ANALYSER LE TEXTE
                      </button>
                    </div>

                    {readabilityResult && (
                      <div className="space-y-4">
                        <div className="bg-[#1A1A1A] p-6 rounded-3xl text-center">
                          <div className="text-3xl font-bold text-[#008080] mb-1">{readabilityResult.score}/100</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Score de Qualité Académique</div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <h5 className="text-[10px] font-bold text-green-700 uppercase mb-2">Points Forts</h5>
                            <ul className="text-[10px] text-green-600 space-y-1 list-disc pl-4">
                              {readabilityResult.pointsForts?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <h5 className="text-[10px] font-bold text-amber-700 uppercase mb-2">À Améliorer</h5>
                            <ul className="text-[10px] text-amber-600 space-y-1 list-disc pl-4">
                              {readabilityResult.pointsAmelioration?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-[#F5F4F0] border-t border-[#E8E5E0]">
                <div className="flex items-center gap-3 text-gray-400">
                  <BookOpen size={16} />
                  <p className="text-[9px] font-medium leading-tight">
                    Ces outils utilisent l&apos;IA pour assister votre rédaction. Vérifiez toujours les faits et les références.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
