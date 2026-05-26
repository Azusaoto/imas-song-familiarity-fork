import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching songs from DB...');
  const songs = await prisma.song.findMany({
    where: {
      youtubeIds: { not: null, notIn: [''] }
    },
    select: { id: true, youtubeIds: true, slug: true }
  });

  console.log(`Found ${songs.length} songs with YouTube IDs. Starting fix...`);

  let updateCount = 0;
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    if (!song.youtubeIds) continue;
    
    const ids = song.youtubeIds.split(',').filter(Boolean);
    const validIds = new Map<string, string>(); 

    for (const id of ids) {
      const lower = id.toLowerCase();
      // 如果還沒存，或是目前拿到的 (id) 比存的還「好」（有大寫），就覆蓋
      if (!validIds.has(lower) || id !== lower) {
        validIds.set(lower, id);
      }
    }

    const newYoutubeIds = Array.from(validIds.values()).join(',');
    
    if (newYoutubeIds !== song.youtubeIds) {
      await prisma.song.update({
        where: { id: song.id },
        data: { youtubeIds: newYoutubeIds }
      });
      updateCount++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Processed ${i + 1} / ${songs.length}... Updates so far: ${updateCount}`);
    }
  }

  console.log(`Finished processing ${songs.length} songs. 成功修復 ${updateCount} 首歌曲的 YouTube IDs 大小寫問題。`);
}

main().finally(() => prisma.$disconnect());
