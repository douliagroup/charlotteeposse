import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'DouliaMed | Assistant Médical IA',
  description: 'Espace de travail académique et assistant IA pour le Dr. Charlotte Eposse.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} font-sans`}>
      <body suppressHydrationWarning className="bg-[#F5F4F0] text-[#1A1A1A] antialiased">
        {children}
      </body>
    </html>
  );
}
