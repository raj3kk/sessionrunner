const $ = id => document.getElementById(id);
async function call(type, payload = {}) {
  const r = await chrome.runtime.sendMessage({ type, payload });
  if (!r || !r.ok) throw new Error((r && r.error) || 'kuch gadbad hui');
  return r.result;
}
const fmtT = ts => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

async function loadSessionsIntoSelect() {
  const list = await call('SR_LIST_SESSIONS');
  const sel = $('jSession');
  sel.innerHTML = '';
  if (!list.length) sel.innerHTML = '<option value="">(pehle session save karo)</option>';
  for (const s of list) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = `${s.name} (${s.domain})`;
    sel.appendChild(o);
  }
}

$('btnSaveJob').onclick = async () => {
  const name = $('jName').value.trim();
  const sessionId = $('jSession').value;
  const url = $('jUrl').value.trim();
  if (!name || !sessionId || !url) return ($('jobMsg').textContent = 'Naam, session aur URL teeno zaroori hain');
  try { new URL(url); } catch { return ($('jobMsg').textContent = 'URL sahi nahi hai'); }
  const job = {
    name, sessionId, url,
    method: $('jMethod').value,
    intervalMin: Math.max(1, parseInt($('jInterval').value) || 10),
    check: { type: $('jCheckType').value, value: $('jCheckVal').value.trim() },
    body: $('jBody').value.trim(),
    notify: $('jNotify').checked,
    active: true,
  };
  await call('SR_SAVE_JOB', { job });
  $('jobMsg').textContent = 'Job save ho gaya — scheduler har 1 min me due jobs chalata hai.';
  $('jName').value = ''; $('jUrl').value = ''; $('jBody').value = ''; $('jCheckVal').value = '';
  loadJobs();
};

async function loadJobs() {
  const box = $('jobList');
  const jobs = await call('SR_LIST_JOBS');
  if (!jobs.length) { box.innerHTML = '<div class="card" style="color:#94a3b8;font-size:13px">Koi job nahi hai. Upar form se banao.</div>'; return; }
  box.innerHTML = '';
  for (const j of jobs) {
    const div = document.createElement('div');
    div.className = 'card job';
    const badge = !j.active ? '<span class="badge b-off">band</span>'
      : j.lastStatus === 'fail' ? '<span class="badge b-fail">fail</span>'
      : j.lastStatus === 'ok' ? '<span class="badge b-ok">ok</span>'
      : '<span class="badge b-off">naya</span>';
    div.innerHTML = `
      <div><div class="nm"></div>
      <div class="meta"></div></div>
      <div style="white-space:nowrap">${badge}<br><br>
        <button class="small mut b-run">▶ Abhi</button><button class="small mut b-log">Logs</button><button class="small mut b-tog"></button><button class="small bad b-del">✕</button>
      </div>`;
    div.querySelector('.nm').textContent = j.name;
    div.querySelector('.meta').textContent =
      `${j.method || 'GET'} ${j.url} • har ${j.intervalMin} min` +
      (j.lastRun ? ` • aakhri: ${fmtT(j.lastRun)}` : '') +
      (j.nextRun && j.active ? ` • agli: ${fmtT(j.nextRun)}` : '');
    const tog = div.querySelector('.b-tog');
    tog.textContent = j.active ? 'Band karo' : 'Chalu karo';
    tog.onclick = async () => { await call('SR_TOGGLE_JOB', { id: j.id }); loadJobs(); };
    div.querySelector('.b-del').onclick = async () => {
      if (!confirm(`"${j.name}" delete karein?`)) return;
      await call('SR_DELETE_JOB', { id: j.id }); loadJobs();
    };
    div.querySelector('.b-run').onclick = async (e) => {
      e.target.textContent = '…';
      try { await call('SR_RUN_JOB', { id: j.id }); } catch (err) { alert(err.message); }
      loadJobs(); loadLogs(j.id, j.name);
    };
    div.querySelector('.b-log').onclick = () => loadLogs(j.id, j.name);
    box.appendChild(div);
  }
}

async function loadLogs(jobId, name) {
  $('logTitle').textContent = '— ' + name;
  const box = $('logs');
  const logs = await call('SR_GET_LOGS', { jobId });
  if (!logs.length) { box.innerHTML = '<span style="color:#64748b">Abhi koi run nahi hua</span>'; return; }
  box.innerHTML = '';
  for (const l of logs) {
    const d = document.createElement('div');
    d.className = 'logrow';
    d.innerHTML = `<span class="badge ${l.ok ? 'b-ok' : 'b-fail'}">${l.ok ? 'OK' : 'FAIL'}</span>
      <span style="color:#94a3b8">${fmtT(l.ts)}</span> — ${l.note} ${l.ms ? `(${l.ms}ms)` : ''}`;
    box.appendChild(d);
  }
}

loadSessionsIntoSelect();
loadJobs();
