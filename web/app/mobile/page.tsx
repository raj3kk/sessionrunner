export default function Mobile() {
  return (
    <>
      <h2 style={{ margin: '0 0 4px' }}>📱 Mobile App</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Android app — phone me hi session banao, session code se kahin bhi login karo. Koi server nahi, sab tumhare phone me.</p>

      <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
        <div style={{ fontSize: 52 }}>📱</div>
        <h3 style={{ margin: '8px 0 4px' }}>SessionRunner v1.0.0 (Android)</h3>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>681 KB • Android 7.0+ • Koi login/signup nahi • Koi server upload nahi</p>
        <p><a href="/sessionrunner.apk" className="btn" style={{ fontSize: 17, padding: '12px 26px' }}>⬇️ APK download karo</a></p>
        <p style={{ color: '#64748b', fontSize: 12 }}>Unknown sources se install ki permission ek baar deni hogi (Play Store ke bahar ka app hai).</p>
      </div>

      <div className="card">
        <h3>1️⃣ Install karo</h3>
        <ol className="guide">
          <li>Upar se <b>APK download</b> karo aur kholo — install kar lo.</li>
          <li>App kholte hi andar ek <b>browser</b> milega (URL bar ke saath).</li>
        </ol>
      </div>

      <div className="card">
        <h3>2️⃣ Session code banao</h3>
        <ol className="guide">
          <li>App ke browser me apni site kholo aur <b>normal login</b> karo (apne ID/password se).</li>
          <li><b>"📥 Is site ka session banao"</b> dabao.</li>
          <li>App ek <b>session code</b> dega (jaise <code>SR1.xxxxx…</code>) — ise <b>Copy</b> karke safe jagah rakh lo. Ye code tumhare session ki chaabi hai.</li>
          <li>Session app ke andar <b>"🗂 Mere sessions"</b> me bhi save ho jayega.</li>
        </ol>
      </div>

      <div className="card">
        <h3>3️⃣ Session code se login karo (kahin bhi)</h3>
        <ol className="guide">
          <li>App me <b>"📋 Session code se login"</b> dabao aur code paste karo.</li>
          <li>App session wapas daal kar site <b>logged-in</b> khol dega — password dobara nahi mangega.</li>
          <li>Ye code apne <b>dusre phone</b> me bhi paste kar sakte ho — wahan bhi logged-in khulega.</li>
        </ol>
      </div>

      <div className="warn">
        Session code kisi ke saath <b>share mat karo</b> — jiske paas code hai, wo tumhare account me ghus sakta hai. Sirf <b>tumhare khud ke accounts</b> ke liye use karo.
      </div>

      <div className="card">
        <h3>⚠️ Honest limits</h3>
        <ul className="guide">
          <li>Session <b>expire</b> hota hai — site jitni der ka session deti hai. Expire hone par dobara login karke naya code banao.</li>
          <li>Kuch sites session ko <b>device/IP se baandh</b> deti hain — aisa session dusre phone me kaam nahi karega, usi phone me chalega.</li>
          <li>Ye app <b>paid checkout / payment</b> automate nahi karta.</li>
        </ul>
      </div>
    </>
  );
}
