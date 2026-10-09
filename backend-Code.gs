/* NTS OS - free Google backend (Sheet + Drive).
   Setup: Sheet > Extensions > Apps Script > paste this > Deploy > New deployment > Web app
   (Execute as: Me, Who has access: Anyone) > copy the URL into CFG.SCRIPT_URL in index.html
   Optional, all free:
   - AI Ninja: Project Settings > Script properties > add GEMINI_API_KEY (free key from aistudio.google.com/apikey)
   - Instagram: add IG_TOKEN (see steps in the site's Instagram page), then run installDailyTrigger once
   After any change to this file: Deploy > Manage deployments > Edit > New version > Deploy. */
var SHEET_ID = '1YvtUcypbfa_WQXGujaFhfTVtXRG1RJQHXVyWMkM5DVY';
var SHEET_NAME = 'Repository';
var FOLDER_NAME = 'NTS Daily Work';
var MODEL_FOLDER = 'NTS AI Models';
var IG_SHEET = 'Instagram';
var IGH = ['id','kind','date','followers','media_count','caption','media_type','media_url','permalink','likes','comments','ts'];
var HEAD = ['id','type','title','detail','from','to','priority','status','due','created','updated','notes'];

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* tab lookup that ignores upper/lower case and stray spaces (getSheetByName is exact, insertSheet is not) */
function byName_(ss, name) {
  var s = ss.getSheetByName(name), a, i, k = String(name).toLowerCase().replace(/\s+/g, '');
  if (s) { return s; }
  a = ss.getSheets();
  for (i = 0; i < a.length; i++) { if (a[i].getName().toLowerCase().replace(/\s+/g, '') === k) { return a[i]; } }
  return null;
}
function sheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var s = byName_(ss, SHEET_NAME);
  if (!s) {
    s = ss.insertSheet(SHEET_NAME);
    s.appendRow(HEAD);
    s.setFrozenRows(1);
    s.getRange('A:L').setNumberFormat('@');
  }
  return s;
}

function folder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function addRow_(it) {
  var row = [], j;
  for (j = 0; j < HEAD.length; j++) { row.push(it[HEAD[j]] || ''); }
  sheet_().appendRow(row);
}

function doGet(e) {
  /* fallback transport for browsers that block cross-site fetch: the page loads this as a <script> (JSONP). Same auth and rules as POST. */
  if (e && e.parameter && e.parameter.cb) {
    var cb = String(e.parameter.cb), out;
    if (!/^[A-Za-z0-9_]{1,40}$/.test(cb)) { return json_({ ok: false, error: 'bad callback' }); }
    try {
      var pr = JSON.parse(e.parameter.d || '{}');
      if (pr.action === 'ping') { out = { ok: true, ping: true }; }
      else if (pr.action && /^(rq_|nt_)/.test(pr.action)) { out = shared_(pr); }
      else { out = { ok: false, error: 'unknown action' }; }
    } catch (err) { out = { ok: false, error: 'Server error: ' + String(err) }; }
    return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  if (e && e.parameter && e.parameter.what === 'instagram') { return json_(igRead_()); }
  var v = sheet_().getDataRange().getValues(), out = [], i, j;
  for (i = 1; i < v.length; i++) {
    var o = {};
    for (j = 0; j < HEAD.length; j++) { o[HEAD[j]] = String(v[i][j]); }
    out.push(o);
  }
  return json_(out);
}

/* ---------- Instagram: daily fetch into the Instagram tab ---------- */
function igSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID), s = byName_(ss, IG_SHEET);
  if (!s) { s = ss.insertSheet(IG_SHEET); s.appendRow(IGH); s.setFrozenRows(1); s.getRange('A:L').setNumberFormat('@'); }
  return s;
}
function igGet_(path) {
  var t = PropertiesService.getScriptProperties().getProperty('IG_TOKEN');
  var r = UrlFetchApp.fetch('https://graph.instagram.com/' + path + (path.indexOf('?') > -1 ? '&' : '?') + 'access_token=' + encodeURIComponent(t), { muteHttpExceptions: true });
  var d = JSON.parse(r.getContentText());
  if (d.error) { throw new Error(d.error.message); }
  return d;
}
function igRead_() {
  var connected = !!PropertiesService.getScriptProperties().getProperty('IG_TOKEN');
  var v = igSheet_().getDataRange().getValues(), out = { connected: connected, profile: null, snaps: [], posts: [], error: PropertiesService.getScriptProperties().getProperty('IG_ERROR') || '' }, i, j;
  for (i = 1; i < v.length; i++) {
    var o = {};
    for (j = 0; j < IGH.length; j++) { o[IGH[j]] = String(v[i][j]); }
    if (o.kind === 'profile') { out.profile = o; }
    else if (o.kind === 'snap') { out.snaps.push(o); }
    else if (o.kind === 'post') { out.posts.push(o); }
  }
  out.posts.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
  return out;
}
function fetchInstagram() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('IG_TOKEN')) { return { ok: false, error: 'IG_TOKEN is not set' }; }
  try {
    var me = igGet_('me?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url');
    var md = igGet_('me/media?limit=30&fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count');
    var s = igSheet_(), v = s.getDataRange().getValues(), idx = {}, i, today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    for (i = 1; i < v.length; i++) { idx[String(v[i][1]) + '|' + String(v[i][0]) + (String(v[i][1]) === 'snap' ? String(v[i][2]) : '')] = i + 1; }
    function put(kind, key, row) {
      var r = idx[kind + '|' + key];
      if (r) { s.getRange(r, 1, 1, IGH.length).setValues([row]); } else { s.appendRow(row); }
    }
    put('profile', me.id, [me.id, 'profile', today, me.followers_count || 0, me.media_count || 0, (me.biography || '') + ' | @' + (me.username || ''), '', me.profile_picture_url || '', 'https://instagram.com/' + (me.username || ''), me.follows_count || 0, 0, new Date().toISOString()]);
    put('snap', 'snap' + today, ['snap', 'snap', today, me.followers_count || 0, me.media_count || 0, '', '', '', '', 0, 0, new Date().toISOString()]);
    var data = md.data || [];
    for (i = 0; i < data.length; i++) {
      var m = data[i];
      put('post', m.id, [m.id, 'post', String(m.timestamp || '').substring(0, 10), 0, 0, (m.caption || '').substring(0, 300), m.media_type || '', m.thumbnail_url || m.media_url || '', m.permalink || '', m.like_count || 0, m.comments_count || 0, m.timestamp || '']);
    }
    props.deleteProperty('IG_ERROR');
    // long-lived tokens last 60 days: refresh about once a month
    var last = Number(props.getProperty('IG_REFRESHED') || 0);
    if (Date.now() - last > 30 * 86400000) {
      var rf = UrlFetchApp.fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(props.getProperty('IG_TOKEN')), { muteHttpExceptions: true });
      var rd = JSON.parse(rf.getContentText());
      if (rd.access_token) { props.setProperty('IG_TOKEN', rd.access_token); props.setProperty('IG_REFRESHED', String(Date.now())); }
    }
    return { ok: true };
  } catch (err) {
    props.setProperty('IG_ERROR', String(err));
    return { ok: false, error: String(err) };
  }
}
function installDailyTrigger() {
  var t = ScriptApp.getProjectTriggers(), i;
  for (i = 0; i < t.length; i++) { if (t[i].getHandlerFunction() === 'fetchInstagram') { ScriptApp.deleteTrigger(t[i]); } }
  ScriptApp.newTrigger('fetchInstagram').timeBased().everyDays(1).atHour(7).create();
  fetchInstagram();
}

/* ---------- AI Ninja: server-side proxy so the key never reaches the browser ---------- */
function chat_(d) {
  var props = PropertiesService.getScriptProperties(), key = props.getProperty('GEMINI_API_KEY');
  if (!key) { return { ok: false, error: 'no_key' }; }
  var cache = CacheService.getScriptCache(), k = 'rl' + Math.floor(Date.now() / 60000), n = Number(cache.get(k) || 0);
  if (n >= 20) { return { ok: false, error: 'rate' }; }
  cache.put(k, String(n + 1), 120);
  var src = (d.messages || []).slice(-14), contents = [], i;
  for (i = 0; i < src.length; i++) {
    var t = String(src[i].text || '').substring(0, 2000);
    if (t) { contents.push({ role: src[i].role === 'assistant' ? 'model' : 'user', parts: [{ text: t }] }); }
  }
  if (!contents.length || contents[contents.length - 1].role !== 'user') { return { ok: false, error: 'bad_request' }; }
  var system = 'You are NIKHILs AI NINJA, the assistant of NIKHILs TECH STUDIO. Personality: intelligent, calm, fast, tech-savvy, confident, helpful, slightly playful, professional. Never childish or robotic. Do not keep asking "How can I help you?". Answer any general question properly (technology, AI, code, ideas). For questions about the studio, prioritise the studio knowledge below and never invent facts that are not in it; if something is missing say you do not have that detail yet. Keep answers concise unless asked for depth. Use plain text, no markdown headings. Remember what the user told you earlier in this conversation.\n\nSTUDIO KNOWLEDGE (JSON):\n' + String(d.knowledge || '').substring(0, 8000) + '\n\nThe visitor is currently on this page of the studio OS: ' + String(d.page || 'unknown').substring(0, 120);
  var want = props.getProperty('GEMINI_MODEL'), models = (want ? [want] : []).concat(['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']), m, j = null;
  var payload = JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: contents, generationConfig: { temperature: 0.7, maxOutputTokens: 900 } });
  for (m = 0; m < models.length; m++) {
    var r = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[m] + ':generateContent', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-goog-api-key': key }, payload: payload
    });
    try { j = JSON.parse(r.getContentText()); } catch (x) { j = { error: { message: 'Bad reply from Gemini (HTTP ' + r.getResponseCode() + ')' } }; }
    if (j.error && (j.error.code === 404 || /not found|not supported/i.test(String(j.error.message || '')))) { continue; }
    break;
  }
  if (j.error) { return { ok: false, error: 'llm', detail: String(j.error.message || '').substring(0, 200) }; }
  var c = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts, txt = '';
  if (c) { for (i = 0; i < c.length; i++) { txt += c[i].text || ''; } }
  return txt ? { ok: true, text: txt } : { ok: false, error: 'empty' };
}


/* ---------- Shared requests, comments/activity and notifications (central source of truth) ----------
   Security: every call must carry the TEAM_KEY (Project Settings > Script properties > TEAM_KEY = any long random string).
   Without TEAM_KEY set, these actions refuse to run. The person ("who") is chosen on each device and is NOT a login:
   it stops strangers, not teammates impersonating each other. Add real sign-in if you need that. */
var TEAM = ['Nikhil', 'Monish', 'Pranav'];
var APPROVER = 'Nikhil';
var RQ_SHEET = 'Requests', AC_SHEET = 'Activity', NT_SHEET = 'Notifications';
var RQH = ['id', 'cid', 'title', 'description', 'category', 'raisedBy', 'assignedTo', 'created', 'updated', 'priority', 'estCost', 'approvedCost', 'actualCost', 'status', 'due', 'visibility', 'attachments', 'version'];
var ACH = ['id', 'reqId', 'ts', 'actor', 'kind', 'text', 'meta'];
var NTH = ['id', 'eventId', 'recipient', 'type', 'reqId', 'actor', 'ts', 'readAt', 'title', 'status', 'estCost', 'text'];
var RQ_STATUSES = ['RAISED', 'APPROVED', 'REJECTED', 'IN PROGRESS', 'HOLD', 'COMPLETED'];
var RQ_PRI = ['Normal', 'High', 'Urgent'];

function tab_(name, head) {
  var ss = SpreadsheetApp.openById(SHEET_ID), s = byName_(ss, name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(head); s.setFrozenRows(1); s.getRange(1, 1, s.getMaxRows(), head.length).setNumberFormat('@'); }
  return s;
}
function rows_(s, head) {
  var v = s.getDataRange().getValues(), out = [], i, j, o;
  for (i = 1; i < v.length; i++) { o = { _row: i + 1 }; for (j = 0; j < head.length; j++) { o[head[j]] = String(v[i][j]); } out.push(o); }
  return out;
}
function rowArr_(head, o) { var r = [], j; for (j = 0; j < head.length; j++) { r.push(o[head[j]] === undefined || o[head[j]] === null ? '' : String(o[head[j]])); } return r; }
function nextId_(prefix, prop) {
  var p = PropertiesService.getScriptProperties(), n = Number(p.getProperty(prop) || 0) + 1, t = String(n);
  p.setProperty(prop, String(n)); while (t.length < 4) { t = '0' + t; }
  return prefix + '-' + t;
}
function num_(v) { if (v === null || v === undefined || v === '') { return null; } var n = Number(v); return isFinite(n) ? n : null; }
function reqOut_(r) {
  var att = []; try { att = JSON.parse(r.attachments || '[]'); } catch (x) { att = []; }
  return { id: r.id, title: r.title, description: r.description, category: r.category, raisedBy: r.raisedBy, assignedTo: r.assignedTo, created: r.created, updated: r.updated, priority: r.priority, estCost: num_(r.estCost), approvedCost: num_(r.approvedCost), actualCost: num_(r.actualCost), status: r.status, due: r.due, visibility: r.visibility || 'team', attachments: att, version: Number(r.version || 1) };
}
function canSee_(r, who) { return (r.visibility || 'team') !== 'private' || who === r.raisedBy || who === r.assignedTo || who === APPROVER; }
function auth_(d) {
  var k = PropertiesService.getScriptProperties().getProperty('TEAM_KEY');
  if (!k) { return 'setup_required'; }
  if (String(d.key || '') !== k) { return 'unauthorized'; }
  if (TEAM.indexOf(d.who) < 0) { return 'unknown_user'; }
  return '';
}
function today_() { return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'); }
function logAct_(reqId, actor, kind, text, meta) {
  tab_(AC_SHEET, ACH).appendRow(rowArr_(ACH, { id: nextId_('ACT', 'AC_SEQ'), reqId: reqId, ts: new Date().toISOString(), actor: actor, kind: kind, text: text, meta: JSON.stringify(meta || {}) }));
}
/* one notification per (eventId, recipient): retries and double submits cannot create duplicates */
function notify_(ctx, recips, type, eventKey, req, actor, text) {
  var seen = ctx.keys, sh = ctx.sheet, i, r;
  for (i = 0; i < recips.length; i++) {
    r = recips[i];
    if (!r || r === actor || TEAM.indexOf(r) < 0 || !canSee_(req, r)) { continue; }
    var ev = eventKey + ':' + r;
    if (seen[ev]) { continue; }
    seen[ev] = true;
    sh.appendRow(rowArr_(NTH, { id: nextId_('NTF', 'NT_SEQ'), eventId: ev, recipient: r, type: type, reqId: req.id, actor: actor, ts: new Date().toISOString(), readAt: '', title: req.title, status: req.status, estCost: req.estCost, text: text }));
  }
}
function ntCtx_() {
  var sh = tab_(NT_SHEET, NTH), v = sh.getLastRow() > 1 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues() : [], keys = {}, i;
  for (i = 0; i < v.length; i++) { keys[String(v[i][0])] = true; }
  return { sheet: sh, keys: keys };
}
function uniq_(a) { var o = {}, r = [], i; for (i = 0; i < a.length; i++) { if (a[i] && !o[a[i]]) { o[a[i]] = 1; r.push(a[i]); } } return r; }
function findReq_(id) {
  var s = tab_(RQ_SHEET, RQH), l = rows_(s, RQH), i;
  for (i = 0; i < l.length; i++) { if (l[i].id === id) { return { s: s, row: l[i]._row, r: l[i] }; } }
  return null;
}

function shared_(d) {
  var bad = auth_(d);
  if (bad) { return { ok: false, error: bad }; }
  if (d.action === 'rq_sync') { return rqSync_(d); }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (d.action === 'rq_create') { return rqCreate_(d); }
    if (d.action === 'rq_update') { return rqUpdate_(d); }
    if (d.action === 'rq_comment') { return rqComment_(d); }
    if (d.action === 'nt_read') { return ntRead_(d); }
    return { ok: false, error: 'unknown action' };
  } catch (err) { return { ok: false, error: String(err) }; }
  finally { lock.releaseLock(); }
}

function rqCreate_(d) {
  var q = d.req || {}, who = d.who, s = tab_(RQ_SHEET, RQH), l = rows_(s, RQH), i, cid = String(q.cid || '');
  if (!cid || cid.length < 8) { return { ok: false, error: 'Missing request key. Reload the page and try again.' }; }
  for (i = 0; i < l.length; i++) { if (l[i].cid === cid) { return { ok: true, duplicate: true, request: reqOut_(l[i]) }; } }
  var title = String(q.title || '').trim(), est = q.estCost === '' || q.estCost === undefined ? null : num_(q.estCost);
  if (!title) { return { ok: false, error: 'Request title is required.' }; }
  if (title.length > 200) { return { ok: false, error: 'Title is too long (200 characters).' }; }
  if (est === null && !q.legacy) { return { ok: false, error: 'Estimated cost is required. Enter 0 only if the request is free.' }; }
  if (est !== null && est < 0) { return { ok: false, error: 'Estimated cost cannot be negative.' }; }
  var to = String(q.assignedTo || '');
  if (TEAM.indexOf(to) < 0) { return { ok: false, error: 'Choose who the request is assigned to.' }; }
  var pri = RQ_PRI.indexOf(q.priority) > -1 ? q.priority : 'Normal', att = [], a = q.attachments || [];
  for (i = 0; i < a.length && i < 5; i++) { if (a[i] && /^https:\/\//.test(String(a[i].url || ''))) { att.push({ name: String(a[i].name || a[i].url).substring(0, 120), url: String(a[i].url).substring(0, 500) }); } }
  var now = new Date().toISOString();
  var r = { id: nextId_('REQ', 'RQ_SEQ'), cid: cid, title: title, description: String(q.description || '').substring(0, 4000), category: String(q.category || 'Other').substring(0, 60), raisedBy: who, assignedTo: to, created: q.legacyCreated || now, updated: now, priority: pri, estCost: est === null ? '' : est, approvedCost: '', actualCost: '', status: RQ_STATUSES.indexOf(q.status) > -1 && q.legacy ? q.status : 'RAISED', due: String(q.due || ''), visibility: q.visibility === 'private' ? 'private' : 'team', attachments: JSON.stringify(att), version: 1 };
  s.appendRow(rowArr_(RQH, r));
  logAct_(r.id, who, 'created', 'Raised this request' + (est !== null ? ' with an estimate of Rs ' + est : ''), { cid: cid });
  var ro = reqOut_(r), ctx = ntCtx_();
  notify_(ctx, [to], 'assigned', 'created:' + r.id, ro, who, 'assigned you a new request');
  notify_(ctx, [APPROVER], 'raised', 'raised:' + r.id, ro, who, 'raised a new request for approval');
  return { ok: true, request: ro };
}

function rqUpdate_(d) {
  var who = d.who, id = String(d.id || ''), p = d.patch || {}, opId = String(d.opId || '');
  if (!opId || opId.length < 8) { return { ok: false, error: 'Missing operation key.' }; }
  var f = findReq_(id);
  if (!f) { return { ok: false, error: 'Request not found.' }; }
  var cur = reqOut_(f.r), isRaiser = who === cur.raisedBy, isAssignee = who === cur.assignedTo, isApprover = who === APPROVER;
  if (!(isRaiser || isAssignee || isApprover)) { return { ok: false, error: 'forbidden' }; }
  var ac = tab_(AC_SHEET, ACH), av = ac.getLastRow() > 1 ? ac.getRange(2, 7, ac.getLastRow() - 1, 1).getValues() : [], i;
  for (i = 0; i < av.length; i++) { if (String(av[i][0]).indexOf('"opId":"' + opId + '"') > -1) { return { ok: true, duplicate: true, request: cur }; } }
  if (d.expectedVersion !== undefined && d.expectedVersion !== null && Number(d.expectedVersion) !== cur.version) { return { ok: false, error: 'conflict', request: cur }; }
  var ch = [], k, nv, ov;
  function chk(field, allowed, label) { if (!allowed) { throw new Error('You are not allowed to change ' + label + '.'); } }
  for (k in p) {
    nv = p[k]; ov = cur[k];
    if (k === 'status') {
      if (RQ_STATUSES.indexOf(nv) < 0) { return { ok: false, error: 'Unknown status.' }; }
      if ((nv === 'APPROVED' || nv === 'REJECTED') && !isApprover) { return { ok: false, error: 'Only ' + APPROVER + ' can approve or reject.' }; }
    } else if (k === 'assignedTo') {
      if (TEAM.indexOf(nv) < 0) { return { ok: false, error: 'Unknown assignee.' }; }
    } else if (k === 'estCost' || k === 'approvedCost' || k === 'actualCost') {
      nv = (nv === '' || nv === null) ? null : num_(nv);
      if (nv === null || nv < 0) { return { ok: false, error: 'Enter a valid amount (0 or more).' }; }
      if (k === 'approvedCost' && !isApprover) { return { ok: false, error: 'Only ' + APPROVER + ' can set the approved cost.' }; }
      if (k === 'actualCost' && !(isAssignee || isApprover)) { return { ok: false, error: 'Only the assignee or ' + APPROVER + ' can record the actual cost.' }; }
      if (k === 'estCost' && !(isRaiser || isApprover || cur.estCost === null)) { return { ok: false, error: 'Only the requester or ' + APPROVER + ' can change the estimate.' }; }
    } else if (k === 'priority') {
      if (RQ_PRI.indexOf(nv) < 0) { return { ok: false, error: 'Unknown priority.' }; }
    } else if (k === 'title' || k === 'description' || k === 'category' || k === 'due' || k === 'visibility') {
      nv = String(nv || '').substring(0, k === 'description' ? 4000 : 200);
      if (k === 'title' && !nv.trim()) { return { ok: false, error: 'Title is required.' }; }
    } else { continue; }
    if (String(nv === null ? '' : nv) !== String(ov === null ? '' : ov)) { ch.push({ f: k, from: ov, to: nv }); }
  }
  if (!ch.length) { return { ok: true, request: cur, noChange: true }; }
  var raw = f.r, now = new Date().toISOString();
  for (i = 0; i < ch.length; i++) { raw[ch[i].f] = ch[i].to === null ? '' : ch[i].to; }
  raw.updated = now; raw.version = String(cur.version + 1);
  f.s.getRange(f.row, 1, 1, RQH.length).setValues([rowArr_(RQH, raw)]);
  var nr = reqOut_(raw), ctx = ntCtx_(), c, kind, text, parts = uniq_([nr.raisedBy, nr.assignedTo]);
  for (i = 0; i < ch.length; i++) {
    c = ch[i]; kind = c.f === 'status' ? 'status' : c.f === 'assignedTo' ? 'assign' : /Cost$/.test(c.f) ? 'cost' : 'edit';
    text = c.f === 'status' ? 'Status changed from ' + c.from + ' to ' + c.to : c.f === 'assignedTo' ? 'Reassigned from ' + c.from + ' to ' + c.to : /Cost$/.test(c.f) ? c.f.replace('Cost', ' cost') + ' changed from ' + (c.from === null ? 'not provided' : 'Rs ' + c.from) + ' to Rs ' + c.to : 'Changed ' + c.f;
    logAct_(id, who, kind, text, { opId: opId, field: c.f, from: c.from, to: c.to });
    if (c.f === 'assignedTo') { notify_(ctx, [c.to], 'assigned', 'assign:' + opId, nr, who, 'assigned you this request'); }
    else if (c.f === 'status' && (c.to === 'APPROVED' || c.to === 'REJECTED')) { notify_(ctx, [nr.raisedBy], 'approval', 'appr:' + opId, nr, who, (c.to === 'APPROVED' ? 'approved' : 'rejected') + ' your request'); }
    else if (c.f === 'status') { notify_(ctx, parts, 'status', 'stat:' + opId, nr, who, 'changed the status to ' + c.to); }
    else if (c.f === 'estCost') { notify_(ctx, [nr.raisedBy, APPROVER], 'cost', 'est:' + opId, nr, who, 'changed the estimated cost to Rs ' + c.to); }
    else if (c.f === 'approvedCost') { notify_(ctx, [nr.raisedBy], 'cost', 'apc:' + opId, nr, who, 'set the approved cost to Rs ' + c.to); }
  }
  return { ok: true, request: nr };
}

function rqComment_(d) {
  var who = d.who, id = String(d.id || ''), text = String(d.text || '').trim(), opId = String(d.opId || '');
  if (!text) { return { ok: false, error: 'Write a comment first.' }; }
  if (text.length > 2000) { return { ok: false, error: 'Comment is too long (2000 characters).' }; }
  if (!opId || opId.length < 8) { return { ok: false, error: 'Missing operation key.' }; }
  var f = findReq_(id);
  if (!f) { return { ok: false, error: 'Request not found.' }; }
  var r = reqOut_(f.r);
  if (!canSee_(r, who)) { return { ok: false, error: 'forbidden' }; }
  var ac = tab_(AC_SHEET, ACH), av = ac.getLastRow() > 1 ? ac.getRange(2, 7, ac.getLastRow() - 1, 1).getValues() : [], i;
  for (i = 0; i < av.length; i++) { if (String(av[i][0]).indexOf('"opId":"' + opId + '"') > -1) { return { ok: true, duplicate: true }; } }
  logAct_(id, who, 'comment', text, { opId: opId });
  var ctx = ntCtx_(), men = [], m, re = /@(Nikhil|Monish|Pranav)/gi;
  while ((m = re.exec(text))) { men.push(m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()); }
  men = uniq_(men);
  notify_(ctx, men, 'mention', 'men:' + opId, r, who, 'mentioned you in a comment');
  notify_(ctx, uniq_([r.raisedBy, r.assignedTo]).filter(function (n) { return men.indexOf(n) < 0; }), 'comment', 'com:' + opId, r, who, 'commented on this request');
  return { ok: true };
}

function ntRead_(d) {
  var sh = tab_(NT_SHEET, NTH), l = rows_(sh, NTH), ids = {}, i, n = 0, now = new Date().toISOString(), a = d.ids || [];
  for (i = 0; i < a.length; i++) { ids[a[i]] = 1; }
  for (i = 0; i < l.length; i++) {
    if (l[i].recipient === d.who && !l[i].readAt && (d.all || ids[l[i].id])) { sh.getRange(l[i]._row, 8).setValue(now); n++; }
  }
  return { ok: true, updated: n };
}

/* due-date reminders: one per request per day-state, only for the assignee */
function remind_() {
  var s = tab_(RQ_SHEET, RQH), l = rows_(s, RQH), t = today_(), tm = Utilities.formatDate(new Date(new Date().getTime() + 86400000), 'Asia/Kolkata', 'yyyy-MM-dd'), ctx = ntCtx_(), i, r, st;
  for (i = 0; i < l.length; i++) {
    r = l[i];
    if (!r.due || r.status === 'COMPLETED' || r.status === 'REJECTED') { continue; }
    if (r.due > tm) { continue; }
    st = r.due < t ? 'overdue' : r.due === t ? 'today' : 'tomorrow';
    var ro = reqOut_(r);
    notify_(ctx, [ro.assignedTo], 'due', 'due:' + r.id + ':' + r.due + ':' + st, ro, 'System', st === 'overdue' ? 'is overdue' : st === 'today' ? 'is due today' : 'is due tomorrow');
  }
}
function remindAll_() { var lock = LockService.getScriptLock(); lock.waitLock(30000); try { remind_(); } finally { lock.releaseLock(); } }
function installReminderTrigger() {
  var t = ScriptApp.getProjectTriggers(), i;
  for (i = 0; i < t.length; i++) { if (t[i].getHandlerFunction() === 'remindAll_') { ScriptApp.deleteTrigger(t[i]); } }
  ScriptApp.newTrigger('remindAll_').timeBased().everyDays(1).atHour(8).create();
}

function rqSync_(d) {
  var who = d.who, lock = LockService.getScriptLock();
  if (lock.tryLock(3000)) { try { remind_(); } finally { lock.releaseLock(); } }
  var rl = rows_(tab_(RQ_SHEET, RQH), RQH), reqs = [], ok = {}, i, r;
  for (i = 0; i < rl.length; i++) { r = reqOut_(rl[i]); if (canSee_(r, who)) { reqs.push(r); ok[r.id] = 1; } }
  var al = rows_(tab_(AC_SHEET, ACH), ACH), act = [], a;
  for (i = 0; i < al.length; i++) { a = al[i]; if (ok[a.reqId]) { act.push({ id: a.id, reqId: a.reqId, ts: a.ts, actor: a.actor, kind: a.kind, text: a.text }); } }
  var nl = rows_(tab_(NT_SHEET, NTH), NTH), nt = [];
  for (i = 0; i < nl.length; i++) { if (nl[i].recipient === who) { a = nl[i]; nt.push({ id: a.id, type: a.type, reqId: a.reqId, actor: a.actor, recipient: a.recipient, ts: a.ts, readAt: a.readAt, title: a.title, status: a.status, estCost: num_(a.estCost), text: a.text }); } }
  nt.sort(function (x, y) { return x.ts < y.ts ? 1 : -1; });
  return { ok: true, now: new Date().toISOString(), requests: reqs, activity: act, notifications: nt.slice(0, 200) };
}

function doPost(e) {
  var pre;
  try { pre = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: 'bad json' }); }
  if (pre.action && /^(rq_|nt_)/.test(pre.action)) { try { return json_(shared_(pre)); } catch (err) { return json_({ ok: false, error: 'Server error: ' + String(err) }); } }
  if (pre.action === 'chat') { try { return json_(chat_(pre)); } catch (err) { return json_({ ok: false, error: 'llm', detail: String(err) }); } }
  if (pre.action === 'ig_refresh') { return json_(fetchInstagram()); }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var d = JSON.parse(e.postData.contents), it = d.item;
    if (d.action === 'add') {
      var ex = sheet_(), exIds = ex.getLastRow() > 1 ? ex.getRange(2, 1, ex.getLastRow() - 1, 1).getValues() : [], x;
      for (x = 0; x < exIds.length; x++) { if (String(exIds[x][0]) === it.id) { return json_({ ok: true, duplicate: true }); } }
      addRow_(it);
      return json_({ ok: true });
    }
    if (d.action === 'update' || d.action === 'delete') {
      var s = sheet_(), ids = s.getRange(1, 1, s.getLastRow(), 1).getValues(), i, j, found = false;
      for (i = 1; i < ids.length; i++) {
        if (String(ids[i][0]) === it.id) {
          found = true;
          if (d.action === 'delete') { s.deleteRow(i + 1); break; }
          for (j = 2; j < HEAD.length; j++) {
            if (it[HEAD[j]] !== undefined && HEAD[j] !== 'created') { s.getRange(i + 1, j + 1).setValue(String(it[HEAD[j]])); }
          }
          break;
        }
      }
      return json_({ ok: true, found: found });
    }
    if (d.action === 'upload') {
      var blob = Utilities.newBlob(Utilities.base64Decode(d.file.data), d.file.mime, d.file.name);
      var dir = (it.type === 'model') ? folder_(DriveApp, MODEL_FOLDER) : folder_(folder_(DriveApp, FOLDER_NAME), it.due);
      var f = dir.createFile(blob);
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      it.detail = f.getUrl();
      addRow_(it);
      return json_({ ok: true, url: it.detail });
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.release();
  }
}
