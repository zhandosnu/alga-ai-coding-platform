import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alga — AI-Powered Competitive Programming Platform',
  description:
    'Master competitive programming with AI-powered hints, secure code execution, and adaptive problem recommendations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
