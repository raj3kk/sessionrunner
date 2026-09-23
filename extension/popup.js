const $ = id => document.getElementById(id);
const say = (t, el = 'loginMsg') => { $(el).textContent = t; };

$('tabLogin').onclick = () => switchTab('Login');
$('tabSessions').onclick = () => { switchTab('Sessions'); loadSessions(); };
function switchTab(name) {
  $('tabLogin').classList.toggle('on', name === 'Login');
  $('tabSessions').classList.toggle('on', name === 'Sessions');
  $('paneLogin').hidden = name !== 'Login';
  $('paneSessions').hidden = name !== 'Sessions';
}
$('openOptions').onclick = (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); };

async function call(type, payload = {}) {
  const r = await chrome.runtime.sendMessage({ type, payload });
  if (!r || !r.ok) throw new Error((r && r.error) || 'kuch gadbad hui');
  return r.result;
}

// --- session ID paste karke login ---
$('btnLogin').onclick = async () => {
  const url = $('loginUrl').value.trim();
  const cs = $('cookieStr').value.trim();
  if (!url || !cs) return say('URL aur cookies dono daalo');
  let host;
  try { host = new URL(url).hostname; } catch { return say('URL sahi nahi hai'); }
  say('login ho raha hai…');
  try {
    const r = await call('SR_LOGIN_COOKIES', { url, host, cookieString: cs });
    say(`Ho gaya! ${r.set.ok} cookies lage — site khul rahi hai, session save bhi ho gaya.`);
    $('cookieStr').value = '';
  } catch (e) { say('Error: ' + e.message); }
};

// --- current tab ka session capture ---
$('btnCapture').onclick = async () => {
  say('capture ho raha hai…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const r = await call('SR_CAPTURE_TAB', { tabId: tab.id });
    if (!r.cookies.length) return say('Is tab me koi cookie nahi mila — pehle site par login karo.');
    const name = prompt('Session ka naam:', r.host);
    if (!name) return say('cancel kar diya');
    await call('SR_SAVE_SESSION', {
      session: { id: 'id_' + Date.now().toString(36), name, url: r.url, domain: r.host, cookies: r.cookies, createdAt: Date.now() }
    });
    say(`Save ho gaya: ${name} (${r.cookies.length} cookies)`);
    loadSessions();
  } catch (e) { say('Error: ' + e.message); }
};

// --- saved sessions list ---
async function loadSessions() {
  const box = $('sessList');
  box.innerHTML = '<div style="font-size:12px;color:#94a3b8">load ho raha hai…</div>';
  try {
    const list = await call('SR_LIST_SESSIONS');
    if (!list.length) { box.innerHTML = '<div style="font-size:12px;color:#94a3b8">Koi session save nahi hai. Pehle login karke save karo.</div>'; return; }
    box.innerHTML = '';
    for (const s of list) {
      const div = document.createElement('div');
      div.className = 'sess';
      const d = new Date(s.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `<div class="nm"></div><div class="dm"></div><div class="row"><button class="open">Kholo</button><button class="del">Delete</button></div>`;
      div.querySelector('.nm').textContent = s.name;
      div.querySelector('.dm').textContent = `${s.domain} • ${s.cookies.length} cookies • ${d}`;
      div.querySelector('.open').onclick = async () => {
        say('khul raha hai…', 'sessMsg');
        try { await call('SR_RESTORE', { id: s.id }); say(s.name + ' khul gaya (logged-in)', 'sessMsg'); }
        catch (e) { say('Error: ' + e.message, 'sessMsg'); }
      };
      div.querySelector('.del').onclick = async () => {
        if (!confirm(`"${s.name}" delete karein?`)) return;
        await call('SR_DELETE_SESSION', { id: s.id });
        loadSessions();
      };
      box.appendChild(div);
    }
  } catch (e) { box.innerHTML = '<div style="font-size:12px;color:#fda4af">Error: ' + e.message + '</div>'; }
}
loadSessions();
