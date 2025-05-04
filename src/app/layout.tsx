import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter as a modern sans-serif font
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'FileFlow', // Updated title
  description: 'Gerenciador de arquivos simples e moderno', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Set language to Portuguese
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use Inter font */}
        {children}
        <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
