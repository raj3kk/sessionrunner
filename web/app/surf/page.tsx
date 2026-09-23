'use client';
import { useState } from 'react';

export default function Surf() {
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');
  const [frameSrc, setFrameSrc] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function openSite() {
    setError('');
    setFrameSrc('');
    if (!code.trim()) { setError('Pehle session code paste karo.'); return; }
    let u = url.trim();
    if (!u) { setError('Site ka URL do (jaise instagram.com).'); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    setLoading(true);
    try {
      const r = await fetch('/api/surf/token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Session code kaam nahi kiya.');
      setDomain(j.domain);
      setFrameSrc(`/api/surf/fetch?t=${encodeURIComponent(j.token)}&u=${encodeURIComponent(u)}`);
    } catch (e: any) {
      setError(e.message || 'Kuch gadbad hui.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>🌐 Site chalao</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>
        Session code paste karo, site ka URL do — site <b>logged-in</b> neeche khul jayegi.
        Session code mobile app ke <b>"📥 Is site ka session banao"</b> se milta hai.
      </p>

      <div className="card">
        <label style={{ fontSize: 13, color: '#94a3b8' }}>Session code (SR1.…)</label>
        <textarea
          value={code} onChange={e => setCode(e.target.value)}
          placeholder="SR1.xxxxx… — mobile app se copy karke yahan paste karo"
          rows={3}
          style={{ width: '100%', marginTop: 6, background: '#0b1220', color: '#e2e8f0', border: '1px solid #1e293b', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'monospace' }}
        />
        <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginTop: 12 }}>Site ka URL</label>
        <input
          value={url} onChange={e => setUrl(e.target.value)}
          placeholder="jaise: instagram.com  ya  https://example.com/dashboard"
          style={{ width: '100%', marginTop: 6, background: '#0b1220', color: '#e2e8f0', border: '1px solid #1e293b', borderRadius: 8, padding: 10, fontSize: 14 }}
        />
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={openSite} disabled={loading}>
            {loading ? 'Khul raha hai…' : '🌐 Site kholo'}
          </button>
          {domain && <span style={{ marginLeft: 12, fontSize: 13, color: '#94a3b8' }}>Session: <b>{domain}</b></span>}
        </div>
        {error && <div className="warn" style={{ marginTop: 12, marginBottom: 0 }}>⚠️ {error}</div>}
      </div>

      {frameSrc && (
        <div className="card" style={{ padding: 8 }}>
          <iframe
            src={frameSrc}
            title="site"
            style={{ width: '100%', height: '72vh', border: '1px solid #1e293b', borderRadius: 8, background: '#fff' }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      )}

      <div className="warn">
        Session code kisi ke saath <b>share mat karo</b> — ye tumhare account ki chaabi hai. Token sirf 30 minute chalta hai aur server session <b>store nahi</b> karta.
      </div>

      <div className="card">
        <h3>⚠️ Honest limits</h3>
        <ul className="guide">
          <li>Ye ek <b>proxy view</b> hai — simple sites poori tarah chalengi; bahut heavy JavaScript wali apps (jaise kuch dashboards) adhoori dikh sakti hain.</li>
          <li>Session jis domain ka hai, proxy <b>sirf wahi domain</b> kholega — dusri site ke liye uska apna session code chahiye.</li>
          <li>Site me <b>payment/checkout</b> mat karna — wo hamesha asli browser/app me khud karo.</li>
          <li>Session expire hone par dobara login karke mobile app se naya code banao.</li>
        </ul>
      </div>
    </>
  );
}
