'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { cn } from '@/lib/utils';

export const LoginPortal = () => {
  const { login } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Small delay to simulate professional check
    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError('Identifiants invalides. Accès refusé.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center relative overflow-hidden p-4">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#008080]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#008080]/10 rounded-full blur-[140px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[400px] z-10"
      >
        <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-[#E8E5E0] relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#008080] to-[#00A3A3]" />
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[#008080]/10 overflow-hidden relative">
              <Image 
                src="https://i.postimg.cc/KYPJ7KtG/Doulia_Med.png" 
                alt="DouliaMed Logo" 
                fill
                className="object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">DouliaMed</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Portail Sécurisé</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">ADRESSE EMAIL</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">MOT DE PASSE</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#008080] transition-colors" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#F5F4F0] border-none rounded-2xl py-3.5 pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-500 text-[11px] font-bold bg-red-50 p-3 rounded-xl border border-red-100"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 group",
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#1A1A1A] hover:bg-black shadow-lg hover:shadow-xl active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  ACCÉDER AU PORTAIL
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#F5F4F0] text-center">
            <p className="text-[10px] text-gray-400 font-medium">
              Intelligence Médicale Exclusive &copy; 2026<br/>
              <span className="text-[#008080] font-bold uppercase tracking-widest">Propulsé par DOULIA</span>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] text-gray-400 font-medium">
          Accès réservé au Docteur Charlotte Eposse et ses partenaires autorisés.
        </p>
      </motion.div>
    </div>
  );
};
