# ⚡ SessionRunner

Session ID / cookies se kisi bhi website me **bina password** login karo — aur us logged-in session par **automation jobs** chalao.

**Tumhare apne sessions, sirf tumhare browser me.** Koi server nahi, koi upload nahi.

## Kya hai isme

- **Session login** — `sessionid=abc123; ...` paste karo, site logged-in khul jayegi (httpOnly cookies samet)
- **Session capture** — site par khud login karo, ek click me saare cookies save
- **Sessions vault** — saved sessions, ek click me dobara kholo
- **Automation jobs** — har X minute me URL check (saved session ke saath), login watchdog, content checks, fail par notification, run logs
- **Website dashboard** — sessions + automation manage karo (`web/`, Next.js)

## Structure

```
extension/   Chrome extension (MV3) — core: cookies + scheduler
web/         Next.js dashboard — https://sessionrunner.vercel.app
```

## Install (extension)

1. `extension/` folder lo
2. `chrome://extensions` → Developer mode ON → **Load unpacked** → folder select karo
3. Toolbar me pin karo

## Use

1. Site par login karo (khud, apne ID se) → popup me **"Is tab ka session save karo"**
   — ya — Sessions page par session cookies paste karke **"Session se login karo"**
2. **Automation** page/options me job banao: session + URL + interval + check
3. Scheduler har 1 min me due jobs chalata hai; fail par notification

## Notes

- Sirf **apne khud ke accounts** ke liye. Kisi aur ka session use karna account takeover hai.
- Sessions expire hote hain — watchdog expire hone par bata dega, phir refresh karo.
- Chrome band ho to scheduled jobs nahi chalenge.
- Paid checkout/payment flows automate nahi hote — wo hamesha user khud karega.
