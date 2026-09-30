import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sensler Cup - Arbitres',
  description:
    'Plateforme d\'inscription des arbitres pour la Sensler Cup - Planifiez vos matchs facilement',
  keywords: 'arbitres, unihockey, Sensler Cup, inscription, planning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
