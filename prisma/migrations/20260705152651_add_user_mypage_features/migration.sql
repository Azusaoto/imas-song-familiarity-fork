-- CreateTable
CREATE TABLE "UserProducerIdol" (
    "userId" UUID NOT NULL,
    "memberId" UUID NOT NULL,

    CONSTRAINT "UserProducerIdol_pkey" PRIMARY KEY ("userId","memberId")
);

-- CreateTable
CREATE TABLE "UserRepresentativeSong" (
    "userId" UUID NOT NULL,
    "songId" UUID NOT NULL,

    CONSTRAINT "UserRepresentativeSong_pkey" PRIMARY KEY ("userId","songId")
);

-- CreateTable
CREATE TABLE "UserCollabSong" (
    "userId" UUID NOT NULL,
    "songId" UUID NOT NULL,

    CONSTRAINT "UserCollabSong_pkey" PRIMARY KEY ("userId","songId")
);

-- CreateTable
CREATE TABLE "SongWish" (
    "id" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "songId" UUID NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongWish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SongWish_senderUserId_targetUserId_songId_key" ON "SongWish"("senderUserId", "targetUserId", "songId");

-- AddForeignKey
ALTER TABLE "UserProducerIdol" ADD CONSTRAINT "UserProducerIdol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProducerIdol" ADD CONSTRAINT "UserProducerIdol_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepresentativeSong" ADD CONSTRAINT "UserRepresentativeSong_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepresentativeSong" ADD CONSTRAINT "UserRepresentativeSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollabSong" ADD CONSTRAINT "UserCollabSong_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollabSong" ADD CONSTRAINT "UserCollabSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongWish" ADD CONSTRAINT "SongWish_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongWish" ADD CONSTRAINT "SongWish_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongWish" ADD CONSTRAINT "SongWish_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
