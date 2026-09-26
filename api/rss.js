const { XMLParser } = require('fast-xml-parser');

function stripHtml(text = '') {
  return String(text)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pickImage(item = {}, channel = {}) {
  const fromItem =
    item['itunes:image']?.href ||
    item['media:thumbnail']?.url ||
    item['media:content']?.url ||
    item.enclosure?.image ||
    '';

  if (fromItem) return fromItem;

  const content = item['content:encoded'] || item.description || '';
  const match = String(content).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];

  return ''; // não usa a capa geral do podcast como arte de episódio
}

module.exports = async function handler(req, res) {
  const RSS_URL = 'https://anchor.fm/s/117a3989c/podcast/rss';
  try {
    const r = await fetch(RSS_URL, { headers: { 'User-Agent': 'Entre-Ruidos-Site/1.0' } });
    if (!r.ok) throw new Error(`RSS HTTP ${r.status}`);
    const xml = await r.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const data = parser.parse(xml);
    const channel = data?.rss?.channel || {};
    const items = ensureArray(channel.item);

    const episodes = items.slice(0, 12).map((item, index) => ({
      index: index + 1,
      title: item.title || `Episódio ${index + 1}`,
      description: stripHtml(item.description || item['itunes:summary'] || item['content:encoded'] || ''),
      date: item.pubDate || '',
      duration: item['itunes:duration'] || '',
      audio: item.enclosure?.url || '',
      link: item.link || '',
      image: pickImage(item, channel)
    }));

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
    res.status(200).json({
      title: channel.title || 'Entre Ruidos',
      description: stripHtml(channel.description || ''),
      episodes
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível carregar o RSS.', detail: String(error.message || error) });
  }
};
