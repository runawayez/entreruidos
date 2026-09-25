const { XMLParser } = require('fast-xml-parser');

module.exports = async function handler(req, res) {
  const RSS_URL = 'https://anchor.fm/s/117a3989c/podcast/rss';
  try {
    const r = await fetch(RSS_URL, { headers: { 'User-Agent': 'Entre-Ruidos-Site/1.0' } });
    if (!r.ok) throw new Error(`RSS HTTP ${r.status}`);
    const xml = await r.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const data = parser.parse(xml);
    const channel = data?.rss?.channel || {};
    let items = channel.item || [];
    if (!Array.isArray(items)) items = [items];

    const episodes = items.slice(0, 12).map((item, index) => ({
      index: index + 1,
      title: item.title || `Episódio ${index + 1}`,
      description: String(item.description || item['itunes:summary'] || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      date: item.pubDate || '',
      duration: item['itunes:duration'] || '',
      audio: item.enclosure?.url || '',
      link: item.link || '',
      image: item['itunes:image']?.href || channel['itunes:image']?.href || ''
    }));

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400');
    res.status(200).json({
      title: channel.title || 'Entre Ruidos',
      description: channel.description || '',
      episodes
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível carregar o RSS.', detail: String(error.message || error) });
  }
};
