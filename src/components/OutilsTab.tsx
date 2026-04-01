'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  FileEdit, 
  Search, 
  BookOpen, 
  Activity, 
  Stethoscope,
  ChevronRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { searchTavilyRaw } from '@/lib/tavilyClient';

const PEDIATRIC_DRUGS = [
  { name: 'Paracétamol', dose: '15 mg/kg', freq: 'toutes les 6h', max: '60 mg/kg/j' },
  { name: 'Amoxicilline', dose: '80-90 mg/kg/j', freq: 'en 2-3 prises', max: '3 g/j' },
  { name: 'Ibuprofène', dose: '10 mg/kg', freq: 'toutes les 8h', max: '30 mg/kg/j' },
  { name: 'Ceftriaxone', dose: '50-100 mg/kg/j', freq: 'en 1 prise', max: '2 g/j' },
  { name: 'Gentamicine', dose: '5-7 mg/kg/j', freq: 'en 1 prise', max: '---' },
];

export const OutilsTab = () => {
  const [activeTool, setActiveTool] = useState<'calc' | 'case' | 'pubmed' | 'scores' | 'growth'>('calc');
  
  // Calculator State
  const [weight, setWeight] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState(PEDIATRIC_DRUGS[0]);
  
  // Case Assistant State
  const [caseData, setCaseData] = useState({
    age: '',
    sexe: 'M',
    motif: '',
    antecedents: '',
    examen: '',
    hypotheses: ''
  });
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [generatedCase, setGeneratedCase] = useState<string | null>(null);

  // PubMed Search State
  const [pubmedQuery, setPubmedQuery] = useState('');
  const [isSearchingPubmed, setIsSearchingPubmed] = useState(false);
  const [pubmedResults, setPubmedResults] = useState<any[]>([]);

  // Scores State
  const [apgar, setApgar] = useState({ r: 2, p: 2, g: 2, a: 2, c: 2 });
  const [silverman, setSilverman] = useState({ b: 0, t: 0, e: 0, x: 0, g: 0 });

  // Growth State
  const [growthData, setGrowthData] = useState({ age: '', weight: '', height: '', pc: '' });
  const [isAnalyzingGrowth, setIsAnalyzingGrowth] = useState(false);
  const [growthAnalysis, setGrowthAnalysis] = useState<string | null>(null);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    if (isNaN(w)) return "---";
    return `${(w * parseFloat(selectedDrug.dose)).toFixed(1)} mg`;
  };

  const calculateApgar = () => Object.values(apgar).reduce((a, b) => a + b, 0);
  const calculateSilverman = () => Object.values(silverman).reduce((a, b) => a + b, 0);

  const handleAnalyzeGrowth = async () => {
    setIsAnalyzingGrowth(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Analyse ces paramètres de croissance pédiatrique :
      Âge : ${growthData.age}
      Poids : ${growthData.weight} kg
      Taille : ${growthData.height} cm
      Périmètre Crânien : ${growthData.pc} cm
      
      Interprète ces données selon les courbes de l'OMS (Z-scores). 
      Donne une conclusion sur l'état nutritionnel et le développement staturo-pondéral. 
      Réponds en français académique.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setGrowthAnalysis(response.text || "Erreur d'analyse.");
    } catch (error) {
      console.error("Growth Analysis Error:", error);
    } finally {
      setIsAnalyzingGrowth(false);
    }
  };

  const handleGenerateCase = async () => {
    setIsGeneratingCase(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `En tant qu'expert pédiatre, structure ce cas clinique pour une publication académique :
      Âge : ${caseData.age}
      Sexe : ${caseData.sexe}
      Motif : ${caseData.motif}
      Antécédents : ${caseData.antecedents}
      Examen : ${caseData.examen}
      Hypothèses : ${caseData.hypotheses}
      
      Formatte le rapport avec les sections suivantes : Titre, Résumé, Introduction, Présentation du Cas, Discussion, Conclusion. 
      Utilise un ton scientifique de haut niveau en français.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setGeneratedCase(response.text || "Erreur de génération.");
    } catch (error) {
      console.error("Case Generation Error:", error);
    } finally {
      setIsGeneratingCase(false);
    }
  };

  const handlePubmedSearch = async () => {
    if (!pubmedQuery.trim()) return;
    setIsSearchingPubmed(true);
    try {
      const results = await searchTavilyRaw(`${pubmedQuery} site:pubmed.ncbi.nlm.nih.gov`);
      setPubmedResults(results || []);
    } catch (error) {
      console.error("PubMed Search Error:", error);
    } finally {
      setIsSearchingPubmed(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 lg:p-12 scrollbar-hide">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-[#1A1A1A] mb-2 tracking-tight">Outils & Recherche</h2>
        <p className="text-sm text-gray-400 font-medium">Fonctionnalités avancées pour l&apos;excellence pédiatrique</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-10">
        {[
          { id: 'calc', name: 'Dose', icon: Calculator },
          { id: 'growth', name: 'Croissance', icon: Activity },
          { id: 'scores', name: 'Scores Cliniques', icon: Stethoscope },
          { id: 'case', name: 'Cas Clinique', icon: FileEdit },
          { id: 'pubmed', name: 'PubMed', icon: BookOpen },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as any)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all border",
              activeTool === tool.id 
                ? "bg-[#008080] text-white border-[#008080] shadow-lg shadow-[#008080]/20" 
                : "bg-white text-gray-500 border-[#E8E5E0] hover:border-[#008080]/30"
            )}
          >
            <tool.icon size={18} />
            {tool.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            {activeTool === 'growth' && (
              <motion.div 
                key="growth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                <div className="bg-white p-10 rounded-[40px] border border-[#E8E5E0] shadow-sm">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-8">Analyse de Croissance</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ÂGE</label>
                        <input 
                          type="text" 
                          value={growthData.age}
                          onChange={(e) => setGrowthData({...growthData, age: e.target.value})}
                          placeholder="Ex: 24 mois"
                          className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">POIDS (KG)</label>
                        <input 
                          type="number" 
                          value={growthData.weight}
                          onChange={(e) => setGrowthData({...growthData, weight: e.target.value})}
                          placeholder="12"
                          className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TAILLE (CM)</label>
                        <input 
                          type="number" 
                          value={growthData.height}
                          onChange={(e) => setGrowthData({...growthData, height: e.target.value})}
                          placeholder="85"
                          className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">P. CRÂNIEN (CM)</label>
                        <input 
                          type="number" 
                          value={growthData.pc}
                          onChange={(e) => setGrowthData({...growthData, pc: e.target.value})}
                          placeholder="48"
                          className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleAnalyzeGrowth}
                      disabled={isAnalyzingGrowth || !growthData.weight}
                      className="w-full bg-[#008080] text-white py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isAnalyzingGrowth ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                      ANALYSER LA CROISSANCE
                    </button>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white shadow-xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-sm">Interprétation OMS (IA)</h3>
                    <CheckCircle2 size={18} className="text-[#008080]" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/10 overflow-y-auto">
                    {isAnalyzingGrowth ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 size={32} className="text-[#008080] animate-spin" />
                        <p className="text-xs font-bold text-[#008080] animate-pulse uppercase tracking-widest">Calcul des Z-scores...</p>
                      </div>
                    ) : growthAnalysis ? (
                      <div className="text-xs leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
                        {growthAnalysis}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                        <Activity size={48} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Saisissez les mesures pour l&apos;analyse</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTool === 'scores' && (
              <motion.div 
                key="scores"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                <div className="bg-white p-10 rounded-[40px] border border-[#E8E5E0] shadow-sm">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-8">Calculateur de Scores</h3>
                  
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-[#008080]">SCORE D&apos;APGAR</h4>
                        <span className="bg-[#E6F2F2] text-[#008080] px-3 py-1 rounded-full text-xs font-bold">{calculateApgar()} / 10</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.keys(apgar).map((key) => (
                          <div key={key} className="space-y-2">
                            <p className="text-[8px] font-bold text-gray-400 uppercase text-center">{key}</p>
                            <select 
                              value={(apgar as any)[key]}
                              onChange={(e) => setApgar({...apgar, [key]: parseInt(e.target.value)})}
                              className="w-full bg-[#F5F4F0] border-none rounded-lg py-2 text-[10px] font-bold outline-none"
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-[#F5F4F0]">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-[#008080]">SCORE DE SILVERMAN</h4>
                        <span className="bg-[#E6F2F2] text-[#008080] px-3 py-1 rounded-full text-xs font-bold">{calculateSilverman()} / 10</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.keys(silverman).map((key) => (
                          <div key={key} className="space-y-2">
                            <p className="text-[8px] font-bold text-gray-400 uppercase text-center">{key}</p>
                            <select 
                              value={(silverman as any)[key]}
                              onChange={(e) => setSilverman({...silverman, [key]: parseInt(e.target.value)})}
                              className="w-full bg-[#F5F4F0] border-none rounded-lg py-2 text-[10px] font-bold outline-none"
                            >
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white shadow-xl flex flex-col justify-center">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#008080] uppercase tracking-widest mb-2">INTERPRÉTATION APGAR</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        {calculateApgar() >= 7 ? "État satisfaisant. Surveillance standard." : calculateApgar() >= 4 ? "Détresse modérée. Réanimation initiale nécessaire." : "Détresse sévère. Réanimation immédiate."}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-[#008080] uppercase tracking-widest mb-2">INTERPRÉTATION SILVERMAN</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        {calculateSilverman() === 0 ? "Absence de détresse respiratoire." : calculateSilverman() <= 3 ? "Détresse respiratoire légère." : calculateSilverman() <= 6 ? "Détresse respiratoire modérée." : "Détresse respiratoire sévère."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTool === 'calc' && (
              <motion.div 
                key="calc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                <div className="bg-white p-10 rounded-[40px] border border-[#E8E5E0] shadow-sm">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-8">Calculateur de Dose</h3>
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">POIDS DU PATIENT (KG)</label>
                      <input 
                        type="number" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">MÉDICAMENT</label>
                      <div className="grid grid-cols-1 gap-2">
                        {PEDIATRIC_DRUGS.map((drug) => (
                          <button
                            key={drug.name}
                            onClick={() => setSelectedDrug(drug)}
                            className={cn(
                              "text-left px-6 py-4 rounded-2xl text-xs font-bold transition-all border",
                              selectedDrug.name === drug.name 
                                ? "bg-[#E6F2F2] border-[#008080] text-[#008080]" 
                                : "bg-white border-[#E8E5E0] text-gray-500 hover:border-[#008080]/30"
                            )}
                          >
                            {drug.name} ({drug.dose})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Calculator size={120} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-[#008080] uppercase tracking-widest mb-4">DOSE CALCULÉE</p>
                    <h4 className="text-6xl font-bold mb-8 tracking-tighter">{handleCalculate()}</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#008080]" />
                        <span className="font-bold uppercase tracking-wider">FRÉQUENCE :</span> {selectedDrug.freq}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="font-bold uppercase tracking-wider">MAXIMUM :</span> {selectedDrug.max}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTool === 'case' && (
              <motion.div 
                key="case"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                <div className="bg-white p-10 rounded-[40px] border border-[#E8E5E0] shadow-sm">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-8">Assistant Cas Clinique</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Âge" 
                        value={caseData.age}
                        onChange={(e) => setCaseData({...caseData, age: e.target.value})}
                        className="bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                      />
                      <select 
                        value={caseData.sexe}
                        onChange={(e) => setCaseData({...caseData, sexe: e.target.value})}
                        className="bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                    <textarea 
                      placeholder="Motif de consultation..." 
                      rows={2}
                      value={caseData.motif}
                      onChange={(e) => setCaseData({...caseData, motif: e.target.value})}
                      className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none"
                    />
                    <textarea 
                      placeholder="Examen clinique & Hypothèses..." 
                      rows={4}
                      value={caseData.examen}
                      onChange={(e) => setCaseData({...caseData, examen: e.target.value})}
                      className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none"
                    />
                    <button 
                      onClick={handleGenerateCase}
                      disabled={isGeneratingCase || !caseData.motif}
                      className="w-full bg-[#008080] text-white py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingCase ? <Loader2 size={18} className="animate-spin" /> : <FileEdit size={18} />}
                      GÉNÉRER LE RAPPORT ACADÉMIQUE
                    </button>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white shadow-xl overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-sm">Rapport Structuré (IA)</h3>
                    <CheckCircle2 size={18} className="text-[#008080]" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/10 overflow-y-auto">
                    {isGeneratingCase ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 size={32} className="text-[#008080] animate-spin" />
                        <p className="text-xs font-bold text-[#008080] animate-pulse uppercase tracking-widest">Rédaction scientifique en cours...</p>
                      </div>
                    ) : generatedCase ? (
                      <div className="text-xs leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
                        {generatedCase}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                        <FileEdit size={48} className="mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">Saisissez les données pour générer le rapport</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTool === 'pubmed' && (
              <motion.div 
                key="pubmed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-white p-10 rounded-[40px] border border-[#E8E5E0] shadow-sm">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-8">Recherche PubMed Directe</h3>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="Rechercher des articles scientifiques (ex: neuroblastome pédiatrique)..." 
                        value={pubmedQuery}
                        onChange={(e) => setPubmedQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePubmedSearch()}
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl py-4 pl-16 pr-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                      />
                    </div>
                    <button 
                      onClick={handlePubmedSearch}
                      disabled={isSearchingPubmed || !pubmedQuery.trim()}
                      className="bg-[#1A1A1A] text-white px-10 rounded-2xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSearchingPubmed ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                      RECHERCHER
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {isSearchingPubmed ? (
                    <div className="bg-white p-20 rounded-[40px] border border-[#E8E5E0] flex flex-col items-center justify-center space-y-4">
                      <Loader2 size={48} className="text-[#008080] animate-spin" />
                      <p className="text-sm font-bold text-[#008080] uppercase tracking-widest">Interrogation de la base PubMed...</p>
                    </div>
                  ) : pubmedResults.length > 0 ? (
                    pubmedResults.map((result, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-8 rounded-[30px] border border-[#E8E5E0] hover:border-[#008080] transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-lg font-bold text-[#1A1A1A] group-hover:text-[#008080] transition-colors leading-tight pr-10">{result.title}</h4>
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-3 bg-[#F5F4F0] rounded-xl text-gray-400 hover:bg-[#008080] hover:text-white transition-all"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">{result.content}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-[#008080] bg-[#E6F2F2] px-3 py-1 rounded-full uppercase tracking-widest">PubMed Central</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source Académique</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-white p-20 rounded-[40px] border border-[#E8E5E0] flex flex-col items-center justify-center text-center opacity-30">
                      <BookOpen size={64} className="mb-6" />
                      <p className="text-sm font-bold uppercase tracking-widest">Lancez une recherche pour voir les publications</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
