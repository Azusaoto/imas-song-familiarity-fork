-- DropForeignKey
ALTER TABLE "SongMember" DROP CONSTRAINT "SongMember_memberId_fkey";

-- DropForeignKey
ALTER TABLE "SongMember" DROP CONSTRAINT "SongMember_songId_fkey";

-- DropForeignKey
ALTER TABLE "SongUnit" DROP CONSTRAINT "SongUnit_songId_fkey";

-- DropForeignKey
ALTER TABLE "SongUnit" DROP CONSTRAINT "SongUnit_unitId_fkey";

-- DropForeignKey
ALTER TABLE "UnitMember" DROP CONSTRAINT "UnitMember_memberId_fkey";

-- DropForeignKey
ALTER TABLE "UnitMember" DROP CONSTRAINT "UnitMember_unitId_fkey";

-- DropForeignKey
ALTER TABLE "UserSelection" DROP CONSTRAINT "UserSelection_songId_fkey";

-- DropForeignKey
ALTER TABLE "UserSelection" DROP CONSTRAINT "UserSelection_userId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP CONSTRAINT "Member_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ADD CONSTRAINT "Member_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Song" DROP CONSTRAINT "Song_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ADD CONSTRAINT "Song_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SongMember" DROP CONSTRAINT "SongMember_pkey",
ALTER COLUMN "songId" TYPE UUID USING "songId"::uuid,
ALTER COLUMN "memberId" TYPE UUID USING "memberId"::uuid,
ADD CONSTRAINT "SongMember_pkey" PRIMARY KEY ("songId", "memberId");

-- AlterTable
ALTER TABLE "SongUnit" DROP CONSTRAINT "SongUnit_pkey",
ALTER COLUMN "songId" TYPE UUID USING "songId"::uuid,
ALTER COLUMN "unitId" TYPE UUID USING "unitId"::uuid,
ADD CONSTRAINT "SongUnit_pkey" PRIMARY KEY ("songId", "unitId");

-- AlterTable
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ADD CONSTRAINT "Unit_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UnitMember" DROP CONSTRAINT "UnitMember_pkey",
ALTER COLUMN "unitId" TYPE UUID USING "unitId"::uuid,
ALTER COLUMN "memberId" TYPE UUID USING "memberId"::uuid,
ADD CONSTRAINT "UnitMember_pkey" PRIMARY KEY ("unitId", "memberId");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserSelection" DROP CONSTRAINT "UserSelection_pkey",
ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid,
ALTER COLUMN "songId" TYPE UUID USING "songId"::uuid,
ADD CONSTRAINT "UserSelection_pkey" PRIMARY KEY ("userId", "songId");

-- AddForeignKey
ALTER TABLE "UnitMember" ADD CONSTRAINT "UnitMember_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMember" ADD CONSTRAINT "UnitMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongUnit" ADD CONSTRAINT "SongUnit_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongUnit" ADD CONSTRAINT "SongUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongMember" ADD CONSTRAINT "SongMember_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongMember" ADD CONSTRAINT "SongMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelection" ADD CONSTRAINT "UserSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSelection" ADD CONSTRAINT "UserSelection_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

