import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/shell/Header';
import { Footer } from '@/components/shell/Footer';

export const metadata: Metadata = {
  title: 'FocusFirewall — The System-1 Attention Router',
  description:
    'A real-time attention router that uses Jev to decide whether digital events should interrupt, wait, batch, or disappear — with context-aware decisions and a replayable benchmark.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
