# VCIS — Vendor Contract Intelligence System

A client-side vendor contract management platform. No framework, no build step, no backend. Open any `.html` file directly in your browser or serve via GitHub Pages.

---

## Quick start

```
https://YOUR_USERNAME.github.io/vcis/modules/01-dashboard.html
```

Or clone and open locally:
```bash
git clone https://github.com/YOUR_USERNAME/vcis.git
cd vcis
open modules/01-dashboard.html   # macOS
# or just double-click the file in Finder / Explorer
```

---

## Modules

| # | File | Description |
|---|------|-------------|
| 01 | `modules/01-dashboard.html` | Login · KPI cards · Aria AI briefing · Activity feed |
| 02 | `modules/02-vendor-database.html` | Vendor table · Search/filter · Detail panel · Excel import |
| 03 | `modules/03-addendum-review.html` | File upload · AI comparison prompt · Human Decision Tool |
| 04 | `modules/04-itw.html` | Kanban pipeline · Aria schedule detection |
| 05 | `modules/05-reviews.html` | Review cards · Aria schedule scan · Prep prompts |
| 06 | `modules/06-calendar.html` | Month/week calendar · 7 event types |
| 07 | `modules/07-forecast.html` | Gantt timeline · Renewal strategy prompts |
| 08 | `modules/08-analytics.html` | 5 charts · Aria analytics insights |
| 09 | `modules/09-audit.html` | Immutable audit log · Filterable · CSV export |
| 10 | `modules/10-datacheck.html` | Issue table · Completeness scores · Fix Now |
| 11 | `modules/11-settings.html` | Groq API key · Model selector · Preferences |

---

## AI Setup (Groq)

VCIS uses [Groq](https://console.groq.com) for two features:
- **Aria Daily Briefing** — summarizes vendor portfolio urgency each morning
- **Schedule Detection** — scans ITW and review notes for dates and deadlines
- **Analytics Insights** — generates actionable portfolio analysis

**To enable:**
1. Get a free key at [console.groq.com](https://console.groq.com) (no credit card)
2. Open `modules/11-settings.html`
3. Paste your `gsk_...` key → Save → Test
4. All modules read it automatically from localStorage

Uses `llama-3.1-8b-instant` — fits 200+ vendors within the free tier (20k tokens/min).

---

## Folder structure

```
vcis/
├── index.html                 ← entry point, redirects to dashboard
├── modules/
│   ├── 01-dashboard.html
│   ├── 02-vendor-database.html
│   ├── 03-addendum-review.html
│   ├── 04-itw.html
│   ├── 05-reviews.html
│   ├── 06-calendar.html
│   ├── 07-forecast.html
│   ├── 08-analytics.html
│   ├── 09-audit.html
│   ├── 10-datacheck.html
│   └── 11-settings.html
├── shared/
│   ├── groq.js                ← Groq client · field trimmers · prompt builders
│   └── nav.js                 ← shared sidebar injector
├── assets/                    ← icons / images (future)
├── README.md
└── .gitignore
```

---

## GitHub Pages

Repo → Settings → Pages → Source: `main` branch → `/ (root)` → Save

Live at: `https://YOUR_USERNAME.github.io/vcis/`
