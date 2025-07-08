export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") return new Response("OK")
    else if (!url.pathname.startsWith("/feeds")) return new Response("The path doesn't exist");

    if (url.pathname === "/feeds") {
      const allFeedsUrl = `https://raw.githubusercontent.com/iMahir/newrss/refs/heads/main/src/feeds.json`;
      const res = await fetch(allFeedsUrl);
      return new Response(res.body);
    }

    const sourceUrl = `https://raw.githubusercontent.com/iMahir/newrss/main/data${url.pathname}.json`;
    let jsonData;
    try {
      const res = await fetch(sourceUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      jsonData = await res.json();
    } catch (e) {
      return new Response(`Failed to fetch/parse JSON: ${e.message}`, { status: 500 });
    }

    const mdToHtml = md => md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n$/gim, '<br />')
      .trim();

    const items = Array.isArray(jsonData.items) ? jsonData.items : [];

    items.forEach(it => {
      if (typeof it.summary === 'string') {
        it.summary = mdToHtml(it.summary);
      }
    });

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
    xml += `<rss version="2.0">\n`;
    xml += `<channel>\n`;
    xml += `<title>${jsonData.title || 'Newrss Feed'}</title>\n`;
    xml += `<link>${jsonData.link || 'https://newrss.mahirjpatel.workers.dev'}</link>\n`;
    xml += `<description>Latest newrss articles</description>\n`;
    xml += `<language>en</language>\n`;
    xml += `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    xml += `<ttl>600</ttl>\n`;

    items.forEach((item) => {
      const title = item.title || 'Untitled';
      const link = item.link || '#';
      const desc = item.summary || '';
      const pubDate = item.pubDate
        ? new Date(item.pubDate).toUTCString()
        : new Date().toUTCString();
      const guid = item.id || link;
      const author = item.author || '';
      const thumb = item.thumbnail;

      xml += `<item>\n`;
      xml += `<title>${title}</title>\n`;
      xml += `<link>${link}</link>\n`;
      xml += `<description><![CDATA[${desc}]]></description>\n`;
      xml += `<pubDate>${pubDate}</pubDate>\n`;
      xml += `<guid isPermaLink="true">${guid}</guid>\n`;
      if (author) {
        xml += `<author>${author}</author>\n`;
      }
      if (thumb) {
        xml += `<enclosure url="${thumb}" type="image/jpeg" />\n`;
      }
      xml += `</item>\n`;
    });

    xml += `</channel>\n`;
    xml += `</rss>\n`;

    return new Response(xml, {
      headers: { "Content-Type": "application/rss+xml; charset=UTF-8" },
    });
  },
};
