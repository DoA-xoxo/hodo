import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noël — Nutcracker Ticket Studio',
  description: '호두까기 인형 발레 무드의 앤티크 티켓을 직접 디자인하고 PNG로 저장하세요.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
