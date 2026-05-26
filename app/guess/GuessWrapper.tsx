'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import { buildThemeVars } from '@/lib/themeUtils';

/**
 * 猜歌頁面的包裝元件，負責處理主題色與共用 Header。
 */
export default function GuessWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const currentThemeColor = session?.user?.themeColor || '#92cfbb';

  return (
    <div style={{
      ...(buildThemeVars(currentThemeColor) as any),
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      <Header />
      <main className="container" style={{ flex: 1, paddingTop: '20px', paddingBottom: '80px', maxWidth: '896px' }}>
        {children}
      </main>
    </div>
  );
}
