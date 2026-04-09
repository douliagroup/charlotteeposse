'use client';

import React, { useState, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Activity, Loader2, Download, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from "jspdf";

const initialVizData = [
  { name: 'Jan', value: 420 },
  { name: 'Fév', value: 380 },
  { name: 'Mar', value: 590 },
  { name: 'Avr', value: 720 },
  { name: 'Mai', value: 850 },
  { name: 'Juin', value: 910 },
];

const initialPieData = [
  { name: 'Néphroblastome', value: 450 },
  { name: 'Drépanocytose', value: 320 },
  { name: 'Malnutrition', value: 280 },
  { name: 'Infections', value: 150 },
];

const COLORS = ['#008080', '#00A3A3', '#00C7C7', '#00EBEB', '#FF8042', '#FFBB28', '#00C49F', '#FF0000'];

export const VisualisationTab = () => {
  const [vizData, setVizData] = useState(initialVizData);
  const [pieData, setPieData] = useState(initialPieData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [biostatsInterpretation, setBiostatsInterpretation] = useState<string | null>(
    "Les données montrent une corrélation significative (p < 0.05) entre l'adhésion au protocole 2026 et la réduction des marqueurs tumoraux au cours du deuxième trimestre. Le groupe A présente une réponse thérapeutique supérieure de 12% par rapport à la moyenne régionale."
  );
  const [fullReport, setFullReport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateInterpretation = async () => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const systemInstruction = `Tu es un expert en biostatistique médicale et oncologie pédiatrique. 
      Ton analyse doit être rigoureuse, académique et basée sur les standards internationaux (OMS, SIOP). 
      Utilise un vocabulaire médical précis. Réponds en français. 
      IMPORTANT: N'utilise JAMAIS d'astérisques (*), de dièses (#) ou de tirets (-) pour le formatage. Utilise uniquement le gras avec __mot__ pour les titres.`;

      const prompt = `Analyse ces données biostatistiques :
      Données temporelles : ${JSON.stringify(vizData)}
      Répartition pathologique : ${JSON.stringify(pieData)}
      
      Génère une interprétation scientifique concise (max 3-4 phrases) pour le bloc d'interprétation rapide.`;
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setBiostatsInterpretation(text || "Erreur d'analyse.");
    } catch (error) {
      console.error("Biostats Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFullReport = async () => {
    setIsGeneratingReport(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const systemInstruction = `Tu es un expert en biostatistique médicale et oncologie pédiatrique d'élite. 
      Ton rôle est de rédiger un rapport académique complet basé sur les données fournies.
      
      CONTRAINTES DE FORMATAGE STRICTES :
      1. Utilise uniquement le GRAS (syntaxe __mot__) pour les titres de sections.
      2. Il est STRICTEMENT INTERDIT d'utiliser des astérisques (*), des dièses (#), des tirets (-) ou des listes à puces.
      3. Rédige des paragraphes fluides.
      4. Sépare chaque section par deux sauts de ligne.
      5. Le ton doit être académique et rigoureux.`;

      const prompt = `Rédige un rapport biostatistique complet basé sur ces données :
      Données temporelles : ${JSON.stringify(vizData)}
      Répartition pathologique : ${JSON.stringify(pieData)}
      
      Le rapport doit inclure :
      - Titre du Rapport
      - Résumé Exécutif
      - Analyse de l'Évolution Temporelle
      - Analyse de la Répartition des Pathologies
      - Discussion et Implications Cliniques
      - Conclusion et Recommandations Stratégiques`;
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setFullReport(text || "Erreur de génération du rapport.");
    } catch (error) {
      console.error("Report Error:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    const combinedData = [
      ["SECTION", "NOM", "VALEUR"],
      ...vizData.map(d => ["EVOLUTION", d.name, d.value]),
      ...pieData.map(d => ["REPARTITION", d.name, d.value])
    ];
    
    const csv = Papa.unparse(combinedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "DouliaMed_Biostats_Export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const rows = results.data as string[][];
          if (rows.length < 2) return;
          
          const newViz: any[] = [];
          const newPie: any[] = [];
          
          rows.slice(1).forEach(row => {
            if (row.length < 3) return;
            const [section, name, value] = row;
            const val = parseFloat(value) || 0;
            if (section === "EVOLUTION") {
              newViz.push({ name, value: val });
            } else if (section === "REPARTITION") {
              newPie.push({ name, value: val });
            }
          });
          
          if (newViz.length > 0) setVizData(newViz);
          if (newPie.length > 0) setPieData(newPie);
          
          alert("Données importées avec succès !");
        },
        header: false,
        skipEmptyLines: true
      });
    }
  };

  const downloadPDFReport = () => {
    if (!fullReport) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 128, 128);
    doc.text("DouliaMed - Rapport Biostatistique", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    
    doc.setDrawColor(232, 229, 224);
    doc.line(20, 35, 190, 35);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    
    // Clean up the markdown-like bolding for PDF
    const cleanText = fullReport.replace(/__(.*?)__/g, '$1');
    const splitText = doc.splitTextToSize(cleanText, 170);
    doc.text(splitText, 20, 45);
    
    doc.save(`Rapport_Biostats_${Date.now()}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 bg-[#F5F4F0] h-full overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="mt-10 lg:mt-0">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Analyse Biostatistique</h2>
          <p className="text-xs text-gray-400 font-medium">Visualisation des données cliniques et interprétation IA</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv" 
            className="hidden" 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border border-[#E8E5E0] text-[#1A1A1A] px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-[#F5F4F0] transition-all flex items-center gap-2"
          >
            <Upload size={14} /> Importer CSV
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-[#E8E5E0] text-[#1A1A1A] px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-[#F5F4F0] transition-all flex items-center gap-2"
          >
            <Download size={14} /> Exporter CSV
          </button>
          <button 
            onClick={handleGenerateFullReport}
            disabled={isGeneratingReport}
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-md shadow-black/10 disabled:opacity-50 flex items-center gap-2"
          >
            {isGeneratingReport ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            Générer Rapport IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-base text-[#1A1A1A]">Évolution des marqueurs tumoraux</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400"><div className="w-2 h-2 rounded-full bg-[#008080]"></div> VALEURS</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vizData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F4F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#008080" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: '#008080', strokeWidth: 3, stroke: '#fff' }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 p-6 bg-[#F5F4F0] rounded-2xl border border-[#E8E5E0] relative group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-[#008080]" />
                <span className="text-[11px] font-bold text-[#008080] uppercase tracking-widest">Interprétation Rapide</span>
              </div>
              <button 
                onClick={handleGenerateInterpretation}
                disabled={isGenerating}
                className="text-[10px] font-bold text-gray-400 hover:text-[#008080] transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                Actualiser
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed italic font-medium">
              {biostatsInterpretation}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm flex flex-col"
        >
          <h3 className="font-bold text-base text-[#1A1A1A] mb-8">Répartition des Pathologies</h3>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Full AI Report Section at the bottom */}
      <AnimatePresence>
        {fullReport && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[40px] border border-[#E8E5E0] shadow-xl mb-10"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#008080]/10 rounded-2xl flex items-center justify-center text-[#008080]">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Rapport Biostatistique IA</h3>
                  <p className="text-xs text-gray-400 font-medium">Analyse approfondie générée par DouliaMed</p>
                </div>
              </div>
              <button 
                onClick={downloadPDFReport}
                className="bg-[#008080] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-all"
              >
                <Download size={18} /> Télécharger PDF
              </button>
            </div>
            
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-medium">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-6">{children}</p>,
                  strong: ({ children }) => <span className="text-[#008080] font-bold text-base uppercase tracking-tight block mt-8 mb-4">{children}</span>
                }}
              >
                {fullReport}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Interpretation Block (as requested) */}
      {!fullReport && (
        <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Activity size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#008080] animate-pulse"></div>
              <h3 className="text-[10px] font-bold text-[#008080] uppercase tracking-widest">Synthèse Stratégique IA</h3>
            </div>
            <p className="text-lg font-medium leading-relaxed italic mb-8 max-w-3xl">
              &quot;Docteur Eposse, l&apos;analyse croisée des données temporelles et de la répartition pathologique suggère une efficacité accrue du protocole actuel. La tendance haussière des marqueurs de réussite sur le dernier trimestre est statistiquement significative.&quot;
            </p>
            <button 
              onClick={handleGenerateFullReport}
              className="bg-[#008080] text-white px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-[#00A3A3] transition-all flex items-center gap-3"
            >
              <FileText size={16} /> Générer le rapport complet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
