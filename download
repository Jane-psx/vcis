/**
 * vcis/shared/groq.js
 * Shared Groq API client for VCIS
 * Used by: 01-dashboard, 04-itw, 05-reviews, 08-analytics
 *
 * Key is stored in localStorage under 'vcis_groq_key'
 * Set it once on the Dashboard login screen — all modules read it from there.
 */

const GROQ = (() => {
  const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

  // Model choices — both well within free tier at 200 vendors w/ trimmed fields
  const MODELS = {
    fast:    'llama-3.1-8b-instant',    // scheduling, briefings  — 20k TPM limit
    smart:   'llama-3.3-70b-versatile', // deep analysis (optional upgrade)
  };

  /* ── Key management ───────────────────────────────────────────────── */
  function getKey()       { return localStorage.getItem('vcis_groq_key') || ''; }
  function setKey(k)      { localStorage.setItem('vcis_groq_key', k.trim()); }
  function clearKey()     { localStorage.removeItem('vcis_groq_key'); }
  function hasKey()       { return getKey().length > 0; }

  /* ── Core API call ────────────────────────────────────────────────── */
  async function call({ prompt, system, model, maxTokens = 900, temperature = 0.2 }) {
    const key = getKey();
    if (!key) throw new Error('NO_KEY');

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: model || MODELS.fast,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }, // guarantees valid JSON back
        messages: [
          {
            role: 'system',
            content: system || 'You are a procurement AI assistant for VCIS. Always respond with valid JSON only. No markdown, no explanation outside the JSON.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      // Surface rate-limit specifically so callers can show a useful message
      if (res.status === 429) throw new Error('RATE_LIMIT: ' + msg);
      throw new Error(msg);
    }

    return JSON.parse(data.choices[0].message.content);
  }

  /* ── Test connection ──────────────────────────────────────────────── */
  async function test() {
    return call({
      prompt: 'Return this json object exactly: {"ok":true,"model":"working"}',
      system: 'You are a json API. Always respond with valid json objects only.',
      maxTokens: 20,
    });
  }

  /* ── Field trimmers (keeps token count low at 200 vendors) ────────── */

  // For briefing / insights — only what Aria needs to reason about urgency
  function trimForBriefing(vendors) {
    return vendors.map(v => ({
      name:               v.name,
      category:           v.category,
      tier:               v.tier,
      status:             v.status,
      score:              v.score,
      badge:              v.badge,
      daysToExpiry:       v.daysToExpiry ?? null,
      adminFee:           v.adminFee,
      autoRenew:          v.autoRenew,
      terminationNotice:  v.terminationNotice,
      lastComm:           v.lastComm,
      followUp:           v.followUp,
      procContact:        v.procContact,
    }));
    // ~13 fields × 200 vendors ≈ 10,400 tokens — fits 8b-instant (20k TPM)
  }

  // For scheduling — only notes where dates might appear
  function trimForScheduling(records) {
    return records.map(r => ({
      name:     r.name     || r.vendor || '',
      notes:    (r.notes   || '').slice(0, 300), // cap long notes
      followUp: r.followUp || r.date  || '',
    }));
    // ~3 fields × 200 records ≈ 6,000 tokens — fits easily
  }

  /* ── Prompt builders ──────────────────────────────────────────────── */

  function buildBriefingPrompt(vendors) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    return `Today is ${today}. You are Aria, a procurement AI assistant embedded in VCIS.
Analyze this vendor portfolio and write a concise daily briefing for the procurement manager.

Vendor data:
${JSON.stringify(trimForBriefing(vendors), null, 2)}

Return ONLY this JSON:
{
  "summary": "2-3 sentence executive summary of the most critical situations today",
  "bullets": [
    { "text": "specific actionable insight mentioning vendor name and numbers", "severity": "critical|warning|info|positive" }
  ]
}

Rules:
- Maximum 5 bullets, ordered by urgency (critical first)
- Each bullet must name a specific vendor or metric
- severity must be exactly one of: critical, warning, info, positive`;
  }

  function buildInsightsPrompt(vendors, stats) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    return `Today is ${today}. You are Aria, a procurement analytics AI.
Analyze this vendor portfolio and generate analytics insights for the procurement team.

Vendor data (trimmed):
${JSON.stringify(trimForBriefing(vendors), null, 2)}

Portfolio stats:
${JSON.stringify(stats || {}, null, 2)}

Return ONLY this JSON:
{
  "summary": "2-3 sentence analytical summary of portfolio health and key patterns",
  "top_risk": "single most urgent portfolio risk in one sentence",
  "opportunity": "single biggest opportunity in one sentence",
  "bullets": [
    { "text": "specific insight with vendor name and numbers", "severity": "critical|warning|info|positive" }
  ]
}

Rules:
- Maximum 5 bullets ordered by severity (critical first)
- Each bullet must name a specific vendor or metric
- severity must be exactly: critical, warning, info, or positive`;
  }

  function buildSchedulingPrompt(records) {
    return `Scan these records and extract any dates, deadlines, meetings, or follow-up commitments mentioned in the notes.

Records:
${JSON.stringify(trimForScheduling(records), null, 2)}

Return ONLY this JSON:
{
  "detected_events": [
    {
      "record_name": "exact name from records",
      "event_title": "short calendar event title",
      "suggested_date": "YYYY-MM-DD",
      "event_type": "call|meeting|deadline|follow_up|review",
      "confidence": 0.0-1.0,
      "source_text": "exact phrase from notes that triggered detection"
    }
  ]
}

Rules:
- Only include events with confidence >= 0.6
- Only use names that exactly match the records provided
- If nothing found return {"detected_events": []}`;
  }

  /* ── Public API ───────────────────────────────────────────────────── */
  return {
    MODELS,
    getKey, setKey, clearKey, hasKey,
    call, test,
    trim: { forBriefing: trimForBriefing, forScheduling: trimForScheduling },
    prompts: {
      briefing:   buildBriefingPrompt,
      insights:   buildInsightsPrompt,
      scheduling: buildSchedulingPrompt,
    },
  };
})();
