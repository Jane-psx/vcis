/**
 * vcis/shared/nav.js  — v2
 * Injects the shared sidebar + top-bar into any VCIS module page.
 *
 * Usage — add TWO lines just before </body> in any module:
 *   <script src="../shared/groq.js"></script>
 *   <script src="../shared/nav.js"></script>
 *
 * Then call once the DOM is ready:
 *   VCISNav.init({ page: 'vendors', title: 'Vendor Database', sub: '...' });
 *
 * FIX: auth guard redirects to dashboard if not logged in
 * FIX: sign-out button and clock added to all pages via top-bar
 * FIX: AI on/off indicator reads from localStorage correctly
 * FIX: badge counts are computed from live data, not hardcoded
 */

const VCISNav = (() => {

  const PAGES = [
    { id: 'dashboard', label: 'Dashboard',      file: '01-dashboard.html',       section: 'Main' },
    { id: 'vendors',   label: 'Vendor Database', file: '02-vendor-database.html', section: 'Main' },
    { id: 'addendum',  label: 'Addendum Review', file: '03-addendum-review.html', section: 'Main' },
    { id: 'itw',       label: 'In The Works',    file: '04-itw.html',             section: 'Pipeline' },
    { id: 'reviews',   label: 'Reviews & Tasks', file: '05-reviews.html',         section: 'Pipeline' },
    { id: 'calendar',  label: 'Calendar',        file: '06-calendar.html',        section: 'Schedule' },
    { id: 'forecast',  label: 'Forecast',        file: '07-forecast.html',        section: 'Schedule' },
    { id: 'analytics', label: 'Analytics',       file: '08-analytics.html',       section: 'Insights' },
    { id: 'history',   label: 'History & Audit', file: '09-audit.html',           section: 'Insights' },
    { id: 'datacheck', label: 'Data Check',      file: '10-datacheck.html',       section: 'Insights' },
  ];

  const ICONS = {
    dashboard:  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    vendors:    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>',
    addendum:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    itw:        '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
    reviews:    '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    calendar:   '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    forecast:   '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>',
    analytics:  '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    history:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    datacheck:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  };

  /* ── Compute live badge counts from localStorage data ──────── */
  function getBadges() {
    const badges = {};
    try {
      // Addendum: count vendors whose addendum status is pending
      const addendums = JSON.parse(localStorage.getItem('vcis_addendums') || '[]');
      const pendingAdd = addendums.filter(a => a.status === 'pending' || !a.decision).length;
      if (pendingAdd > 0) badges.addendum = { count: pendingAdd, type: 'red' };

      // Datacheck: count open issues
      const issues = JSON.parse(localStorage.getItem('vcis_issues') || '[]');
      const openIssues = issues.filter(i => i.status !== 'resolved').length;
      if (openIssues > 0) badges.datacheck = { count: openIssues, type: 'amber' };
    } catch (e) {
      // If data is absent or malformed, show no badges
    }
    return badges;
  }

  function icon(id) {
    return `<svg style="width:15px;height:15px;opacity:.7;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[id] || ''}</svg>`;
  }

  /* ── Auth guard ─────────────────────────────────────────────── */
  function checkAuth() {
    try {
      const session = JSON.parse(localStorage.getItem('vcis_session') || 'null');
      if (!session || !session.name) {
        window.location.href = '01-dashboard.html';
        return null;
      }
      return session;
    } catch (e) {
      window.location.href = '01-dashboard.html';
      return null;
    }
  }

  /* ── Sign-out ────────────────────────────────────────────────── */
  function doSignOut() {
    localStorage.removeItem('vcis_session');
    window.location.href = '01-dashboard.html';
  }

  /* ── Sidebar builder ─────────────────────────────────────────── */
  function buildSidebar(activePage, user) {
    const groqOn = !!localStorage.getItem('vcis_groq_key');
    const badges = getBadges();

    let sections = {};
    PAGES.forEach(p => {
      if (!sections[p.section]) sections[p.section] = [];
      sections[p.section].push(p);
    });

    let navHTML = '';
    Object.entries(sections).forEach(([sec, pages]) => {
      navHTML += `<div class="nav-sec">${sec}</div>`;
      pages.forEach(p => {
        const isActive = p.id === activePage;
        const badge = badges[p.id];
        const badgeHTML = badge
          ? `<span class="nb ${badge.type === 'red' ? 'nb-red' : 'nb-amber'}">${badge.count}</span>`
          : '';
        navHTML += `
          <a href="${p.file}" class="nav-item${isActive ? ' active' : ''}">
            ${icon(p.id)}
            ${p.label}
            ${badgeHTML}
          </a>`;
      });
    });

    const initials = user.initials || (user.name || 'U')[0].toUpperCase();

    return `
      <div id="vcis-sidebar">
        <a href="01-dashboard.html" class="sb-logo">
          <div class="sb-mark">VC</div>
          <div style="flex:1"><div class="sb-name">VCIS</div><div class="sb-sub">Contract Intel</div></div>
          <div class="sb-ai">
            <span id="sb-ai-dot" style="width:5px;height:5px;border-radius:50%;background:${groqOn ? '#22c55e' : '#5a6490'};display:inline-block"></span>
            &nbsp;<span id="sb-ai-lbl" style="color:${groqOn ? '#22c55e' : '#5a6490'}">${groqOn ? 'AI on' : 'AI off'}</span>
          </div>
        </a>
        <nav>${navHTML}</nav>
        <div class="sb-foot">
          <div class="sb-av" id="sb-av">${initials}</div>
          <div style="flex:1;min-width:0">
            <div class="sb-un" id="sb-un">${user.name || 'User'}</div>
            <div class="sb-ur" id="sb-ur">${user.role || ''}</div>
          </div>
          <a href="11-settings.html" class="sb-cfg" title="Settings">&#9881;</a>
        </div>
      </div>`;
  }

  /* ── Top-bar builder ─────────────────────────────────────────── */
  function buildTopBar(title, sub, activePage) {
    // Dashboard manages its own top bar; skip for it
    if (activePage === 'dashboard') return '';

    return `
      <div class="top-bar" id="vcis-top-bar">
        <span class="top-logo">VCIS</span>
        <div class="divider" style="width:1px;height:18px;background:var(--border2);flex-shrink:0"></div>
        <span class="top-title">${title}</span>
        ${sub ? `<span class="top-sub">${sub}</span>` : ''}
        <div class="top-right" id="vcis-top-right-slot"></div>
        <div style="display:flex;align-items:center;gap:10px;margin-left:auto">
          <span class="clock" id="vcis-clock" style="font-size:11px;color:var(--muted);font-family:var(--mono)"></span>
          <button class="btn-signout" onclick="VCISNav.signOut()">Sign out</button>
        </div>
      </div>`;
  }

  /* ── Shared CSS injected once ────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('vcis-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'vcis-nav-styles';
    style.textContent = `
      :root{
        --bg:#0b0e1a;--sb:#0f1221;--card:#131729;--card2:#181d35;
        --border:#1e2444;--border2:#252b4f;--text:#e8ecf8;--muted:#5a6490;--muted2:#7a85b0;
        --blue:#4f7cff;--blue2:#3d6aff;--blue-dim:rgba(79,124,255,.12);
        --green:#22c55e;--green-dim:rgba(34,197,94,.12);
        --amber:#f59e0b;--amber-dim:rgba(245,158,11,.12);
        --red:#ef4444;--red-dim:rgba(239,68,68,.12);
        --purple:#a855f7;--purple-dim:rgba(168,85,247,.12);
        --teal:#14b8a6;--teal-dim:rgba(20,184,166,.12);
        --font:'Sora',sans-serif;--mono:'DM Mono',monospace;
      }
      body { margin-left:220px; padding-top:52px; }

      /* Sidebar */
      #vcis-sidebar{position:fixed;top:0;left:0;width:220px;height:100vh;background:#0f1221;border-right:1px solid #1e2444;display:flex;flex-direction:column;z-index:100;overflow:hidden;font-family:'Sora',sans-serif}
      #vcis-sidebar .sb-logo{padding:16px;border-bottom:1px solid #1e2444;display:flex;align-items:center;gap:8px;text-decoration:none}
      #vcis-sidebar .sb-mark{width:30px;height:30px;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#4f7cff;flex-shrink:0}
      #vcis-sidebar .sb-name{font-size:13px;font-weight:700;color:#e8ecf8}
      #vcis-sidebar .sb-sub{font-size:9px;color:#5a6490;letter-spacing:.06em;text-transform:uppercase}
      #vcis-sidebar .sb-ai{font-size:9px;padding:2px 7px;border-radius:10px;border:1px solid #1e2444;display:flex;align-items:center;gap:4px;margin-left:auto;white-space:nowrap}
      #vcis-sidebar nav{flex:1;overflow-y:auto;padding:6px 0}
      #vcis-sidebar nav::-webkit-scrollbar{width:3px}
      #vcis-sidebar nav::-webkit-scrollbar-thumb{background:#252b4f}
      #vcis-sidebar .nav-sec{padding:8px 16px 3px;font-size:9px;color:#5a6490;letter-spacing:.1em;text-transform:uppercase;font-weight:600}
      #vcis-sidebar a.nav-item{display:flex;align-items:center;gap:9px;padding:7px 16px;border-left:2px solid transparent;color:#7a85b0;font-size:12px;text-decoration:none;transition:all .12s;white-space:nowrap}
      #vcis-sidebar a.nav-item:hover{background:rgba(255,255,255,.03);color:#e8ecf8}
      #vcis-sidebar a.nav-item.active{color:#4f7cff;border-left-color:#4f7cff;background:rgba(79,124,255,.12);font-weight:500}
      #vcis-sidebar a.nav-item svg,#vcis-sidebar a.nav-item:hover svg{opacity:.7}
      #vcis-sidebar a.nav-item.active svg{opacity:1}
      #vcis-sidebar .nb{margin-left:auto;font-size:9px;padding:1px 6px;border-radius:10px;font-weight:600;flex-shrink:0}
      #vcis-sidebar .nb-red{background:rgba(239,68,68,.12);color:#ef4444}
      #vcis-sidebar .nb-amber{background:rgba(245,158,11,.12);color:#f59e0b}
      #vcis-sidebar .sb-foot{padding:11px 16px;border-top:1px solid #1e2444;display:flex;align-items:center;gap:8px}
      #vcis-sidebar .sb-av{width:28px;height:28px;border-radius:50%;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#4f7cff;flex-shrink:0}
      #vcis-sidebar .sb-un{font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#e8ecf8}
      #vcis-sidebar .sb-ur{font-size:9px;color:#5a6490}
      #vcis-sidebar .sb-cfg{font-size:11px;color:#5a6490;padding:3px 7px;border-radius:3px;border:1px solid #1e2444;text-decoration:none;flex-shrink:0}
      #vcis-sidebar .sb-cfg:hover{color:#4f7cff;border-color:#4f7cff}

      /* Top bar (shared, non-dashboard pages) */
      .top-bar{position:fixed;top:0;left:220px;right:0;z-index:50;display:flex;align-items:center;padding:0 24px;height:52px;border-bottom:1px solid var(--border);background:var(--sb);gap:12px}
      .top-logo{font-size:11px;letter-spacing:.2em;color:var(--blue);font-weight:600;text-transform:uppercase;flex-shrink:0}
      .top-title{font-size:15px;font-weight:600;letter-spacing:-.2px;flex-shrink:0}
      .top-sub{font-size:11px;color:var(--muted2)}
      .top-right{display:flex;gap:8px;align-items:center}
      .btn-signout{font-size:11px;color:var(--muted2);background:transparent;border:1px solid var(--border2);border-radius:5px;padding:4px 10px;cursor:pointer;font-family:var(--font);flex-shrink:0}
      .btn-signout:hover{color:var(--red);border-color:var(--red)}
    `;
    document.head.appendChild(style);
  }

  /* ── Clock ──────────────────────────────────────────────────── */
  function startClock() {
    const tick = () => {
      const el = document.getElementById('vcis-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Public init ─────────────────────────────────────────────── */
  /**
   * @param {object} opts
   * @param {string}  opts.page       - page id matching PAGES[].id
   * @param {string}  opts.title      - top-bar page title
   * @param {string}  [opts.sub]      - optional subtitle
   * @param {boolean} [opts.noAuth]   - set true only on 01-dashboard (manages own auth)
   */
  function init({ page, title, sub = '', noAuth = false }) {
    injectStyles();

    let user = { name: 'User', role: '', initials: 'U' };

    if (!noAuth) {
      const session = checkAuth();
      if (!session) return; // redirect already triggered
      user = session;
    }

    // Inject sidebar + top bar at the start of <body>
    const html = buildSidebar(page, user) + buildTopBar(title, sub, page);
    document.body.insertAdjacentHTML('afterbegin', html);

    startClock();
  }

  /**
   * Call to append page-specific action buttons into the top bar's right slot.
   * Example: VCISNav.addTopBarActions('<button ...>Export</button>');
   */
  function addTopBarActions(html) {
    const slot = document.getElementById('vcis-top-right-slot');
    if (slot) slot.innerHTML = html;
  }

  return { init, addTopBarActions, signOut: doSignOut };
})();
