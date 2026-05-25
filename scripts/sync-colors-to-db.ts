import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncColors() {
  const dataPath = path.join(process.cwd(), 'data', 'idol-colors.json');
  if (!fs.existsSync(dataPath)) {
    console.error('No color data found.');
    return;
  }
  
  const colors: Array<{name: string, color: string}> = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const members = await prisma.member.findMany();
  const units = await prisma.unit.findMany();
  
  let memberUpdates = 0;
  let unitUpdates = 0;
  let newMembers = 0;
  
  for (const item of colors) {
    const rawName = item.name.replace(/\s+/g, '');
    
    // Check Member
    const m = members.find(x => x.name === item.name || x.name.replace(/\s+/g, '') === rawName);
    if (m) {
      await prisma.member.update({
        where: { id: m.id },
        data: { color: item.color }
      });
      memberUpdates++;
      continue;
    }
    
    // Check Unit
    const u = units.find(x => x.name === item.name || x.name.replace(/\s+/g, '') === rawName);
    if (u) {
      await prisma.unit.update({
        where: { id: u.id },
        data: { color: item.color }
      });
      unitUpdates++;
      continue;
    }
    
    // If not found in either, upsert into Member (with no production)
    // Upsert by name
    await prisma.member.upsert({
      where: { name: item.name },
      update: { color: item.color },
      create: {
        name: item.name,
        color: item.color
      }
    });
    newMembers++;
  }
  
  console.log(`Updated ${memberUpdates} existing members.`);
  console.log(`Updated ${unitUpdates} existing units.`);
  console.log(`Inserted/Updated ${newMembers} missing items as new members.`);
}

syncColors()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
