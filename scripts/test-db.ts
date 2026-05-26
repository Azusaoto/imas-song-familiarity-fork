import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const songs = await prisma.song.findMany({
    where: {
      youtubeIds: { not: null, notIn: [''] }
    },
    select: { title: true, youtubeIds: true, slug: true },
    take: 10
  });
  console.log(songs);
}

main().finally(() => prisma.$disconnect());
