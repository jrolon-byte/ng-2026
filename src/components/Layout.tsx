import type { ReactNode } from 'react';
import Shell from './Shell';

interface LayoutProps {
  children: ReactNode;
}

/** Kept as the name the pages import; the frame itself lives in Shell. */
export default function Layout({ children }: LayoutProps) {
  return <Shell>{children}</Shell>;
}
