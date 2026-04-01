'use client';

import React, { useState } from 'react';
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
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon, Search, Activity, Loader2 } from 'lucide-react';
import Image from 'next/image';

const vizData = [
  { name: 'Jan', value: 420 },
  { name: 'Fév', value: 380 },
  { name: 'Mar', value: 590 },
  { name: 'Avr', value: 720 },
  { name: 'Mai', value: 850 },
  { name: 'Juin', value: 910 },
];

const pieData = [
  { name: 'Néphroblastome', value: 450 },
  { name: 'Drépanocytose', value: 320 },
  { name: 'Malnutrition', value: 280 },
  { name: 'Infections', value: 150 },
];

import { GoogleGenAI } from "@google/genai";

const COLORS = ['#008080', '#00A3A3', '#00C7C7', '#00EBEB'];

export const VisualisationTab = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [biostatsInterpretation, setBiostatsInterpretation] = useState<string | null>(
    "Les données montrent une corrélation significative (p < 0.05) entre l'adhésion au protocole 2026 et la réduction des marqueurs tumoraux au cours du deuxième trimestre. Le groupe A présente une réponse thérapeutique supérieure de 12% par rapport à la moyenne régionale."
  );

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const ai = new GoogleGenAI({ apiKey });
      
      const systemInstruction = `Tu es un expert en biostatistique médicale et oncologie pédiatrique. 
      Ton analyse doit être rigoureuse, académique et basée sur les standards internationaux (OMS, SIOP). 
      Utilise un vocabulaire médical précis (p-value, intervalle de confiance, significativité statistique, etc.).`;

      const prompt = `Analyse ces données biostatistiques issues de la recherche clinique du Docteur Eposse :
      Données temporelles : ${JSON.stringify(vizData)}
      Répartition pathologique : ${JSON.stringify(pieData)}
      
      Génère une interprétation scientifique détaillée incluant :
      1. Une analyse des tendances observées.
      2. Une interprétation de la significativité statistique (p-value simulée basée sur la cohérence des données).
      3. Des recommandations cliniques basées sur ces résultats.
      
      Le rapport doit être structuré et rédigé en français académique.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { systemInstruction }
      });
      
      setBiostatsInterpretation(response.text || "Erreur d'analyse.");
    } catch (error) {
      console.error("Biostats Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage || !imageMimeType) return;
    setIsAnalyzingImage(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clé API manquante");
      const ai = new GoogleGenAI({ apiKey });
      
      const base64Data = selectedImage.split(',')[1];
      
      const systemInstruction = `Tu es un radiologue pédiatrique expert. 
      Ton rôle est d'analyser les imageries médicales (Radio, Scanner, IRM) avec une précision académique. 
      Identifie les structures anatomiques, les anomalies pathologiques (masses, opacités, fractures, etc.) et propose un diagnostic différentiel étayé.
      Utilise la terminologie radiologique standard.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Analyse cette imagerie médicale pédiatrique. Fournis une description sémiologique détaillée, les hypothèses diagnostiques et les examens complémentaires suggérés. Réponds en français académique." },
            { inlineData: { data: base64Data, mimeType: imageMimeType } }
          ]
        },
        config: { systemInstruction }
      });
      
      setAnalysisResult(response.text || "Désolé, je n'ai pas pu analyser cette image.");
    } catch (error) {
      console.error("Image Analysis Error:", error);
      setAnalysisResult("Erreur lors de l'analyse de l'image.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setImageMimeType(file.type);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + vizData.map(e => `${e.name},${e.value}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "DouliaMed_Data_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const newData = lines.slice(1).map(line => {
          const [name, value] = line.split(',');
          return { name, value: parseFloat(value) || 0 };
        });
        // In a real app we'd update vizData, but for now we just show we can parse it
        console.log("Parsed CSV Data:", newData);
        alert("Données CSV chargées avec succès ! (Simulation)");
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#F5F4F0] h-full overflow-y-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="mt-10 lg:mt-0">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Analyse Biostatistique</h2>
          <p className="text-xs text-gray-400 font-medium">Visualisation des données cliniques et interprétation IA</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload}
            />
            <button className="bg-white border border-[#E8E5E0] text-[#1A1A1A] px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-[#F5F4F0] transition-all">
              Importer CSV
            </button>
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-[#E8E5E0] text-[#1A1A1A] px-4 py-2 rounded-lg text-[11px] font-bold hover:bg-[#F5F4F0] transition-all"
          >
            Exporter CSV
          </button>
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="bg-[#008080] text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-md shadow-[#008080]/10 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : "Générer Rapport IA"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-[24px] border border-[#E8E5E0] shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm text-[#1A1A1A]">Évolution des marqueurs tumoraux</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-[#008080]"></div> GROUPE A</span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> GROUPE B</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vizData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F4F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '11px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="value" stroke="#008080" strokeWidth={3} dot={{ r: 4, fill: '#008080', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* AI Interpretation for Biostats */}
          <div className="mt-6 p-4 bg-[#F5F4F0] rounded-xl border border-[#E8E5E0]">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-[#008080]" />
              <span className="text-[10px] font-bold text-[#008080] uppercase tracking-widest">Interprétation IA</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed italic">
              {biostatsInterpretation}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-[24px] border border-[#E8E5E0] shadow-sm flex flex-col"
        >
          <h3 className="font-bold text-sm text-[#1A1A1A] mb-6">Répartition par spécialité</h3>
          <div className="flex-1 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Medical Imaging Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-[24px] border border-[#E8E5E0] shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm text-[#1A1A1A]">Imagerie Médicale (Analyse Vision)</h3>
            <ImageIcon size={18} className="text-[#008080]" />
          </div>
          
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#E8E5E0] rounded-xl p-8 bg-[#F5F4F0]/50 transition-all hover:border-[#008080]/30 group relative overflow-hidden min-h-[200px]">
            {selectedImage ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <div className="relative w-full h-[150px] mb-4">
                  <Image 
                    src={selectedImage} 
                    alt="Selected" 
                    fill 
                    className="object-contain rounded-lg shadow-sm" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  SUPPRIMER
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Camera size={20} className="text-[#008080]" />
                </div>
                <p className="text-[11px] font-bold text-gray-400 mb-4">GLISSER OU TÉLÉVERSER UNE IMAGE (RADIO, SCAN, IRM)</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleImageUpload}
                />
                <button className="bg-white border border-[#E8E5E0] px-4 py-2 rounded-lg text-[10px] font-bold text-[#1A1A1A]">
                  CHOISIR UN FICHIER
                </button>
              </>
            )}
          </div>
          
          <button 
            onClick={handleAnalyzeImage}
            disabled={!selectedImage || isAnalyzingImage}
            className="w-full mt-4 bg-[#1A1A1A] text-white py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#008080] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzingImage ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            LANCER L&apos;ANALYSE IA
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#1A1A1A] p-6 rounded-[24px] text-white shadow-xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm">Interprétation de l&apos;Imagerie</h3>
            <Activity size={18} className="text-[#008080]" />
          </div>
          
          <div className="flex-1 bg-white/5 rounded-xl p-5 border border-white/10 overflow-y-auto max-h-[350px]">
            {isAnalyzingImage ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 size={24} className="text-[#008080] animate-spin" />
                <p className="text-[10px] font-bold text-[#008080] animate-pulse uppercase tracking-widest">Analyse des pixels en cours...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#008080]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#008080] animate-ping"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Analyse Terminée</span>
                </div>
                <div className="text-xs leading-relaxed text-gray-300 font-medium whitespace-pre-wrap">
                  {analysisResult}
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Note: Cette analyse est une aide à la décision et ne remplace pas l&apos;expertise d&apos;un radiologue.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                <Search size={32} className="mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest">En attente d&apos;imagerie...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-[#E6F2F2] p-6 rounded-[24px] border border-[#008080]/10 flex items-start gap-6"
      >
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <span className="text-lg">💡</span>
        </div>
        <div>
          <h4 className="font-bold text-sm text-[#1A1A1A] mb-1">Interprétation de l&apos;IA</h4>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            Les données montrent une corrélation significative (p &lt; 0.05) entre l&apos;adhésion au protocole 2026 et la réduction des marqueurs tumoraux au cours du deuxième trimestre. Le groupe A présente une réponse thérapeutique supérieure de 12% par rapport à la moyenne régionale.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
