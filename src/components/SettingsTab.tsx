'use client';

import React, { useState } from 'react';
import { Save, User, Stethoscope, Globe, Bell, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsTab = () => {
  const [profile, setProfile] = useState({
    name: "Dr. Charlotte Eposse",
    specialty: "Pédiatrie - Oncologie",
    language: "Français (France)",
    notifications: true,
    privacy: "Élevé"
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      console.log("Paramètres enregistrés avec succès !");
    }, 1500);
  };

  return (
    <div className="p-10 bg-[#F5F4F0] h-full overflow-y-auto">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Paramètres</h2>
        <p className="text-sm text-gray-400 font-medium">Gérez vos préférences et votre profil académique</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#E6F2F2] rounded-xl flex items-center justify-center text-[#008080]">
              <User size={20} />
            </div>
            <h3 className="font-bold text-[#1A1A1A]">Profil Académique</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Spécialité</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={profile.specialty} 
                  onChange={(e) => setProfile({...profile, specialty: e.target.value})}
                  className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all" 
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Langue de l&apos;IA</label>
              <select 
                value={profile.language}
                onChange={(e) => setProfile({...profile, language: e.target.value})}
                className="w-full bg-[#F5F4F0] border-none rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#008080] transition-all appearance-none"
              >
                <option>Français (France)</option>
                <option>English (US)</option>
                <option>Deutsch</option>
              </select>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#E6F2F2] rounded-xl flex items-center justify-center text-[#008080]">
                <Bell size={20} />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Préférences</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[#F5F4F0] rounded-2xl">
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">Notifications Coaching</p>
                <p className="text-[10px] text-gray-400 font-medium">Recevoir des conseils de DouliaMed</p>
              </div>
              <button 
                onClick={() => setProfile({...profile, notifications: !profile.notifications})}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  profile.notifications ? "bg-[#008080]" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  profile.notifications ? "left-7" : "left-1"
                )}></div>
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#E6F2F2] rounded-xl flex items-center justify-center text-[#008080]">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Sécurité</h3>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Niveau de confidentialité</p>
            <div className="flex gap-2">
              {['Standard', 'Élevé', 'Maximum'].map((level) => (
                <button 
                  key={level}
                  onClick={() => setProfile({...profile, privacy: level})}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold transition-all",
                    profile.privacy === level ? "bg-[#008080] text-white" : "bg-[#F5F4F0] text-gray-400 hover:bg-[#E8E5E0]"
                  )}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={18} />
                ENREGISTRER LES MODIFICATIONS
              </>
            )}
          </button>

          {/* User Guide Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[32px] border border-[#E8E5E0] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E6F2F2] rounded-xl flex items-center justify-center text-[#008080]">
                <Globe size={20} />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">Guide d&apos;utilisation DouliaMed</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F4F0] rounded-2xl">
                <p className="text-xs font-bold text-[#008080] mb-1">① Recherche Scientifique</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">Posez des questions précises sur des protocoles ou des pathologies. DouliaMed croise vos sources locales avec les données web les plus récentes.</p>
              </div>
              <div className="p-4 bg-[#F5F4F0] rounded-2xl">
                <p className="text-xs font-bold text-[#008080] mb-1">② Analyse de Documents</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">Utilisez le bouton &quot;Téléverser&quot; pour soumettre des PDF ou images. DouliaMed peut résumer, extraire des données ou critiquer un article.</p>
              </div>
              <div className="p-4 bg-[#F5F4F0] rounded-2xl">
                <p className="text-xs font-bold text-[#008080] mb-1">③ Dictée Vocale</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">Activez le micro pour dicter vos pensées. Le mode est continu : il ne s&apos;arrête que lorsque vous cliquez à nouveau sur l&apos;icône.</p>
              </div>
              <div className="p-4 bg-[#F5F4F0] rounded-2xl">
                <p className="text-xs font-bold text-[#008080] mb-1">④ Exportation PDF</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">Chaque réponse de l&apos;IA peut être exportée en PDF haute qualité pour vos archives ou vos publications.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
