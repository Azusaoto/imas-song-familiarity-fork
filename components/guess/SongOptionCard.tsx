import React from 'react';
import { Song } from '@/types/game';
import { getBrandDisplayName, getBrandColor } from '@/lib/themeUtils';

interface SongOptionCardProps {
  option: Song;
  isEliminated: boolean;
  isAnswered: boolean;
  isSelected: boolean;
  isCorrectAnswer: boolean;
  onClick: (id: string) => void;
}

export default function SongOptionCard({
  option,
  isEliminated,
  isAnswered,
  isSelected,
  isCorrectAnswer,
  onClick,
}: SongOptionCardProps) {
  const getSingerText = (song: Song) => {
    if (song.units && song.units.length > 0) {
      return song.units.map((u) => u.name).join('、');
    }
    if (song.members && song.members.length > 0) {
      return song.members.map((m) => m.name).join('、');
    }
    return '群星 / 其他';
  };

  const brandColor = getBrandColor(option.brand);
  let cardClasses = 'card-el';
  let cardStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    textAlign: 'left',
    overflow: 'hidden',
    transition: 'all 0.3s ease-out'
  };

  if (isEliminated) {
    cardStyles = {
      ...cardStyles,
      opacity: 0.3,
      cursor: 'not-allowed',
      transform: 'scale(0.95)',
      backgroundColor: '#f3f4f6',
      borderColor: '#e5e7eb'
    };
  } else if (isAnswered) {
    if (isCorrectAnswer) {
      cardStyles = {
        ...cardStyles,
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
        boxShadow: '0 0 20px rgba(34,197,94,0.2)',
        zIndex: 10,
        transform: 'scale(1.02)'
      };
    } else if (isSelected) {
      cardStyles = {
        ...cardStyles,
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
        boxShadow: '0 0 20px rgba(239,68,68,0.2)',
        opacity: 0.8
      };
    } else {
      cardStyles = {
        ...cardStyles,
        opacity: 0.5,
        transform: 'scale(0.95)',
        borderColor: '#e5e7eb'
      };
    }
  } else {
    cardStyles = {
      ...cardStyles,
      cursor: 'pointer',
      '--border-color-hover': brandColor
    } as React.CSSProperties;
  }

  return (
    <button
      onClick={() => onClick(option.id)}
      disabled={isAnswered || isEliminated}
      className={cardClasses}
      style={cardStyles}
    >
      {!isEliminated && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            opacity: 0.7,
            backgroundColor: brandColor
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '12px', paddingLeft: '8px' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
          border: '1px solid #e5e7eb'
        }}>
          {isEliminated ? 'ELIMINATED' : getBrandDisplayName(option.brand)}
        </span>
        {isAnswered && isCorrectAnswer && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: 'bold' }}>
            <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            CORRECT
          </span>
        )}
        {isAnswered && isSelected && !isCorrectAnswer && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>
            <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            WRONG
          </span>
        )}
      </div>

      <div style={{ paddingLeft: '8px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '4px',
            lineHeight: 1.2,
            textDecoration: isEliminated ? 'line-through' : 'none',
            color: isEliminated ? '#9ca3af' : 'var(--text-primary)'
          }}
        >
          {isEliminated ? '---' : option.title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
          <span style={{ opacity: 0.6, marginRight: '6px' }}>BY</span>
          {isEliminated ? '---' : getSingerText(option)}
        </p>
      </div>
    </button>
  );
}
