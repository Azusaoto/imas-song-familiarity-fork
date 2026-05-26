'use client';

import React, { useState } from 'react';
import YoutubePlayer from './YoutubePlayer';
import GameOverModal from './GameOverModal';
import GameStatusHeader from './GameStatusHeader';
import SongOptionCard from './SongOptionCard';
import { useGameLogic } from './useGameLogic';
import { buildThemeVars } from '@/lib/themeUtils';

export default function GameClient() {
  const {
    gameState,
    score,
    error,
    currentQuestion,
    selectedOptionId,
    eliminationCount,
    sameBrandCount,
    eliminatedOptions,
    sameBrandUsedOnCurrent,
    startGame,
    handleOptionClick,
    handleNext,
    useElimination,
    useSameBrand,
  } = useGameLogic();

  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayerReady = (event: { target: { playVideo: () => void } }) => {
    event.target.playVideo();
    setIsPlaying(true);
  };

  if (gameState === 'loading') {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-xl shadow-lg border border-red-200">
          <p className="font-bold text-lg">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (gameState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-gray-700/50 max-w-lg w-full transform transition-all hover:scale-[1.02]">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-4xl">🎵</span>
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 mb-4">
            超級猜歌挑戰
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
            官方試聽 MV 大挑戰！仔細聆聽歌曲片段，從四個選項中找出正確的歌名與演唱者。
          </p>
          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xl shadow-xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-1"
          >
            立即開始遊戲
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const videoId = currentQuestion.answer.youtubeIds?.split(',')[0].trim() || '';
  const isAnswered = gameState === 'answered';

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col space-y-6" style={buildThemeVars('#92cfbb')}>
      <GameStatusHeader
        score={score}
        eliminationCount={eliminationCount}
        sameBrandCount={sameBrandCount}
        gameState={gameState}
        eliminatedOptionsLength={eliminatedOptions.length}
        sameBrandUsedOnCurrent={sameBrandUsedOnCurrent}
        onUseElimination={useElimination}
        onUseSameBrand={useSameBrand}
      />

      {/* 影片播放區塊 */}
      <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-full bg-black/5 dark:bg-black/20 p-2 rounded-[2rem] shadow-inner backdrop-blur-sm border border-gray-100 dark:border-gray-800">
          <YoutubePlayer 
            videoId={videoId} 
            showVideo={isAnswered} 
            onReady={handlePlayerReady}
            onError={() => {
              console.error('Video failed to load, automatically skipping...');
              handleNext();
            }}
          />
        </div>
      </div>

      {/* 選項區塊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {currentQuestion.options.map((option) => (
          <SongOptionCard
            key={option.id}
            option={option}
            isEliminated={eliminatedOptions.includes(option.id)}
            isAnswered={isAnswered}
            isSelected={option.id === selectedOptionId}
            isCorrectAnswer={option.id === currentQuestion.answer.id}
            onClick={handleOptionClick}
          />
        ))}
      </div>

      {isAnswered && (
        <div className="flex justify-center pt-8 pb-12 animate-fade-in-up">
          <button
            onClick={handleNext}
            className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xl shadow-[0_8px_30px_rgba(79,70,229,0.3)] transition-all transform hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center">
              繼續下一題
              <svg className="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <GameOverModal score={score} onRestart={startGame} />
      )}
    </div>
  );
}
