/* eslint-disable @typescript-eslint/no-explicit-any */
let cachedSongs: any[] | null = null;
let promise: Promise<any[]> | null = null;

const SESSION_CACHE_KEY = 'imas_songs_v2_cache';

export async function fetchSongsClient(options?: { bypassCache?: boolean }): Promise<any[]> {
  // 1. Check in-memory cache
  if (cachedSongs && !options?.bypassCache) {
    return cachedSongs;
  }

  // 2. Check sessionStorage cache
  if (typeof window !== 'undefined' && !options?.bypassCache) {
    try {
      const stored = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (stored) {
        cachedSongs = JSON.parse(stored);
        return cachedSongs!;
      }
    } catch (e) {
      console.warn('Failed to read songs from sessionStorage:', e);
    }
  }

  // 3. Shared fetch promise for concurrent requests
  if (promise && !options?.bypassCache) {
    return promise;
  }

  promise = fetch('/api/songs?schema=v2', { cache: 'no-cache' })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('回應格式錯誤');
      cachedSongs = data;
      
      // Store in sessionStorage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to save songs to sessionStorage:', e);
        }
      }
      return data;
    })
    .catch((err) => {
      promise = null; // Clear promise on error so subsequent attempts can retry
      throw err;
    });

  return promise;
}

export function getCachedSongsSync(): any[] | null {
  return cachedSongs;
}
