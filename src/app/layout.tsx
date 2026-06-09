import type { Metadata, Viewport } from 'next';
import { ThemeProvider, ThemeToggle } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Typing Pro - 打字练习',
  description: '一个简洁的在线打字练习工具',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
