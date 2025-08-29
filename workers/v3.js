// newrss-worker-fixed.js
const DASH_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
    * { box-sizing: border-box; margin:0; padding:0; }
    body {
      background-color: var(--bg);
      color: var(--fg);
      font-family: 'Inter', sans-serif;
      display:flex;
      flex-direction:column;
      min-height:100vh;
      transition: background-color 0.3s, color 0.3s;
    }
    header {
      position: sticky; top:0;
      background-color: var(--card-bg);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display:flex; justify-content:space-between; align-items:center;
      z-index:1000; box-shadow: var(--shadow);
    }
    header h1 { font-size:1.75rem; font-weight:700; }
    .controls { display:flex; gap:1rem; align-items:center; }
    .controls input[type="search"], .controls input[type="url"] {
      padding:0.75rem 1rem; border:1px solid var(--border); border-radius:8px;
      background-color:var(--bg); color:var(--fg); font-size:1rem; width:250px;
      transition: all 0.3s;
    }
    .controls input[type="search"]:focus, .controls input[type="url"]:focus {
      outline:none; border-color:var(--accent);
      box-shadow: 0 0 0 3px rgba(0,123,255,0.25);
    }
    .controls button {
      padding:0.75rem 1.5rem; border:none; border-radius:8px; background-color:var(--accent);
      color:#fff; font-size:1rem; font-weight:500; cursor:pointer;
      transition: background-color 0.3s, transform 0.2s;
    }
    .controls button:hover { opacity:0.9; transform:translateY(-2px); }
    #themeToggle {
      background:none; border:1px solid var(--border); color:var(--fg);
      font-size:1.25rem; width:48px; height:48px; border-radius:50%;
      display:flex; justify-content:center; align-items:center;
    }
    main { flex:1; max-width:1400px; width:100%; margin:2rem auto; padding:0 2rem; }
    #addForm { display:flex; gap:1rem; margin-bottom:2rem; }
    #addForm input { flex-grow:1; }
    #msg { margin-bottom:1.5rem; padding:1rem; border-radius:8px; font-weight:500; }
    #msg.success { background-color:var(--success); color:#fff; }
    #msg.error { background-color:var(--error); color:#fff; }
    #feedGrid { display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:1.5rem; }
    .feed-card { background-color:var(--card-bg); border:1px solid var(--border);
      border-radius:12px; padding:1.5rem; display:flex; flex-direction:column;
      transition: transform 0.3s, box-shadow 0.3s; box-shadow: var(--shadow);
    }
    .feed-card:hover { transform: translateY(-8px); box-shadow:0 8px 16px rgba(0,0,0,0.15); }
    .feed-header { display:flex; align-items:center; gap:1rem; margin-bottom:1rem; }
    .feed-header img { width:48px; height:48px; border-radius:8px; border:1px solid var(--border); }
    .feed-header h2 { font-size:1.25rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .feed-meta { font-size:0.875rem; color:#6c757d; margin-bottom:1.5rem; }
    .feed-actions { margin-top:auto; display:flex; gap:0.75rem; justify-content:flex-end; }
    .feed-actions button {
      background:none; border:1px solid var(--border); color:var(--accent); cursor:pointer;
      font-size:1.2rem; width:40px; height:40px; border-radius:50%; display:flex; justify-content:center; align-items:center;
      transition: all 0.3s;
    }
    .feed-actions button:hover { background-color:var(--accent); color:#fff; border-color:var(--accent); }
    #loadMore { display:block; margin:3rem auto; padding:0.75rem 2rem; background-color:var(--bg); color:var(--fg);
      border:1px solid var(--border); border-radius:8px; cursor:pointer; font-size:1rem; font-weight:500;
    }
    #loadMore:disabled { opacity:0.5; cursor:not-allowed; }
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
    var themeToggle = document.getElementById('themeToggle');
    var filterInput = document.getElementById('filter');
    var feedGrid = document.getElementById('feedGrid');
    var loadMoreBtn = document.getElementById('loadMore');
    var msg = document.getElementById('msg');
    var form = document.getElementById('addForm');
    var urlIn = document.getElementById('rssUrl');

    var feeds = [], offset = 0, limit = 20;

    themeToggle.onclick = function() {
      var body = document.body;
      var isDark = body.dataset.theme === 'dark';
      body.dataset.theme = isDark ? 'light' : 'dark';
      themeToggle.textContent = isDark ? '🌙' : '☀️';
    };

    // --- Time parsing utilities (robust against missing timezone)
    function normalizeIsoIfMissingTZ(s) {
      if (!s) return null;
      try { s = String(s).trim(); } catch (e) { return null; }

      // numeric epoch handling
      if (/^-?\d+$/.test(s)) {
        var num = Number(s);
        if (num > 1e12) return new Date(num).toISOString();
        if (num > 1e9) return new Date(num * 1000).toISOString();
        return null;
      }

      if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) return s;

      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return s + 'Z';
      }
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
        return s.replace(' ', 'T') + 'Z';
      }
      return s;
    }

    function timeAgo(dateString) {
      if (!dateString) return '–';
      var normalized = normalizeIsoIfMissingTZ(dateString);
      var ts = Date.parse(normalized);
      if (isNaN(ts)) return '–';
      var now = Date.now();
      var seconds = Math.round((now - ts) / 1000);

      if (seconds < 0) {
        seconds = Math.abs(seconds);
        if (seconds < 5) return 'soon';
        var units = [
          { value: 31536000, name: 'year' },
          { value: 2592000, name: 'month' },
          { value: 86400, name: 'day' },
          { value: 3600, name: 'hour' },
          { value: 60, name: 'minute' },
          { value: 1, name: 'second' }
        ];
        for (var i = 0; i < units.length; i++) {
          var u = units[i];
          var n = Math.floor(seconds / u.value);
          if (n >= 1) return 'in ' + n + ' ' + u.name + (n > 1 ? 's' : '');
        }
        return 'soon';
      }

      if (seconds < 5) return 'just now';

      var intervals = [
        { value: 31536000, unit: 'year' },
        { value: 2592000, unit: 'month' },
        { value: 86400, unit: 'day' },
        { value: 3600, unit: 'hour' },
        { value: 60, unit: 'minute' }
      ];

      for (var j = 0; j < intervals.length; j++) {
        var interval = intervals[j];
        var count = Math.floor(seconds / interval.value);
        if (count >= 1) {
          return String(count) + ' ' + interval.unit + (count > 1 ? 's' : '') + ' ago';
        }
      }
      return String(seconds) + ' second' + (seconds > 1 ? 's' : '') + ' ago';
    }

    function loadFeeds() {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
      (async function() {
        try {
          if (offset === 0) feeds = [];
          var res = await fetch('/api/feeds?offset=' + offset + '&limit=' + limit);
          if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
          var page = await res.json();
          feeds.push.apply(feeds, page);
          renderGrid();
          offset += page.length;
          if (page.length < limit) {
            loadMoreBtn.style.display = 'none';
          } else {
            loadMoreBtn.style.display = 'block';
          }
        } catch (error) {
          console.error('Failed to load feeds:', error);
          msg.textContent = '✖ Failed to load feeds.';
          msg.className = 'error';
        } finally {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load More';
        }
      })();
    }

    function renderGrid() {
      feedGrid.innerHTML = '';
      var q = (filterInput.value || '').toLowerCase();
      var filteredFeeds = feeds.filter(function(f) {
        return ((f.name || '').toLowerCase().indexOf(q) !== -1) || ((f.rss || '').toLowerCase().indexOf(q) !== -1);
      });

      filteredFeeds.forEach(function(f) {
        var card = document.createElement('div');
        card.className = 'feed-card';

        var parsed = normalizeIsoIfMissingTZ(f.lastUpdated || '');
        var localFull = (parsed && !isNaN(Date.parse(parsed))) ? new Date(Date.parse(parsed)).toLocaleString() : 'Unknown';

        // Build innerHTML with concatenation to avoid unescaped backticks
        var hostname = '';
        try { hostname = new URL(f.website || f.rss).hostname; } catch (e) { hostname = ''; }

        var metaText = 'Last updated: ' + timeAgo(f.lastUpdated);
        var inner = '';
        inner += '<div class="feed-header">';
        inner += '<img src="https://www.google.com/s2/favicons?domain=' + hostname + '&sz=64" alt="Favicon">';
        inner += '<h2>' + (f.name || '') + '</h2>';
        inner += '</div>';
        inner += '<div class="feed-meta" title="' + localFull + '">' + metaText + '</div>';
        inner += '<div class="feed-actions">';
        inner += '<button title="Open Internal RSS" onclick="window.open(\\'' + (f.internalRss || '') + '\\',\\'_blank\\')">🔗</button>';
        inner += '<button title="Original RSS" onclick="window.open(\\'' + (f.rss || '') + '\\',\\'_blank\\')">📰</button>';
        inner += '</div>';

        card.innerHTML = inner;
        feedGrid.appendChild(card);
      });
    }

    filterInput.addEventListener('input', function() {
      renderGrid(); // local filter only
    });

    loadMoreBtn.onclick = loadFeeds;

    form.onsubmit = function(e) {
      e.preventDefault();
      (async function() {
        msg.textContent = 'Adding…';
        msg.className = '';
        try {
          var res = await fetch('/api/feeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlIn.value.trim() })
          });
          var j = await res.json();
          if (res.ok) {
            msg.innerHTML = '✔ <a href="' + (j.internalRss || '') + '"><strong>' + (j.name || '') + '</strong></a> processed successfully!';
            msg.className = 'success';
            urlIn.value = '';
            offset = 0;
            loadFeeds();
          } else {
            throw new Error(j.error || 'An unknown error occurred.');
          }
        } catch (error) {
          msg.textContent = '✖ ' + (error.message || error);
          msg.className = 'error';
        }
      })();
    };

    // initial load
    loadFeeds();
  </script>
</body>
</html>
`;

// ─── Helpers (server-side) ───────────────────────────────────────────────────

function parseRssTitle(xml) {
  var match = xml.match(/<channel>[\s\S]*?<title.*?>(.*?)<\/title>/i);
  if (match) return match[1].trim();
  match = xml.match(/<feed[^>]*>[\s\S]*?<title.*?>(.*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

function parseRssLink(xml) {
  var m = xml.match(/<channel[^>]*>[\s\S]*?<link>([^<]+)<\/link>/i);
  return m ? m[1].trim() : null;
}

function toRss(js, overrideTitle, overrideDesc) {
  var md2html = function(md) {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n$/gim, '<br />')
      .trim();
  };

  var title = overrideTitle || js.title || '';
  var desc = overrideDesc || js.description || '';
  var link = js.link || '';

  var xml = '<?xml version="1.0"?>\n<rss version="2.0">\n<channel>\n';
  xml += '<title><![CDATA[' + title + ']]></title>\n';
  xml += '<link>' + link + '</link>\n';
  xml += '<description><![CDATA[' + desc + ']]></description>\n';
  xml += '<lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n';

  (js.items || []).forEach(function(it) {
    var summary = it.summary;
    if (typeof summary === 'string') summary = md2html(summary);

    xml += '<item>\n';
    xml += '  <title><![CDATA[' + (it.title || '') + ']]></title>\n';
    xml += '  <link>' + (it.link || '') + '</link>\n';
    xml += '  <pubDate>' + (it.pubDate ? new Date(it.pubDate).toUTCString() : new Date().toUTCString()) + '</pubDate>\n';
    xml += '  <guid>' + (it.id || it.link || '') + '</guid>\n';
    xml += '  <description><![CDATA[' + (summary || '') + ']]></description>\n';
    if (it.author) xml += '  <author>' + it.author + '</author>\n';
    if (it.thumbnail) xml += '  <enclosure url="' + it.thumbnail + '" type="image/jpeg"/>\n';
    xml += '</item>\n';
  });

  xml += '</channel>\n</rss>';
  return xml;
}

function json(body, status) {
  if (status === undefined) status = 200;
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function safeJson(req) {
  try { return await req.json(); } catch (e) { return {}; }
}

function jsonErr(msg, status) {
  if (status === undefined) status = 400;
  return json({ error: msg }, status);
}

async function validateRssFeed(feedUrl) {
  var validatorUrl = 'https://validator.w3.org/feed/check.cgi?url=' + encodeURIComponent(feedUrl);
  try {
    var response = await fetch(validatorUrl);
    var responseHtml = await response.text();
    if (responseHtml.includes('This is a valid RSS feed') || responseHtml.includes('This is a valid Atom feed')) {
      return { isValid: true, message: 'Feed is valid.' };
    } else {
      return { isValid: false, message: 'Feed is invalid or contains warnings.' };
    }
  } catch (error) {
    console.error('Error validating RSS feed:', error);
    return { isValid: false, message: 'An error occurred during validation.' };
  }
}

async function generateHash(inputString, key) {
  var encoder = new TextEncoder();
  var data = encoder.encode(inputString + key);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  var hexHash = hashArray.map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  return hexHash;
}

function sanitizeFilename(filename) {
  var sanitized = filename.replace(/[\\\/:*?"<>|\x00-\x1F]/g, '_');
  sanitized = sanitized.trim();
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');
  if (sanitized.length > 255) sanitized = sanitized.substring(0,255);
  return sanitized;
}

function normalizeLastUpdatedValue(raw) {
  if (raw == null) return null;

  if (typeof raw === 'number' || /^\d+$/.test(String(raw))) {
    var num = Number(raw);
    var ts = num > 1e12 ? num : (num > 1e9 ? num * 1000 : num);
    try { return new Date(ts).toISOString(); } catch (e) { }
  }

  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})$/.test(String(raw))) {
    return String(raw);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(String(raw))) {
    return String(raw) + 'Z';
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(String(raw))) {
    return String(raw).replace(' ', 'T') + 'Z';
  }

  return String(raw);
}

// ─── Main Worker ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    var urlObj = new URL(request.url);
    var p = urlObj.pathname;
    var m = request.method;
    var db = env.FEEDS_DB;

    // 1. Serve UI
    if ((p === '/' || p === '/dashboard') && m === 'GET') {
      return new Response(DASH_HTML, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    // 2. Paginated list
    if (p === '/api/feeds' && m === 'GET') {
      var offsetParam = parseInt(urlObj.searchParams.get('offset') || '0', 10);
      var limitParam = parseInt(urlObj.searchParams.get('limit') || '20', 10);
      var resultObj = await db.prepare(
        'SELECT ROWID AS id, name, rss, website, lastUpdated FROM feeds ORDER BY ROWID DESC LIMIT ? OFFSET ?'
      ).bind(limitParam, offsetParam).all();
      var results = resultObj.results || [];

      results.forEach(function(r) {
        r.internalRss = '/rss?url=' + encodeURIComponent(r.rss);
        r.lastUpdated = normalizeLastUpdatedValue(r.lastUpdated);
      });

      return json(results);
    }

    // 3. Add or update feed
    if (p === '/api/feeds' && m === 'POST') {
      var body = await safeJson(request);
      var rss = body.url;
      if (!rss) return jsonErr('Invalid URL format.', 400);

      var xml;
      try {
        var res = await fetch(rss, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
          }
        });
        var ct = res.headers.get('content-type') || '';
        if (!res.ok) throw '';
        xml = await res.text();
        if (!/<(rss|feed)(\s|>)/i.test(xml)) {
          throw new Error('Not a valid RSS or Atom feed');
        }
        if (!/(xml|rss|application\/rss\+xml)/i.test(ct)) throw '';
      } catch (e) {
        return jsonErr('Unable to fetch or validate RSS feed.', 400);
      }

      var title = parseRssTitle(xml) || rss;
      var website = parseRssLink(xml) || (new URL(rss)).origin;

      function parseCdata(escapedStr) {
        try {
          var decoded = JSON.parse('"' + escapedStr.replace(/"/g, '\\"') + '"');
          var m = decoded.match(/<!\[CDATA\[(.*?)\]\]>/);
          return m ? m[1] : escapedStr;
        } catch (err) {
          return escapedStr;
        }
      }

      title = parseCdata(title);

      try {
        var ins = await db.prepare(
          'INSERT INTO feeds (name, rss, website) VALUES (?, ?, ?)'
        ).bind(title, rss, website).run();

        var id = ins.meta.last_row_id;
        return json({
          id: id, name: title, rss: rss, website: website,
          internalRss: '/rss?url=' + encodeURIComponent(rss)
        }, 201);
      } catch (err) {
        // Duplicate: update name & website
        await db.prepare('UPDATE feeds SET name = ?, website = ? WHERE rss = ?').bind(title, website, rss).run();
        var row = await db.prepare('SELECT ROWID AS id, name, rss, website FROM feeds WHERE rss = ?').bind(rss).first();
        return json({
          id: row.id, name: row.name, rss: row.rss, website: row.website,
          internalRss: '/rss?url=' + encodeURIComponent(rss)
        }, 200);
      }
    }

    // 4. JSON→RSS endpoint
    if (p === '/rss' && m === 'GET') {
      var orig = urlObj.searchParams.get('url');
      if (!orig) return new Response('Missing ?url=', { status: 400 });

      function convertToSlug(feedUrl) {
        var b64 = btoa(feedUrl);
        var slug = b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=*$/,'');
        if (slug.length > 200) return slug.slice(0,200);
        return slug;
      }

      var slug;
      try { slug = convertToSlug(orig); } catch (e) { return new Response('Invalid URL encoding', { status: 400 }); }

      var jsonUrl = 'https://raw.githubusercontent.com/iMahir/newrss/main/data/feeds/' + slug + '.json';
      var js;
      try {
        var r = await fetch(jsonUrl);
        if (!r.ok) throw new Error(r.statusText);
        js = await r.json();
      } catch (e) {
        return new Response('Failed to load JSON: ' + e.message, { status: 502 });
      }

      var rssXml = toRss(js, urlObj.searchParams.get('title') || '', urlObj.searchParams.get('description') || '');
      return new Response(rssXml, { headers: { 'Content-Type': 'application/rss+xml; charset=UTF-8' } });
    }

    // 5. Bulk update lastUpdated field
    if (p === '/api/feeds/update' && m === 'POST') {
      var payload = await safeJson(request);
      var ids = payload.ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return jsonErr('Invalid request: "ids" must be a non-empty array.', 200);
      }

      var nowIso = new Date().toISOString();
      var placeholders = ids.map(function(){ return '?'; }).join(', ');
      var updateStmt = 'UPDATE feeds SET lastUpdated = ? WHERE ROWID IN (' + placeholders + ')';

      try {
        var info = await db.prepare(updateStmt).bind.apply(null, [nowIso].concat(ids)).run();
        if (info.meta.changes > 0) {
          return json({ success: true, message: 'Successfully updated lastUpdated for ' + info.meta.changes + ' records.', updatedCount: info.meta.changes }, 200);
        } else {
          return json({ success: false, message: 'No records found or updated for the provided IDs.', updatedCount: 0 }, 200);
        }
      } catch (error) {
        console.error('Error in bulk update:', error);
        return jsonErr('Failed to perform bulk update: ' + error.message, 500);
      }
    }

    if (p.endsWith('/favicon.ico')) {
      var resF = await fetch('https://raw.githubusercontent.com/iMahir/newrss/refs/heads/main/workers/favicon.png');
      var faviconData = await resF.blob();
      return new Response(faviconData, { headers: { 'Content-Type': 'image/x-icon' } });
    }

    return new Response('Not found', { status: 404 });
  }
};
