/**
 * vcis/shared/nav.js
 * Injects the shared sidebar + top-bar into any VCIS module page.
 *
 * Usage: add ONE line to any module's <body>:
 *   <script src="../shared/nav.js"></script>
 *
 * Then call:  VCISNav.init({ page: 'vendors', title: 'Vendor Database', sub: '...' });
 */

const VCISNav = (() => {

  const PAGES = [
    { id: 'dashboard',  label: 'Dashboard',       file: '01-dashboard.html',       section: 'Main',     badge: null },
    { id: 'vendors',    label: 'Vendor Database',  file: '02-vendor-database.html', section: 'Main',     badge: null },
    { id: 'addendum',   label: 'Addendum Review',  file: '03-addendum-review.html', section: 'Main',     badge: { count: 2, type: 'red' } },
    { id: 'itw',        label: 'In The Works',     file: '04-itw.html',             section: 'Pipeline', badge: null },
    { id: 'reviews',    label: 'Reviews & Tasks',  file: '05-reviews.html',         section: 'Pipeline', badge: null },
    { id: 'calendar',   label: 'Calendar',         file: '06-calendar.html',        section: 'Schedule', badge: null },
    { id: 'forecast',   label: 'Forecast',         file: '07-forecast.html',        section: 'Schedule', badge: null },
    { id: 'analytics',  label: 'Analytics',        file: '08-analytics.html',       section: 'Insights', badge: null },
    { id: 'history',    label: 'History & Audit',  file: '09-audit.html',           section: 'Insights', badge: null },
    { id: 'datacheck',  label: 'Data Check',       file: '10-datacheck.html',       section: 'Insights', badge: { count: 7, type: 'amber' } },
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

  function icon(id) {
    return `<svg style="width:15px;height:15px;opacity:.7;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICONS[id] || ''}</svg>`;
  }

  function buildSidebar(activePage) {
    const user = JSON.parse(localStorage.getItem('vcis_user') || '{"name":"User","role":"Admin","initials":"U"}');
    const groqOn = !!(localStorage.getItem('vcis_groq_key'));

    let sections = {};
    PAGES.forEach(p => {
      if (!sections[p.section]) sections[p.section] = [];
      sections[p.section].push(p);
    });

    let navHTML = '';
    Object.entries(sections).forEach(([sec, pages]) => {
      navHTML += `<div style="padding:8px 16px 3px;font-size:9px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;font-weight:600">${sec}</div>`;
      pages.forEach(p => {
        const isActive = p.id === activePage;
        const badgeHTML = p.badge
          ? `<span style="margin-left:auto;font-size:9px;padding:1px 6px;border-radius:10px;font-weight:600;background:${p.badge.type === 'red' ? 'var(--red-dim)' : 'var(--amber-dim)'};color:${p.badge.type === 'red' ? 'var(--red)' : 'var(--amber)'}">${p.badge.count}</span>`
          : '';
        navHTML += `
          <a href="${p.file}" style="display:flex;align-items:center;gap:9px;padding:7px 16px;border-left:2px solid ${isActive ? 'var(--blue)' : 'transparent'};color:${isActive ? 'var(--blue)' : 'var(--muted2)'};font-size:12px;text-decoration:none;transition:all .12s;background:${isActive ? 'var(--blue-dim)' : 'transparent'};font-weight:${isActive ? '500' : '400'}">
            ${icon(p.id)}
            ${p.label}
            ${badgeHTML}
          </a>`;
      });
    });

    return `
      <aside style="width:220px;min-width:220px;background:var(--sb);border-right:1px solid var(--border);display:flex;flex-direction:column;height:100vh;position:fixed;top:0;left:0;z-index:50">
        <div style="padding:18px 16px 12px;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:30px;height:30px;background:var(--blue-dim);border:1px solid rgba(79,124,255,.3);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--blue)">VC</div>
            <div>
              <div style="font-size:13px;font-weight:700;letter-spacing:-.3px">VCIS</div>
              <div style="font-size:9px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase">Contract Intel</div>
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:4px;font-size:9px;padding:2px 7px;border-radius:10px;border:1px solid var(--border2);color:${groqOn ? 'var(--green)' : 'var(--muted)'}">
              <div style="width:5px;height:5px;border-radius:50%;background:${groqOn ? 'var(--green)' : 'var(--muted)'}"></div>
              ${groqOn ? 'AI on' : 'AI off'}
            </div>
          </div>
        </div>
        <nav style="flex:1;overflow-y:auto;padding:6px 0">${navHTML}</nav>
        <div style="padding:11px 16px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--blue-dim);border:1px solid rgba(79,124,255,.3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--blue);flex-shrink:0">${user.initials}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</div>
            <div style="font-size:9px;color:var(--muted)">${user.role}</div>
          </div>
          <a href="11-settings.html" style="font-size:10px;color:var(--muted);padding:2px 7px;border-radius:3px;border:1px solid var(--border);text-decoration:none" title="Settings">⚙</a>
        </div>
      </aside>`;
  }

  function buildTopBar(title, sub) {
    return `
      <div style="position:fixed;top:0;left:220px;right:0;height:52px;background:var(--sb);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:12px;z-index:40">
        <div>
          <div style="font-size:15px;font-weight:600;letter-spacing:-.2px">${title}</div>
          ${sub ? `<div style="font-size:11px;color:var(--muted2)">${sub}</div>` : ''}
        </div>
        <div style="margin-left:auto;font-size:11px;color:var(--muted);font-family:var(--mono)" id="vcis-clock"></div>
      </div>`;
  }

  function startClock() {
    const tick = () => {
      const el = document.getElementById('vcis-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick(); setInterval(tick, 1000);
  }

  function injectStyles() {
    if (document.getElementById('vcis-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'vcis-nav-styles';
    style.textContent = `
      :root{--bg:#0b0e1a;--sb:#0f1221;--card:#131729;--card2:#181d35;--border:#1e2444;--border2:#252b4f;--text:#e8ecf8;--muted:#5a6490;--muted2:#7a85b0;--blue:#4f7cff;--blue-dim:rgba(79,124,255,.12);--green:#22c55e;--green-dim:rgba(34,197,94,.12);--amber:#f59e0b;--amber-dim:rgba(245,158,11,.12);--red:#ef4444;--red-dim:rgba(239,68,68,.12);--purple:#a855f7;--purple-dim:rgba(168,85,247,.12);--teal:#14b8a6;--font:'Sora',sans-serif;--mono:'DM Mono',monospace;}
      body { margin-left: 220px; padding-top: 52px; }
      nav a:hover { background: rgba(255,255,255,.03) !important; color: var(--text) !important; }
      nav::-webkit-scrollbar { width: 3px; }
      nav::-webkit-scrollbar-thumb { background: var(--border2); }
    `;
    document.head.appendChild(style);
  }

  function init({ page, title, sub = '' }) {
    injectStyles();
    document.body.insertAdjacentHTML('afterbegin', buildSidebar(page) + buildTopBar(title, sub));
    startClock();
  }

  return { init };
})();
