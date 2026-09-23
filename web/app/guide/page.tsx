export default function Guide() {
  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>📖 Guide</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Extension install se lekar pehli automation tak — sab kuch step by step.</p>

      <div className="card">
        <h3>1️⃣ Extension install karo (ek baar)</h3>
        <ol className="guide">
          <li>GitHub repo <code>raj3kk/sessionrunner</code> se <code>extension/</code> folder download karo (ya zip).</li>
          <li>Chrome me <code>chrome://extensions</code> kholo.</li>
          <li>Upar right me <b>Developer mode</b> ON karo.</li>
          <li><b>Load unpacked</b> dabao aur <code>extension/</code> folder select karo.</li>
          <li>Toolbar me ⚡ icon pin kar lo. Bas!</li>
        </ol>
      </div>

      <div className="card">
        <h3>2️⃣ Session ID / cookies kaise nikalein</h3>
        <p>Do tareeke hain — jo aasaan lage:</p>
        <ol className="guide">
          <li><b>Aasaan (recommended):</b> site par normal login karo (apne ID/password se). Phir extension popup me <b>"📥 Is tab ka session save karo"</b> dabao — saare cookies khud capture ho jayenge, httpOnly wale bhi.</li>
          <li><b>Manual:</b> site kholo → <code>F12</code> → <b>Application</b> tab → <b>Cookies</b> → site select karo. Wahan <b>Name</b> aur <b>Value</b> dikhenge (jaise <code>sessionid</code>). Inhe <code>name=value; name2=value2</code> format me jodkar Sessions page par paste karo.</li>
        </ol>
        <div className="warn" style={{ marginBottom: 0 }}>
          Ye sirf <b>tumhare khud ke accounts</b> ke liye hai. Kisi aur ka session ID use karna account takeover hota hai — mat karna.
        </div>
      </div>

      <div className="card">
        <h3>3️⃣ Session se login karo</h3>
        <ol className="guide">
          <li><b>Sessions</b> page par naam + URL + cookies paste karke <b>"Session se login karo"</b> dabao.</li>
          <li>Extension cookies set karke site naye tab me <b>logged-in</b> khol dega — password dobara nahi mangega.</li>
          <li>Session vault me save ho jayega — baad me ek click me <b>"Kholo"</b> dabakar wapas khol sakte ho.</li>
        </ol>
      </div>

      <div className="card">
        <h3>4️⃣ Automation job banao</h3>
        <ol className="guide">
          <li><b>Automation</b> page par job ka naam, session, URL aur interval do (jaise har 10 minute).</li>
          <li><b>Check</b> lagao — jaise page me <code>Welcome</code> text hona chahiye, ya URL me <code>/login</code> nahi hona chahiye.</li>
          <li>Save karte hi scheduler chalu — har 1 minute me due jobs apne aap chalte hain.</li>
          <li>Fail hone par <b>notification</b> ayega (jaise session expire ho gaya ho).</li>
          <li><b>Logs</b> me har run ka time, status aur note dikhega.</li>
        </ol>
      </div>

      <div className="card">
        <h3>⚠️ Honest limits (pehle se pata ho)</h3>
        <ul className="guide">
          <li><b>Session expire</b> hota hai — site jitni der ka session deti hai, utni der chalega. Expire hone par dobara login karke session refresh karo (watchdog tumhe bata dega).</li>
          <li>Kuch sites session ko <b>IP/device se baandh</b> deti hain — aise me paste kiya session kaam nahi karega. Extension se capture kiya session (same browser) zyada reliable hai.</li>
          <li>Chrome band hone par scheduled jobs nahi chalenge — automation ke liye Chrome khula rehna chahiye.</li>
          <li>Ye tool <b>paid checkout / payment flows</b> automate nahi karta — wo hamesha tum khud karoge.</li>
        </ul>
      </div>
    </>
  );
}
