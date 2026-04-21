# VCIS — Vendor Contract Intelligence System

A fully client-side vendor contract management platform built in pure HTML, CSS, and JavaScript. No framework, no build step, no backend required. Open any `.html` file directly in your browser.

AI features (daily briefings, analytics insights, schedule detection) are powered by **Groq** — free, fast, and runs entirely in the browser.

---

## What's in the box

| Module | File | Description |
|--------|------|-------------|
| 01 Dashboard | `modules/01-dashboard.html` | KPI cards, Aria daily briefing (Groq), activity feed, data quality |
| 02 Vendor Database | `modules/02-vendor-database.html` | Full vendor table, search/filter, detail panel, Excel import, log notes |
| 03 Addendum Review | `modules/03-addendum-review.html` | File upload, copy-prompt AI comparison, Human Decision Tool |
| 04 In The Works | `modules/04-itw.html` | Kanban pipeline, Aria schedule detection (Groq), side panel |
| 05 Reviews & Tasks | `modules/05-reviews.html` | Expandable review cards, Aria schedule scan (Groq), prep prompts |
| 06 Calendar | `modules/06-calendar.html` | Month/week views, 7 event types, event detail panel |
| 07 Forecast | `modules/07-forecast.html` | Gantt timeline, financial summary, renewal strategy prompts |
| 08 Analytics | `modules/08-analytics.html` | 5 Chart.js charts, Aria insights panel (Groq) |
| 09 Audit Log | `modules/09-audit.html` | Immutable action log, filterable, expandable rows, CSV export |
| 10 Data Check | `modules/10-datacheck.html` | Issue table, completeness scores, inline Fix Now editing |
| 11 Settings | `modules/11-settings.html` | Groq API key, model selector, token budget meter, preferences |

### Shared files

| File | Purpose |
|------|---------|
| `shared/groq.js` | Groq API client, field trimmers, prompt builders — imported by AI modules |
| `shared/nav.js` | Shared sidebar + top-bar injector (optional, for future integration) |

---

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/vcis.git
cd vcis
```

### 2. Open the dashboard

No build step needed. Just open directly:

```bash
# macOS
open modules/01-dashboard.html

# Windows
start modules/01-dashboard.html

# Or serve locally (recommended for module-to-module navigation)
npx serve .
# then visit http://localhost:3000/modules/01-dashboard.html
```

### 3. Add your Groq API key

1. Go to [console.groq.com](https://console.groq.com) and create a free account
2. Generate an API key (starts with `gsk_`)
3. Open `modules/11-settings.html` and paste your key → click **Save Key**
4. Or enter it directly on the Dashboard login screen

The key is stored in `localStorage` — it never leaves your browser except in direct calls to `api.groq.com`.

---

## AI features (Groq)

VCIS uses Groq for two specific tasks only — everything else uses copy-prompt (you paste into your AI tool manually):

| Feature | Module | Groq used for |
|---------|--------|---------------|
| **Aria Daily Briefing** | Dashboard | Summarizes vendor portfolio urgency each day |
| **Analytics Insights** | Analytics | Generates actionable portfolio insights |
| **ITW Schedule Detection** | In The Works | Scans pipeline notes for dates/deadlines |
| **Review Schedule Detection** | Reviews & Tasks | Scans review notes for scheduling intents |

### Why Groq (not OpenAI)?

- Free tier is generous — 1M tokens/day, 20k tokens/minute on `llama-3.1-8b-instant`
- Runs directly from the browser — no backend proxy needed
- Fast enough for interactive use (~0.5s responses)
- API key is browser-only, no server-side secret management

### Token usage at 200 vendors

VCIS trims vendor records to only the fields each task needs before sending to Groq:

| Call | Fields sent | Tokens (200 vendors) | Free tier limit |
|------|------------|---------------------|-----------------|
| Briefing / Insights | 13 fields | ~10,400 | 20,000/min ✅ |
| Scheduling scan | 3 fields | ~6,000 | 20,000/min ✅ |

Both fit comfortably within the free tier using `llama-3.1-8b-instant`.

---

## Addendum Review — copy-prompt flow

The Addendum Review module (Module 03) does **not** use Groq automatically. Instead it uses a "copy-prompt" pattern:

1. Select vendor → upload addendum file
2. System builds a structured prompt with all vendor data pre-filled
3. Copy the prompt → paste into your AI tool (ChatGPT, Claude, Gemini, etc.) with the file attached
4. Copy the JSON response → paste back into VCIS
5. Human Decision Tool loads with all changes and risks surfaced

This is intentional — addendum analysis requires the actual document, which varies by file format and length. The copy-prompt approach keeps you in control of which AI you use and ensures you review the output before it changes any records.

---

## Project structure

```
vcis/
├── modules/
│   ├── 01-dashboard.html        # ← Start here
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
│   ├── groq.js                  # Shared Groq client + prompt builders
│   └── nav.js                   # Shared nav injector
├── assets/                      # Icons, images (empty for now)
└── README.md
```

---

## Hosting on GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Your app will be live at `https://YOUR_USERNAME.github.io/vcis/modules/01-dashboard.html`

No build step, no CI, no config — GitHub Pages serves static files directly.

---

## Connecting a real database

All modules currently use in-memory sample data. To connect real data:

1. Set up **Firebase Firestore** (free tier handles VCIS volume easily)
2. Add the Firebase SDK to each module's `<head>`:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore-compat.js"></script>
   ```
3. Replace `const VENDORS = [...]` in each module with Firestore reads
4. Replace save/update functions with Firestore writes

The data model (collection names, field names) is fully documented in the session that built this system.

---

## Roadmap

- [ ] Firebase Firestore integration
- [ ] Real Excel import via SheetJS (Module 02)
- [ ] PDF text extraction for addendum upload (Module 03)
- [ ] Shared nav.js wired into all modules
- [ ] Mobile-responsive layout
- [ ] Role-based access control (Admin / Manager / Viewer)
- [ ] Multi-user audit trail via Firebase Auth

---

## License

MIT — use it, modify it, ship it.
