/**
 * vcis/shared/groq.js  — v2
 * Single Groq API client for all VCIS modules.
 *
 * Load once per page:
 *   <script src="../shared/groq.js"></script>
 *
 * FIX: model is now read from localStorage('vcis_groq_model') so the
 * model selected in 11-settings.html is actually respected everywhere.
 */

const GROQ = (() => {
  const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const MODEL_DEFAULTS = {
    fast:  'llama-3.1-8b-instant',
    smart: 'llama-3.3-70b-versatile',
  };

  /* ── Key & model management ─────────────────────────────────── */
  function getKey()   { return localStorage.getItem('vcis_groq_key')   || ''; }
  function setKey(k)  { localStorage.setItem('vcis_groq_key', k.trim()); }
  function clearKey() { localStorage.removeItem('vcis_groq_key'); }
  function hasKey()   { return getKey().length > 0; }

  // Always read from localStorage so 11-settings changes take effect immediately
  function getModel() {
    return localStorage.getItem('vcis_groq_model') || MODEL_DEFAULTS.fast;
  }

  /* ── Core API call ──────────────────────────────────────────── */
  async function call({ prompt, system, maxTokens = 900, temperature = 0.2 }) {
    const key = getKey();
    if (!key) throw new Error('NO_KEY');

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: getModel(),
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
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
      if (res.status === 429) throw new Error('RATE_LIMIT: ' + msg);
      throw new Error(msg);
    }

    return JSON.parse(data.choices[0].message.content);
  }

  /* ── Test connection ────────────────────────────────────────── */
  async function test() {
    return call({
      prompt: 'Return this json object exactly: {"ok":true,"model":"working"}',
      system: 'You are a json API. Always respond with valid json objects only.',
      maxTokens: 20,
    });
  }

  /* ── Field trimmers ─────────────────────────────────────────── */
  function trimForBriefing(vendors) {
    return vendors.map(v => ({
      name:              v.name,
      category:          v.category,
      tier:              v.tier,
      status:            v.status,
      score:             v.score,
      badge:             v.badge,
      daysToExpiry:      v.daysToExpiry ?? null,
      adminFee:          v.adminFee,
      autoRenew:         v.autoRenew,
      terminationNotice: v.terminationNotice,
      lastComm:          v.lastComm,
      followUp:          v.followUp,
      procContact:       v.procContact,
    }));
  }

  function trimForScheduling(records) {
    return records.map(r => ({
      name:     r.name     || r.vendor || '',
      notes:    (r.notes   || '').slice(0, 300),
      followUp: r.followUp || r.date   || '',
    }));
  }

  /* ── Prompt builders ────────────────────────────────────────── */
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
      "confidence": 0.0,
      "source_text": "exact phrase from notes that triggered detection"
    }
  ]
}

Rules:
- Only include events with confidence >= 0.6
- Only use names that exactly match the records provided
- If nothing found return {"detected_events": []}`;
  }

  /* ── Public API ─────────────────────────────────────────────── */
  return {
    MODELS: MODEL_DEFAULTS,
    getKey, setKey, clearKey, hasKey, getModel,
    call, test,
    trim: { forBriefing: trimForBriefing, forScheduling: trimForScheduling },
    prompts: {
      briefing:   buildBriefingPrompt,
      insights:   buildInsightsPrompt,
      scheduling: buildSchedulingPrompt,
    },
  };
})();
