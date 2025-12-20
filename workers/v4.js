// newrss-worker-fixed.js
const DASH_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>NewRSS - Your Personal Feed Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    /* Skip to main content link for accessibility */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--accent);
      color: white;
      padding: 0.5rem 1rem;
      z-index: 9999;
      border-radius: 0 0 var(--radius-sm) 0;
      font-weight: 500;
      transition: top 0.2s;
    }
    .skip-link:focus {
      top: 0;
    }
    :root {
      --bg-primary: #fafbfc;
      --bg-secondary: #ffffff;
      --bg-tertiary: #f3f4f6;
      --fg-primary: #111827;
      --fg-secondary: #4b5563;
      --fg-muted: #9ca3af;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --accent-dark: #4f46e5;
      --accent-glow: rgba(99, 102, 241, 0.15);
      --border: #e5e7eb;
      --border-light: #f3f4f6;
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.1);
      --error: #ef4444;
      --error-bg: rgba(239, 68, 68, 0.1);
      --warning: #f59e0b;
      --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      --shadow-glow: 0 0 40px rgba(99, 102, 241, 0.15);
      --radius-sm: 8px;
      --radius: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    [data-theme="dark"] {
      --bg-primary: #0f0f0f;
      --bg-secondary: #171717;
      --bg-tertiary: #262626;
      --fg-primary: #fafafa;
      --fg-secondary: #a1a1aa;
      --fg-muted: #71717a;
      --accent: #818cf8;
      --accent-light: #a5b4fc;
      --accent-dark: #6366f1;
      --accent-glow: rgba(129, 140, 248, 0.2);
      --border: #27272a;
      --border-light: #3f3f46;
      --success-bg: rgba(16, 185, 129, 0.15);
      --error-bg: rgba(239, 68, 68, 0.15);
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--bg-primary);
      color: var(--fg-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      line-height: 1.6;
      transition: var(--transition);
      overflow-x: hidden;
    }
    
    /* Animated background */
    .bg-pattern {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 20% 50%, var(--accent-glow) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(129, 140, 248, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 40% 80%, rgba(245, 87, 108, 0.05) 0%, transparent 40%);
      pointer-events: none;
      z-index: 0;
    }
    
    /* Header */
    header {
      position: sticky;
      top: 0;
      background: var(--bg-secondary);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      transition: var(--transition);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--gradient-1);
      border-radius: var(--radius);
      
      /* ADD THESE THREE LINES */
      padding: 6px; /* Increase this number to make the icon smaller */
      box-sizing: border-box; /* Ensures padding doesn't grow the 40px box */
      object-fit: contain; /* Keeps the icon's aspect ratio perfect */
    
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow);
    }
    
    .logo h1 {
      font-size: 1.5rem;
      font-weight: 700;
      background: var(--gradient-1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header-controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .search-box svg {
      position: absolute;
      left: 1rem;
      width: 18px;
      height: 18px;
      color: var(--fg-muted);
      pointer-events: none;
    }
    
    .search-box input {
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-tertiary);
      color: var(--fg-primary);
      font-size: 0.9rem;
      width: 280px;
      transition: var(--transition);
      font-family: inherit;
    }
    
    .search-box input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
      background: var(--bg-secondary);
    }
    
    .search-box input::placeholder {
      color: var(--fg-muted);
    }
    
    .icon-btn {
      width: 44px;
      height: 44px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-tertiary);
      color: var(--fg-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      font-size: 1.1rem;
    }
    
    .icon-btn:hover {
      background: var(--bg-secondary);
      border-color: var(--accent);
      color: var(--accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }
    
    /* Main content */
    main {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem;
    }
    
    /* Hero section */
    .hero {
      text-align: center;
      padding: 3rem 0 2rem;
      margin-bottom: 2rem;
    }
    
    .hero h2 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
      background: var(--gradient-1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .hero p {
      color: var(--fg-secondary);
      font-size: 1.1rem;
      max-width: 500px;
      margin: 0 auto;
    }
    
    /* Add feed form */
    .add-feed-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow);
    }
    
    .add-feed-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--fg-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    #addForm {
      display: flex;
      gap: 0.75rem;
    }
    
    #addForm input {
      flex: 1;
      padding: 0.875rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-tertiary);
      color: var(--fg-primary);
      font-size: 0.95rem;
      transition: var(--transition);
      font-family: inherit;
    }
    
    #addForm input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
      background: var(--bg-secondary);
    }
    
    .btn-primary {
      padding: 0.875rem 1.75rem;
      border: none;
      border-radius: var(--radius);
      background: var(--gradient-1);
      color: white;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
      font-family: inherit;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md), var(--shadow-glow);
    }
    
    .btn-primary:active {
      transform: translateY(0);
    }
    
    /* Message toast */
    #msg {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: var(--radius);
      font-weight: 500;
      font-size: 0.9rem;
      max-width: 400px;
      opacity: 0;
      transform: translateY(20px);
      transition: var(--transition);
      z-index: 2000;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: var(--shadow-lg);
    }
    
    #msg.show { opacity: 1; transform: translateY(0); }
    #msg.success { background: var(--success-bg); border: 1px solid var(--success); color: var(--success); }
    #msg.error { background: var(--error-bg); border: 1px solid var(--error); color: var(--error); }
    #msg a { color: inherit; font-weight: 600; }
    
    /* Stats bar */
    .stats-bar {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--fg-secondary);
      font-size: 0.9rem;
    }
    
    .stat-item strong {
      color: var(--fg-primary);
      font-weight: 600;
    }
    
    /* View toggle */
    .view-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .view-toggle {
      display: flex;
      gap: 0.25rem;
      padding: 0.25rem;
      background: var(--bg-tertiary);
      border-radius: var(--radius);
    }
    
    .view-toggle button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--fg-muted);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      font-family: inherit;
    }
    
    .view-toggle button.active {
      background: var(--bg-secondary);
      color: var(--fg-primary);
      box-shadow: var(--shadow-sm);
    }
    
    .view-toggle button:hover:not(.active) {
      color: var(--fg-secondary);
    }
    
    /* Feed grid */
    #feedGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    
    #feedGrid.list-view {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    /* Feed card */
    .feed-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      transition: var(--transition);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    
    .feed-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--gradient-1);
      opacity: 0;
      transition: var(--transition);
    }
    
    .feed-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--accent);
    }
    
    .feed-card:hover::before {
      opacity: 1;
    }
    
    #feedGrid.list-view .feed-card {
      flex-direction: row;
      align-items: center;
      padding: 1rem 1.5rem;
      gap: 1rem;
    }
    
    #feedGrid.list-view .feed-card:hover {
      transform: translateX(4px);
    }
    
    .feed-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    #feedGrid.list-view .feed-header {
      margin-bottom: 0;
      flex: 1;
    }
    
    .feed-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    
    .feed-icon img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    
    .feed-info {
      flex: 1;
      min-width: 0;
    }
    
    .feed-info h2 {
      font-size: 1.05rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
      color: var(--fg-primary);
    }
    
    .feed-info .feed-url {
      font-size: 0.8rem;
      color: var(--fg-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .feed-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: var(--fg-secondary);
    }
    
    #feedGrid.list-view .feed-meta {
      margin-bottom: 0;
    }
    
    .feed-meta span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    
    .feed-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    
    #feedGrid.list-view .feed-actions {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    
    .feed-action-btn {
      flex: 1;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      color: var(--fg-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      font-family: inherit;
    }
    
    .feed-action-btn:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    
    .feed-action-btn.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    
    .feed-action-btn.primary:hover {
      background: var(--accent-dark);
      border-color: var(--accent-dark);
    }
    
    #feedGrid.list-view .feed-action-btn {
      flex: none;
      width: 40px;
      padding: 0.65rem;
    }
    
    #feedGrid.list-view .feed-action-btn span {
      display: none;
    }
    
    /* Load more */
    #loadMore {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 2.5rem auto;
      padding: 0.875rem 2rem;
      background: var(--bg-secondary);
      color: var(--fg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: var(--transition);
      font-family: inherit;
    }
    
    #loadMore:hover:not(:disabled) {
      border-color: var(--accent);
      color: var(--accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }
    
    #loadMore:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--fg-muted);
    }
    
    .empty-state svg {
      width: 80px;
      height: 80px;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }
    
    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--fg-secondary);
      margin-bottom: 0.5rem;
    }
    
    /* Skeleton loader */
    .skeleton {
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .skeleton-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }
    
    .skeleton-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .skeleton-icon {
      width: 52px;
      height: 52px;
      border-radius: var(--radius);
    }
    
    .skeleton-text {
      flex: 1;
    }
    
    .skeleton-title {
      height: 20px;
      width: 70%;
      margin-bottom: 0.5rem;
    }
    
    .skeleton-subtitle {
      height: 14px;
      width: 50%;
    }
    
    .skeleton-meta {
      height: 16px;
      width: 40%;
      margin-bottom: 1rem;
    }
    
    .skeleton-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    
    .skeleton-btn {
      flex: 1;
      height: 36px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      header { padding: 1rem; }
      .logo h1 { display: none; }
      .search-box input { width: 180px; }
      main { padding: 1rem; }
      .hero h2 { font-size: 1.75rem; }
      .hero p { font-size: 0.95rem; }
      #addForm { flex-direction: column; }
      .btn-primary { justify-content: center; }
      #feedGrid { grid-template-columns: 1fr; }
      .stats-bar { flex-wrap: wrap; gap: 1rem; }
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .feed-card {
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    .feed-card:nth-child(1) { animation-delay: 0.05s; }
    .feed-card:nth-child(2) { animation-delay: 0.1s; }
    .feed-card:nth-child(3) { animation-delay: 0.15s; }
    .feed-card:nth-child(4) { animation-delay: 0.2s; }
    .feed-card:nth-child(5) { animation-delay: 0.25s; }
    .feed-card:nth-child(6) { animation-delay: 0.3s; }
    
    /* Visually hidden but accessible to screen readers */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    /* Focus visible for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    
    /* Reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body data-theme="light">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="bg-pattern" aria-hidden="true"></div>
  
  <header role="banner">
    <div class="logo">
      <img class="logo-icon" src="/favicon.ico" alt="NewRSS Logo">
      <h1>NewRSS</h1>
    </div>
    <div class="header-controls">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <label for="filter" class="visually-hidden">Search feeds</label>
        <input type="search" id="filter" placeholder="Search feeds..." aria-label="Search feeds">
      </div>
      <button class="icon-btn" id="themeToggle" title="Toggle theme" aria-label="Toggle dark mode">
        <span aria-hidden="true">🌙</span>
      </button>
    </div>
  </header>

  <main id="main-content" role="main">
    <div class="hero">
      <h2>Your Personal Feed Hub</h2>
      <p>Aggregate, organize, and read all your favorite RSS feeds in one beautiful place</p>
    </div>
    
    <div class="add-feed-section">
      <h3 id="add-feed-heading">➕ Add New Feed</h3>
      <form id="addForm" aria-labelledby="add-feed-heading">
        <label for="rssUrl" class="visually-hidden">RSS or Atom feed URL</label>
        <input type="url" id="rssUrl" placeholder="Paste any RSS or Atom feed URL..." required aria-describedby="add-feed-heading">
        <button type="submit" class="btn-primary">
          <span>Add Feed</span>
          <span>→</span>
        </button>
      </form>
    </div>
    
    <div class="stats-bar">
      <div class="stat-item">
        <span>📊</span>
        <strong id="totalFeeds">0</strong> feeds subscribed
      </div>
      <div class="stat-item">
        <span>🕐</span>
        Last synced: <strong id="lastSync">Never</strong>
      </div>
    </div>
    
    <div class="view-controls">
      <div class="view-toggle">
        <button class="active" data-view="grid">Grid</button>
        <button data-view="list">List</button>
      </div>
    </div>

    <div id="feedGrid"></div>
    <button id="loadMore">
      <span>Load More</span>
      <span>↓</span>
    </button>
  </main>

  <div id="msg" role="alert"></div>

  <script>
    var themeToggle = document.getElementById('themeToggle');
    var filterInput = document.getElementById('filter');
    var feedGrid = document.getElementById('feedGrid');
    var loadMoreBtn = document.getElementById('loadMore');
    var msg = document.getElementById('msg');
    var form = document.getElementById('addForm');
    var urlIn = document.getElementById('rssUrl');
    var totalFeedsEl = document.getElementById('totalFeeds');
    var lastSyncEl = document.getElementById('lastSync');
    var viewToggleBtns = document.querySelectorAll('.view-toggle button');

    var feeds = [], offset = 0, limit = 20;
    
    // Initialize theme from localStorage
    var savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    updateThemeButton(savedTheme === 'dark');
    
    function updateThemeButton(isDark) {
      themeToggle.innerHTML = '<span aria-hidden="true">' + (isDark ? '☀️' : '🌙') + '</span>';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    themeToggle.onclick = function() {
      var body = document.body;
      var isDark = body.dataset.theme === 'dark';
      body.dataset.theme = isDark ? 'light' : 'dark';
      updateThemeButton(!isDark);
      localStorage.setItem('theme', body.dataset.theme);
    };
    
    // View toggle
    viewToggleBtns.forEach(function(btn) {
      btn.onclick = function() {
        viewToggleBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var view = btn.dataset.view;
        if (view === 'list') {
          feedGrid.classList.add('list-view');
        } else {
          feedGrid.classList.remove('list-view');
        }
        localStorage.setItem('feedView', view);
      };
    });
    
    // Restore view preference
    var savedView = localStorage.getItem('feedView') || 'grid';
    if (savedView === 'list') {
      feedGrid.classList.add('list-view');
      viewToggleBtns.forEach(function(b) {
        b.classList.toggle('active', b.dataset.view === 'list');
      });
    }
    
    // Show toast message
    function showMsg(text, type, duration) {
      if (duration === undefined) duration = 4000;
      msg.innerHTML = text;
      msg.className = type + ' show';
      setTimeout(function() {
        msg.classList.remove('show');
      }, duration);
    }

    // --- Time parsing utilities (robust against missing timezone)
    function normalizeIsoIfMissingTZ(s) {
      if (!s) return null;
      try { s = String(s).trim(); } catch (e) { return null; }

      // numeric epoch handling
      if (/^-?\\d+$/.test(s)) {
        var num = Number(s);
        if (num > 1e12) return new Date(num).toISOString();
        if (num > 1e9) return new Date(num * 1000).toISOString();
        return null;
      }

      if (/[zZ]|[+\\-]\\d{2}:\\d{2}$/.test(s)) return s;

      if (/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?$/.test(s)) {
        return s + 'Z';
      }
      if (/^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}(\\.\\d+)?$/.test(s)) {
        return s.replace(' ', 'T') + 'Z';
      }
      return s;
    }

    function timeAgo(dateString) {
      if (!dateString) return 'Never';
      var normalized = normalizeIsoIfMissingTZ(dateString);
      var ts = Date.parse(normalized);
      if (isNaN(ts)) return 'Unknown';
      var now = Date.now();
      var seconds = Math.round((now - ts) / 1000);

      if (seconds < 0) {
        seconds = Math.abs(seconds);
        if (seconds < 5) return 'Soon';
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
        return 'Soon';
      }

      if (seconds < 5) return 'Just now';

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
      return String(seconds) + 's ago';
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    function renderSkeletons(count) {
      var html = '';
      for (var i = 0; i < count; i++) {
        html += '<div class="skeleton-card">';
        html += '<div class="skeleton-header">';
        html += '<div class="skeleton skeleton-icon"></div>';
        html += '<div class="skeleton-text">';
        html += '<div class="skeleton skeleton-title"></div>';
        html += '<div class="skeleton skeleton-subtitle"></div>';
        html += '</div></div>';
        html += '<div class="skeleton skeleton-meta"></div>';
        html += '<div class="skeleton-actions">';
        html += '<div class="skeleton skeleton-btn"></div>';
        html += '<div class="skeleton skeleton-btn"></div>';
        html += '</div></div>';
      }
      return html;
    }

    function loadFeeds() {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<span>Loading...</span>';
      
      if (offset === 0) {
        feedGrid.innerHTML = renderSkeletons(6);
      }
      
      (async function() {
        try {
          if (offset === 0) feeds = [];
          var res = await fetch('/api/feeds?offset=' + offset + '&limit=' + limit);
          if (!res.ok) throw new Error('HTTP error! status: ' + res.status);
          var page = await res.json();
          feeds.push.apply(feeds, page);
          renderGrid();
          offset += page.length;
          
          // Update stats
          totalFeedsEl.textContent = feeds.length;
          lastSyncEl.textContent = 'Just now';
          
          if (page.length < limit) {
            loadMoreBtn.style.display = 'none';
          } else {
            loadMoreBtn.style.display = 'flex';
          }
        } catch (error) {
          console.error('Failed to load feeds:', error);
          showMsg('✖ Failed to load feeds. Please try again.', 'error');
        } finally {
          loadMoreBtn.disabled = false;
          loadMoreBtn.innerHTML = '<span>Load More</span><span>↓</span>';
        }
      })();
    }

    function renderGrid() {
      feedGrid.innerHTML = '';
      var q = (filterInput.value || '').toLowerCase();
      var filteredFeeds = feeds.filter(function(f) {
        return ((f.name || '').toLowerCase().indexOf(q) !== -1) || ((f.rss || '').toLowerCase().indexOf(q) !== -1);
      });
      
      if (filteredFeeds.length === 0) {
        feedGrid.innerHTML = '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />' +
          '</svg>' +
          '<h3>No feeds found</h3>' +
          '<p>Add your first RSS feed to get started</p>' +
          '</div>';
        return;
      }

      filteredFeeds.forEach(function(f) {
        var card = document.createElement('div');
        card.className = 'feed-card';

        var parsed = normalizeIsoIfMissingTZ(f.lastUpdated || '');
        var localFull = (parsed && !isNaN(Date.parse(parsed))) ? new Date(Date.parse(parsed)).toLocaleString() : 'Unknown';

        var hostname = '';
        try { hostname = new URL(f.website || f.rss).hostname; } catch (e) { hostname = ''; }
        
        var shortUrl = hostname.replace('www.', '');

        var inner = '';
        inner += '<div class="feed-header">';
        inner += '<div class="feed-icon">';
        inner += '<img src="https://www.google.com/s2/favicons?domain=' + hostname + '&sz=64" alt="' + escapeHtml(f.name || 'Feed') + ' icon" loading="lazy" onerror="this.outerHTML=\\'<span style=padding:0.5rem;font-size:1.25rem>📰</span>\\'">';
        inner += '</div>';
        inner += '<div class="feed-info">';
        inner += '<h2 title="' + escapeHtml(f.name || '') + '">' + escapeHtml(f.name || 'Untitled Feed') + '</h2>';
        inner += '<div class="feed-url" title="' + (f.rss || '') + '">' + shortUrl + '</div>';
        inner += '</div></div>';
        inner += '<div class="feed-meta">';
        inner += '<span title="' + localFull + '">🕐 ' + timeAgo(f.lastUpdated) + '</span>';
        inner += '</div>';
        inner += '<div class="feed-actions" role="group" aria-label="Feed actions">';
        inner += '<button class="feed-action-btn primary" onclick="event.stopPropagation(); window.location.href=\\'/feed?url=' + encodeURIComponent(f.rss || '') + '\\'" title="Read Feed" aria-label="Read ' + escapeHtml(f.name || 'feed') + '"><span aria-hidden="true">📖</span><span>Read</span></button>';
        inner += '<button class="feed-action-btn" onclick="event.stopPropagation(); window.open(\\'' + escapeHtml(f.internalRss || '') + '\\', \\'_blank\\')" title="RSS Feed" aria-label="Get RSS for ' + escapeHtml(f.name || 'feed') + '"><span aria-hidden="true">📡</span><span>RSS</span></button>';
        inner += '<button class="feed-action-btn" onclick="event.stopPropagation(); window.open(\\'' + escapeHtml(f.rss || '') + '\\', \\'_blank\\')" title="Original Source" aria-label="View source for ' + escapeHtml(f.name || 'feed') + '"><span aria-hidden="true">🔗</span><span>Source</span></button>';
        inner += '</div>';

        card.innerHTML = inner;
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', escapeHtml(f.name || 'Untitled Feed') + ' - Press Enter to read');
        
        var navigateToFeed = function() {
          window.location.href = '/feed?url=' + encodeURIComponent(f.rss || '');
        };
        card.onclick = navigateToFeed;
        card.onkeydown = function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateToFeed();
          }
        };
        feedGrid.appendChild(card);
      });
    }

    filterInput.addEventListener('input', function() {
      renderGrid();
    });

    loadMoreBtn.onclick = loadFeeds;

    form.onsubmit = function(e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Adding...</span>';
      
      (async function() {
        try {
          var res = await fetch('/api/feeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlIn.value.trim() })
          });
          var j = await res.json();
          if (res.ok) {
            showMsg('✔ <strong>' + (j.name || 'Feed') + '</strong> added successfully!', 'success');
            urlIn.value = '';
            offset = 0;
            loadFeeds();
          } else {
            throw new Error(j.error || 'An unknown error occurred.');
          }
        } catch (error) {
          showMsg('✖ ' + (error.message || error), 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Add Feed</span><span>→</span>';
        }
      })();
    };

    // initial load
    loadFeeds();
  </script>
</body>
</html>
`;

// Feed Reader Page HTML - Beautiful article display
const FEED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reading Feed - NewRSS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Merriweather:wght@300;400;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #fafbfc;
      --bg-secondary: #ffffff;
      --bg-tertiary: #f3f4f6;
      --bg-hover: #f9fafb;
      --fg-primary: #111827;
      --fg-secondary: #4b5563;
      --fg-muted: #9ca3af;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --accent-dark: #4f46e5;
      --accent-glow: rgba(99, 102, 241, 0.15);
      --border: #e5e7eb;
      --border-light: #f3f4f6;
      --success: #10b981;
      --error: #ef4444;
      --warning: #f59e0b;
      --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      --gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      --gradient-4: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      --radius-sm: 8px;
      --radius: 12px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    [data-theme="dark"] {
      --bg-primary: #0a0a0a;
      --bg-secondary: #141414;
      --bg-tertiary: #1f1f1f;
      --bg-hover: #1a1a1a;
      --fg-primary: #fafafa;
      --fg-secondary: #a1a1aa;
      --fg-muted: #71717a;
      --accent: #818cf8;
      --accent-light: #a5b4fc;
      --accent-dark: #6366f1;
      --accent-glow: rgba(129, 140, 248, 0.2);
      --border: #27272a;
      --border-light: #3f3f46;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--bg-primary);
      color: var(--fg-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      line-height: 1.7;
      transition: var(--transition);
    }
    
    /* Subtle animated gradient background */
    .bg-gradient {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 400px;
      background: linear-gradient(180deg, var(--accent-glow) 0%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }
    
    /* Header */
    header {
      position: sticky;
      top: 0;
      background: var(--bg-secondary);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      z-index: 1000;
      transition: var(--transition);
    }
    
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-tertiary);
      color: var(--fg-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      font-family: inherit;
    }
    
    .back-btn:hover {
      background: var(--bg-secondary);
      border-color: var(--accent);
      color: var(--accent);
      transform: translateX(-2px);
    }
    
    .feed-title-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      justify-content: center;
      max-width: 600px;
    }
    
    .feed-title-header img {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
    }
    
    .feed-title-header h1 {
      font-size: 1.1rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .icon-btn {
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-tertiary);
      color: var(--fg-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition);
      font-size: 1.1rem;
    }
    
    .icon-btn:hover {
      background: var(--bg-secondary);
      border-color: var(--accent);
      color: var(--accent);
    }
    
    /* Main layout */
    .layout {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 340px 1fr;
      min-height: calc(100vh - 70px);
    }
    
    /* Sidebar - Article List */
    .sidebar {
      position: sticky;
      top: 70px;
      height: calc(100vh - 70px);
      overflow-y: auto;
      border-right: 1px solid var(--border);
      background: var(--bg-secondary);
    }
    
    .sidebar::-webkit-scrollbar {
      width: 6px;
    }
    
    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .sidebar::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }
    
    .sidebar-header {
      position: sticky;
      top: 0;
      background: var(--bg-secondary);
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      z-index: 10;
    }
    
    .sidebar-header h2 {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    
    .search-articles {
      position: relative;
    }
    
    .search-articles input {
      width: 100%;
      padding: 0.6rem 1rem 0.6rem 2.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      color: var(--fg-primary);
      font-size: 0.85rem;
      transition: var(--transition);
      font-family: inherit;
    }
    
    .search-articles input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    
    .search-articles svg {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      color: var(--fg-muted);
    }
    
    .article-list {
      padding: 0.5rem;
    }
    
    .article-item {
      padding: 1rem;
      border-radius: var(--radius);
      cursor: pointer;
      transition: var(--transition);
      margin-bottom: 0.25rem;
      border: 1px solid transparent;
    }
    
    .article-item:hover {
      background: var(--bg-hover);
    }
    
    .article-item.active {
      background: var(--accent-glow);
      border-color: var(--accent);
    }
    
    .article-item.active .article-item-title {
      color: var(--accent);
    }
    
    .article-item-title {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: var(--fg-primary);
    }
    
    .article-item-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: var(--fg-muted);
    }
    
    .article-item-meta span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .article-item-scores {
      display: flex;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }
    
    .score-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .score-impact { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .score-novelty { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .score-scale { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    
    /* Main content - Article reader */
    .main-content {
      padding: 2rem 3rem;
      background: var(--bg-primary);
    }
    
    .article-container {
      max-width: 720px;
      margin: 0 auto;
    }
    
    /* Empty state */
    .empty-reader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
      color: var(--fg-muted);
    }
    
    .empty-reader svg {
      width: 100px;
      height: 100px;
      margin-bottom: 1.5rem;
      opacity: 0.3;
    }
    
    .empty-reader h3 {
      font-size: 1.25rem;
      color: var(--fg-secondary);
      margin-bottom: 0.5rem;
    }
    
    /* Article view */
    .article-header {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    
    .article-category {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      background: var(--accent-glow);
      color: var(--accent);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    
    .article-title {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 2.25rem;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 1rem;
      color: var(--fg-primary);
    }
    
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.5rem;
      color: var(--fg-secondary);
      font-size: 0.9rem;
    }
    
    .article-meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    
    .article-thumbnail {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: var(--radius-lg);
      margin-bottom: 2rem;
      box-shadow: var(--shadow-lg);
    }
    
    .article-scores {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 2rem;
    }
    
    .score-item {
      flex: 1;
      min-width: 120px;
      text-align: center;
      padding: 0.75rem;
    }
    
    .score-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.35rem;
    }
    
    .score-value.impact { color: #ef4444; }
    .score-value.novelty { color: #3b82f6; }
    .score-value.scale { color: #10b981; }
    .score-value.significance { color: #f59e0b; }
    
    .score-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .article-body {
      font-family: 'Merriweather', Georgia, serif;
      font-size: 1.1rem;
      line-height: 1.9;
      color: var(--fg-primary);
    }
    
    .article-body p {
      margin-bottom: 1.5rem;
    }
    
    .article-body ul, .article-body ol {
      margin: 1.5rem 0;
      padding-left: 1.5rem;
    }
    
    .article-body li {
      margin-bottom: 0.75rem;
    }
    
    .article-body strong {
      font-weight: 700;
      color: var(--fg-primary);
    }
    
    .article-body a {
      color: var(--accent);
      text-decoration: underline;
      text-decoration-color: var(--accent-glow);
      text-underline-offset: 2px;
      transition: var(--transition);
    }
    
    .article-body a:hover {
      text-decoration-color: var(--accent);
    }
    
    .article-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }
    
    .keyword-tag {
      padding: 0.4rem 0.75rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 0.8rem;
      color: var(--fg-secondary);
      transition: var(--transition);
    }
    
    .keyword-tag:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    
    .article-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }
    
    .article-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--bg-secondary);
      color: var(--fg-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      font-family: inherit;
    }
    
    .article-action-btn:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    
    .article-action-btn.primary {
      background: var(--gradient-1);
      border: none;
      color: white;
    }
    
    .article-action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    /* Loading skeleton */
    .skeleton {
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .loading-list .article-item-skeleton {
      padding: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .skeleton-title {
      height: 18px;
      width: 90%;
      margin-bottom: 0.75rem;
    }
    
    .skeleton-meta {
      height: 12px;
      width: 60%;
    }
    
    /* Mobile responsiveness */
    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
      
      .sidebar {
        position: relative;
        top: 0;
        height: auto;
        max-height: 50vh;
        border-right: none;
        border-bottom: 1px solid var(--border);
      }
      
      .main-content {
        padding: 1.5rem;
      }
      
      .article-title {
        font-size: 1.75rem;
      }
      
      .header-inner {
        padding: 0.75rem 1rem;
      }
      
      .feed-title-header {
        display: none;
      }
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .article-container {
      animation: fadeIn 0.4s ease-out;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100px); }
    }
    
    /* Visually hidden for accessibility */
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    /* Focus styles for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    
    /* Reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body data-theme="light">
  <div class="bg-gradient"></div>
  
  <header>
    <div class="header-inner">
      <a href="/" class="back-btn">
        <span>←</span>
        <span>All Feeds</span>
      </a>
      <div class="feed-title-header" id="feedTitleHeader">
        <img id="feedFavicon" src="" alt="">
        <h1 id="feedTitleText">Loading...</h1>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="themeToggle" title="Toggle theme" aria-label="Toggle dark mode"><span aria-hidden="true">🌙</span></button>
        <button class="icon-btn" onclick="window.open(getRssUrl(), '_blank')" title="RSS Feed" aria-label="Open RSS feed in new tab"><span aria-hidden="true">📡</span></button>
      </div>
    </div>
  </header>
  
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Articles</h2>
        <div class="search-articles">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <label for="articleSearch" class="visually-hidden">Search articles</label>
          <input type="search" id="articleSearch" placeholder="Search articles..." aria-label="Search articles">
        </div>
      </div>
      <div class="article-list" id="articleList" role="listbox" aria-label="Article list">
        <div class="loading-list">
          <div class="article-item-skeleton"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-meta"></div></div>
          <div class="article-item-skeleton"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-meta"></div></div>
          <div class="article-item-skeleton"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-meta"></div></div>
          <div class="article-item-skeleton"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-meta"></div></div>
        </div>
      </div>
    </aside>
    
    <main class="main-content">
      <div class="article-container" id="articleContainer">
        <div class="empty-reader">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h3>Select an article to read</h3>
          <p>Choose from the list on the left to start reading</p>
        </div>
      </div>
    </main>
  </div>
  
  <script>
    var feedData = null;
    var articles = [];
    var currentArticle = null;
    var themeToggle = document.getElementById('themeToggle');
    var articleList = document.getElementById('articleList');
    var articleContainer = document.getElementById('articleContainer');
    var articleSearch = document.getElementById('articleSearch');
    var feedTitleText = document.getElementById('feedTitleText');
    var feedFavicon = document.getElementById('feedFavicon');
    
    // Get feed URL from query params
    function getFeedUrl() {
      var params = new URLSearchParams(window.location.search);
      return params.get('url') || '';
    }
    
    function getRssUrl() {
      return '/rss?url=' + encodeURIComponent(getFeedUrl());
    }
    
    // Theme handling with accessibility
    var savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    updateFeedThemeButton(savedTheme === 'dark');
    
    function updateFeedThemeButton(isDark) {
      themeToggle.innerHTML = '<span aria-hidden="true">' + (isDark ? '☀️' : '🌙') + '</span>';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    
    themeToggle.onclick = function() {
      var isDark = document.body.dataset.theme === 'dark';
      document.body.dataset.theme = isDark ? 'light' : 'dark';
      updateFeedThemeButton(!isDark);
      localStorage.setItem('theme', document.body.dataset.theme);
    };
    
    // Time formatting
    function timeAgo(dateString) {
      if (!dateString) return 'Unknown';
      var ts = Date.parse(dateString);
      if (isNaN(ts)) return 'Unknown';
      var seconds = Math.round((Date.now() - ts) / 1000);
      if (seconds < 0) return 'Soon';
      if (seconds < 60) return 'Just now';
      var intervals = [
        { value: 31536000, unit: 'y' },
        { value: 2592000, unit: 'mo' },
        { value: 86400, unit: 'd' },
        { value: 3600, unit: 'h' },
        { value: 60, unit: 'm' }
      ];
      for (var i = 0; i < intervals.length; i++) {
        var count = Math.floor(seconds / intervals[i].value);
        if (count >= 1) return count + intervals[i].unit + ' ago';
      }
      return 'Just now';
    }
    
    function formatDate(dateString) {
      if (!dateString) return 'Unknown date';
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return 'Unknown date';
      }
    }
    
    // Escape HTML
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // Convert markdown-like summary to HTML
    function formatSummary(text) {
      if (!text) return '';
      return text
        .replace(/^- /gm, '• ')
        .replace(/\\n/g, '<br>')
        .split('\\n').join('<br>')
        .split('• ').map(function(item, i) {
          if (i === 0) return item;
          return '<li>' + item + '</li>';
        }).join('');
    }
    
    // Render article list
    function renderArticleList(items) {
      if (!items || items.length === 0) {
        articleList.innerHTML = '<div class="empty-reader" style="padding:2rem;height:auto;"><h3>No articles found</h3></div>';
        return;
      }
      
      var html = '';
      items.forEach(function(item, index) {
        var scores = item.scores || {};
        var scoresHtml = '';
        if (scores.impact || scores.novelty || scores.scale) {
          scoresHtml = '<div class="article-item-scores">';
          if (scores.impact) scoresHtml += '<span class="score-badge score-impact">Impact ' + scores.impact + '</span>';
          if (scores.novelty) scoresHtml += '<span class="score-badge score-novelty">Novelty ' + scores.novelty + '</span>';
          if (scores.scale) scoresHtml += '<span class="score-badge score-scale">Scale ' + scores.scale + '</span>';
          scoresHtml += '</div>';
        }
        
        html += '<div class="article-item' + (index === 0 ? ' active' : '') + '" data-index="' + index + '" tabindex="0" role="option" aria-selected="' + (index === 0 ? 'true' : 'false') + '">';
        html += '<div class="article-item-title">' + escapeHtml(item.title) + '</div>';
        html += '<div class="article-item-meta">';
        html += '<span>🕐 ' + timeAgo(item.pubDate) + '</span>';
        if (item.author) html += '<span>✍️ ' + escapeHtml(item.author) + '</span>';
        html += '</div>';
        html += scoresHtml;
        html += '</div>';
      });
      
      articleList.innerHTML = html;
      
      // Add click and keyboard handlers
      document.querySelectorAll('.article-item').forEach(function(el) {
        el.onclick = function() {
          var idx = parseInt(el.dataset.index);
          selectArticle(idx);
        };
        el.onkeydown = function(e) {
          var idx = parseInt(el.dataset.index);
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectArticle(idx);
          } else if (e.key === 'ArrowDown' && idx < items.length - 1) {
            e.preventDefault();
            document.querySelector('.article-item[data-index="' + (idx + 1) + '"]').focus();
          } else if (e.key === 'ArrowUp' && idx > 0) {
            e.preventDefault();
            document.querySelector('.article-item[data-index="' + (idx - 1) + '"]').focus();
          }
        };
      });
      
      // Auto-select first article
      if (items.length > 0) {
        selectArticle(0);
      }
    }
    
    // Select and display article
    function selectArticle(index) {
      if (!articles[index]) return;
      
      currentArticle = articles[index];
      
      // Update active state and aria-selected in list
      document.querySelectorAll('.article-item').forEach(function(el, i) {
        el.classList.toggle('active', i === index);
        el.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      
      // Render article
      var item = currentArticle;
      var scores = item.scores || {};
      
      var html = '<div class="article-header">';
      
      // Category badge (use first keyword if available)
      if (item.keywords && item.keywords.length > 0) {
        html += '<div class="article-category">📰 ' + escapeHtml(item.keywords[0]) + '</div>';
      }
      
      html += '<h1 class="article-title">' + escapeHtml(item.title) + '</h1>';
      html += '<div class="article-meta">';
      html += '<span class="article-meta-item">📅 ' + formatDate(item.pubDate) + '</span>';
      if (item.author) html += '<span class="article-meta-item">✍️ ' + escapeHtml(item.author) + '</span>';
      html += '</div>';
      html += '</div>';
      
      // Thumbnail with lazy loading and graceful fallback
      if (item.thumbnail) {
        html += '<img class="article-thumbnail" src="' + escapeHtml(item.thumbnail) + '" alt="Article thumbnail for ' + escapeHtml(item.title) + '" loading="lazy" onerror="this.parentNode.removeChild(this)">';
      }
      
      // Scores panel
      if (scores.impact || scores.novelty || scores.scale || scores.longTermSignificance) {
        html += '<div class="article-scores">';
        if (scores.impact) {
          html += '<div class="score-item"><div class="score-value impact">' + scores.impact + '</div><div class="score-label">Impact</div></div>';
        }
        if (scores.novelty) {
          html += '<div class="score-item"><div class="score-value novelty">' + scores.novelty + '</div><div class="score-label">Novelty</div></div>';
        }
        if (scores.scale) {
          html += '<div class="score-item"><div class="score-value scale">' + scores.scale + '</div><div class="score-label">Scale</div></div>';
        }
        if (scores.longTermSignificance) {
          html += '<div class="score-item"><div class="score-value significance">' + scores.longTermSignificance + '</div><div class="score-label">Long-term</div></div>';
        }
        html += '</div>';
      }
      
      // Article body/summary
      html += '<div class="article-body">';
      var summary = item.summary || item.description || '';
      var formattedSummary = formatSummary(summary);
      if (formattedSummary.includes('<li>')) {
        html += '<ul>' + formattedSummary + '</ul>';
      } else {
        html += '<p>' + formattedSummary.replace(/<br>/g, '</p><p>') + '</p>';
      }
      html += '</div>';
      
      // Keywords
      if (item.keywords && item.keywords.length > 0) {
        html += '<div class="article-keywords">';
        item.keywords.forEach(function(kw) {
          html += '<span class="keyword-tag">' + escapeHtml(kw) + '</span>';
        });
        html += '</div>';
      }
      
      // Actions
      html += '<div class="article-actions">';
      html += '<a href="' + escapeHtml(item.link) + '" target="_blank" rel="noopener" class="article-action-btn primary">🔗 Read Full Article</a>';
      html += '<button class="article-action-btn" onclick="copyLink()">📋 Copy Link</button>';
      html += '</div>';
      
      articleContainer.innerHTML = html;
      
      // Scroll to top of article on mobile
      if (window.innerWidth <= 900) {
        articleContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Toast notification system
    function showToast(message, type) {
      type = type || 'success';
      var existing = document.querySelector('.toast-notification');
      if (existing) existing.remove();
      
      var toast = document.createElement('div');
      toast.className = 'toast-notification ' + type;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML = '<span aria-hidden="true">' + (type === 'success' ? '✓' : '✕') + '</span> ' + message;
      toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;padding:1rem 1.5rem;border-radius:var(--radius);font-weight:500;font-size:0.9rem;z-index:9999;display:flex;align-items:center;gap:0.5rem;animation:slideIn 0.3s ease;background:' + (type === 'success' ? 'var(--success)' : 'var(--error)') + ';color:white;box-shadow:var(--shadow-lg);';
      document.body.appendChild(toast);
      setTimeout(function() {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(function() { toast.remove(); }, 300);
      }, 3000);
    }
    
    // Copy link to clipboard
    function copyLink() {
      if (currentArticle && currentArticle.link) {
        navigator.clipboard.writeText(currentArticle.link).then(function() {
          showToast('Link copied to clipboard!');
        }).catch(function() {
          showToast('Failed to copy link', 'error');
        });
      }
    }
    window.copyLink = copyLink;
    
    // Search functionality
    articleSearch.addEventListener('input', function() {
      var q = (this.value || '').toLowerCase();
      var filtered = articles.filter(function(item) {
        return (item.title || '').toLowerCase().includes(q) ||
               (item.summary || '').toLowerCase().includes(q) ||
               (item.keywords || []).some(function(kw) { return kw.toLowerCase().includes(q); });
      });
      renderArticleList(filtered);
    });
    
    // Load feed data
    async function loadFeed() {
      var feedUrl = getFeedUrl();
      if (!feedUrl) {
        articleList.innerHTML = '<div class="empty-reader" style="padding:2rem;height:auto;"><h3>No feed URL provided</h3></div>';
        return;
      }
      
      // Convert URL to slug for JSON fetch (handles Unicode safely)
      function convertToSlug(url) {
        try {
          // Encode to UTF-8 first, then base64
          var b64 = btoa(unescape(encodeURIComponent(url)));
          var slug = b64.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=*$/, '');
          if (slug.length > 200) return slug.slice(0, 200);
          return slug;
        } catch (e) {
          // Fallback: use simple encoding
          return encodeURIComponent(url).slice(0, 200);
        }
      }
      
      var slug = convertToSlug(feedUrl);
      var jsonUrl = 'https://raw.githubusercontent.com/iMahir/newrss/main/data/feeds/' + slug + '.json';
      
      try {
        var res = await fetch(jsonUrl);
        if (!res.ok) throw new Error('Feed not found');
        feedData = await res.json();
        articles = feedData.items || [];
        
        // Update header
        feedTitleText.textContent = feedData.title || 'Untitled Feed';
        var hostname = '';
        try { hostname = new URL(feedData.link || feedUrl).hostname; } catch (e) {}
        if (hostname) {
          feedFavicon.src = 'https://www.google.com/s2/favicons?domain=' + hostname + '&sz=64';
        }
        document.title = (feedData.title || 'Feed') + ' - NewRSS';
        
        renderArticleList(articles);
      } catch (err) {
        console.error('Failed to load feed:', err);
        articleList.innerHTML = '<div class="empty-reader" style="padding:2rem;height:auto;"><h3>Failed to load feed</h3><p>' + escapeHtml(err.message) + '</p></div>';
      }
    }
    
    // Initialize
    loadFeed();
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
  var md2html = function (md) {
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

  (js.items || []).forEach(function (it) {
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
  var hexHash = hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  return hexHash;
}

function sanitizeFilename(filename) {
  var sanitized = filename.replace(/[\\\/:*?"<>|\x00-\x1F]/g, '_');
  sanitized = sanitized.trim();
  sanitized = sanitized.replace(/^\.+|\.+$/g, '');
  if (sanitized.length > 255) sanitized = sanitized.substring(0, 255);
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

    // 1. Serve Dashboard UI
    if ((p === '/' || p === '/dashboard') && m === 'GET') {
      return new Response(DASH_HTML, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    // 1b. Serve Feed Reader UI
    if (p === '/feed' && m === 'GET') {
      return new Response(FEED_HTML, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    // 2. Paginated list
    if (p === '/api/feeds' && m === 'GET') {
      var offsetParam = parseInt(urlObj.searchParams.get('offset') || '0', 10);
      var limitParam = parseInt(urlObj.searchParams.get('limit') || '20', 10);

      if (!urlObj.searchParams.get('offset') && !urlObj.searchParams.get('limit')) {
        var allFeeds = await db.prepare(
          'SELECT ROWID AS id, name, rss, website, lastUpdated FROM feeds ORDER BY ROWID DESC'
        ).all();
        var allResults = allFeeds.results || [];
        allResults.forEach(function (r) {
          r.internalRss = '/rss?url=' + encodeURIComponent(r.rss);
          r.lastUpdated = normalizeLastUpdatedValue(r.lastUpdated);
        });
        return json(allResults);
      }
      var resultObj = await db.prepare(
        'SELECT ROWID AS id, name, rss, website, lastUpdated FROM feeds ORDER BY ROWID DESC LIMIT ? OFFSET ?'
      ).bind(limitParam, offsetParam).all();
      var results = resultObj.results || [];

      results.forEach(function (r) {
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
        var slug = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');
        if (slug.length > 200) return slug.slice(0, 200);
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
      var placeholders = ids.map(function () { return '?'; }).join(', ');
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

    // 6. Sync lastUpdated from remote JSON
    if (p === '/api/feeds/sync' && m === 'GET') {

      const remoteUrl = 'https://raw.githubusercontent.com/iMahir/newrss/main/data/rss.json';
      let remoteFeeds;
      try {
        const resp = await fetch(remoteUrl);
        if (!resp.ok) throw new Error('Failed to fetch remote JSON');
        remoteFeeds = await resp.json();
      } catch (err) {
        return jsonErr('Could not fetch remote JSON: ' + err.message, 502);
      }

      let updatedCount = 0;
      let debug = [];
      for (const feed of remoteFeeds) {
        if (!feed.rss || !feed.lastUpdated) {
          debug.push({ rss: feed.rss, reason: "missing rss or lastUpdated" });
          continue;
        }

        const row = await db.prepare('SELECT ROWID, lastUpdated FROM feeds WHERE id = ?').bind(feed.id).first();

        if (row) {
          const newDate = normalizeLastUpdatedValue(feed.lastUpdated);
          if (newDate && newDate !== row.lastUpdated) {
            await db.prepare('UPDATE feeds SET lastUpdated = ? WHERE id = ?').bind(newDate, row.id).run();
            updatedCount++;
            debug.push({ rss: feed.rss, updated: true, old: row.lastUpdated, new: newDate });
          } else {
            debug.push({ rss: feed.rss, updated: false, reason: "already up to date" });
          }
        } else {
          debug.push({ rss: feed.rss, updated: false, reason: "not found in DB" });
        }
      }
      return json({ success: true, updatedCount, debug }, 200);
    }


    if (p.endsWith('/favicon.ico')) {
      var resF = await fetch('https://raw.githubusercontent.com/iMahir/newrss/refs/heads/main/workers/favicon.png');
      var faviconData = await resF.blob();
      return new Response(faviconData, { headers: { 'Content-Type': 'image/x-icon' } });
    }

    return new Response('Not found', { status: 404 });
  }
};
