import type { ReactNode } from 'react';
import TopNav from './TopNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <TopNav />
      <main className="contain">
        {children}
      </main>
    </>
  );
}
