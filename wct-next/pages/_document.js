import { Html, Head, Main, NextScript } from 'next/document';

// Sentry benzeri harici bir servis kullanmadan, basit istemci hata günlüğü.
// En erken noktada (Document seviyesinde) yüklenir ki React önyükleme
// hatalarını da yakalasın. Sayfa adı URL'den otomatik çıkarılır, bu yüzden
// bu script tüm sayfalar için ortak kullanılabilir.
const errorCatcherScript = `
(function () {
    var reported = 0;
    var page = (window.location.pathname.replace(/^\\/|\\.html$/g, '') || 'index');
    function report(message) {
        if (reported >= 3) return;
        reported++;
        try {
            fetch('/log-error.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: page, message: String(message).slice(0, 500) })
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
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            </Head>
            <body className="antialiased selection:bg-accent/30 selection:text-white">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
