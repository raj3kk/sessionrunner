'use client';
import { useEffect, useState } from 'react';
import { extCall, extAvailable, fmtT } from '@/lib/bridge';

type Job = {
  id: string; name: string; sessionId: string; url: string; method: string;
  intervalMin: number; check: { type: string; value: string }; body?: string;
  notify: boolean; active: boolean; lastRun?: number; lastStatus?: string; nextRun?: number; createdAt: number;
};
type Session = { id: string; name: string; domain: string };

export default function AutomationPage() {
  const [hasExt, setHasExt] = useState<boolean | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [msg, setMsg] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [logTitle, setLogTitle] = useState('');
  const [f, setF] = useState({ name: '', sessionId: '', url: '', method: 'GET', intervalMin: 10, checkType: 'none', checkVal: '', body: '', notify: true });

  const load = async () => {
    setJobs(await extCall('SR_LIST_JOBS'));
    setSessions(await extCall('SR_LIST_SESSIONS'));
  };
  useEffect(() => {
    (async () => {
      const ok = await extAvailable();
      setHasExt(ok);
      if (ok) { try { await load(); } catch (e: any) { setMsg(e.message); } }
    })();
  }, []);

  const save = async () => {
    if (!f.name.trim() || !f.sessionId || !f.url.trim()) return setMsg('Naam, session aur URL teeno zaroori hain');
    try { new URL(f.url.trim()); } catch { return setMsg('URL sahi nahi hai'); }
    try {
      await extCall('SR_SAVE_JOB', { job: { name: f.name.trim(), sessionId: f.sessionId, url: f.url.trim(), method: f.method, intervalMin: Math.max(1, f.intervalMin || 10), check: { type: f.checkType, value: f.checkVal.trim() }, body: f.body.trim(), notify: f.notify, active: true } });
      setMsg('Job save ho gaya — scheduler har 1 min me due jobs chalata hai.');
      setF({ ...f, name: '', url: '', body: '', checkVal: '' });
      load();
    } catch (e: any) { setMsg('Error: ' + e.message); }
  };
  const runNow = async (j: Job) => {
    setMsg(j.name + ' chal raha hai…');
    try { const r = await extCall('SR_RUN_JOB', { id: j.id }); setMsg(j.name + ': ' + (r.ok ? 'OK' : 'FAIL') + ' — ' + r.note); load(); showLogs(j); }
    catch (e: any) { setMsg('Error: ' + e.message); }
  };
  const showLogs = async (j: Job) => {
    setLogTitle('— ' + j.name);
    setLogs(await extCall('SR_GET_LOGS', { jobId: j.id }));
  };

  if (hasExt === null) return <p style={{ color: '#94a3b8' }}>Extension check ho rahi hai…</p>;
  if (!hasExt) return <div className="warn">Extension install nahi hai. <a href="/guide" style={{ color: '#7dd3fc' }}>Guide</a> dekho.</div>;

  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>🤖 Automation</h2>
      <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 8px' }}>Saved session par scheduled jobs — login watchdog, content checks, fail alerts.</p>

      <div className="card">
        <h3>➕ Naya job</h3>
        <label>Job ka naam</label>
        <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="jaise: Dashboard login check" />
        <div className="grid2">
          <div><label>Session</label>
            <select value={f.sessionId} onChange={e => setF({ ...f, sessionId: e.target.value })}>
              <option value="">— chunno —</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>)}
            </select>
          </div>
          <div><label>Har kitne minute me</label><input type="number" min={1} value={f.intervalMin} onChange={e => setF({ ...f, intervalMin: parseInt(e.target.value) || 10 })} /></div>
        </div>
        <label>URL (session ke saath khulega)</label>
        <input value={f.url} onChange={e => setF({ ...f, url: e.target.value })} placeholder="https://example.com/dashboard" />
        <div className="grid2">
          <div><label>Method</label>
            <select value={f.method} onChange={e => setF({ ...f, method: e.target.value })}><option>GET</option><option>POST</option></select>
          </div>
          <div><label>POST body (JSON)</label><input value={f.body} onChange={e => setF({ ...f, body: e.target.value })} placeholder='{"action":"ping"}' /></div>
        </div>
        <div className="grid2">
          <div><label>Check</label>
            <select value={f.checkType} onChange={e => setF({ ...f, checkType: e.target.value })}>
              <option value="none">koi check nahi</option>
              <option value="contains">page me ye text HO</option>
              <option value="notContains">page me ye text NA ho</option>
              <option value="urlNotContains">URL me ye NA ho (jaise /login)</option>
            </select>
          </div>
          <div><label>Check value</label><input value={f.checkVal} onChange={e => setF({ ...f, checkVal: e.target.value })} placeholder="jaise: Welcome" /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={f.notify} onChange={e => setF({ ...f, notify: e.target.checked })} />
          Fail hone par notification dikhao
        </label>
        <button className="btn" onClick={save}>Job save karo</button>
        <div className="msg">{msg}</div>
      </div>

      <h3 style={{ margin: '26px 0 10px' }}>📋 Jobs ({jobs.length})</h3>
      {!jobs.length && <p style={{ color: '#64748b', fontSize: 14 }}>Koi job nahi. Upar form se banao.</p>}
      {jobs.map(j => (
        <div className="sess" key={j.id}>
          <div>
            <div className="nm">{j.name} {!j.active ? <span className="badge b-off">band</span> : j.lastStatus === 'fail' ? <span className="badge b-fail">fail</span> : j.lastStatus === 'ok' ? <span className="badge b-ok">ok</span> : <span className="badge b-off">naya</span>}</div>
            <div className="dm">{j.method} {j.url} • har {j.intervalMin} min{j.lastRun ? ` • aakhri: ${fmtT(j.lastRun)}` : ''}{j.nextRun && j.active ? ` • agli: ${fmtT(j.nextRun)}` : ''}</div>
          </div>
          <div className="rowbtns">
            <button className="sbtn mut" onClick={() => runNow(j)}>▶ Abhi</button>
            <button className="sbtn mut" onClick={() => showLogs(j)}>Logs</button>
            <button className="sbtn mut" onClick={async () => { await extCall('SR_TOGGLE_JOB', { id: j.id }); load(); }}>{j.active ? 'Band' : 'Chalu'}</button>
            <button className="sbtn del" onClick={async () => { if (confirm(`"${j.name}" delete?`)) { await extCall('SR_DELETE_JOB', { id: j.id }); load(); } }}>✕</button>
          </div>
        </div>
      ))}

      <h3 style={{ margin: '26px 0 10px' }}>🧾 Logs <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>{logTitle}</span></h3>
      <div className="card">
        {!logs.length && <span style={{ color: '#64748b', fontSize: 13 }}>Kisi job ka "Logs" dabao</span>}
        {logs.map((l, i) => (
          <div className="logrow" key={i}>
            <span className={`badge ${l.ok ? 'b-ok' : 'b-fail'}`}>{l.ok ? 'OK' : 'FAIL'}</span>{' '}
            <span style={{ color: '#94a3b8' }}>{fmtT(l.ts)}</span> — {l.note}{l.ms ? ` (${l.ms}ms)` : ''}
          </div>
        ))}
      </div>
    </>
  );
}
