import './globals.css';
export const metadata = { title: 'SessionRunner', description: 'Session ID se website login + automation. Tumhare apne sessions, tumhare browser me.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>
        <nav className="nav">
          <a href="/" className="logo">⚡ SessionRunner</a>
          <div className="links">
            <a href="/sessions">Sessions</a>
            <a href="/automation">Automation</a>
            <a href="/guide">Guide</a>
          </div>
        </nav>
        <main className="wrap">{children}</main>
        <footer className="foot">SessionRunner — tumhare apne sessions, sirf tumhare browser me. Kisi aur ka session use karna account takeover hota hai — ye tool sirf tumhare khud ke accounts ke liye hai.</footer>
      </body>
    </html>
  );
}
