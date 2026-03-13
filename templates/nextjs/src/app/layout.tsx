import { ThemeProvider } from '@/components/layout/theme-provider';
import type { Metadata } from 'next';
import { Geist_Mono, Lato } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Template Central',
  description: 'A Next.js template from templateCentral',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="no-scrollbar">
      <body
        className={`${lato.variable} ${geistMono.variable} relative antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
