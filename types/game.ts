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
  videoId: string;
};

export type GameState = 'loading' | 'idle' | 'playing' | 'answered' | 'gameover';
