import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
  console.log('Fetching sitemap...');
  const res = await axios.get('https://fujiwarahaji.me/sitemap/musiclist', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const $ = cheerio.load(res.data);
  const links = $('.musiclist .listwrap .list-group-item a').map((i, el) => $(el).attr('href')).get();
  
  if (links.length === 0) {
    console.log('No links found');
    return;
  }
  
  const target = links.find(l => l.includes('13824')); // Let's try to find Radio Happy or just take the first
  const firstLink = target || links[0];
  const url = firstLink.startsWith('http') ? firstLink : `https://fujiwarahaji.me${firstLink}`;
  console.log('Fetching detail:', url);
  
  const detailRes = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const d$ = cheerio.load(detailRes.data);
  
  console.log('--- arve elements ---');
  d$('#movie [data-provider="youtube"]').each((_, el) => {
    console.log('id:', d$(el).attr('id'));
  });

  console.log('--- iframes ---');
  d$('#movie iframe').each((_, el) => {
    console.log('src:', d$(el).attr('src'));
    console.log('data-src-no-ap:', d$(el).attr('data-src-no-ap'));
  });
}
main();
