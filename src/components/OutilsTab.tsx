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
  Download,
  Copy,
  Send,
  FileText as FileIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";
import { searchTavilyRaw } from '@/lib/tavilyClient';
import { useAppContext } from '@/lib/AppContext';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

const PEDIATRIC_DRUGS = [
  // Antalgiques & Antipyrétiques
  { id: 'para', name: 'Paracétamol', dose: 15, unit: 'mg/kg/dose', freq: 'Toutes les 6h', max: '60 mg/kg/j', cat: 'Antalgique', notes: 'Espacez les prises de 6h minimum. Risque d\'hépatotoxicité en cas de surdosage.' },
  { id: 'ibu', name: 'Ibuprofène', dose: 10, unit: 'mg/kg/dose', freq: 'Toutes les 8h', max: '30 mg/kg/j', cat: 'AINS', notes: 'À prendre au cours des repas. Contre-indiqué en cas de varicelle ou d\'infection pulmonaire sévère.' },
  { id: 'morph', name: 'Morphine (IV)', dose: 0.1, unit: 'mg/kg/dose', freq: 'Toutes les 4h', max: 'Surveillance étroite', cat: 'Opioïde', notes: 'Surveillance de la fréquence respiratoire et de la saturation (SaO2) obligatoire.' },
  { id: 'tram', name: 'Tramadol (PO)', dose: 1, unit: 'mg/kg/dose', freq: 'Toutes les 6-8h', max: '400 mg/j', cat: 'Opioïde', notes: 'Utiliser avec prudence chez l\'enfant de plus de 12 ans. Risque de dépression respiratoire.' },
  
  // Antibiotiques
  { id: 'amox', name: 'Amoxicilline', dose: 80, unit: 'mg/kg/j', freq: 'En 2-3 prises', max: '3 g/j', cat: 'Antibiotique', notes: 'Privilégier 2 prises par jour pour une meilleure observance.' },
  { id: 'augm', name: 'Augmentin', dose: 80, unit: 'mg/kg/j', freq: 'En 2-3 prises', max: '3 g/j', cat: 'Antibiotique', notes: 'Risque de troubles digestifs (diarrhées). À prendre en début de repas.' },
  { id: 'ceft', name: 'Ceftriaxone', dose: 50, unit: 'mg/kg/j', freq: 'En 1 prise (IV/IM)', max: '2 g/j', cat: 'Antibiotique', notes: 'Utilisation hospitalière privilégiée. Attention au risque de précipitation avec le calcium.' },
  { id: 'gent', name: 'Gentamicine', dose: 6, unit: 'mg/kg/j', freq: 'En 1 prise (IV/IM)', max: '---', cat: 'Antibiotique', notes: 'Risque de néphrotoxicité et d\'ototoxicité. Surveillance des taux résiduels si traitement > 3 jours.' },
  { id: 'azit', name: 'Azithromycine', dose: 10, unit: 'mg/kg/j', freq: 'En 1 prise (3 jours)', max: '500 mg/j', cat: 'Antibiotique', notes: 'Efficace sur les germes intracellulaires. Prise unique quotidienne.' },
  
  // Drépanocytose & Hématologie
  { id: 'hydr', name: 'Hydroxyurée', dose: 15, unit: 'mg/kg/j', freq: 'En 1 prise quotidienne', max: '35 mg/kg/j', cat: 'Drépanocytose', notes: 'Traitement de fond de la drépanocytose. Surveillance mensuelle de la NFS (recherche de neutropénie).' },
  { id: 'afol', name: 'Acide Folique', dose: 5, unit: 'mg/j', freq: '1 fois par jour', max: '5 mg/j', cat: 'Drépanocytose', notes: 'Indispensable pour prévenir l\'anémie mégaloblastique chez le drépanocytaire.' },
  { id: 'penv', name: 'Pénicilline V', dose: 50000, unit: 'UI/kg/j', freq: 'En 2 prises', max: '---', cat: 'Prophylaxie SCD', notes: 'Prophylaxie anti-pneumococcique systématique jusqu\'à l\'âge de 5 ans.' },
  
  // Respiratoire & Autres
  { id: 'salb', name: 'Salbutamol (Sirop)', dose: 0.1, unit: 'mg/kg/dose', freq: 'Toutes les 6-8h', max: '2 mg/dose', cat: 'Respiratoire', notes: 'Risque de tachycardie et de tremblements. Préférer la voie inhalée si possible.' },
  { id: 'pred', name: 'Prednisolone', dose: 1, unit: 'mg/kg/j', freq: 'En 1-2 prises', max: '60 mg/j', cat: 'Corticoïde', notes: 'À prendre le matin. Cure courte (3-5 jours) généralement suffisante en pédiatrie.' },
  { id: 'phen', name: 'Phénobarbital', dose: 3, unit: 'mg/kg/j', freq: 'En 1-2 prises', max: '---', cat: 'Anticonvulsivant', notes: 'Inducteur enzymatique puissant. Surveillance de la sédation.' },
  { id: 'valp', name: 'Valproate', dose: 20, unit: 'mg/kg/j', freq: 'En 2 prises', max: '---', cat: 'Anticonvulsivant', notes: 'Surveillance de la fonction hépatique. Risque de prise de poids.' },
];

export const OutilsTab = () => {
  const { setActiveTab, addDocument } = useAppContext();
  const [activeTool, setActiveTool] = useState<'calc' | 'case' | 'pubmed' | 'scores' | 'growth'>('calc');
  
  // Calculator State
  const [weight, setWeight] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState(PEDIATRIC_DRUGS[0]);
  const [drugSearch, setDrugSearch] = useState('');
  const [isDrugListOpen, setIsDrugListOpen] = useState(false);
  
  // Case Assistant State
  const [caseData, setCaseData] = useState({
    age: '',
    sexe: 'M',
    motif: '',
    antecedents: '',
    examen: '',
    hypotheses: '',
    traitement: ''
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
    if (isNaN(w) || w <= 0) return "---";
    const result = w * selectedDrug.dose;
    const unit = selectedDrug.unit.split('/')[0];
    return `${result.toLocaleString('fr-FR')} ${unit}`;
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
      
      const systemInstruction = `Tu es un expert pédiatre et rédacteur scientifique d'élite. 
      Ton rôle est de structurer des cas cliniques pour des publications académiques de haut niveau.
      
      CONTRAINTES DE FORMATAGE CRITIQUES :
      1. Utilise UNIQUEMENT le double underscore (__mot__) pour mettre en gras les titres de sections et les points clés.
      2. Il est STRICTEMENT INTERDIT d'utiliser des astérisques (*), des dièses (#), des tirets (-) ou des listes à puces.
      3. N'utilise AUCUNE balise HTML.
      4. Rédige des paragraphes fluides, structurés et élégants.
      5. Sépare chaque grande section par deux sauts de ligne.
      6. Ne mets aucun symbole de liste, utilise des transitions textuelles (ex: "Concernant les antécédents...", "L'examen clinique révèle...").
      7. Le ton doit être académique, rigoureux et précis.`;

      const prompt = `Rédige un rapport de cas clinique structuré et prêt pour publication basé sur ces informations :
      ÂGE : ${caseData.age}
      SEXE : ${caseData.sexe === 'M' ? 'Masculin' : 'Féminin'}
      MOTIF : ${caseData.motif}
      ANTÉCÉDENTS : ${caseData.antecedents}
      EXAMEN CLINIQUE : ${caseData.examen}
      HYPOTHÈSES & DIAGNOSTIC : ${caseData.hypotheses}
      TRAITEMENT & ÉVOLUTION : ${caseData.traitement}
      
      Le rapport doit inclure les sections suivantes : __TITRE DU CAS__, __RÉSUMÉ__, __INTRODUCTION__, __PRÉSENTATION DU CAS__, __DISCUSSION__, __CONCLUSION__.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction }
      });
      
      setGeneratedCase(response.text || "Erreur de génération.");
    } catch (error) {
      console.error("Case Generation Error:", error);
    } finally {
      setIsGeneratingCase(false);
    }
  };

  const copyCaseToClipboard = () => {
    if (!generatedCase) return;
    navigator.clipboard.writeText(generatedCase.replace(/__/g, ''));
    alert("Texte copié dans le presse-papier !");
  };

  const exportCasePDF = () => {
    if (!generatedCase) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Rapport de Cas Clinique - DouliaMed", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const cleanText = generatedCase.replace(/__/g, '');
    const splitText = doc.splitTextToSize(cleanText, 170);
    doc.text(splitText, 20, 35);
    
    doc.save(`Cas_Clinique_${new Date().getTime()}.pdf`);
  };

  const sendToRedaction = async () => {
    if (!generatedCase) return;
    const title = "Cas Clinique - " + (caseData.motif || "Sans titre");
    await addDocument(title, generatedCase.replace(/__/g, '**'));
    setActiveTab('redaction');
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
                      <div className="relative">
                        <button
                          onClick={() => setIsDrugListOpen(!isDrugListOpen)}
                          className="w-full bg-[#F5F4F0] border border-[#E8E5E0] rounded-2xl py-4 px-6 text-sm font-bold text-[#1A1A1A] flex items-center justify-between hover:border-[#008080]/30 transition-all"
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] text-[#008080] uppercase tracking-tighter mb-0.5">{selectedDrug.cat}</span>
                            <span>{selectedDrug.name}</span>
                          </div>
                          <ChevronRight size={18} className={cn("transition-transform", isDrugListOpen && "rotate-90")} />
                        </button>

                        <AnimatePresence>
                          {isDrugListOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute z-50 w-full mt-2 bg-white border border-[#E8E5E0] rounded-3xl shadow-2xl overflow-hidden"
                            >
                              <div className="p-4 border-b border-[#F5F4F0]">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                  <input 
                                    type="text"
                                    placeholder="Rechercher un médicament..."
                                    value={drugSearch}
                                    onChange={(e) => setDrugSearch(e.target.value)}
                                    className="w-full bg-[#F5F4F0] border-none rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-[#008080] outline-none"
                                  />
                                </div>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
                                {PEDIATRIC_DRUGS.filter(d => 
                                  d.name.toLowerCase().includes(drugSearch.toLowerCase()) || 
                                  d.cat.toLowerCase().includes(drugSearch.toLowerCase())
                                ).map((drug) => (
                                  <button
                                    key={drug.id}
                                    onClick={() => {
                                      setSelectedDrug(drug);
                                      setIsDrugListOpen(false);
                                      setDrugSearch('');
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group",
                                      selectedDrug.id === drug.id ? "bg-[#E6F2F2] text-[#008080]" : "hover:bg-[#F5F4F0]"
                                    )}
                                  >
                                    <div>
                                      <p className="text-xs font-bold">{drug.name}</p>
                                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">{drug.cat}</p>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{drug.dose} {drug.unit}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white shadow-xl flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Calculator size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-[10px] font-bold text-[#008080] uppercase tracking-widest">DOSE CALCULÉE</p>
                      <span className="text-[9px] bg-[#008080]/20 text-[#008080] px-2 py-0.5 rounded-full font-bold">{selectedDrug.unit}</span>
                    </div>
                    <h4 className="text-6xl font-bold mb-8 tracking-tighter text-white">
                      {handleCalculate()}
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-[#008080]/20 flex items-center justify-center text-[#008080]">
                            <Activity size={16} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schéma Thérapeutique</span>
                        </div>
                        <p className="text-sm font-bold text-white">{selectedDrug.freq}</p>
                      </div>
                      
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                            <Activity size={16} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dose Maximale</span>
                        </div>
                        <p className="text-sm font-bold text-white">{selectedDrug.max}</p>
                      </div>

                      <div className="p-6 bg-[#008080]/10 rounded-3xl border border-[#008080]/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-[#008080]/20 flex items-center justify-center text-[#008080]">
                            <Stethoscope size={16} />
                          </div>
                          <span className="text-[10px] font-bold text-[#008080] uppercase tracking-widest">Notes & Précautions</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed italic">"{selectedDrug.notes}"</p>
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
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ÂGE</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 5 ans" 
                          value={caseData.age}
                          onChange={(e) => setCaseData({...caseData, age: e.target.value})}
                          className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">SEXE</label>
                        <select 
                          value={caseData.sexe}
                          onChange={(e) => setCaseData({...caseData, sexe: e.target.value})}
                          className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none"
                        >
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">MOTIF DE CONSULTATION</label>
                      <textarea 
                        placeholder="Ex: Fièvre persistante et douleurs osseuses..." 
                        rows={2}
                        value={caseData.motif}
                        onChange={(e) => setCaseData({...caseData, motif: e.target.value})}
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ANTÉCÉDENTS</label>
                      <textarea 
                        placeholder="Ex: Drépanocytose SS connue, hospitalisations antérieures..." 
                        rows={2}
                        value={caseData.antecedents}
                        onChange={(e) => setCaseData({...caseData, antecedents: e.target.value})}
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">EXAMEN CLINIQUE & HYPOTHÈSES</label>
                      <textarea 
                        placeholder="Signes physiques, examens complémentaires, diagnostic suspecté..." 
                        rows={3}
                        value={caseData.examen}
                        onChange={(e) => setCaseData({...caseData, examen: e.target.value})}
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">TRAITEMENT & ÉVOLUTION</label>
                      <textarea 
                        placeholder="Prise en charge initiale et réponse au traitement..." 
                        rows={2}
                        value={caseData.traitement}
                        onChange={(e) => setCaseData({...caseData, traitement: e.target.value})}
                        className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none resize-none"
                      />
                    </div>

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
                    <div className="flex items-center gap-2">
                      {generatedCase && (
                        <>
                          <button 
                            onClick={copyCaseToClipboard}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                            title="Copier le texte"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={exportCasePDF}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                            title="Exporter en PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={sendToRedaction}
                            className="p-2 bg-[#008080] hover:bg-[#008080]/80 rounded-lg transition-all"
                            title="Envoyer vers Rédaction"
                          >
                            <Send size={14} />
                          </button>
                        </>
                      )}
                      <CheckCircle2 size={18} className="text-[#008080]" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/10 overflow-y-auto">
                    {isGeneratingCase ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 size={32} className="text-[#008080] animate-spin" />
                        <p className="text-xs font-bold text-[#008080] animate-pulse uppercase tracking-widest">Rédaction scientifique en cours...</p>
                      </div>
                    ) : generatedCase ? (
                      <div className="text-xs leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
                        <ReactMarkdown 
                          components={{
                            strong: ({node, ...props}) => <span className="font-bold text-white text-sm block mt-4 mb-2" {...props} />
                          }}
                        >
                          {generatedCase.replace(/__/g, '**')}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                        <FileIcon size={48} className="mb-4" />
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
