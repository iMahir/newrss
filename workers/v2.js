const DASH_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NewRSS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f8f9fa;
            --fg: #212529;
            --accent: #007bff;
            --card-bg: #ffffff;
            --border: #dee2e6;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --success: #28a745;
            --error: #dc3545;
        }

        [data-theme="dark"] {
            --bg: #121212;
            --fg: #e9ecef;
            --accent: #0d6efd;
            --card-bg: #1e1e1e;
            --border: #343a40;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--bg);
            color: var(--fg);
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            transition: background-color 0.3s, color 0.3s;
        }

        header {
            position: sticky;
            top: 0;
            background-color: var(--card-bg);
            border-bottom: 1px solid var(--border);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: var(--shadow);
        }

        header h1 {
            font-size: 1.75rem;
            font-weight: 700;
        }

        .controls {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .controls input[type="search"],
        .controls input[type="url"] {
            padding: 0.75rem 1rem;
            border: 1px solid var(--border);
            border-radius: 8px;
            background-color: var(--bg);
            color: var(--fg);
            font-size: 1rem;
            width: 250px;
            transition: all 0.3s;
        }

        .controls input[type="search"]:focus,
        .controls input[type="url"]:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
        }

        .controls button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            background-color: var(--accent);
            color: #fff;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s;
        }

        .controls button:hover {
            opacity: 0.9;
            transform: translateY(-2px);
        }

        #themeToggle {
            background: none;
            border: 1px solid var(--border);
            color: var(--fg);
            font-size: 1.25rem;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        main {
            flex: 1;
            max-width: 1400px;
            width: 100%;
            margin: 2rem auto;
            padding: 0 2rem;
        }

        #addForm {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        #addForm input {
            flex-grow: 1;
        }

        #msg {
            margin-bottom: 1.5rem;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 500;
        }
        
        #msg.success {
            background-color: var(--success);
            color: #fff;
        }

        #msg.error {
            background-color: var(--error);
            color: #fff;
        }

        #feedGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }

        .feed-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s, box-shadow 0.3s;
            box-shadow: var(--shadow);
        }

        .feed-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .feed-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .feed-header img {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            border: 1px solid var(--border);
        }

        .feed-header h2 {
            font-size: 1.25rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .feed-meta {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 1.5rem;
        }

        .feed-actions {
            margin-top: auto;
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
        }

        .feed-actions button {
            background: none;
            border: 1px solid var(--border);
            color: var(--accent);
            cursor: pointer;
            font-size: 1.2rem;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s;
        }
        
        .feed-actions button:hover {
            background-color: var(--accent);
            color: #fff;
            border-color: var(--accent);
        }

        #loadMore {
            display: block;
            margin: 3rem auto;
            padding: 0.75rem 2rem;
            background-color: var(--bg);
            color: var(--fg);
            border: 1px solid var(--border);
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
        }
        
        #loadMore:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body data-theme="light">
    <header>
        <h1>NewRSS</h1>
        <div class="controls">
            <input type="search" id="filter" placeholder="Search feeds…">
            <button id="themeToggle">🌙</button>
        </div>
    </header>
    <main>
        <form id="addForm" class="controls">
            <input type="url" id="rssUrl" placeholder="Enter RSS feed URL…" required>
            <button type="submit">Add Feed</button>
        </form>
        <div id="msg" role="alert"></div>
        <div id="feedGrid"></div>
        <button id="loadMore">Load More</button>
    </main>
<script>
    const themeToggle = document.getElementById('themeToggle');
    const filterInput = document.getElementById('filter');
    const feedGrid    = document.getElementById('feedGrid');
    const loadMoreBtn = document.getElementById('loadMore');
    const msg         = document.getElementById('msg');
    const form        = document.getElementById('addForm');
    const urlIn       = document.getElementById('rssUrl');

    let feeds = [], offset = 0, limit = 20;

    themeToggle.onclick = () => {
        const body = document.body;
        const isDark = body.dataset.theme === 'dark';
        body.dataset.theme = isDark ? 'light' : 'dark';
        themeToggle.textContent = isDark ? '🌙' : '☀️';
    };

    function timeAgo(dateString) {
        if (!dateString) return '–';
        
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        
        if (seconds < 5) {
            return "just now";
        }

        const intervals = [
            { value: 31536000, unit: 'year' },
            { value: 2592000, unit: 'month' },
            { value: 86400, unit: 'day' },
            { value: 3600, unit: 'hour' },
            { value: 60, unit: 'minute' }
        ];

        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.value);
            if (count >= 1) {
                return \`\${count} \${interval.unit}\${count > 1 ? 's' : ''} ago\`;
            }
        }
        
        const secondCount = Math.floor(seconds);
        return \`\${secondCount} second\${secondCount > 1 ? 's' : ''} ago\`;
    }

    async function loadFeeds() {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
        try {
            if (offset === 0) {
                feeds = [];
            }

            const res = await fetch(\`/api/feeds?offset=\${offset}&limit=\${limit}\`);
            if (!res.ok) throw new Error(\`HTTP error! status: \${res.status}\`);
            const page = await res.json();
            
            feeds.push(...page);
            renderGrid();
            
            offset += page.length;

            if (page.length < limit) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        } catch (error) {
            console.error("Failed to load feeds:", error);
            msg.textContent = '✖ Failed to load feeds.';
            msg.className = 'error';
        } finally {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load More';
        }
    }

    function renderGrid() {
        feedGrid.innerHTML = ''; 
    
        const q = filterInput.value.toLowerCase();
        const filteredFeeds = feeds.filter(f => f.name.toLowerCase().includes(q) || f.rss.toLowerCase().includes(q));

        filteredFeeds.forEach(f => {
            const card = document.createElement('div');
            card.className = 'feed-card';
            card.innerHTML = \`
                <div class="feed-header">
                    <img src="https://www.google.com/s2/favicons?domain=\${new URL(f.website || f.rss).hostname}&sz=64" alt="Favicon">
                    <h2>\${f.name}</h2>
                </div>
                <div class="feed-meta">Last updated: \${timeAgo(f.lastUpdated)}</div>
                <div class="feed-actions">
                    <button title="Open Internal RSS" onclick="window.open('\${f.internalRss}','_blank')">🔗</button>
                    <button title="Original RSS" onclick="window.open('\${f.rss}','_blank');">📰</button>
                </div>\`;
            feedGrid.appendChild(card);
        });
    }

    filterInput.addEventListener('input', () => {
        offset = 0;
        loadFeeds();
    });
    
    loadMoreBtn.onclick = loadFeeds;

    form.onsubmit = async e => {
        e.preventDefault();
        msg.textContent = 'Adding…';
        msg.className = '';
        
        try {
            const res = await fetch('/api/feeds', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ url: urlIn.value.trim() })
            });
            const j = await res.json();

            if (res.ok) {
                msg.innerHTML = \`✔ <a href="\${j.internalRss}"><strong>\${j.name}</strong></a> processed successfully!\`;
                msg.className = 'success';
                urlIn.value = '';
                offset = 0;
                loadFeeds();
            } else {
                throw new Error(j.error || 'An unknown error occurred.');
            }
        } catch (error) {
            msg.textContent = \`✖ \${error.message}\`;
            msg.className = 'error';
        }
    };

    loadFeeds();
</script>
</body>
</html>
`;

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseRssTitle(xml) {
  let match = xml.match(/<channel>[\s\S]*?<title.*?>(.*?)<\/title>/i);
  if (match) return match[1].trim();

  match = xml.match(/<feed[^>]*>[\s\S]*?<title.*?>(.*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

function parseRssLink(xml) {
  // Match the first <channel>…<link>…</link>
  const m = xml.match(/<channel[^>]*>[\s\S]*?<link>([^<]+)<\/link>/i);
  return m ? m[1].trim() : null;
}

function toRss(js, overrideTitle, overrideDesc) {
  const md2html = md => md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n$/gim, '<br />')
    .trim();

  const title = overrideTitle || js.title || '';
  const desc = overrideDesc || js.description || '';
  const link = js.link || '';

  let xml = `<?xml version="1.0"?>\n<rss version="2.0">\n<channel>\n`;
  xml += `<title><![CDATA[${title}]]></title>\n`;
  xml += `<link>${link}</link>\n`;
  xml += `<description><![CDATA[${desc}]]></description>\n`;
  xml += `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;

  (js.items || []).forEach(it => {
    let summary = it.summary;
    if (typeof summary === 'string') summary = md2html(summary);

    xml += `<item>\n`;
    xml += `  <title><![CDATA[${it.title || ''}]]></title>\n`;
    xml += `  <link>${it.link || ''}</link>\n`;
    xml += `  <pubDate>${it.pubDate ? new Date(it.pubDate).toUTCString()
      : new Date().toUTCString()
      }</pubDate>\n`;
    xml += `  <guid>${it.id || it.link || ''}</guid>\n`;
    xml += `  <description><![CDATA[${summary || ''}]]></description>\n`;
    if (it.author) xml += `  <author>${it.author}</author>\n`;
    if (it.thumbnail) xml += `  <enclosure url="${it.thumbnail}" type="image/jpeg"/>\n`;
    xml += `</item>\n`;
  });

  xml += `</channel>\n</rss>`;
  return xml;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function safeJson(req) {
  try { return await req.json(); }
  catch { return {}; }
}

function jsonErr(msg, status = 400) {
  return json({ error: msg }, status);
}

async function validateRssFeed(feedUrl) {
  const validatorUrl = `https://validator.w3.org/feed/check.cgi?url=${encodeURIComponent(feedUrl)}`;

  try {
    const response = await fetch(validatorUrl);
    const responseHtml = await response.text();

    // Check for specific success messages in the validator's response
    if (responseHtml.includes('This is a valid RSS feed') || responseHtml.includes('This is a valid Atom feed')) {
      return { isValid: true, message: 'Feed is valid.' };
    } else {
      // You might need to parse the HTML more thoroughly to extract specific error messages
      return { isValid: false, message: 'Feed is invalid or contains warnings.' };
    }
  } catch (error) {
    console.error('Error validating RSS feed:', error);
    return { isValid: false, message: 'An error occurred during validation.' };
  }
}

async function generateHash(inputString, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString + key); // Concatenate input and key

  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Encode for URL and filename safety (e.g., replace non-alphanumeric characters)
  // For basic URL/filename safety, hexadecimal is usually sufficient.
  // Further encoding like encodeURIComponent might be needed for very specific characters.
  return hexHash;
}

function sanitizeFilename(filename) {
  // Remove or replace characters commonly considered unsafe or reserved in file systems.
  // This includes characters like /, \, :, *, ?, ", <, >, |, and control characters.
  let sanitized = filename.replace(/[\\/:*?"<>|\x00-\x1F]/g, '_');

  // Optionally, trim leading/trailing spaces or periods which can cause issues on some systems.
  sanitized = sanitized.trim();
  sanitized = sanitized.replace(/^\.+|\.+$/g, ''); // Remove leading/trailing periods

  // Limit filename length if necessary (e.g., for compatibility with older file systems)
  // Example: Truncate to 255 characters
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

// ─── Main Worker ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const urlObj = new URL(request.url);
    const p = urlObj.pathname;
    const m = request.method;
    const db = env.FEEDS_DB;

    // 1. Serve UI
    if ((p === '/' || p === '/dashboard') && m === 'GET') {
      return new Response(DASH_HTML, {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' }
      });
    }

    // 2. Paginated list
    if (p === '/api/feeds' && m === 'GET') {
      const offset = parseInt(urlObj.searchParams.get('offset') || '0', 10);
      const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);
      const { results } = await db.prepare(
        'SELECT ROWID AS id, name, rss, website, lastUpdated FROM feeds ORDER BY ROWID DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset).all();

      results.forEach(r => {
        r.internalRss = '/rss?url=' + encodeURIComponent(r.rss);
      });

      return json(results);
    }

    // 3. Add or update feed
    if (p === '/api/feeds' && m === 'POST') {
      const { url: rss } = await safeJson(request);
      if (!rss || !/^https?:\/\//i.test(rss)) return jsonErr('Invalid URL format.', 400);

      // Fetch & validate RSS
      let xml;
      try {
        const res = await fetch(rss);
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || !/(xml|rss|application\/rss\+xml)/i.test(ct)) throw '';
        xml = await res.text();
      } catch {
        return jsonErr('Unable to fetch or validate RSS feed.', 400);
      }

      // Parse title & link
      let title = parseRssTitle(xml) || rss;
      const website = parseRssLink(xml) || (new URL(rss)).origin;

      function parseCdata(escapedStr) {
        // Decode Unicode escapes like \u003C to <
        const decoded = JSON.parse(`"${escapedStr}"`);

        // Extract CDATA content using regex
        const match = decoded.match(/<!\[CDATA\[(.*?)\]\]>/);
        return match ? match[1] : escapedStr;
      }

      title = parseCdata(title)

      try {
        // Insert
        const ins = await db.prepare(
          'INSERT INTO feeds (name, rss, website) VALUES (?, ?, ?)'
        ).bind(title, rss, website).run();

        const id = ins.meta.last_row_id;
        return json({
          id, name: title, rss, website,
          internalRss: `/rss?url=${encodeURIComponent(rss)}`
        }, 201);

      } catch {
        // Duplicate: update name & website
        await db.prepare(
          'UPDATE feeds SET name = ?, website = ? WHERE rss = ?'
        ).bind(title, website, rss).run();

        const row = await db.prepare(
          'SELECT ROWID AS id, name, rss, website FROM feeds WHERE rss = ?'
        ).bind(rss).first();

        return json({
          id: row.id,
          name: row.name,
          rss: row.rss,
          website: row.website,
          internalRss: `/rss?url=${encodeURIComponent(rss)}`
        }, 200);
      }
    }

    // 4. JSON→RSS endpoint
    if (p === '/rss' && m === 'GET') {
      const orig = urlObj.searchParams.get('url');
      if (!orig) return new Response('Missing ?url=', { status: 400 });

      // base64url slug
      let slug;
      try {
        const b64 = btoa(orig);
        slug = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
      } catch {
        return new Response('Invalid URL encoding', { status: 400 });
      }

      const jsonUrl = `https://raw.githubusercontent.com/iMahir/newrss/main/data/feeds/${slug}.json`;
      let js;
      try {
        const res = await fetch(jsonUrl);
        if (!res.ok) throw new Error(res.statusText);
        js = await res.json();
      } catch (e) {
        return new Response('Failed to load JSON: ' + e.message, { status: 502 });
      }

      const rssXml = toRss(
        js,
        urlObj.searchParams.get('title') || '',
        urlObj.searchParams.get('description') || ''
      );
      return new Response(rssXml, {
        headers: { 'Content-Type': 'application/rss+xml; charset=UTF-8' }
      });
    }

    // 5. Bulk update lastUpdated field
    if (p === '/api/feeds/update' && m === 'POST') {
      const { ids } = await safeJson(request); // Expects an array of IDs
      if (!Array.isArray(ids) || ids.length === 0) {
        return jsonErr('Invalid request: "ids" must be a non-empty array.', 400);
      }

      const now = new Date().toISOString(); // Get current timestamp in ISO format

      // Construct the SQL query to update multiple records
      // Using a prepared statement for multiple values helps prevent SQL injection
      const placeholders = ids.map(() => '?').join(', ');
      const updateStmt = `UPDATE feeds SET lastUpdated = ? WHERE ROWID IN (${placeholders})`;

      try {
        const info = await db.prepare(updateStmt)
          .bind(now, ...ids) // Bind the timestamp and then all IDs
          .run();

        // Check how many rows were actually updated
        if (info.meta.changes > 0) {
          return json({
            success: true,
            message: `Successfully updated lastUpdated for ${info.meta.changes} records.`,
            updatedCount: info.meta.changes
          }, 200);
        } else {
          return json({
            success: false,
            message: 'No records found or updated for the provided IDs.',
            updatedCount: 0
          }, 200); // Still 200, as the request was processed, just no changes
        }
      } catch (error) {
        console.error('Error in bulk update:', error);
        return jsonErr(`Failed to perform bulk update: ${error.message}`, 500);
      }
    }

    
    return new Response('Not found', { status: 404 });
  }
};
