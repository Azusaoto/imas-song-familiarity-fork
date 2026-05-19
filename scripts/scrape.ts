import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'https://fujiwarahaji.me';
const MUSIC_LIST_URL = `${BASE_URL}/sitemap/musiclist`;

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeAll() {
  console.log('正在獲取歌曲列表頁面...');
  try {
    const response = await axios.get(MUSIC_LIST_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      }
    });
    
    const $ = cheerio.load(response.data);
    const songElements = $('.musiclist .listwrap .list-group-item');
    console.log(`總共找到 ${songElements.length} 首歌曲。`);
    
    const limit = pLimit(3);

    for (let i = 0; i < songElements.length; i++) {
      const el = songElements[i];
      const href = $(el).find('a').attr('href') || '';
      if (!href) continue;

      // slug: brand/id, 如 /music/ml/12087 -> ml/12087
      let path = href;
      if (href.startsWith('http')) {
        try {
          const urlObj = new URL(href);
          path = urlObj.pathname;
        } catch (e) {
          path = href.replace(/https?:\/\/[^\/]+/, '');
        }
      }
      const slug = path.replace(/^\/music\//, '').replace(/^music\//, '');
      const title = $(el).find('a').text().trim();
      const brand = $(el).attr('data-brand') || '';
      const musicType = $(el).attr('data-musictype') || '';

      // 增量停止機制：若資料庫已有該 slug，終止爬蟲
      const existing = await prisma.song.findUnique({
        where: { slug }
      });

      if (existing) {
        console.log(`偵測到重複歌曲 [${title}] (slug: ${slug}) 已存在於資料庫中。`);
        console.log('增量同步完成，中斷爬蟲腳本。');
        break;
      }

      const detailUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

      await limit(async () => {
        try {
          console.log(`正在爬取歌曲詳情: ${title} (${slug})...`);
          await delay(200 + Math.random() * 200);

          const detailRes = await axios.get(detailUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const d$ = cheerio.load(detailRes.data);

          let lyrics = '';
          let composer = '';
          let arranger = '';

          d$('table tr').each((_, tr) => {
            const label = d$(tr).find('td').first().text().trim();
            const val = d$(tr).find('td').last().text().trim();
            if (label.includes('作詞')) lyrics = val;
            if (label.includes('作曲')) composer = val;
            if (label.includes('編曲')) arranger = val;
          });

          // 寫入 Song 表
          const song = await prisma.song.create({
            data: {
              slug,
              title,
              brand,
              musicType,
              lyrics: lyrics || null,
              composer: composer || null,
              arranger: arranger || null,
            }
          });

          // 演唱成員解析: 尋找 idol_card 內部的 card 清單
          const memberCards = d$('.idol_card .card');
          for (let m = 0; m < memberCards.length; m++) {
            const card = memberCards[m];
            const name = d$(card).find('h5').text().trim();
            const cvText = d$(card).find('p').text().trim(); // 例如 "CV: 中村繪里子"
            const cvName = cvText.replace('CV:', '').replace('CV', '').trim();

            if (!name) continue;

            // 寫入/更新 Member
            const dbMember = await prisma.member.upsert({
              where: { name },
              update: { cvName: cvName || null },
              create: { name, cvName: cvName || null }
            });

            // 建立多對多關聯
            await prisma.songMember.upsert({
              where: {
                songId_memberId: {
                  songId: song.id,
                  memberId: dbMember.id
                }
              },
              update: {},
              create: {
                songId: song.id,
                memberId: dbMember.id
              }
            });
          }

        } catch (err: any) {
          console.error(`爬取歌曲詳情失敗: ${title} (${slug}), 原因: ${err.message}`);
        }
      });
    }

    console.log('增量同步結束。');
  } catch (err: any) {
    console.error('爬蟲主流程異常:', err.message);
  }
}

scrapeAll()
  .catch((err) => console.error('腳本異常中斷:', err))
  .finally(() => prisma.$disconnect());
