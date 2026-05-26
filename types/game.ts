export type Song = {
  id: string;
  title: string;
  brand: string;
  youtubeIds: string | null;
  members: { name: string }[];
  units: { name: string }[];
};

export type Question = {
  answer: Song;
  options: Song[];
};

export type GameState = 'loading' | 'idle' | 'playing' | 'answered' | 'gameover';
