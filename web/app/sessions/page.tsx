'use client';
import { useEffect, useState } from 'react';
import { extCall, extAvailable, fmtT } from '@/lib/bridge';

type Session = { id: string; name: string; url: string; domain: string; cookies: any[]; createdAt: number };

export default function SessionsPage() {
  const [hasExt, setHasExt] = useState<boolean | null>(null);
  const [list, setList] = useState<Session[]>([]);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cookieStr, setCookieStr] = useState('');

  const load = async () => {
    try { setList(await extCall('SR_LIST_SESSIONS')); }
    catch (e: any) { setMsg(e.message); }
  };

  useEffect(() => {
    (async () => {
      const ok = await extAvailable();
      setHasExt(ok);
      if (ok) load();
    })();
  }, []);

  const doLogin = async () => {
    if (!url.trim() || !cookieStr.trim()) return setMsg('URL aur cookies dono daalo');
    let host = '';
    try { host = new URL(url.trim()).hostname; } catch { return setMsg('URL sahi nahi hai'); }
    setMsg('login ho raha hai…');
    try {
      await extCall('SR_LOGIN_COOKIES', { url: url.trim(), host, cookieString: cookieStr.trim(), name: name.trim() || undefined });
      setMsg('Ho gaya! Cookies lag gaye, site khul rahi hai, session save bhi ho gaya.');
      setCookieStr('');
      load();
    } catch (e: any) { setMsg('Error: ' + e.message); }
  };

  const restore = async (s: Session) => {
    setMsg(s.name + ' khul raha hai…');
    try { await extCall('SR_RESTORE', { id: s.id }); setMsg(s.name + ' khul gaya (logged-in)'); }
    catch (e: any) { setMsg('Error: ' + e.message); }
  };
  const del = async (s: Session) => {
    if (!confirm(`"${s.name}" delete karein?`)) return;
    await extCall('SR_DELETE_SESSION', { id: s.id });
    load();
  };

  if (hasExt === null) return <p style={{ color: '#94a3b8' }}>Extension check ho rahi hai…</p>;
  if (!hasExt) return (
    <div className="warn">
      SessionRunner extension install nahi hai ya active nahi hai. <a href="/guide" style={{ color: '#7dd3fc' }}>Guide</a> me
      install steps hain — <code>chrome://extensions</code> → Developer mode → Load unpacked → <code>extension/</code> folder.
    </div>
  );

  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>🔑 Sessions</h2>
      <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 8px' }}>Session ID se login karo, ya naye session save karo. Sab tumhare browser me safe hai.</p>

      <div className="card">
        <h3>➕ Session ID se login karo</h3>
        <div className="grid2">
          <div><label>Naam (optional)</label><input value={name} onChange={e => setName(e.target.value)} placeholder="jaise: Mera dashboard" /></div>
          <div><label>Website URL</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/dashboard" /></div>
        </div>
        <label>Session cookies <span style={{ color: '#64748b' }}>(format: name=value; name2=value2)</span></label>
        <textarea rows={3} value={cookieStr} onChange={e => setCookieStr(e.target.value)} placeholder="sessionid=abc123; csrftoken=xyz789" />
        <button className="btn" onClick={doLogin}>Session se login karo</button>
        <div className="msg">{msg}</div>
        <p style={{ fontSize: 12, color: '#64748b' }}>Tip: site par khud login karke extension popup me "Is tab ka session save karo" bhi daba sakte ho — cookies khud capture ho jayenge.</p>
      </div>

      <h3 style={{ margin: '26px 0 10px' }}>💾 Saved sessions ({list.length})</h3>
      {!list.length && <p style={{ color: '#64748b', fontSize: 14 }}>Koi session nahi hai. Upar se login karo ya extension popup se capture karo.</p>}
      {list.map(s => (
        <div className="sess" key={s.id}>
          <div>
            <div className="nm">{s.name}</div>
            <div className="dm">{s.domain} • {s.cookies.length} cookies • {fmtT(s.createdAt)}</div>
          </div>
          <div className="rowbtns">
            <button className="sbtn open" onClick={() => restore(s)}>Kholo</button>
            <button className="sbtn del" onClick={() => del(s)}>✕</button>
          </div>
        </div>
      ))}
    </>
  );
}
