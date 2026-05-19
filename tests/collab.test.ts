import { expect, test } from 'vitest';

interface Selection {
  userId: string;
  username: string;
  songId: string;
  familiarity: number;
}

function calculateIntersection(users: string[], selections: Selection[]) {
  const songSelectionMap: Record<string, Record<string, number>> = {};

  selections.forEach((sel) => {
    if (!songSelectionMap[sel.songId]) {
      songSelectionMap[sel.songId] = {};
    }
    songSelectionMap[sel.songId][sel.username] = sel.familiarity;
  });

  const result: Array<{ songId: string; ratings: Record<string, number> }> = [];
  Object.keys(songSelectionMap).forEach((songId) => {
    const ratings = songSelectionMap[songId];
    if (Object.keys(ratings).length === users.length) {
      result.push({ songId, ratings });
    }
  });

  return result;
}

test('Collaborative intersection logic correctly calculates shared familiarity lists', () => {
  const users = ['userA', 'userB'];
  const mockSelections: Selection[] = [
    // Song 1: Both users have it
    { userId: '1', username: 'userA', songId: 'song1', familiarity: 1 },
    { userId: '2', username: 'userB', songId: 'song1', familiarity: 2 },
    // Song 2: Only userA has it
    { userId: '1', username: 'userA', songId: 'song2', familiarity: 3 },
    // Song 3: Only userB has it
    { userId: '2', username: 'userB', songId: 'song3', familiarity: 4 },
  ];

  const result = calculateIntersection(users, mockSelections);

  expect(result.length).toBe(1);
  expect(result[0].songId).toBe('song1');
  expect(result[0].ratings['userA']).toBe(1);
  expect(result[0].ratings['userB']).toBe(2);
});
