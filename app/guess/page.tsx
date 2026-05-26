import React from 'react';
import GameClient from '@/components/guess/GameClient';
import GuessWrapper from './GuessWrapper';

export const metadata = {
  title: '猜歌遊戲 | imas song familiarity',
  description: '聽偶像大師官方試聽/MV的聲音，猜出正確的歌名',
};

export default function GuessPage() {
  return (
    <GuessWrapper>
      <GameClient />
    </GuessWrapper>
  );
}
