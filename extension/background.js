// SessionRunner background service worker — sessions vault + automation engine.
const SESS_KEY = 'sr_sessions';
const JOBS_KEY = 'sr_jobs';
const LOGS_KEY = 'sr_logs';
const MAX_LOGS = 50;

async function storeGet(key, fallback) {
  const o = await chrome.storage.local.get(key);
  return o[key] ?? fallback;
}
async function storeSet(key, val) {
  await chrome.storage.local.set({ [key]: val });
}
function uid() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function domainFromUrl(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}
function parseCookieString(str) {
  return String(str).split(';').map(s => s.trim()).filter(Boolean).map(pair => {
    const i = pair.indexOf('=');
    if (i <= 0) return null;
    return { name: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim() };
  }).filter(Boolean);
}
function hostMatchesCookie(host, cookieDomain) {
  const d = String(cookieDomain || '').replace(/^\./, '').toLowerCase();
  const h = String(host || '').toLowerCase();
  return !!d && (h === d || h.endsWith('.' + d));
}

// Saare cookies domain par set karo (httpOnly bhi — cookies permission se allowed).
async function setCookies(domain, cookies) {
  const clean = String(domain).replace(/^\./, '');
  const base = 'https://' + clean;
  let ok = 0, fail = 0;
  for (const c of cookies || []) {
    if (!c.name) { fail++; continue; }
    try {
      await chrome.cookies.set({
        url: base + (c.path || '/'),
        name: c.name,
        value: c.value ?? '',
        domain: c.domain || clean,
        path: c.path || '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: c.sameSite || 'lax',
        ...(c.expirationDate ? { expirationDate: c.expirationDate } : {}),
      });
      ok++;
    } catch { fail++; }
  }
  return { ok, fail };
}

async function captureHostCookies(host, url) {
  const all = await chrome.cookies.getAll({});
  return all.filter(c => hostMatchesCookie(host, c.domain)).map(c => ({
    name: c.name, value: c.value, domain: c.domain, path: c.path,
    secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite,
    expirationDate: c.expirationDate,
  }));
}

// ---------- automation job runner ----------
async function appendLog(jobId, entry) {
  const logs = await storeGet(LOGS_KEY, {});
  const arr = logs[jobId] || [];
  arr.unshift(entry);
  logs[jobId] = arr.slice(0, MAX_LOGS);
  await storeSet(LOGS_KEY, logs);
}

async function runJob(job, manual = false) {
  const sessions = await storeGet(SESS_KEY, {});
  const session = sessions[job.sessionId];
  if (!session) {
    await appendLog(job.id, { ts: Date.now(), ok: false, status: 0, note: 'session nahi mila (delete ho gaya?)' });
    return { ok: false };
  }
  // Session ke cookies browser me set — iske baad fetch me cookies apne aap lagenge.
  await setCookies(session.domain, session.cookies);

  const t0 = Date.now();
  let status = 0, text = '', finalUrl = job.url, err = '';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    const res = await fetch(job.url, {
      method: job.method || 'GET',
      credentials: 'include',
      redirect: 'follow',
      signal: ctrl.signal,
      ...(job.method === 'POST' && job.body
        ? { headers: { 'Content-Type': 'application/json' }, body: job.body }
        : {}),
    });
    clearTimeout(timer);
    status = res.status;
    finalUrl = res.url;
    text = (await res.text()).slice(0, 20000);
  } catch (e) { err = String((e && e.message) || e); }

  let ok = !err && status >= 200 && status < 400;
  let note = err || ('HTTP ' + status);
  const chk = job.check || { type: 'none' };
  if (ok && chk.type && chk.type !== 'none' && chk.value) {
    const v = chk.value;
    if (chk.type === 'contains') ok = text.includes(v);
    else if (chk.type === 'notContains') ok = !text.includes(v);
    else if (chk.type === 'urlNotContains') ok = !finalUrl.toLowerCase().includes(v.toLowerCase());
    note = (ok ? 'check pass' : 'check FAIL') + ' — ' + note;
  }
  // Login-page par redirect = session expire
  if (ok && /\/login/i.test(finalUrl) && !/\/login/i.test(job.url)) {
    ok = false;
    note = 'login page par redirect — session expire lag raha hai';
  }
  const entry = { ts: Date.now(), ok, status, ms: Date.now() - t0, note: String(note).slice(0, 220) };
  await appendLog(job.id, entry);

  const jobs = await storeGet(JOBS_KEY, {});
  if (jobs[job.id]) {
    jobs[job.id].lastRun = Date.now();
    jobs[job.id].lastStatus = ok ? 'ok' : 'fail';
    jobs[job.id].nextRun = Date.now() + Math.max(1, job.intervalMin || 10) * 60000;
    await storeSet(JOBS_KEY, jobs);
  }
  if (!ok && job.notify && !manual) {
    try {
      await chrome.notifications.create('sr_' + job.id + '_' + Date.now(), {
        type: 'basic', iconUrl: 'icon.png',
        title: 'SessionRunner: ' + job.name,
        message: 'Fail — ' + entry.note,
      });
    } catch {}
  }
  return entry;
}

// ---------- message router (popup + options + website bridge) ----------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handle(msg).then(r => sendResponse({ ok: true, result: r }))
    .catch(e => sendResponse({ ok: false, error: String((e && e.message) || e) }));
  return true;
});

async function handle(msg) {
  const { type, payload } = msg;
  const p = payload || {};

  if (type === 'SR_PING') return { pong: true, v: '1.0.0' };

  if (type === 'SR_LIST_SESSIONS') {
    const s = await storeGet(SESS_KEY, {});
    return Object.values(s).sort((a, b) => b.createdAt - a.createdAt);
  }
  if (type === 'SR_SAVE_SESSION') {
    const s = await storeGet(SESS_KEY, {});
    s[p.session.id] = p.session;
    await storeSet(SESS_KEY, s);
    return { saved: true };
  }
  if (type === 'SR_DELETE_SESSION') {
    const s = await storeGet(SESS_KEY, {});
    delete s[p.id];
    await storeSet(SESS_KEY, s);
    return { deleted: true };
  }
  // Session ID/cookies paste karke login: cookies set + site kholo + vault me save
  if (type === 'SR_LOGIN_COOKIES') {
    const host = p.host || domainFromUrl(p.url);
    if (!host) throw new Error('URL sahi nahi hai');
    const parsed = parseCookieString(p.cookieString || '');
    if (!parsed.length) throw new Error('koi cookie nahi mila — format: name=value; name2=value2');
    const set = await setCookies(host, parsed);
    const session = {
      id: uid(), name: p.name || host, url: p.url, domain: host,
      cookies: parsed.map(c => ({ ...c, domain: host, path: '/' })),
      createdAt: Date.now(),
    };
    const s = await storeGet(SESS_KEY, {});
    s[session.id] = session;
    await storeSet(SESS_KEY, s);
    await chrome.tabs.create({ url: p.url });
    return { set, sessionId: session.id };
  }
  if (type === 'SR_RESTORE') {
    const s = await storeGet(SESS_KEY, {});
    const session = s[p.id];
    if (!session) throw new Error('session nahi mila');
    const set = await setCookies(session.domain, session.cookies);
    await chrome.tabs.create({ url: session.url });
    return { set };
  }
  if (type === 'SR_CAPTURE_TAB') {
    const tab = await chrome.tabs.get(p.tabId);
    const host = domainFromUrl(tab.url);
    if (!host || /^(chrome|edge|about):/.test(tab.url)) throw new Error('is page se capture nahi ho sakta');
    const cookies = await captureHostCookies(host, tab.url);
    return { url: tab.url, host, cookies };
  }

  if (type === 'SR_LIST_JOBS') {
    const j = await storeGet(JOBS_KEY, {});
    return Object.values(j).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }
  if (type === 'SR_SAVE_JOB') {
    const j = await storeGet(JOBS_KEY, {});
    const job = p.job;
    if (!job.id) job.id = uid();
    job.createdAt = job.createdAt || Date.now();
    job.active = job.active !== false;
    if (!job.nextRun) job.nextRun = Date.now() + Math.max(1, job.intervalMin || 10) * 60000;
    j[job.id] = job;
    await storeSet(JOBS_KEY, j);
    return { saved: true, id: job.id };
  }
  if (type === 'SR_DELETE_JOB') {
    const j = await storeGet(JOBS_KEY, {});
    delete j[p.id];
    await storeSet(JOBS_KEY, j);
    const logs = await storeGet(LOGS_KEY, {});
    delete logs[p.id];
    await storeSet(LOGS_KEY, logs);
    return { deleted: true };
  }
  if (type === 'SR_TOGGLE_JOB') {
    const j = await storeGet(JOBS_KEY, {});
    if (!j[p.id]) throw new Error('job nahi mila');
    j[p.id].active = !j[p.id].active;
    if (j[p.id].active) j[p.id].nextRun = Date.now() + Math.max(1, j[p.id].intervalMin || 10) * 60000;
    await storeSet(JOBS_KEY, j);
    return { active: j[p.id].active };
  }
  if (type === 'SR_RUN_JOB') {
    const j = await storeGet(JOBS_KEY, {});
    const job = j[p.id];
    if (!job) throw new Error('job nahi mila');
    return await runJob(job, true);
  }
  if (type === 'SR_GET_LOGS') {
    const logs = await storeGet(LOGS_KEY, {});
    return logs[p.jobId] || [];
  }
  throw new Error('unknown message: ' + type);
}

// ---------- scheduler: har 1 min me due jobs chalao ----------
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== 'sr-tick') return;
  try {
    const jobs = await storeGet(JOBS_KEY, {});
    const now = Date.now();
    for (const job of Object.values(jobs)) {
      if (job.active && (!job.nextRun || job.nextRun <= now)) {
        try { await runJob(job); } catch {}
      }
    }
  } catch {}
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('sr-tick', { periodInMinutes: 1 });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('sr-tick', { periodInMinutes: 1 });
});
