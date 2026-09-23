export default function Home() {
  return (
    <>
      <div className="hero">
        <h1>⚡ SessionRunner</h1>
        <p>
          Session ID / cookies se kisi bhi website me <b>bina password</b> login karo —
          aur us logged-in session par <b>automation jobs</b> chalao. Sab kuch tumhare
          apne browser me, tumhare apne sessions ke saath.
        </p>
        <div style={{ marginTop: 22 }}>
          <a className="btn" href="/sessions">Sessions kholo</a>
          <a className="btn ghost" href="/automation">Automation</a>
          <a className="btn ghost" href="/guide">Guide padho</a>
        </div>
      </div>

      <div className="warn">
        Pehle Chrome extension install karna zaroori hai — bina uske website kuch nahi kar payegi.
        Extension me hi cookies padhne/lagane ki permission hoti hai (httpOnly cookies samet).
      </div>

      <div className="steps">
        <div className="step">
          <div className="n">1️⃣</div>
          <h4>Extension install karo</h4>
          <p>Repo se <code>extension/</code> folder download karke <code>chrome://extensions</code> me Developer mode ON karke "Load unpacked" dabao.</p>
        </div>
        <div className="step">
          <div className="n">2️⃣</div>
          <h4>Session se login karo</h4>
          <p>Site ka session ID / cookies paste karo — extension cookies set karke site logged-in khol dega. Ya site par khud login karke "session save karo" dabao.</p>
        </div>
        <div className="step">
          <div className="n">3️⃣</div>
          <h4>Automation chalao</h4>
          <p>Job banao: kaunsa session, kaunsa URL, har kitne minute me. Login-check, text-check, fail par notification — sab automatic.</p>
        </div>
      </div>

      <div className="card">
        <h3>🔧 Automation me kya-kya hota hai</h3>
        <ul className="guide">
          <li><b>Scheduled checks</b> — har 1 minute se lekar ghanton tak, tumhare set interval par URL khulta hai saved session ke saath.</li>
          <li><b>Login watchdog</b> — agar session expire hokar login page par redirect ho, job FAIL mark hoga aur tumhe notification milega.</li>
          <li><b>Content checks</b> — page me koi text hona chahiye / nahi hona chahiye, ye verify hota hai (jaise "Welcome" dikhe, "Login" na dikhe).</li>
          <li><b>Run log</b> — har run ka time, status, aur note safe rehta hai (aakhri 50 runs).</li>
          <li><b>Manual run</b> — kisi bhi job ko turant chala sakte ho.</li>
        </ul>
      </div>

      <div className="card">
        <h3>🔐 Privacy</h3>
        <p>
          Sessions sirf tumhare browser ke local storage me rehte hain — koi server nahi,
          koi upload nahi. Automation bhi tumhare browser se hi chalta hai, isliye site ko
          tumhara asli IP aur asli browser milta hai (datacenter jaisa block ka risk nahi).
        </p>
      </div>
    </>
  );
}
