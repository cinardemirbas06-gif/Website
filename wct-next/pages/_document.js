import { Html, Head, Main, NextScript } from 'next/document';

// Sentry benzeri harici bir servis kullanmadan, basit istemci hata günlüğü.
// En erken noktada (Document seviyesinde) yüklenir ki React önyükleme
// hatalarını da yakalasın.
const errorCatcherScript = `
(function () {
    var reported = 0;
    function report(message) {
        if (reported >= 3) return;
        reported++;
        try {
            fetch('/log-error.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: 'webcreatortr', message: String(message).slice(0, 500) })
            });
        } catch (e) {}
    }
    window.addEventListener('error', function (e) { report(e.message || 'Bilinmeyen hata'); });
    window.addEventListener('unhandledrejection', function (e) { report((e.reason && e.reason.message) || String(e.reason) || 'Promise reddedildi'); });
})();
`;

export default function Document() {
    return (
        <Html lang="tr" className="scroll-smooth">
            <Head>
                <script dangerouslySetInnerHTML={{ __html: errorCatcherScript }} />
                <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%230a0f16'/%3E%3Ctext x='50' y='68' font-size='50' font-family='Arial, sans-serif' font-weight='bold' fill='%234f46e5' text-anchor='middle'%3EW%3C/text%3E%3C/svg%3E" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>
            <body className="antialiased selection:bg-accent/30 selection:text-white">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
