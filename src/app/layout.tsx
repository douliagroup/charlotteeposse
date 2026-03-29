import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'DouliaMed | Assistant Médical IA',
  description: 'Espace de travail académique et assistant IA pour le Dr. Charlotte Eposse.',
  metadataBase: new URL('https://charlotteeposse.vercel.app/'),
  openGraph: {
    title: 'DouliaMed | Assistant Médical IA',
    description: 'Espace de travail académique et assistant IA pour le Dr. Charlotte Eposse.',
    url: 'https://charlotteeposse.vercel.app/',
    siteName: 'DouliaMed',
    images: [
      {
        url: 'https://i.postimg.cc/v8hD1LQP/Whats_App_Image_2026_03_24_at_06_04_08.jpg',
        width: 800,
        height: 800,
        alt: 'DouliaMed Logo',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DouliaMed | Assistant Médical IA',
    description: 'Espace de travail académique et assistant IA pour le Dr. Charlotte Eposse.',
    images: ['https://i.postimg.cc/v8hD1LQP/Whats_App_Image_2026_03_24_at_06_04_08.jpg'],
  },
  icons: {
    icon: 'https://i.postimg.cc/v8hD1LQP/Whats_App_Image_2026_03_24_at_06_04_08.jpg',
    apple: 'https://i.postimg.cc/v8hD1LQP/Whats_App_Image_2026_03_24_at_06_04_08.jpg',
  },
  manifest: '/manifest.json',
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
