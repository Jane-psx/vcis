/**
 * vcis/shared/data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central data layer for VCIS. All modules include this one file.
 * Handles: localStorage r/w, schema, audit logging, session, cross-module sync.
 *
 * Usage: <script src="../shared/data.js"></script>
 * Then call: VCIS.vendors.getAll(), VCIS.audit.log({...}), etc.
 */

const VCIS = (() => {
  'use strict';

  // ── localStorage keys ───────────────────────────────────────────────────────
  const KEYS = {
    vendors:   'vcis_vendors',    // array of vendor objects
    addendums: 'vcis_addendums',  // array of addendum review records
    itw:       'vcis_itw',        // array of ITW pipeline records
    reviews:   'vcis_reviews',    // array of vendor review records
    events:    'vcis_events',     // array of calendar event records
    audit:     'vcis_audit',      // array of audit log entries (append-only)
    activity:  'vcis_activity',   // array of recent activity (last 50)
    session:   'vcis_session',    // current user session
    user:      'vcis_user',       // persisted user profile
    prefs:     'vcis_prefs',      // UI preferences
    groqKey:   'vcis_groq_key',   // Groq API key
    groqModel: 'vcis_groq_model', // selected Groq model
  };

  // ── Vendor schema (canonical field list) ────────────────────────────────────
  const VENDOR_SCHEMA = {
    // Identity
    id:                 { type: 'string',  required: true,  label: 'Vendor ID' },
    name:               { type: 'string',  required: true,  label: 'Vendor Name' },
    company:            { type: 'string',  required: true,  label: 'Company Name' },
    aka:                { type: 'string',  required: false, label: 'Also Known As' },
    website:            { type: 'string',  required: false, label: 'Website' },
    about:              { type: 'string',  required: false, label: 'About' },
    // Classification
    category:           { type: 'string',  required: true,  label: 'Category' },
    subCategory:        { type: 'string',  required: false, label: 'Sub-Category' },
    product:            { type: 'string',  required: false, label: 'Product' },
    tier:               { type: 'string',  required: true,  label: 'Tier' },
    classOfTrade:       { type: 'string',  required: false, label: 'Class of Trade' },
    markets:            { type: 'string',  required: false, label: 'Markets' },
    status:             { type: 'string',  required: true,  label: 'Status' },
    // Contract
    contractNo:         { type: 'string',  required: true,  label: 'Contract No.' },
    contractName:       { type: 'string',  required: false, label: 'Contract Name' },
    agreementType:      { type: 'string',  required: true,  label: 'Agreement Type' },
    effectiveDate:      { type: 'date',    required: true,  label: 'Effective Date' },
    expiry:             { type: 'date',    required: true,  label: 'Expiry Date' },
    contractTerm:       { type: 'string',  required: false, label: 'Contract Term' },
    currentTerm:        { type: 'string',  required: false, label: 'Current Term' },
    // Renewal
    autoRenew:          { type: 'string',  required: true,  label: 'Auto-Renew' },
    autoRenewType:      { type: 'string',  required: false, label: 'Auto-Renew Type' },
    terminationNotice:  { type: 'string',  required: true,  label: 'Termination Notice' },
    // Financial
    adminFee:           { type: 'string',  required: true,  label: 'Admin Fee' },
    adminFeeNotes:      { type: 'string',  required: false, label: 'Admin Fee Notes' },
    tiers:              { type: 'string',  required: false, label: 'Fee Tiers' },
    gpo:                { type: 'string',  required: false, label: 'GPO' },
    // Legal
    exclusivity:        { type: 'string',  required: false, label: 'Exclusivity' },
    assignment:         { type: 'string',  required: false, label: 'Assignment' },
    perpetuity:         { type: 'string',  required: false, label: 'Perpetuity' },
    tail:               { type: 'string',  required: false, label: 'Tail Clause' },
    // Primary Contact
    procContact:        { type: 'string',  required: true,  label: 'Primary Contact' },
    title:              { type: 'string',  required: false, label: 'Title' },
    bizPhone:           { type: 'string',  required: true,  label: 'Business Phone' },
    mobile:             { type: 'string',  required: false, label: 'Mobile' },
    email:              { type: 'string',  required: true,  label: 'Email' },
    // Secondary Contact
    shared2:            { type: 'string',  required: false, label: 'Contact 2 Name' },
    title2:             { type: 'string',  required: false, label: 'Contact 2 Title' },
    mobile2:            { type: 'string',  required: false, label: 'Contact 2 Mobile' },
    email2:             { type: 'string',  required: false, label: 'Contact 2 Email' },
    // Activity
    lastComm:           { type: 'date',    required: false, label: 'Last Communication' },
    followUp:           { type: 'date',    required: false, label: 'Follow-up Date' },
    notes:              { type: 'string',  required: false, label: 'Notes' },
    comments:           { type: 'string',  required: false, label: 'Comments' },
    // Computed (not stored in Excel, calculated on load)
    score:              { type: 'number',  required: false, label: 'Priority Score',   computed: true },
    badge:              { type: 'string',  required: false, label: 'Effectivity Badge', computed: true },
    completeness:       { type: 'number',  required: false, label: 'Completeness %',   computed: true },
    addendumPending:    { type: 'boolean', required: false, label: 'Addendum Pending',  computed: true },
  };

  // ── Addendum review schema ──────────────────────────────────────────────────
  const ADDENDUM_SCHEMA = {
    id:                 { label: 'Review ID' },
    vendorId:           { label: 'Vendor ID' },
    vendorName:         { label: 'Vendor Name' },
    uploadedFileName:   { label: 'Uploaded File' },
    uploadedAt:         { label: 'Upload Timestamp' },
    status:             { label: 'Status' },           // Pending|Draft|Completed|Discarded
    // Raw AI output (copy-paste JSON from user)
    aiAnalysis:         { label: 'AI Analysis JSON' }, // full parsed object
    // Human decisions (one per changed field)
    decisions:          { label: 'Human Decisions' },  // array: { fieldName, decision, customValue, note }
    // Finalized data (merged result — written to vendor record)
    finalizedData:      { label: 'Finalized Data' },   // flat object of field:value
    finalizedAt:        { label: 'Finalized At' },
    finalizedBy:        { label: 'Finalized By' },
    overallNote:        { label: 'Overall Note' },
    calendarEventAdded: { label: 'Calendar Event Added' },
  };

  // ── Excel column map ─────────────────────────────────────────────────────────
  // Maps Excel column headers (from Vendor_Catalogue.xlsm) → VCIS field names
  // Handles both exact match and common variations
  const EXCEL_COLUMN_MAP = {
    // Exact sheet column names → vcis field
    'Vendor Name':          'name',
    'Company Name':         'company',
    'AKA':                  'aka',
    'Website':              'website',
    'About':                'about',
    'Category':             'category',
    'Sub-Category':         'subCategory',
    'Sub Category':         'subCategory',
    'Product':              'product',
    'Tier':                 'tier',
    'Class of Trade':       'classOfTrade',
    'Markets':              'markets',
    'Status':               'status',
    'Contract No':          'contractNo',
    'Contract No.':         'contractNo',
    'Contract Number':      'contractNo',
    'Contract Name':        'contractName',
    'Agreement Type':       'agreementType',
    'Effective Date':       'effectiveDate',
    'In Contract Since':    'effectiveDate',
    'Expiry Date':          'expiry',
    'Expiry':               'expiry',
    'Contract Expiry':      'expiry',
    'Contract Term':        'contractTerm',
    'Current Term':         'currentTerm',
    'Auto-Renew':           'autoRenew',
    'Auto Renew':           'autoRenew',
    'Auto-Renew Type':      'autoRenewType',
    'Termination Notice':   'terminationNotice',
    'Notice Period':        'terminationNotice',
    'Admin Fee':            'adminFee',
    'Admin Fee %':          'adminFee',
    'Admin Fee Notes':      'adminFeeNotes',
    'Tiers':                'tiers',
    'Fee Tiers':            'tiers',
    'GPO':                  'gpo',
    'GPO Affiliation':      'gpo',
    'Exclusivity':          'exclusivity',
    'Assignment':           'assignment',
    'Perpetuity':           'perpetuity',
    'Tail':                 'tail',
    'Tail Clause':          'tail',
    'Primary Contact':      'procContact',
    'Procurement Contact':  'procContact',
    'Contact Name':         'procContact',
    'Contact':              'procContact',
    'Title':                'title',
    'Business Phone':       'bizPhone',
    'Phone':                'bizPhone',
    'Biz Phone':            'bizPhone',
    'Mobile':               'mobile',
    'Cell':                 'mobile',
    'Email':                'email',
    'Contact 2':            'shared2',
    'Secondary Contact':    'shared2',
    'Title 2':              'title2',
    'Mobile 2':             'mobile2',
    'Email 2':              'email2',
    'Last Communication':   'lastComm',
    'Last Comm':            'lastComm',
    'Last Contact':         'lastComm',
    'Follow-up':            'followUp',
    'Follow Up':            'followUp',
    'Follow-up Date':       'followUp',
    'Notes':                'notes',
    'Comments':             'comments',
  };

  // ── Computed fields ──────────────────────────────────────────────────────────
  function calcScore(v) {
    let score = 1.0;
    const days = v.expiry ? Math.round((new Date(v.expiry + 'T12:00:00') - new Date()) / 86400000) : 9999;
    const noticeDays = parseNoticeDays(v.terminationNotice);
    const noticeDL = noticeDays && v.expiry ? days - noticeDays : null;

    if (v.autoRenew === 'No' || !v.autoRenew) {
      if (days < 0)    score += 3;
      else if (days <= 7)   score += 5;
      else if (days <= 30)  score += 4.5;
      else if (days <= 60)  score += 3.5;
      else if (days <= 90)  score += 2.5;
      else if (days <= 180) score += 1;
    } else {
      if (noticeDL !== null) {
        if (noticeDL < 0)   score += 3.5;
        else if (noticeDL <= 14) score += 3;
        else if (noticeDL <= 30) score += 2;
        else if (noticeDL <= 60) score += 1;
      }
    }
    const feeNum = parseFloat(v.adminFee) || 0;
    if (feeNum >= 10) score += 2;
    else if (feeNum >= 6) score += 1.5;
    else if (feeNum >= 3) score += 0.5;

    if (v.followUp) {
      const fuDays = Math.round((new Date(v.followUp + 'T12:00:00') - new Date()) / 86400000);
      if (fuDays < -14) score += 1.5;
      else if (fuDays < -7) score += 1;
      else if (fuDays < 0)  score += 0.5;
    }

    if (v.status === 'In Renewal') score = Math.min(score, 4);
    if (v.status === 'Dormant')    score = Math.min(score, 2);
    if (days < 0 && v.status !== 'In Renewal') score = Math.max(score, 3);
    return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
  }

  function calcBadge(v) {
    const days = v.expiry ? Math.round((new Date(v.expiry + 'T12:00:00') - new Date()) / 86400000) : 9999;
    if (days < 0)         return 'gray';
    if (v.status === 'In Renewal') return 'blue';
    if (days <= 30)       return 'red';
    if (days <= 90)       return 'amber';
    return 'green';
  }

  function calcCompleteness(v) {
    const required    = ['name','company','category','contractNo','expiry','adminFee','autoRenew','terminationNotice','procContact','email','bizPhone','status','effectiveDate','agreementType'];
    const recommended = ['tier','gpo','exclusivity','lastComm','followUp','website','classOfTrade','markets','contractTerm'];
    const optional    = ['notes','shared2','email2','mobile2','tiers','about','tail','perpetuity','assignment','mobile','title','aka'];

    const req  = required.filter(f => v[f] && String(v[f]).trim()).length;
    const rec  = recommended.filter(f => v[f] && String(v[f]).trim()).length;
    const opt  = optional.filter(f => v[f] && String(v[f]).trim()).length;
    const max  = required.length * 3 + recommended.length * 2 + optional.length;
    return Math.round(((req * 3 + rec * 2 + opt) / max) * 100);
  }

  function parseNoticeDays(notice) {
    if (!notice) return null;
    const m = String(notice).match(/(\d+)\s*(day|month|year)/i);
    if (!m) return null;
    const n = parseInt(m[1]);
    const u = m[2].toLowerCase();
    return u.startsWith('d') ? n : u.startsWith('m') ? n * 30 : n * 365;
  }

  function enrichVendor(v) {
    return {
      ...v,
      score:       calcScore(v),
      badge:       calcBadge(v),
      completeness: calcCompleteness(v),
    };
  }

  // ── Generic storage helpers ──────────────────────────────────────────────────
  function read(key, def = []) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
    catch { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { console.error('VCIS write failed', key, e); return false; }
  }

  // ── Audit logger ─────────────────────────────────────────────────────────────
  function audit(entry) {
    const user    = read(KEYS.user, {});
    const session = read(KEYS.session, {});
    const log     = read(KEYS.audit, []);
    const newEntry = {
      id:         'al-' + Date.now(),
      time:       new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      timestamp:  Date.now(),
      user:       session.name  || user.name  || 'Unknown',
      userInitials: session.initials || user.initials || '?',
      userColor:  session.color || '#4f7cff',
      userRole:   session.role  || user.role  || 'User',
      sessionId:  session.sessionId || 'sess-' + (session.ts || '0'),
      ip:         'client-side',
      triggered:  'Human',
      ...entry,
    };
    log.push(newEntry);
    write(KEYS.audit, log);

    // Also append to activity feed (keep last 50)
    const activity = read(KEYS.activity, []);
    activity.unshift({
      time:      newEntry.time,
      user:      newEntry.user,
      initials:  newEntry.userInitials,
      color:     newEntry.userColor,
      action:    newEntry.action,
      vendor:    newEntry.vendor || '',
      triggered: newEntry.triggered,
    });
    write(KEYS.activity, activity.slice(0, 50));
  }

  // ── Session ──────────────────────────────────────────────────────────────────
  const session = {
    get() {
      const s = read(KEYS.session, null);
      if (!s) return null;
      if (Date.now() - s.ts > 8 * 60 * 60 * 1000) { this.clear(); return null; }
      return s;
    },
    save(user) {
      const s = {
        ...user,
        ts:        Date.now(),
        sessionId: 'sess-' + Date.now(),
        color:     user.color || '#4f7cff',
      };
      write(KEYS.session, s);
      write(KEYS.user, user);
      return s;
    },
    clear() { localStorage.removeItem(KEYS.session); },
    isLoggedIn() { return !!this.get(); },
    requireLogin() {
      if (!this.isLoggedIn()) {
        window.location.href = '01-dashboard.html';
        return false;
      }
      return true;
    },
  };

  // ── Vendors ──────────────────────────────────────────────────────────────────
  const vendors = {
    getAll()          { return read(KEYS.vendors, []).map(enrichVendor); },
    getById(id)       { return this.getAll().find(v => v.id === id) || null; },
    save(arr) {
      write(KEYS.vendors, arr.map(v => {
        // Strip computed fields before saving — recalculate on load
        const { score, badge, completeness, ...rest } = v;
        return rest;
      }));
    },
    upsert(vendor) {
      const arr = read(KEYS.vendors, []);
      const idx = arr.findIndex(v => v.id === vendor.id);
      const { score, badge, completeness, ...clean } = vendor;
      if (idx >= 0) arr[idx] = clean; else arr.push(clean);
      write(KEYS.vendors, arr);
    },
    updateFields(id, fields) {
      const arr = read(KEYS.vendors, []);
      const idx = arr.findIndex(v => v.id === id);
      if (idx < 0) return false;
      arr[idx] = { ...arr[idx], ...fields };
      write(KEYS.vendors, arr);
      return true;
    },
    delete(id) {
      const arr = read(KEYS.vendors, []).filter(v => v.id !== id);
      write(KEYS.vendors, arr);
    },

    // ── Import from Excel rows ────────────────────────────────────────────────
    importFromRows(rows, sheetName) {
      if (!rows || !rows.length) return { created: 0, updated: 0, skipped: 0, errors: [] };
      const headers = rows[0];
      const existing = read(KEYS.vendors, []);
      const results  = { created: 0, updated: 0, skipped: 0, errors: [] };

      rows.slice(1).forEach((row, ri) => {
        if (row.every(c => !c)) return; // skip blank rows
        const raw = {};
        headers.forEach((h, i) => {
          const field = EXCEL_COLUMN_MAP[h] || EXCEL_COLUMN_MAP[String(h).trim()];
          if (field) raw[field] = String(row[i] || '').trim();
        });

        if (!raw.name) { results.skipped++; return; }

        // Generate stable ID from contract number or name
        const id = raw.contractNo
          ? 'v-' + raw.contractNo.replace(/\W+/g, '-').toLowerCase()
          : 'v-' + raw.name.replace(/\W+/g, '-').toLowerCase().slice(0, 30);

        // Normalize admin fee — ensure it ends with %
        if (raw.adminFee && !raw.adminFee.includes('%')) raw.adminFee = raw.adminFee + '%';

        // Normalize auto-renew
        if (raw.autoRenew) {
          const ar = raw.autoRenew.toLowerCase();
          raw.autoRenew = ar.includes('y') || ar === 'true' || ar === '1' ? 'Yes' : 'No';
        }

        const vendor = { id, ...raw, status: raw.status || 'Active' };
        const existIdx = existing.findIndex(v => v.id === id || v.name === raw.name);
        if (existIdx >= 0) { existing[existIdx] = { ...existing[existIdx], ...vendor }; results.updated++; }
        else { existing.push(vendor); results.created++; }
      });

      write(KEYS.vendors, existing);
      audit({
        action: 'Import', vendor: `Batch — ${results.created} created, ${results.updated} updated`,
        field: '', oldVal: '', newVal: `${results.created + results.updated} records`,
        triggered: 'Human', notes: `Sheet: ${sheetName}. Skipped: ${results.skipped}`,
      });
      return results;
    },
  };

  // ── Addendum Reviews ─────────────────────────────────────────────────────────
  const addendums = {
    getAll()    { return read(KEYS.addendums, []); },
    getByVendor(vendorId) { return this.getAll().filter(a => a.vendorId === vendorId); },
    getById(id) { return this.getAll().find(a => a.id === id) || null; },

    // Create new review when addendum is uploaded
    create(vendorId, vendorName, fileName) {
      const review = {
        id:               'ar-' + Date.now(),
        vendorId,
        vendorName,
        uploadedFileName: fileName,
        uploadedAt:       new Date().toISOString(),
        status:           'Pending',
        aiAnalysis:       null,
        decisions:        [],
        finalizedData:    null,
        finalizedAt:      null,
        finalizedBy:      null,
        overallNote:      '',
        calendarEventAdded: false,
      };
      const arr = read(KEYS.addendums, []);
      arr.push(review);
      write(KEYS.addendums, arr);
      audit({
        action: 'Addendum Upload', vendor: vendorName,
        field: '', oldVal: '', newVal: fileName,
        triggered: 'Human', notes: `File: ${fileName}`,
      });
      // Mark vendor as having pending addendum
      vendors.updateFields(vendorId, { addendumPending: true });
      return review;
    },

    // Save AI analysis result (after user pastes JSON)
    saveAnalysis(reviewId, analysisJson) {
      const arr = read(KEYS.addendums, []);
      const idx = arr.findIndex(a => a.id === reviewId);
      if (idx < 0) return false;
      arr[idx].aiAnalysis = analysisJson;
      arr[idx].status     = 'Draft';
      write(KEYS.addendums, arr);
      audit({
        action: 'AI Analysis', vendor: arr[idx].vendorName,
        triggered: 'AI',
        notes: `Confidence: ${Math.round((analysisJson.confidence_score||0)*100)}%. Rec: ${analysisJson.overall_recommendation}. Changes: ${(analysisJson.changes||[]).length}`,
        aiResponse: JSON.stringify(analysisJson).slice(0, 300),
      });
      return true;
    },

    // Save human decisions
    saveDecisions(reviewId, decisions, overallNote) {
      const arr = read(KEYS.addendums, []);
      const idx = arr.findIndex(a => a.id === reviewId);
      if (idx < 0) return false;
      arr[idx].decisions   = decisions;
      arr[idx].overallNote = overallNote;
      arr[idx].status      = 'Draft';
      write(KEYS.addendums, arr);
      return true;
    },

    // Finalize — merge decisions into vendor record
    finalize(reviewId, decisions, overallNote) {
      const arr    = read(KEYS.addendums, []);
      const idx    = arr.findIndex(a => a.id === reviewId);
      if (idx < 0) return { ok: false, error: 'Review not found' };

      const review = arr[idx];
      const user   = session.get() || read(KEYS.user, {});
      const changes = review.aiAnalysis?.changes || [];

      // Build finalized data — apply each human decision
      const finalizedData = {};
      const changeLog     = [];

      changes.forEach(ch => {
        const dec = decisions[ch.field_name];
        if (!dec) return;

        let newValue;
        if (dec.decision === 'accept')  newValue = ch.proposed_value;
        else if (dec.decision === 'keep')  newValue = ch.current_value;
        else if (dec.decision === 'custom') newValue = dec.customValue;
        else return;

        if (newValue !== ch.current_value) {
          finalizedData[ch.field_name] = newValue;
          changeLog.push({
            field:    ch.field_name,
            label:    ch.field_label,
            oldVal:   ch.current_value,
            newVal:   newValue,
            decision: dec.decision,
            note:     dec.note || '',
          });
        }
      });

      // Save finalized record on addendum
      arr[idx].finalizedData     = finalizedData;
      arr[idx].decisions         = decisions;
      arr[idx].overallNote       = overallNote;
      arr[idx].finalizedAt       = new Date().toISOString();
      arr[idx].finalizedBy       = user.name || 'User';
      arr[idx].status            = 'Completed';
      write(KEYS.addendums, arr);

      // Apply changes to vendor record
      if (Object.keys(finalizedData).length > 0) {
        vendors.updateFields(review.vendorId, finalizedData);
      }

      // Clear addendumPending flag
      vendors.updateFields(review.vendorId, { addendumPending: false });

      // Audit each field change
      changeLog.forEach(ch => {
        audit({
          action:    'Human Decision',
          vendor:    review.vendorName,
          field:     ch.field,
          oldVal:    ch.oldVal,
          newVal:    ch.newVal,
          triggered: 'Human',
          notes:     `Decision: ${ch.decision}. ${ch.note}. Review ID: ${reviewId}`,
        });
      });

      // One summary audit entry
      audit({
        action:    'Addendum Finalized',
        vendor:    review.vendorName,
        triggered: 'Human',
        notes:     `${changeLog.length} field(s) updated. ${overallNote}. File: ${review.uploadedFileName}`,
      });

      return { ok: true, finalizedData, changeCount: changeLog.length };
    },

    discard(reviewId) {
      const arr = read(KEYS.addendums, []);
      const idx = arr.findIndex(a => a.id === reviewId);
      if (idx < 0) return;
      const name = arr[idx].vendorName;
      arr[idx].status = 'Discarded';
      write(KEYS.addendums, arr);
      vendors.updateFields(arr[idx].vendorId, { addendumPending: false });
      audit({ action: 'Addendum Discarded', vendor: name, triggered: 'Human' });
    },
  };

  // ── ITW ──────────────────────────────────────────────────────────────────────
  const itw = {
    getAll()    { return read(KEYS.itw, []); },
    save(arr)   { write(KEYS.itw, arr); },
    add(record) {
      const arr  = read(KEYS.itw, []);
      const item = { id: 'itw-' + Date.now(), ...record, createdAt: new Date().toISOString() };
      arr.push(item);
      write(KEYS.itw, arr);
      audit({ action: 'Create', vendor: record.name, triggered: 'Human', notes: 'Added to ITW pipeline' });
      return item;
    },
    update(id, fields) {
      const arr = read(KEYS.itw, []);
      const idx = arr.findIndex(x => x.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...fields }; write(KEYS.itw, arr); }
    },
    remove(id) {
      const item = read(KEYS.itw, []).find(x => x.id === id);
      write(KEYS.itw, read(KEYS.itw, []).filter(x => x.id !== id));
      if (item) audit({ action: 'Delete', vendor: item.name, triggered: 'Human', notes: 'Removed from ITW' });
    },
  };

  // ── Reviews ──────────────────────────────────────────────────────────────────
  const reviews = {
    getAll()    { return read(KEYS.reviews, []); },
    save(arr)   { write(KEYS.reviews, arr); },
    add(record) {
      const arr  = read(KEYS.reviews, []);
      const item = { id: 'rv-' + Date.now(), ...record, createdAt: new Date().toISOString() };
      arr.push(item);
      write(KEYS.reviews, arr);
      audit({ action: 'Create', vendor: record.vendor, triggered: 'Human', notes: 'Review scheduled for ' + record.date });
      return item;
    },
    complete(id, note) {
      const arr = read(KEYS.reviews, []);
      const idx = arr.findIndex(r => r.id === id);
      if (idx < 0) return;
      const old = arr[idx];
      arr[idx]  = { ...old, status: 'Completed', completedAt: new Date().toISOString(), completionNote: note || '' };
      write(KEYS.reviews, arr);
      audit({ action: 'Update', vendor: old.vendor, field: 'status', oldVal: old.status, newVal: 'Completed', triggered: 'Human' });
    },
  };

  // ── Calendar Events ──────────────────────────────────────────────────────────
  const events = {
    getAll() {
      const stored  = read(KEYS.events, []);
      const vendorEvts = this._autoEvents();
      // Merge — stored events take priority; auto events fill in gaps
      const storedIds = new Set(stored.map(e => e.id));
      return [...stored, ...vendorEvts.filter(e => !storedIds.has(e.id))];
    },
    _autoEvents() {
      return vendors.getAll().flatMap(v => {
        const evts = [];
        if (v.expiry) {
          const days = Math.round((new Date(v.expiry + 'T12:00:00') - new Date()) / 86400000);
          if (days >= -30 && days <= 365) {
            evts.push({ id: 'auto-exp-' + v.id, title: v.name + ' — Contract Expiry', date: v.expiry, type: 'expiry', vendor: v.name, time: 'All day', notes: days < 0 ? 'Expired' : days + ' days remaining', status: days < 0 ? 'Overdue' : 'Scheduled', auto: true });
          }
        }
        if (v.followUp) {
          evts.push({ id: 'auto-fu-' + v.id, title: 'Follow-up: ' + v.name, date: v.followUp, type: 'followup', vendor: v.name, time: 'All day', notes: 'Follow-up with ' + (v.procContact || 'vendor'), status: 'Scheduled', auto: true });
        }
        return evts;
      });
    },
    add(evt) {
      const arr = read(KEYS.events, []);
      const item = { id: 'ev-' + Date.now(), ...evt, createdAt: new Date().toISOString() };
      arr.push(item);
      write(KEYS.events, arr);
      audit({ action: 'Calendar Event Created', vendor: evt.vendor || '', triggered: evt.auto ? 'Automation' : 'Human', notes: evt.title + ' on ' + evt.date });
      return item;
    },
    update(id, fields) {
      const arr = read(KEYS.events, []);
      const idx = arr.findIndex(e => e.id === id);
      if (idx >= 0) { arr[idx] = { ...arr[idx], ...fields }; write(KEYS.events, arr); }
    },
    delete(id) {
      write(KEYS.events, read(KEYS.events, []).filter(e => e.id !== id));
    },
  };

  // ── Prefs ────────────────────────────────────────────────────────────────────
  const prefs = {
    get(key, def) {
      const all = read(KEYS.prefs, {});
      return key in all ? all[key] : def;
    },
    set(key, val) {
      const all = read(KEYS.prefs, {});
      all[key] = val;
      write(KEYS.prefs, all);
    },
    getAll() { return read(KEYS.prefs, {}); },
    saveAll(obj) { write(KEYS.prefs, obj); },
  };

  // ── Groq ─────────────────────────────────────────────────────────────────────
  const groq = {
    getKey()   { return localStorage.getItem(KEYS.groqKey) || ''; },
    setKey(k)  { localStorage.setItem(KEYS.groqKey, k.trim()); },
    hasKey()   { return !!this.getKey(); },
    getModel() { return localStorage.getItem(KEYS.groqModel) || 'llama-3.1-8b-instant'; },
    setModel(m){ localStorage.setItem(KEYS.groqModel, m); },

    async call({ prompt, system, maxTokens = 900, temperature = 0.2, model }) {
      const key = this.getKey();
      if (!key) throw new Error('NO_KEY');
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: model || this.getModel(),
          temperature, max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system || 'You are a procurement AI. Always respond with valid json only.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(data?.error?.message || 'Groq error ' + res.status);
      }
      return JSON.parse(data.choices[0].message.content);
    },

    buildBriefingPrompt(vendorList) {
      const slim = vendorList.map(v => ({
        name: v.name, category: v.category, status: v.status, score: v.score,
        daysToExpiry: v.expiry ? Math.round((new Date(v.expiry+'T12:00:00')-new Date())/86400000) : null,
        adminFee: v.adminFee, autoRenew: v.autoRenew, lastComm: v.lastComm, followUp: v.followUp,
      }));
      const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
      return `Today is ${today}. You are Aria, a procurement AI. Analyze this vendor portfolio and write a concise daily briefing.
Vendor data: ${JSON.stringify(slim)}
Return ONLY: { "summary": "2-3 sentences", "bullets": [{ "text": "specific insight with vendor name", "severity": "critical|warning|info|positive" }] }
Max 5 bullets ordered by urgency.`;
    },

    buildInsightsPrompt(vendorList) {
      const slim = vendorList.map(v => ({
        name: v.name, category: v.category, tier: v.tier, status: v.status,
        score: v.score, adminFee: v.adminFee, daysToExpiry: v.expiry ? Math.round((new Date(v.expiry+'T12:00:00')-new Date())/86400000) : null,
        completeness: v.completeness,
      }));
      const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
      return `Today is ${today}. You are Aria, a procurement analytics AI. Analyze this vendor portfolio.
Data: ${JSON.stringify(slim)}
Return ONLY: { "summary": "2-3 sentence analytical summary", "top_risk": "one sentence", "opportunity": "one sentence", "bullets": [{ "text": "specific insight", "severity": "critical|warning|info|positive" }] }
Max 5 bullets.`;
    },

    buildSchedulingPrompt(records) {
      const slim = records.map(r => ({ name: r.name || r.vendor || '', notes: (r.notes||'').slice(0,300), followUp: r.followUp||r.date||'' }));
      return `Scan these records and extract any dates, deadlines, or meetings mentioned in notes.
Records: ${JSON.stringify(slim)}
Return ONLY: { "detected_events": [{ "record_name": "exact name", "event_title": "short title", "suggested_date": "YYYY-MM-DD", "event_type": "call|meeting|deadline|follow_up|review", "confidence": 0.0-1.0, "source_text": "phrase that triggered this" }] }
Only include events with confidence >= 0.6. Return empty array if nothing found.`;
    },
  };

  // ── Public API ───────────────────────────────────────────────────────────────
  return {
    KEYS, VENDOR_SCHEMA, ADDENDUM_SCHEMA, EXCEL_COLUMN_MAP,
    session, vendors, addendums, itw, reviews, events, prefs, groq,
    audit,
    enrichVendor, calcScore, calcBadge, calcCompleteness,

    // Helper: toast (modules can call VCIS.toast())
    toast(msg, color = '#4f7cff') {
      let t = document.getElementById('vcis-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'vcis-toast';
        t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:8px;font-size:12px;color:#fff;opacity:0;transform:translateY(8px);transition:all .2s;pointer-events:none;z-index:9999;font-weight:500;font-family:"Sora",sans-serif';
        document.body.appendChild(t);
      }
      t.textContent = msg; t.style.background = color;
      t.style.opacity = '1'; t.style.transform = 'translateY(0)';
      clearTimeout(t._tid);
      t._tid = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 2800);
    },

    // Helper: format date
    fmtDate(s) {
      if (!s) return '—';
      try { return new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
      catch { return s; }
    },

    // Helper: days to date
    daysTo(s) {
      if (!s) return 9999;
      return Math.round((new Date(s + 'T12:00:00') - new Date()) / 86400000);
    },
  };
})();
