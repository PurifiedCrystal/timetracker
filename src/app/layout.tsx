import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TimeTracker - Simple, Elegant Time Tracking',
  description: 'Track your work hours with a clean, distraction-free interface. Built for freelancers, consultants, and small teams who value simplicity and reliability.',
  keywords: 'time tracking, work hours, freelancer, consultant, timesheet, productivity',
  authors: [{ name: 'TimeTracker Team' }],
  openGraph: {
    title: 'TimeTracker - Simple, Elegant Time Tracking',
    description: 'Track your work hours with a clean, distraction-free interface.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TimeTracker - Simple Time Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TimeTracker - Simple, Elegant Time Tracking',
    description: 'Track your work hours with a clean, distraction-free interface.',
    images: ['/og-image.png'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <div id="root" className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}