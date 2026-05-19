import { expect, test } from 'vitest';
import * as cheerio from 'cheerio';

function parseDetailHtml(html: string) {
  const $ = cheerio.load(html);
  let lyrics = '';
  let composer = '';
  $('table tr').each((_, tr) => {
    const label = $(tr).find('td').first().text().trim();
    const val = $(tr).find('td').last().text().trim();
    if (label.includes('作詞')) lyrics = val;
    if (label.includes('作曲')) composer = val;
  });

  const members: string[] = [];
  $('.card h5').each((_, el) => {
    members.push($(el).text().trim());
  });
  return { lyrics, composer, members };
}

test('Parse song detail HTML successfully', () => {
  const mockHtml = `
    <table>
      <tr><td>作詞</td><td>Lyricist Name</td></tr>
      <tr><td>作曲</td><td>Composer Name</td></tr>
    </table>
    <div class="card"><h5>Amami Haruka</h5></div>
    <div class="card"><h5>Kisaragi Chihaya</h5></div>
  `;
  const result = parseDetailHtml(mockHtml);
  expect(result.lyrics).toBe('Lyricist Name');
  expect(result.composer).toBe('Composer Name');
  expect(result.members).toContain('Amami Haruka');
});
