const RSS_URL = "https://anchor.fm/s/117a3989c/podcast/rss";

export default async function handler(req, res) {
  try {
    const response = await fetch(RSS_URL, {
      cache: "no-store",
      headers: {
        "User-Agent": "EntreRuidos/1.0 (+https://entreruidos.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Não foi possível carregar o RSS." });
      return;
    }

    const xml = await response.text();

    // O navegador sempre consulta a Vercel, e a Vercel sempre consulta o feed atual.
    // Isso evita ficar preso ao cache de serviços intermediários como rss2json.
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Erro ao buscar RSS:", error);
    res.status(500).json({ error: "Erro interno ao carregar o RSS." });
  }
}
