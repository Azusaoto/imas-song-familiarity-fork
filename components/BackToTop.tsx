'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="返回最上層"
      data-testid="back-to-top"
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  );
}
