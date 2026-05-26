import React from 'react';
import { GameState } from '@/types/game';

interface GameStatusHeaderProps {
  score: number;
  eliminationCount: number;
  sameBrandCount: number;
  gameState: GameState;
  eliminatedOptionsLength: number;
  sameBrandUsedOnCurrent: boolean;
  onUseElimination: () => void;
  onUseSameBrand: () => void;
}

export default function GameStatusHeader({
  score,
  eliminationCount,
  sameBrandCount,
  gameState,
  eliminatedOptionsLength,
  sameBrandUsedOnCurrent,
  onUseElimination,
  onUseSameBrand,
}: GameStatusHeaderProps) {
  return (
    <div className="flex justify-between items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-6">
        <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
          SCORE: <span className="text-3xl font-black text-purple-600 dark:text-purple-400 ml-1">{score}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onUseElimination}
          disabled={gameState !== 'playing' || eliminationCount <= 0 || eliminatedOptionsLength >= 2}
          className="btn btn-secondary relative"
        >
          <span className="relative z-10">50/50 刪去法</span>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full z-20 shadow-sm border-2 border-orange-500">
            {eliminationCount}
          </span>
        </button>
        
        <button
          onClick={onUseSameBrand}
          disabled={gameState !== 'playing' || sameBrandCount <= 0 || sameBrandUsedOnCurrent}
          className="btn btn-secondary relative"
        >
          <span className="relative z-10">同品牌提示</span>
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full z-20 shadow-sm border-2 border-pink-500">
            {sameBrandCount}
          </span>
        </button>
      </div>
    </div>
  );
}
