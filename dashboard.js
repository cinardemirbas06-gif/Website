/**
 * Panel Uygulama Mantığı
 */
if (window.__DASHBOARD_JS_LOADED__) {
  console.warn("dashboard.js zaten yüklendi, tekrar çalıştırılmadı.");
} else {
  window.__DASHBOARD_JS_LOADED__ = true;

  // dashboard.js içindeki tüm kodlar buraya gelecek
}

// --- TEMA YÖNETİMİ (DARK MODE) ---
const savedTheme = localStorage.getItem('dash_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
window.toggleTheme = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dash_theme', next);

    // Grafikleri Temaya Göre Canlı Güncelle
    if (window.Chart) {
        Chart.defaults.color = next === 'dark' ? '#9ca3af' : '#8e8e93';
        Chart.defaults.scale.grid.color = next === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        for(let id in Chart.instances){
            Chart.instances[id].update();
        }
    }
};

// --- UI ETKİLEŞİM SESLERİ VE TİTREŞİM ---
let audioCtx;
// Ses context'ini kullanıcı etkileşimiyle başlatmak en iyi pratiktir.
const initAudio = () => {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API bu tarayıcıda desteklenmiyor.");
        }
    }
};

// Basit bir ses efekti çalar
const playSound = (type = 'click') => {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    } else if (type === 'hover') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
    }
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
};

// Dokunmatik cihazlarda hafif bir titreşim gönderir
const doHaptic = () => {
    if (navigator.vibrate) {
        navigator.vibrate(30); // 30ms titreşim
    }
};

// Chart.js Global Estetik Ayarları
if (window.Chart) {
    Chart.defaults.color = savedTheme === 'dark' ? '#9ca3af' : '#8e8e93';
    Chart.defaults.scale.grid.color = savedTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
}

document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page;
    
    // Global Sayfa Geçiş Animasyonu (Loader)
    const loader = document.createElement('div');
    loader.className = 'dash-page-loader';
    loader.innerHTML = '<div class="dash-spinner-global"></div>';
    document.body.appendChild(loader);

    const protectedPages = ['dashboard', 'money', 'planner', 'analysis', 'notes'];
    
    try {
        if (protectedPages.includes(page) || page === 'login') {
            const session = localStorage.getItem('panel_auth') === 'true';
            
            if (protectedPages.includes(page) && !session) {
                window.location.href = 'login.html';
                return; // Loader görünür kalarak logine gider
            }
            
            if (page === 'login' && session) {
                window.location.href = 'dashboard.html';
                return; 
            }
        }
    } catch(e) {
        console.error("Oturum kontrol hatası:", e);
    }

    if (page === 'login') initLogin();
    if (page === 'dashboard') initDashboard();
    if (page === 'money') initMoney();
    if (page === 'planner') initPlanner();
    if (page === 'analysis') initAnalysis();
    if (page === 'notes') initNotes();

    setTimeout(() => { loader.classList.add('fade-out'); }, 300);

    // Etkileşimli elementlere ses ve titreşim ekle
    document.addEventListener('click', initAudio, { once: true });

    const interactiveElements = document.querySelectorAll(
        '.dash-btn, .cal-day, .widget-handle, a.dash-card'
    );

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => playSound('hover'));
        el.addEventListener('click', () => {
            playSound('click');
            doHaptic();
        });
    });

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            const target = link.getAttribute('target');
            if (href && !href.startsWith('#') && !href.startsWith('javascript') && target !== '_blank') {
                e.preventDefault();
                loader.classList.remove('fade-out');
                setTimeout(() => { window.location.href = href; }, 400);
            }
        });
    });
});

// --- YARDIMCI FONKSİYONLAR ---

window.showToast = (msg, isError = false) => {
    let toast = document.getElementById('dash-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'dash-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `dash-toast show ${isError ? 'error' : ''}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
};

const isThisMonth = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const isToday = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.toDateString() === now.toDateString();
};

const isOverdue = (dateString, status) => {
    const date = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Sadece tarihi karşılaştır
    return date < now && (status === 'Ödenmedi' || status === 'Bekleniyor');
};

window.doLogout = async () => {
    try {
        localStorage.removeItem('panel_auth');
        window.location.href = 'login.html';
    } catch(e) {
        alert("Çıkış yapılamadı: " + e.message);
    }
};

window.exportAnalysisToPDF = async () => {
    if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
        return showToast('PDF kütüphaneleri yüklenemedi.', true);
    }

    showToast('PDF Raporu oluşturuluyor, lütfen bekleyin...');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pageTitle = "Analiz & Raporlar";
    const date = new Date().toLocaleDateString('tr-TR');
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const isDark = theme === 'dark';
    const textColor = isDark ? '#FFFFFF' : '#000000';
    const bgColor = isDark ? '#111827' : '#FFFFFF';

    doc.setTextColor(textColor);
    doc.setFontSize(22);
    doc.text(pageTitle, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Rapor Tarihi: ${date}`, 105, 27, { align: 'center' });

    try {
        const chartElements = document.querySelectorAll('.dash-card canvas');
        let yPos = 40;
        for (const chartEl of chartElements) {
            const card = chartEl.closest('.dash-card');
            const canvas = await html2canvas(card, { backgroundColor: bgColor, useCORS: true, scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth() - 30;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            doc.addImage(imgData, 'PNG', 15, yPos, pdfWidth, pdfHeight);
            yPos += pdfHeight + 10;
            if (yPos > 250) { doc.addPage(); yPos = 20; }
        }
        doc.save('Analiz_Raporu.pdf');
    } catch (error) {
        console.error("PDF oluşturma hatası:", error);
        showToast('PDF oluşturulurken bir hata oluştu.', true);
    }
};

function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        btn.innerText = "Giriş Yapılıyor...";
        btn.disabled = true;
        
        try {
            const pass = document.getElementById('login-password').value;
            if (pass === '254006') {
                localStorage.setItem('panel_auth', 'true');
                window.location.href = 'dashboard.html';
            } else {
                throw new Error('Hatalı şifre');
            }
        } catch(error) {
            showToast("Giriş Başarısız! Şifreniz hatalı.", true);
            btn.innerText = "Giriş Yap";
            btn.disabled = false;
        }
    });
}

// Global Kredi Hesaplayıcı / Erteleme
window.calcAsgari = () => {
    const total = parseFloat(document.getElementById('cc-total-debt')?.value);
    const rate = parseFloat(document.getElementById('cc-rate')?.value);
    if(total > 0) {
        const asgari = (total * rate) / 100;
        const resEl = document.getElementById('cc-result');
        resEl.style.display = 'block';
        resEl.innerHTML = `<strong>Ödenmesi Gereken Asgari Tutar:</strong> <span style="color:var(--dash-danger); font-size:18px; margin-left:8px;">${formatCurrency(asgari)}</span>`;
    } else {
        showToast('Lütfen geçerli bir borç tutarı girin.', true);
    }
};

window.postponeCredit = async (id, currentAmount, currentDateStr) => {
    const feeStr = prompt("Erteleme için alınacak ek faiz/ücret tutarını girin (₺) (Yoksa 0 yazın):", "0");
    if (feeStr === null) return;
    const fee = parseFloat(feeStr) || 0;
    const monthsStr = prompt("Kaç ay ertelenecek?", "1");
    if (monthsStr === null) return;
    const months = parseInt(monthsStr) || 1;

    if (confirm(`Borcunuz ${months} ay ertelenecek ve borca ${fee} ₺ eklenecek. Onaylıyor musunuz?`)) {
        const [y, m, d] = currentDateStr.split('-').map(Number);
        const newDate = new Date(y, (m - 1) + months, d);
        const newDateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
        const newAmount = parseFloat(currentAmount) + fee;
        try {
            const { error } = await window.supabaseClient.from('money_records').update({ amount: newAmount, date: newDateStr }).eq('id', id);
            if (error) throw error;
            showToast('Borç başarıyla ertelendi!');
            if (window.reloadMoneyRecords) window.reloadMoneyRecords();
        } catch(e) {
            showToast('Erteleme başarısız: ' + e.message, true);
        }
    }
};

// --- BİLDİRİM (NOTIFICATION) SİSTEMİ ---
window.requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        showToast("Tarayıcınız bildirimleri desteklemiyor.", true);
        return;
    }
    if (Notification.permission === "granted") {
        showToast("Bildirimler zaten aktif!");
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            showToast("Bildirimler başarıyla açıldı!");
        }
    }
};

const checkAndSendNotifications = (moneyRecords, planRecords) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const todayStr = new Date().toDateString();
    const lastNotified = localStorage.getItem('dash_last_notified');
    if (lastNotified === todayStr) return; // Günde sadece bir kez uyar

    let overdueMoney = 0;
    let todayPlans = 0;

    moneyRecords.forEach(r => {
        if ((r.type === 'Borç' || r.type === 'Taksit' || r.type === 'Harcama') && r.status !== 'Ödendi') {
            if (isOverdue(r.date, r.status) || isToday(r.date)) overdueMoney++;
        }
    });

    planRecords.forEach(r => {
        if (isToday(r.date) && r.status === 'Yapılacak') todayPlans++;
    });

    if (overdueMoney > 0 || todayPlans > 0) {
        let bodyText = "";
        if (todayPlans > 0) bodyText += `Bugün yapmanız gereken ${todayPlans} planınız var.\n`;
        if (overdueMoney > 0) bodyText += `Gecikmiş veya bugün ödenecek ${overdueMoney} ödemeniz var.`;

        new Notification("Kişisel Panel Uyarısı", { body: bodyText });
        localStorage.setItem('dash_last_notified', todayStr);
    }
};

// --- WIDGET YARDIMCI FONKSİYONLARI ---
const initGreetingAndWeather = async () => {
    const textEl = document.getElementById('dash-greeting-text');
    const weatherEl = document.getElementById('dash-weather');
    if(textEl) {
        const h = new Date().getHours();
        if(h < 12) textEl.innerText = "Günaydın Çınar ☕️";
        else if(h < 18) textEl.innerText = "İyi Günler Çınar ☀️";
        else textEl.innerText = "İyi Akşamlar Çınar 🌙";
    }
    if(weatherEl) {
        try {
            const res = await fetch('https://wttr.in/Istanbul?format=%c+%t');
                if(res.ok) {
                    const rawData = await res.text();
                    // Eğer servis HTML kodu döndürdüyse, içinden sadece hava durumu metnini ayıkla
                    if (rawData.includes('<html')) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(rawData, 'text/html');
                        const termContainer = doc.querySelector('.term-container');
                        weatherEl.innerText = termContainer ? termContainer.innerText.trim() : "🌤️ 15°C";
                    } else {
                        // Temiz metin döndüyse direkt yazdır
                        weatherEl.innerText = rawData.trim();
                    }
                }
        } catch(e) { weatherEl.innerText = "🌤️ 15°C"; }
    }
};

const initCryptoWidget = async () => {
    const container = document.getElementById('dash-crypto-list');
    if(!container) return;
    try {
        // Dolar, Euro, Altın (PAXG - Ons) ve Kripto paraları çekmek için Binance API kullanıyoruz
        const symbols = encodeURIComponent('["BTCUSDT","ETHUSDT","USDTTRY","EURUSDT","PAXGUSDT"]');
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=' + symbols);
        if (!res.ok) throw new Error('API Hatası');
        const data = await res.json();
        
        const prices = {};
        data.forEach(coin => { prices[coin.symbol] = parseFloat(coin.price); });

        const dolar = prices['USDTTRY'];
        const euro = prices['EURUSDT'] * dolar; // Euro/Dolar paritesi * Dolar/TL
        const gramAltin = (prices['PAXGUSDT'] * dolar) / 31.1035; // 1 Ons = 31.1035 Gram

        const formatTRY = (val) => new Intl.NumberFormat('tr-TR', {style:'currency', currency:'TRY'}).format(val);
        const formatUSD = (val) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(val);

        container.innerHTML = '';
        container.innerHTML = `
            <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;"><span style="font-weight:bold; display:flex; align-items:center; gap:8px;">💵 Dolar</span><span style="color:var(--dash-success); font-weight:600;">${formatTRY(dolar)}</span></div>
            <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;"><span style="font-weight:bold; display:flex; align-items:center; gap:8px;">💶 Euro</span><span style="color:var(--dash-success); font-weight:600;">${formatTRY(euro)}</span></div>
            <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;"><span style="font-weight:bold; display:flex; align-items:center; gap:8px;">🥇 Gram Altın</span><span style="color:var(--dash-success); font-weight:600;">${formatTRY(gramAltin)}</span></div>
            <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;"><span style="font-weight:bold; display:flex; align-items:center; gap:8px;">₿ Bitcoin</span><span style="color:var(--dash-success); font-weight:600;">${formatUSD(prices['BTCUSDT'])}</span></div>
            <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;"><span style="font-weight:bold; display:flex; align-items:center; gap:8px;">🔷 Ethereum</span><span style="color:var(--dash-success); font-weight:600;">${formatUSD(prices['ETHUSDT'])}</span></div>
        `;
    } catch(e) { 
        console.error('Kripto verisi çekme hatası:', e);
        container.innerHTML = '<div class="dash-empty">Piyasa verisi alınamadı.</div>'; 
    }
};

window.renderSubs = () => {
    const container = document.getElementById('dash-subs-list');
    if(!container) return;
    let subs = JSON.parse(localStorage.getItem('dash_subs')) || [{name: 'Netflix', price: 150, date: 15}, {name: 'Spotify', price: 40, date: 21}];
    container.innerHTML = '';
    if(subs.length === 0) return container.innerHTML = '<div class="dash-empty">Abonelik bulunmuyor.</div>';
    subs.forEach((s, i) => {
        container.innerHTML += `
            <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;">
                <div class="dash-item-info">
                    <div class="dash-item-title" style="font-size:13px; margin-bottom:2px;">${s.name}</div>
                    <div class="dash-item-meta" style="font-size:11px;">Her ayın ${s.date}. günü</div>
                </div>
                <div style="font-weight:bold; font-size:14px; color:var(--dash-danger);">-${formatCurrency(s.price)}
                    <button style="background:transparent; border:none; color:var(--dash-muted); cursor:pointer; margin-left:8px;" onclick="deleteSub(${i})">🗑️</button>
                </div>
            </div>`;
    });
};

window.addSubscription = () => {
    const name = prompt("Abonelik Adı (Örn: Netflix):");
    const price = prompt("Aylık Tutar (₺):");
    const date = prompt("Ayın Kaçıncı Günü Yenileniyor?");
    if(name && price && date) {
        let subs = JSON.parse(localStorage.getItem('dash_subs')) || [];
        subs.push({name, price: parseFloat(price), date: parseInt(date)});
        localStorage.setItem('dash_subs', JSON.stringify(subs));
        renderSubs();
    }
};
window.deleteSub = (index) => {
    let subs = JSON.parse(localStorage.getItem('dash_subs')) || [];
    subs.splice(index, 1);
    localStorage.setItem('dash_subs', JSON.stringify(subs));
    renderSubs();
};

window.renderHabits = () => {
    const container = document.getElementById('dash-habit-list');
    if(!container) return;
    let habits = JSON.parse(localStorage.getItem('dash_habits')) || { 'Su İç': [], 'Kitap Oku': [], 'Spor Yap': [] };
    container.innerHTML = '';
    const days = Array.from({length:7}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6-i)); return d.toISOString().split('T')[0]; });

    Object.keys(habits).forEach(habitName => {
        const completedDates = habits[habitName];
        let dotsHtml = days.map(d => `<div onclick="toggleHabit('${habitName}', '${d}')" style="width:24px; height:24px; border-radius:6px; cursor:pointer; transition:0.3s; background:${completedDates.includes(d) ? 'var(--dash-success)' : 'var(--dash-border)'};" title="${d}"></div>`).join('');
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; font-weight:600; color:var(--dash-text);">${habitName}</span>
                <div style="display:flex; gap:6px;">${dotsHtml}</div>
            </div>`;
    });
};

window.toggleHabit = (name, date) => {
    let habits = JSON.parse(localStorage.getItem('dash_habits'));
    if (!habits) habits = { 'Su İç': [], 'Kitap Oku': [], 'Spor Yap': [] };
    if (!habits[name]) habits[name] = [];
    if(habits[name].includes(date)) habits[name] = habits[name].filter(d => d !== date);
    else { habits[name].push(date); if(typeof doHaptic === 'function') doHaptic(); }
    localStorage.setItem('dash_habits', JSON.stringify(habits));
    renderHabits();
};
window.addHabit = () => {
    const name = prompt("Yeni alışkanlık adı:");
    if(name) {
        let habits = JSON.parse(localStorage.getItem('dash_habits'));
        if (!habits) habits = { 'Su İç': [], 'Kitap Oku': [], 'Spor Yap': [] };
        if (!habits[name]) habits[name] = [];
        localStorage.setItem('dash_habits', JSON.stringify(habits)); renderHabits();
    }
};

// --- DASHBOARD ANA SAYFA ---

async function initDashboard() {
    try {
        const [moneyRecords, planRecords] = await Promise.all([
            window.db.money.getAll(),
            window.db.planner.getAll()
        ]);

        checkAndSendNotifications(moneyRecords, planRecords);

        let thisMonthIncome = 0;
        let thisMonthDebt = 0;
        let totalOpenDebt = 0;
        let upcomingPayments = 0;
        
        const now = new Date();

        moneyRecords.forEach(r => {
            const amount = parseFloat(r.amount);
            if (r.type === 'Gelir' && isThisMonth(r.date)) {
                thisMonthIncome += amount;
            }
            if ((r.type === 'Borç' || r.type === 'Taksit' || r.type === 'Harcama') && r.status !== 'Ödendi') {
                // Toplam Açık Borç'a harcamaları ekleme
                if (r.type !== 'Harcama') {
                    totalOpenDebt += amount;
                }
                if (isThisMonth(r.date)) {
                    thisMonthDebt += amount;
                }
                if (new Date(r.date) >= new Date()) {
                    upcomingPayments++;
                }
            }
        });

        const todayPlans = planRecords.filter(r => isToday(r.date)).length;

        document.getElementById('sum-income').innerText = formatCurrency(thisMonthIncome);
        document.getElementById('sum-income').style.color = 'var(--dash-success)';
        
        document.getElementById('sum-payment').innerText = formatCurrency(thisMonthDebt);
        document.getElementById('sum-payment').style.color = 'var(--dash-warning)';
        
        document.getElementById('sum-debt').innerText = formatCurrency(totalOpenDebt);
        document.getElementById('sum-debt').style.color = 'var(--dash-danger)';
        
        document.getElementById('sum-plans').innerText = todayPlans;
        document.getElementById('sum-plans').style.color = 'var(--dash-primary)';
        
        document.getElementById('sum-upcoming').innerText = upcomingPayments;

        // DASHBOARD WIDGET DOLDURMALARI

        // 1. Haftalık Grafik
        const canvasEl = document.getElementById('dashMainChart');
        if(canvasEl && window.Chart) {
            const ctx = canvasEl.getContext('2d');
            const gradInc = ctx.createLinearGradient(0, 0, 0, 300);
            gradInc.addColorStop(0, 'rgba(52, 199, 89, 0.5)'); gradInc.addColorStop(1, 'rgba(52, 199, 89, 0.0)');
            const gradExp = ctx.createLinearGradient(0, 0, 0, 300);
            gradExp.addColorStop(0, 'rgba(255, 59, 48, 0.5)'); gradExp.addColorStop(1, 'rgba(255, 59, 48, 0.0)');

            const days = []; const incData = []; const expData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                days.push(`${d.getDate()} ${d.toLocaleString('tr', {month:'short'})}`);
                const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                
                let dInc = 0, dExp = 0;
                moneyRecords.forEach(r => {
                    if(r.date === dStr) {
                        if(r.type === 'Gelir') dInc += parseFloat(r.amount);
                        else if(['Borç', 'Harcama', 'Taksit'].includes(r.type)) dExp += parseFloat(r.amount);
                    }
                });
                incData.push(dInc); expData.push(dExp);
            }
            new Chart(ctx, {
                type: 'line',
                data: { labels: days, datasets: [
                    { label: 'Gelir', data: incData, borderColor: '#34c759', backgroundColor: gradInc, fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHitRadius: 10 },
                    { label: 'Gider', data: expData, borderColor: '#ff3b30', backgroundColor: gradExp, fill: true, tension: 0.4, borderWidth: 3, pointRadius: 0, pointHitRadius: 10 }
                ]},
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    scales: { x: { grid: { display: false } }, y: { display: false, grid: { display: false } } }, 
                    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, 
                    interaction: { mode: 'nearest', axis: 'x', intersect: false } }
            });
        }

        // 2. Son İşlemler (Son 5 Kayıt)
        const recentList = document.getElementById('dash-recent-txs');
        if(recentList) {
            const sorted = [...moneyRecords].sort((a,b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).slice(0, 6);
            if(sorted.length === 0) recentList.innerHTML = '<div class="dash-empty">Kayıt yok.</div>';
            sorted.forEach(r => {
                const isGelir = r.type === 'Gelir';
                recentList.innerHTML += `
                    <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px;">
                        <div class="dash-item-info">
                            <div class="dash-item-title" style="font-size:13px; margin-bottom:2px;">${r.title}</div>
                            <div class="dash-item-meta" style="font-size:11px;">${formatDate(r.date)}</div>
                        </div>
                        <div style="font-weight:bold; font-size:14px; color:${isGelir?'var(--dash-success)':'var(--dash-danger)'}">
                            ${isGelir ? '+' : '-'}${formatCurrency(r.amount)}
                        </div>
                    </div>
                `;
            });
        }

        // 3. Bugünün Ajandası
        const todayList = document.getElementById('dash-today-plans');
        if(todayList) {
            const todays = planRecords.filter(r => isToday(r.date) && r.status !== 'İptal');
            if(todays.length === 0) todayList.innerHTML = '<div class="dash-empty">Bugün planınız yok.</div>';
            todays.forEach(r => {
                todayList.innerHTML += `
                    <div class="dash-list-item" style="padding:10px 12px; margin-bottom:6px; ${r.status==='Yapıldı' ? 'opacity:0.5; text-decoration:line-through;' : ''}">
                        <div class="dash-item-info">
                            <div class="dash-item-title" style="font-size:13px; margin-bottom:2px;">${r.title}</div>
                            <div class="dash-item-meta" style="font-size:11px;">⏰ ${r.start_time} - ${r.end_time}</div>
                        </div>
                    </div>
                `;
            });
        }

        // 4. Bütçe Durumu Çekimi (Dinamik renderBudget çağırmak)
        const budgets = JSON.parse(localStorage.getItem('dash_budgets')) || {};
        const catTotals = {};
        moneyRecords.forEach(r => {
            if(isThisMonth(r.date) && ['Borç', 'Harcama', 'Taksit'].includes(r.type)) {
                catTotals[r.category] = (catTotals[r.category] || 0) + parseFloat(r.amount);
            }
        });
        // Bütçe Listesi Doldur
        const budgetContainer = document.getElementById('dash-budget-overview');
        if(budgetContainer) {
            const keys = Object.keys(budgets);
            if(keys.length === 0) budgetContainer.innerHTML = '<div class="dash-empty">Bütçe limiti belirlenmemiş.</div>';
            keys.forEach(cat => {
                const limit = budgets[cat]; const spent = catTotals[cat] || 0;
                const perc = Math.min((spent / limit) * 100, 100);
                let color = 'var(--dash-success)'; if (perc > 75) color = 'var(--dash-warning)'; if (perc >= 100) color = 'var(--dash-danger)';
                budgetContainer.innerHTML += `
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span style="font-weight:600; color:var(--dash-text);">${cat}</span>
                            <span style="color:var(--dash-muted);">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
                        </div>
                        <div style="width:100%; background:var(--dash-border); border-radius:8px; height:8px; overflow:hidden;">
                            <div style="width:${perc}%; background:${color}; height:100%;"></div>
                        </div>
                    </div>
                `;
            });
        }

        // 5. Sürükle-Bırak Özelliğini Başlat
        initDragAndDrop();
        
        initGreetingAndWeather();
        initCryptoWidget();
        renderSubs();
        renderHabits();

    } catch (error) {
        console.error('Veri çekilirken hata oluştu:', error);
    }
}

// --- SÜRÜKLE-BIRAK (DRAG & DROP) ÖZELLİĞİ ---
function initDragAndDrop() {
    const container = document.getElementById('dashboard-widgets');
    if (!container) return;

    // Kaydedilmiş sıralamayı yükle ve uygula
    const savedOrder = JSON.parse(localStorage.getItem('dash_widget_order'));
    if (savedOrder) {
        savedOrder.forEach(id => {
            const el = container.querySelector(`[data-id="${id}"]`);
            if (el) container.appendChild(el);
        });
    }

    let draggedItem = null;

    container.addEventListener('dragstart', e => {
        const widget = e.target.closest('.draggable-widget');
        if (widget) {
            draggedItem = widget;
            setTimeout(() => widget.classList.add('dragging'), 0);
        }
    });

    container.addEventListener('dragend', e => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
            // Yeni sıralamayı kaydet
            const currentOrder = [...container.querySelectorAll('.draggable-widget')].map(w => w.dataset.id);
            localStorage.setItem('dash_widget_order', JSON.stringify(currentOrder));
        }
    });

    container.addEventListener('dragover', e => {
        e.preventDefault();
        if (!draggedItem) return;
        
        const draggableElements = [...container.querySelectorAll('.draggable-widget:not(.dragging)')];
        const afterElement = draggableElements.find(child => {
            const box = child.getBoundingClientRect();
            if (e.clientY < box.top + box.height / 2 && e.clientY > box.top - box.height / 2) return e.clientX < box.left + box.width / 2;
            return e.clientY < box.top + box.height / 2;
        });

        if (afterElement == null) container.appendChild(draggedItem);
        else container.insertBefore(draggedItem, afterElement);
    });
}

// --- FİNANS (MONEY) SAYFASI ---

async function initMoney() {
    const form = document.getElementById('money-form');
    const listContainer = document.getElementById('money-list');
    let records = [];

    // TAKVİM İÇİN STATE
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let selectedDateStr = '';
    let searchQuery = '';
    let filterType = 'All';

    // İSTATİSTİKLER İÇİN STATE
    let statsMonth = new Date().getMonth();
    let statsYear = new Date().getFullYear();

    let budgets = JSON.parse(localStorage.getItem('dash_budgets')) || {};
    let warnedBudgets = {}; // Uyarı tekrarını önlemek için oturum bazlı kayıt

    window.saveBudget = () => {
        const cat = document.getElementById('budget-category').value;
        const lim = parseFloat(document.getElementById('budget-limit').value);
        if (lim > 0) {
            budgets[cat] = lim;
        } else {
            delete budgets[cat];
        }
        localStorage.setItem('dash_budgets', JSON.stringify(budgets));
        document.getElementById('budget-setup-form').style.display = 'none';
        document.getElementById('budget-limit').value = '';
        updateMoneySummaries();
        showToast('Bütçe limiti güncellendi!');
    };

    window.changeStatsMonth = (offset) => {
        statsMonth += offset;
        if (statsMonth < 0) {
            statsMonth = 11;
            statsYear--;
        } else if (statsMonth > 11) {
            statsMonth = 0;
            statsYear++;
        }
        updateMoneySummaries();
    };

    window.toggleInstallmentFields = (val) => {
        const group = document.getElementById('m-installment-group');
        const repeatGrp = document.getElementById('m-repeat-group');
        if(group) {
            group.style.display = val === 'Taksit' ? 'flex' : 'none';
            group.style.flexDirection = 'column';
        }
        if(repeatGrp) {
            repeatGrp.style.display = val !== 'Taksit' ? 'flex' : 'none';
            repeatGrp.style.flexDirection = 'column';
        }
    };

    // Kredi Seçeneği İçin Form Dinleyici
    document.getElementById('m-category')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const trGroup = document.getElementById('m-transaction-group');
        const dateLbl = document.getElementById('m-date-label');
        if (val === 'Kredi') {
            if(trGroup) trGroup.style.display = 'flex';
            if(dateLbl) dateLbl.innerText = 'Son Ödeme / Ekstre Tarihi';
        } else {
            if(trGroup) trGroup.style.display = 'none';
            if(dateLbl) dateLbl.innerText = 'Tarih';
        }
    });

    // Arama ve Filtreleme Dinleyicileri
    document.getElementById('m-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderMoneyRecords();
    });
    document.getElementById('m-filter-type').addEventListener('change', (e) => {
        filterType = e.target.value;
        renderMoneyRecords();
    });

    const importInput = document.getElementById('excel-import-input');
    if (importInput) {
        importInput.addEventListener('change', handleExcelImport);
    }

    async function handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        showToast('Dosya okunuyor, lütfen bekleyin...');
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    return showToast('Excel dosyası boş veya geçersiz.', true);
                }

                const newRecords = json.map(row => {
                    // Map common header variations
                    const amount = row['Tutar'] || row['Tutar (₺)'] || row['Amount'];
                    const date = row['Tarih'] || row['Date'];
                    
                    let formattedDate;
                    if (date instanceof Date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        formattedDate = `${y}-${m}-${d}`;
                    }

                    return {
                        type: row['Tür'] || row['Type'],
                        title: row['Başlık'] || row['Title'],
                        amount: parseFloat(amount),
                        date: formattedDate,
                        category: row['Kategori'] || row['Category'],
                        description: row['Açıklama'] || row['Description'] || '',
                        status: row['Durum'] || row['Status'] || 'Ödenmedi',
                    };
                }).filter(r => r.title && r.amount && r.date && r.type); // Basic validation

                if (newRecords.length > 0) {
                    if (confirm(`${newRecords.length} adet yeni kayıt bulundu. Veritabanına aktarmak istediğinize emin misiniz?`)) {
                        showToast(`${newRecords.length} kayıt aktarılıyor...`);
                        await window.db.money.create(newRecords);
                        showToast('Tüm kayıtlar başarıyla aktarıldı!', false);
                        loadRecords();
                    }
                } else {
                    showToast('Dosyada geçerli bir kayıt bulunamadı. Lütfen sütun başlıklarını kontrol edin (Örn: Başlık, Tutar, Tarih).', true);
                }
            } catch (error) {
                showToast('Dosya okunurken bir hata oluştu: ' + error.message, true);
            } finally {
                event.target.value = ''; // Allow re-uploading the same file
            }
        };
        reader.readAsArrayBuffer(file);
    }

    window.exportToExcel = () => {
        if (typeof XLSX === 'undefined') {
            showToast("Excel kütüphanesi yüklenemedi.", true);
            return;
        }
        
        // İndirme işlemi öncesi filtrelenmiş verileri al
        const s = searchQuery;
        let filteredData = records.filter(r => {
            const matchesType = filterType === 'All' || r.type === filterType;
            const matchesSearch = !s || (
                (r.title && r.title.toLowerCase().includes(s)) ||
                (r.category && r.category.toLowerCase().includes(s)) ||
                (r.description && r.description.toLowerCase().includes(s))
            );
            return matchesType && matchesSearch;
        });

        if (filteredData.length === 0) {
            showToast("İndirilecek kayıt bulunamadı.", true);
            return;
        }

        const exportData = filteredData.map(r => ({
            'Tarih': formatDate(r.date),
            'Kategori': r.category,
            'Başlık': r.title,
            'Tür': r.type,
            'Tutar (₺)': parseFloat(r.amount),
            'Durum': r.status,
            'Açıklama': r.description || ''
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtrelenmis_Kayitlar");
        XLSX.writeFile(wb, "Finans_Gecmisi.xlsx");
    };

    const loadRecords = async () => {
        listContainer.innerHTML = '<div class="dash-loading">Yükleniyor...</div>';
        try {
            records = await window.db.money.getAll();
            renderMoneyRecords();
            updateMoneySummaries();
            renderCalendar();
            if (selectedDateStr) selectDate(selectedDateStr);
        } catch (error) {
            listContainer.innerHTML = `<div class="dash-empty" style="color:var(--dash-danger)">Hata: ${error.message}</div>`;
        }
    };

    window.reloadMoneyRecords = loadRecords;

    const updateMoneySummaries = () => {
        let monthIncome = 0, monthDebt = 0, totalDebt = 0, totalPaid = 0;
        let prevMonthIncome = 0, prevMonthDebt = 0;
        let todayIncome = 0, todayDebt = 0;
        let chartInc = 0, chartDebt = 0, chartHarcama = 0, chartTaksit = 0;
        const categoryTotals = {};

        const currentMonth = statsMonth;
        const currentYear = statsYear;
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        records.forEach(r => {
            const amt = parseFloat(r.amount);
            const d = new Date(r.date);
            const isCurrMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            const isPrevMonth = d.getMonth() === prevMonth && d.getFullYear() === prevYear;
            const isTdy = isToday(r.date);

            if (r.type === 'Gelir') {
                if (isCurrMonth) { monthIncome += amt; chartInc += amt; }
                if (isPrevMonth) prevMonthIncome += amt;
                if (isTdy) todayIncome += amt;
            }

            if ((r.type === 'Borç' || r.type === 'Taksit' || r.type === 'Harcama')) {
                // Toplam borca harcamaları dahil etme
                if (r.status !== 'Ödendi' && r.type !== 'Harcama') totalDebt += amt;
                if (r.status === 'Ödendi') totalPaid += amt;
                
                if (isCurrMonth) {
                    if (r.type === 'Borç' || r.type === 'Harcama') chartDebt += amt;
                    else if (r.type === 'Taksit') chartTaksit += amt;
                    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + amt;
                }
                if (isCurrMonth && r.status !== 'Ödendi') monthDebt += amt;
                if (isPrevMonth && r.status !== 'Ödendi') prevMonthDebt += amt;
                if (isTdy && r.status !== 'Ödendi') todayDebt += amt;
            }
        });

        const currentNet = monthIncome - monthDebt;
        const prevNet = prevMonthIncome - prevMonthDebt;

        let percText = 'Değişim yok';
        let percColor = 'var(--dash-muted)';

        if (prevNet !== 0) {
            const diff = currentNet - prevNet;
            const perc = (diff / Math.abs(prevNet)) * 100;
            if (perc > 0) {
                percText = `▲ %${Math.abs(perc).toFixed(1)} artış`;
                percColor = 'var(--dash-success)';
            } else if (perc < 0) {
                percText = `▼ %${Math.abs(perc).toFixed(1)} düşüş`;
                percColor = 'var(--dash-danger)';
            }
        } else if (currentNet > 0) {
            percText = `▲ %100 artış`;
            percColor = 'var(--dash-success)';
        } else if (currentNet < 0) {
            percText = `▼ %100 düşüş`;
            percColor = 'var(--dash-danger)';
        }

        document.getElementById('m-sum-net').innerText = formatCurrency(currentNet);
        const percEl = document.getElementById('m-sum-net-perc');
        if(percEl) {
            percEl.innerText = percText;
            percEl.style.color = percColor;
        }
        
        document.getElementById('m-sum-debt').innerText = formatCurrency(totalDebt);
        document.getElementById('m-sum-inc').innerText = formatCurrency(monthIncome);

        const tdyIncEl = document.getElementById('m-today-inc');
        const tdyExpEl = document.getElementById('m-today-exp');
        if(tdyIncEl) tdyIncEl.innerText = formatCurrency(todayIncome);
        if(tdyExpEl) tdyExpEl.innerText = formatCurrency(todayDebt);

        // Başlıkları Güncelle
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const statsTitle = document.getElementById('stats-month-year');
        if (statsTitle) statsTitle.innerText = `${monthNames[currentMonth]} ${currentYear} Dağılımı`;
        
        const topNetLbl = document.querySelector('#m-sum-net')?.previousElementSibling;
        const topIncLbl = document.querySelector('#m-sum-inc')?.previousElementSibling;
        if (topNetLbl) topNetLbl.innerText = `${monthNames[currentMonth]} Net Durum`;
        if (topIncLbl) topIncLbl.innerText = `${monthNames[currentMonth]} Gelecek`;

        renderMonthlyChart(chartInc, chartDebt, chartHarcama, chartTaksit);
        renderBudgets(categoryTotals);

        // Kategori dağılımını widget'a yazdır
        const catContainer = document.getElementById('m-category-stats');
        if (catContainer) {
            catContainer.innerHTML = '';
            const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
            if (sortedCats.length === 0) {
                catContainer.innerHTML = '<div class="dash-empty" style="padding:10px;font-size:12px;">Bu ay gider kaydı yok.</div>';
            } else {
                sortedCats.forEach(([cat, val]) => {
                    catContainer.innerHTML += `
                        <div style="display:flex; justify-content:space-between; font-size:12px; padding:6px 10px; background:var(--dash-item-bg); border-radius:8px; border:1px solid var(--dash-border);">
                            <span style="font-weight:600; color:var(--dash-text);">${cat}</span>
                            <span style="color:var(--dash-danger); font-weight:bold;">${formatCurrency(val)}</span>
                        </div>
                    `;
                });
            }
        }
    };

    const renderBudgets = (catTotals) => {
        const container = document.getElementById('budget-bars-container');
        if (!container) return;

        const budgetKeys = Object.keys(budgets);
        if (budgetKeys.length === 0) {
            container.innerHTML = '<div class="dash-empty" style="padding:10px;">Henüz bütçe limiti belirlenmedi.</div>';
            return;
        }

        container.innerHTML = '';
        let exceededCategories = [];

        budgetKeys.forEach(cat => {
            const limit = budgets[cat];
            const spent = catTotals[cat] || 0;
            const perc = Math.min((spent / limit) * 100, 100);
            
            if (perc >= 100) {
                const warnKey = `${statsYear}-${statsMonth}-${cat}`;
                if (!warnedBudgets[warnKey]) {
                    exceededCategories.push(cat);
                    warnedBudgets[warnKey] = true;
                }
            }

            let color = 'var(--dash-success)';
            if (perc > 75) color = 'var(--dash-warning)';
            if (perc >= 100) color = 'var(--dash-danger)';

            let alertIcon = perc >= 100 ? '⚠️ Limit Aşıldı!' : '';

            container.innerHTML += `
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
                        <span style="font-weight:600; color:var(--dash-text);">${cat} ${alertIcon ? `<span style="color:var(--dash-danger); font-size:11px; margin-left:4px;">${alertIcon}</span>` : ''}</span>
                        <span style="color:var(--dash-muted);">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
                    </div>
                    <div style="width:100%; background:var(--dash-border); border-radius:8px; height:10px; overflow:hidden;">
                        <div style="width:${perc}%; background:${color}; height:100%; transition:width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        });

        if (exceededCategories.length > 0) {
            showToast(`⚠️ Bütçe Aşıldı: ${exceededCategories.join(', ')}`, true);
        }
    };

    const renderMonthlyChart = (inc, debt, harcama, taksit) => {
        const ctx = document.getElementById('monthlyChart');
        if(!ctx) return;
        
        if(window.monthlyChartInstance) {
            window.monthlyChartInstance.destroy();
        }

        if(window.Chart) {
            window.monthlyChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Gelir', 'Borç', 'Taksit'],
                    datasets: [{
                        data: [inc, debt, taksit],
                        backgroundColor: ['#34c759', '#ff3b30', '#ff9500'],
                        borderWidth: 0,
                        hoverOffset: 8,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { 
                            position: 'bottom', 
                            labels: { boxWidth: 12, font: { size: 12 } } 
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                        label += new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(context.parsed);
                                        label += ` (%${percentage})`;
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    };

    const renderCalendar = () => {
        const calContainer = document.getElementById('cal-grid');
        if (!calContainer) return;

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        document.getElementById('cal-month-year').innerText = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let firstDayIndex = firstDay === 0 ? 6 : firstDay - 1; // Pazartesi'den başlatmak için

        let html = '';
        const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        dayNames.forEach(d => {
            html += `<div class="cal-day-name">${d}</div>`;
        });

        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="cal-day empty"></div>`;
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            let dailyIncome = 0;
            let dailyExpense = 0;

            records.forEach(r => {
                if (r.date === dateStr) {
                    if (r.type === 'Gelir') dailyIncome += parseFloat(r.amount);
                    if (r.type === 'Borç' || r.type === 'Taksit' || r.type === 'Harcama') dailyExpense += parseFloat(r.amount);
                }
            });

            let summaryHtml = '';
            if (dailyIncome > 0) summaryHtml += `<div class="cal-val cal-inc">+${dailyIncome}</div>`;
            if (dailyExpense > 0) summaryHtml += `<div class="cal-val cal-exp">-${dailyExpense}</div>`;

            const isTodayClass = isToday(dateStr) ? 'today' : '';

            html += `<div class="cal-day ${isTodayClass}" data-date="${dateStr}" onclick="selectDate('${dateStr}')">
                <div class="cal-date-num">${i}</div>
                <div class="cal-summary">${summaryHtml}</div>
            </div>`;
        }

        calContainer.innerHTML = html;
    };

    window.changeMonth = (offset) => {
        currentMonth += offset;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    };

    window.selectDate = (dateStr) => {
        selectedDateStr = dateStr;
        
        // Tıklanan güne seçili (selected) efektini uygula
        document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
        const activeDay = document.querySelector(`.cal-day[data-date="${dateStr}"]`);
        if (activeDay) activeDay.classList.add('selected');

        const widget = document.getElementById('selected-day-widget');
        const title = document.getElementById('selected-day-title');
        const netEl = document.getElementById('selected-day-net');
        const list = document.getElementById('selected-day-list');
        
        widget.style.display = 'block';
        title.innerText = formatDate(dateStr) + ' Kayıtları';
        
        const dayRecords = records.filter(r => r.date === dateStr);
        
        if (dayRecords.length === 0) {
            netEl.innerHTML = '';
            list.innerHTML = '<div class="dash-empty" style="padding: 10px; font-size: 13px;">Bu tarihte kayıt yok.</div>';
        } else {
            let dailyInc = 0;
            let dailyExp = 0;
            dayRecords.forEach(r => {
                const amt = parseFloat(r.amount);
                if (r.type === 'Gelir') dailyInc += amt;
                if (r.type === 'Borç' || r.type === 'Taksit' || r.type === 'Harcama') dailyExp += amt;
            });
            const net = dailyInc - dailyExp;
            const netColor = net >= 0 ? 'var(--dash-success)' : 'var(--dash-danger)';
            const netSign = net > 0 ? '+' : '';
            netEl.innerHTML = `Günlük Net Durum: <span style="color:${netColor}">${netSign}${formatCurrency(net)}</span>`;

            list.innerHTML = '';
            dayRecords.forEach(r => {
                let badgeClass = 'badge-primary';
                if (r.type === 'Gelir') badgeClass = 'badge-success';
                else if (r.type === 'Borç' || r.type === 'Harcama') badgeClass = 'badge-danger';
                else if (r.type === 'Taksit') badgeClass = 'badge-warning';
                list.innerHTML += `
                    <div class="dash-list-item" style="padding: 10px 12px;">
                        <div class="dash-item-info">
                            <div class="dash-item-title" style="font-size: 13px; margin-bottom: 4px;">${r.title} <span class="dash-badge ${badgeClass}" style="font-size: 10px; padding: 2px 6px;">${r.type}</span></div>
                            <div class="dash-item-meta" style="font-size: 11px;">${formatCurrency(r.amount)}</div>
                        </div>
                        <div style="text-align:right; display:flex; flex-direction:column; gap:6px;">
                            <select class="dash-select" style="padding:2px 6px; font-size:11px; width:auto;" onchange="updateMStatus(${r.id}, this.value)">
                                <option value="Bekleniyor" ${r.status === 'Bekleniyor' ? 'selected' : ''}>Bekleniyor</option>
                                <option value="Geldi" ${r.status === 'Geldi' ? 'selected' : ''}>Geldi</option>
                                <option value="Ödenmedi" ${r.status === 'Ödenmedi' ? 'selected' : ''}>Ödenmedi</option>
                                <option value="Ödendi" ${r.status === 'Ödendi' ? 'selected' : ''}>Ödendi</option>
                            </select>
                            ${r.status !== 'Ödendi' && r.status !== 'Geldi' ? `<button class="dash-btn dash-btn-primary" style="padding:2px 6px; font-size:10px; margin-bottom:4px; box-shadow:none;" onclick="updateMStatus(${r.id}, '${r.type==='Gelir'?'Geldi':'Ödendi'}'); showToast('İşlem tamamlandı!')">Hemen ${r.type==='Gelir'?'Al':'Öde'}</button>` : ''}
                            ${r.category === 'Kredi' && r.status !== 'Ödendi' && r.status !== 'Geldi' ? `<button class="dash-btn dash-btn-outline" style="padding:2px 6px; font-size:10px; margin-bottom:4px; color:var(--dash-warning); border-color:var(--dash-warning);" onclick="postponeCredit(${r.id}, ${r.amount}, '${r.date}')">Borç Ertele</button>` : ''}
                            <button class="dash-btn dash-btn-outline" style="padding:2px 6px; font-size:10px; color:var(--dash-danger); border-color:var(--dash-danger);" onclick="deleteMRecord(${r.id})">Sil</button>
                        </div>
                    </div>
                `;
            });
        }
    };

    window.goToAddRecord = () => {
        document.getElementById('m-date').value = selectedDateStr;
        const formEl = document.getElementById('money-form');
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ufak bir efekt ile form alanını belirt
        formEl.style.transition = '0.3s';
        formEl.style.transform = 'scale(1.02)';
        setTimeout(() => { formEl.style.transform = 'scale(1)'; }, 300);
    };

    const renderMoneyRecords = () => {
        let filtered = records.filter(r => {
            const matchesType = filterType === 'All' || r.type === filterType;
            const s = searchQuery;
            const matchesSearch = !s || (
                (r.title && r.title.toLowerCase().includes(s)) ||
                (r.category && r.category.toLowerCase().includes(s)) ||
                (r.description && r.description.toLowerCase().includes(s))
            );
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="dash-empty">Aradığınız kriterlere uygun kayıt bulunamadı.</div>';
            return;
        }

        listContainer.innerHTML = '';
        filtered.forEach(r => {
            const isOver = isOverdue(r.date, r.status);
            let badgeClass = 'badge-primary';
            if (r.type === 'Gelir') badgeClass = 'badge-success';
            else if (r.type === 'Borç' || r.type === 'Harcama') badgeClass = 'badge-danger';
            else if (r.type === 'Taksit') badgeClass = 'badge-warning';
            const statusBadge = r.status === 'Ödendi' || r.status === 'Geldi' ? 'badge-success' : 'badge-warning';
            
            const div = document.createElement('div');
            div.className = `dash-list-item ${isOver ? 'overdue' : ''}`;
            div.innerHTML = `
                <div class="dash-item-info">
                    <div class="dash-item-title">${r.title} <span class="dash-badge ${badgeClass}">${r.type}</span></div>
                    <div class="dash-item-meta">
                        <span>📅 ${formatDate(r.date)}</span>
                        <span>📁 ${r.category}</span>
                        ${isOver ? '<span style="color:var(--dash-danger); font-weight:bold;">(Gecikmiş)</span>' : ''}
                    </div>
                    <div class="dash-item-meta" style="margin-top:4px;">${r.description || ''}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:18px; font-weight:700; margin-bottom:8px;">${formatCurrency(r.amount)}</div>
                    <select class="dash-select" style="padding:4px 8px; font-size:12px; margin-bottom:8px; width:auto;" onchange="updateMStatus(${r.id}, this.value)">
                        <option value="Bekleniyor" ${r.status === 'Bekleniyor' ? 'selected' : ''}>Bekleniyor</option>
                        <option value="Geldi" ${r.status === 'Geldi' ? 'selected' : ''}>Geldi</option>
                        <option value="Ödenmedi" ${r.status === 'Ödenmedi' ? 'selected' : ''}>Ödenmedi</option>
                        <option value="Ödendi" ${r.status === 'Ödendi' ? 'selected' : ''}>Ödendi</option>
                    </select>
                    <br>
                    ${r.status !== 'Ödendi' && r.status !== 'Geldi' ? `<button class="dash-btn dash-btn-primary" style="padding:4px 8px; font-size:11px; margin-right:4px; box-shadow:none;" onclick="updateMStatus(${r.id}, '${r.type==='Gelir'?'Geldi':'Ödendi'}'); showToast('İşlem tamamlandı!')">Hemen ${r.type==='Gelir'?'Al':'Öde'}</button>` : ''}
                    ${r.category === 'Kredi' && r.status !== 'Ödendi' && r.status !== 'Geldi' ? `<button class="dash-btn dash-btn-outline" style="padding:4px 8px; font-size:11px; margin-right:4px; color:var(--dash-warning); border-color:var(--dash-warning);" onclick="postponeCredit(${r.id}, ${r.amount}, '${r.date}')">Borç Ertele</button>` : ''}
                    <button class="dash-btn dash-btn-outline" style="padding:4px 8px; font-size:11px; color:var(--dash-danger); border-color:var(--dash-danger);" onclick="deleteMRecord(${r.id})">Sil</button>
                </div>
            `;
            listContainer.appendChild(div);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerText = "Kaydediliyor...";

        const baseTitle = document.getElementById('m-title').value;
        const typeVal = document.getElementById('m-type').value;
        const amountVal = parseFloat(document.getElementById('m-amount').value);
        const dateVal = document.getElementById('m-date').value;
        const categoryVal = document.getElementById('m-category').value;
        const descVal = document.getElementById('m-desc').value;
        const statusVal = document.getElementById('m-status').value;
        const repeatEl = document.getElementById('m-repeat');
        const repeatVal = repeatEl && repeatEl.value ? parseInt(repeatEl.value) : 1;
        const transactionDateVal = document.getElementById('m-transaction-date')?.value;
        const receiptEl = document.getElementById('m-receipt');

        let finalDesc = descVal;
        
        if (receiptEl && receiptEl.files.length > 0) {
            finalDesc = `📸 [Fiş: ${receiptEl.files[0].name}] | ` + finalDesc;
        }
        
        if (categoryVal === 'Kredi' && transactionDateVal) {
            finalDesc = `İşlem Tarihi: ${formatDate(transactionDateVal)} | ` + finalDesc;
        }

        try {
            if (typeVal === 'Taksit') {
                const tot = parseInt(document.getElementById('m-inst-total').value);
                if (tot && tot > 0) {
                    const [year, month, day] = dateVal.split('-');
                    let currentYear = parseInt(year);
                    let currentMonth = parseInt(month) - 1;
                    let currentDay = parseInt(day);

                    const promises = [];
                    for (let i = 1; i <= tot; i++) {
                        let m = currentMonth + (i - 1);
                        let y = currentYear + Math.floor(m / 12);
                        m = m % 12;
                        
                        // O ayın maksimum gün sayısını hesapla (Örn: 31 Ocak -> 28 Şubat koruması)
                        let maxDays = new Date(y, m + 1, 0).getDate();
                        let d = currentDay > maxDays ? maxDays : currentDay;
                        
                        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        
                        const record = { type: typeVal, title: `${baseTitle} (${i}/${tot}. Taksit)`, amount: amountVal, date: dateStr, category: categoryVal, description: finalDesc, status: statusVal };
                        promises.push(window.db.money.create(record));
                    }
                    // Tüm taksitleri eş zamanlı olarak Supabase'e kaydet
                    await Promise.all(promises);
                } else {
                    // Taksit seçilip sayı girilmemişse tek kayıt olarak ekle
                    await window.db.money.create({ type: typeVal, title: baseTitle, amount: amountVal, date: dateVal, category: categoryVal, description: finalDesc, status: statusVal });
                }
            } else {
                // Aylık Otomatik Tekrar Eden Abonelik / Maaş
                if (repeatVal > 1) {
                    const promises = [];
                    const [year, month, day] = dateVal.split('-');
                    let currentYear = parseInt(year); let currentMonth = parseInt(month) - 1; let currentDay = parseInt(day);

                    for (let i = 0; i < repeatVal; i++) {
                        let m = currentMonth + i; let y = currentYear + Math.floor(m / 12); m = m % 12;
                        let maxDays = new Date(y, m + 1, 0).getDate();
                        let d = currentDay > maxDays ? maxDays : currentDay;
                        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        
                        promises.push(window.db.money.create({ type: typeVal, title: `${baseTitle} (Düzenli)`, amount: amountVal, date: dateStr, category: categoryVal, description: finalDesc, status: statusVal }));
                    }
                    await Promise.all(promises);
                } else {
                    await window.db.money.create({ type: typeVal, title: baseTitle, amount: amountVal, date: dateVal, category: categoryVal, description: finalDesc, status: statusVal });
                }
            }

            form.reset();
            const group = document.getElementById('m-installment-group');
            if (group) group.style.display = 'none';
            await loadRecords();
            showToast('Kayıt Başarıyla Eklendi!');
        } catch (error) {
            alert("Kaydedilemedi: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Kaydet";
        }
    });

    window.deleteMRecord = async (id) => {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            await window.db.money.delete(id);
            loadRecords();
        }
    };

    window.updateMStatus = async (id, status) => {
        await window.db.money.updateStatus(id, status);
        loadRecords();
    };

    loadRecords();
}

// --- NOTLAR (NOTES) SAYFASI ---

function initNotes() {
    const listEl = document.getElementById('notes-sidebar-list');
    const titleEl = document.getElementById('note-title');
    const contentEl = document.getElementById('note-content');
    let notes = JSON.parse(localStorage.getItem('dash_notes')) || [];
    let activeId = null;

    window.renderNotesList = () => {
        if(!listEl) return;
        listEl.innerHTML = '';
        if(notes.length === 0) listEl.innerHTML = '<div class="dash-empty">Henüz not yok.</div>';
        notes.forEach(n => {
            listEl.innerHTML += `
                <div class="dash-list-item ${n.id === activeId ? 'selected' : ''}" style="cursor:pointer; margin-bottom:8px; ${n.id === activeId ? 'border-color:var(--dash-primary); background:var(--dash-card);' : ''}" onclick="selectNote(${n.id})">
                    <div class="dash-item-info"><div class="dash-item-title" style="font-size:14px;">${n.title || 'İsimsiz Not'}</div><div class="dash-item-meta" style="font-size:11px;">${new Date(n.date).toLocaleDateString('tr-TR')}</div></div>
                    <button class="dash-btn-outline" style="border:none; color:var(--dash-danger); padding:4px;" onclick="deleteNote(${n.id}, event)">🗑️</button>
                </div>`;
        });
    };

    window.addNewNote = () => { activeId = null; if(titleEl) titleEl.value = ''; if(contentEl) contentEl.value = ''; renderNotesList(); };

    window.selectNote = (id) => {
        activeId = id; const n = notes.find(x => x.id === id);
        if(n) { titleEl.value = n.title; contentEl.value = n.content; }
        renderNotesList();
    };

    window.saveNote = () => {
        if(!titleEl || !contentEl) return;
        if (activeId) { const n = notes.find(x => x.id === activeId); if(n) { n.title = titleEl.value; n.content = contentEl.value; } } 
        else { const newNote = { id: Date.now(), title: titleEl.value || 'Yeni Not', content: contentEl.value, date: new Date().toISOString() }; notes.push(newNote); activeId = newNote.id; }
        localStorage.setItem('dash_notes', JSON.stringify(notes));
        renderNotesList(); showToast('Not başarıyla kaydedildi!');
    };

    window.deleteNote = (id, e) => {
        e.stopPropagation();
        if(confirm("Notu silmek istediğinize emin misiniz?")) { notes = notes.filter(x => x.id !== id); localStorage.setItem('dash_notes', JSON.stringify(notes)); if(activeId === id) addNewNote(); else renderNotesList(); }
    };

    renderNotesList();
}

// --- ANALİZ (CHARTS) SAYFASI ---

async function initAnalysis() {
    try {
        const records = await window.db.money.getAll();
        
        // Ortak Tooltip (Para Birimi Formatı)
        const currencyCallback = {
            label: function(context) {
                let label = context.dataset.label || context.label || '';
                if (label) label += ': ';
                let val = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                label += new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
                return label;
            }
        };

        // 1. Son 6 Ay Gelir/Gider (Bar Chart)
        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const last6Months = [];
        const incomeData = [];
        const expenseData = [];

        const barCanvas = document.getElementById('barChart');
        const barCtx = barCanvas.getContext('2d');
        const barGradInc = barCtx.createLinearGradient(0, 0, 0, barCanvas.parentElement.offsetHeight || 300);
        barGradInc.addColorStop(0, '#34c759'); barGradInc.addColorStop(1, '#1b8a39');
        const barGradExp = barCtx.createLinearGradient(0, 0, 0, barCanvas.parentElement.offsetHeight || 300);
        barGradExp.addColorStop(0, '#ff3b30'); barGradExp.addColorStop(1, '#a61c14');

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push(monthNames[d.getMonth()] + ' ' + d.getFullYear());
            
            let inc = 0, exp = 0;
            records.forEach(r => {
                const rd = new Date(r.date);
                if (rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear()) {
                    if (r.type === 'Gelir') inc += parseFloat(r.amount);
                    else if (['Borç', 'Harcama', 'Taksit'].includes(r.type)) exp += parseFloat(r.amount);
                }
            });
            incomeData.push(inc);
            expenseData.push(exp);
        }

        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: last6Months,
                datasets: [
                    { label: 'Gelir', data: incomeData, backgroundColor: barGradInc, borderRadius: 6, borderSkipped: false },
                    { label: 'Gider Toplamı', data: expenseData, backgroundColor: barGradExp, borderRadius: 6, borderSkipped: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { tooltip: { callbacks: currencyCallback, mode: 'index', intersect: false } },
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, border: { dash: [4, 4] } } }
            }
        });

        // 2. Kategori Dağılımı (Tüm Zamanlar Gider) (Doughnut Chart)
        const categoryTotals = {};
        records.forEach(r => {
            if (['Borç', 'Harcama', 'Taksit'].includes(r.type)) {
                categoryTotals[r.category] = (categoryTotals[r.category] || 0) + parseFloat(r.amount);
            }
        });
        
        new Chart(document.getElementById('categoryChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#ff3b30', '#ff9500', '#ffcc00', '#4cd964', '#5ac8fa', '#007aff', '#5856d6', '#af52de'],
                    borderWidth: 0,
                    hoverOffset: 8,
                    borderRadius: 4
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { 
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: { callbacks: currencyCallback }
                } 
            }
        });

        // 3. Bu Ay Günlük Harcama Trendi (Line Chart)
        const lineCanvas = document.getElementById('lineChart');
        const lineCtx = lineCanvas.getContext('2d');
        const lineGrad = lineCtx.createLinearGradient(0, 0, 0, lineCanvas.parentElement.offsetHeight || 300);
        lineGrad.addColorStop(0, 'rgba(212, 175, 55, 0.5)'); lineGrad.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

        const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const days = Array.from({length: currentMonthDays}, (_, i) => i + 1);
        const dailyExp = Array(currentMonthDays).fill(0);

        records.forEach(r => {
            const rd = new Date(r.date);
            if (rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear()) {
                if (['Borç', 'Harcama', 'Taksit'].includes(r.type)) {
                    dailyExp[rd.getDate() - 1] += parseFloat(r.amount);
                }
            }
        });

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Günlük Gider',
                    data: dailyExp,
                    borderColor: '#d4af37',
                    backgroundColor: lineGrad,
                    borderWidth: 3, fill: true, tension: 0.4, pointRadius: 0, pointHitRadius: 10
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false,
                plugins: { tooltip: { callbacks: currencyCallback, mode: 'index', intersect: false } },
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, border: { dash: [4, 4] } } }
            }
        });
    } catch (error) {
        console.error("Analiz verileri yüklenirken hata:", error);
    }
}

// --- PLAN (PLANNER) SAYFASI ---

async function initPlanner() {
    const form = document.getElementById('planner-form');
    const listContainer = document.getElementById('planner-list');
    let records = [];

    let currentPMonth = new Date().getMonth();
    let currentPYear = new Date().getFullYear();
    let selectedPDateStr = '';
    let pSearchQuery = '';
    let pFilterStatus = 'All';

    let statsPMonth = new Date().getMonth();
    let statsPYear = new Date().getFullYear();

    document.getElementById('p-search')?.addEventListener('input', (e) => {
        pSearchQuery = e.target.value.toLowerCase();
        renderPlanRecords();
    });
    document.getElementById('p-filter-status')?.addEventListener('change', (e) => {
        pFilterStatus = e.target.value;
        renderPlanRecords();
    });

    window.changePStatsMonth = (offset) => {
        statsPMonth += offset;
        if (statsPMonth < 0) { statsPMonth = 11; statsPYear--; } 
        else if (statsPMonth > 11) { statsPMonth = 0; statsPYear++; }
        updatePlannerSummaries();
    };

    window.exportPToExcel = () => {
        if (typeof XLSX === 'undefined') return showToast("Excel kütüphanesi yüklenemedi.", true);
        const s = pSearchQuery;
        let filteredData = records.filter(r => {
            const mStat = pFilterStatus === 'All' || r.status === pFilterStatus;
            const mSearch = !s || ((r.title && r.title.toLowerCase().includes(s)) || (r.category && r.category.toLowerCase().includes(s)));
            return mStat && mSearch;
        });
        if (filteredData.length === 0) return showToast("İndirilecek plan bulunamadı.", true);

        const exportData = filteredData.map(r => ({
            'Tarih': formatDate(r.date), 'Saat': `${r.start_time} - ${r.end_time}`, 'Kategori': r.category,
            'Başlık': r.title, 'Öncelik': r.priority, 'Durum': r.status, 'Açıklama': r.description || ''
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Planlar");
        XLSX.writeFile(wb, "Gunluk_Planlar.xlsx");
    };

    const loadRecords = async () => {
        listContainer.innerHTML = '<div class="dash-loading">Yükleniyor...</div>';
        try {
            records = await window.db.planner.getAll();
            renderPlanRecords();
            renderPCalendar();
            updatePlannerSummaries();
            if (selectedPDateStr) selectPDate(selectedPDateStr);
        } catch (error) {
            listContainer.innerHTML = `<div class="dash-empty" style="color:var(--dash-danger)">Hata: ${error.message}</div>`;
        }
    };

    const updatePlannerSummaries = () => {
        let todayCount = 0;
        let monthDone = 0;
        let monthPending = 0;
        const catTotals = {};

        const now = new Date();
        
        records.forEach(r => {
            const d = new Date(r.date);
            if (isToday(r.date) && r.status !== 'İptal') todayCount++;
            
            if (d.getMonth() === statsPMonth && d.getFullYear() === statsPYear) {
                if (r.status === 'Yapıldı') monthDone++;
                else if (r.status === 'Yapılacak') monthPending++;
                catTotals[r.category] = (catTotals[r.category] || 0) + 1;
            }
        });

        const totalMonth = monthDone + monthPending;
        const successRate = totalMonth > 0 ? Math.round((monthDone / totalMonth) * 100) : 0;

        document.getElementById('p-sum-today').innerText = todayCount;
        document.getElementById('p-sum-done').innerText = monthDone;
        document.getElementById('p-sum-pending').innerText = monthPending;
        document.getElementById('p-sum-rate').innerText = `%${successRate}`;

        // Bugünkü görevler widget
        const todayList = document.getElementById('p-today-list');
        if (todayList) {
            todayList.innerHTML = '';
            const todays = records.filter(r => isToday(r.date) && r.status !== 'İptal');
            if(todays.length === 0) {
                todayList.innerHTML = '<div class="dash-empty" style="padding:10px;">Bugün için plan yok.</div>';
            } else {
                todays.forEach(r => {
                    todayList.innerHTML += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--dash-item-bg); border:1px solid var(--dash-border); border-radius:8px; margin-bottom:6px; ${r.status==='Yapıldı' ? 'opacity:0.5; text-decoration:line-through;' : ''}">
                            <span style="font-size:12px; font-weight:600;">${r.title}</span>
                            <span style="font-size:11px; color:var(--dash-muted);">${r.start_time}</span>
                        </div>
                    `;
                });
            }
        }

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const statsTitle = document.getElementById('p-stats-month-year');
        if (statsTitle) statsTitle.innerText = `${monthNames[statsPMonth]} ${statsPYear} Dağılımı`;

        renderPChart(catTotals);
    };

    const renderPChart = (catTotals) => {
        const ctx = document.getElementById('pMonthlyChart');
        if(!ctx || !window.Chart) return;
        if(window.pChartInstance) window.pChartInstance.destroy();

        window.pChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catTotals),
                datasets: [{
                    data: Object.values(catTotals),
                    backgroundColor: ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa', '#ffcc00'],
                    borderWidth: 0,
                    hoverOffset: 8,
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
        });
    };

    const renderPCalendar = () => {
        const calContainer = document.getElementById('cal-p-grid');
        if (!calContainer) return;

        const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        document.getElementById('cal-p-month-year').innerText = `${monthNames[currentPMonth]} ${currentPYear}`;

        const firstDay = new Date(currentPYear, currentPMonth, 1).getDay();
        const daysInMonth = new Date(currentPYear, currentPMonth + 1, 0).getDate();
        let firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

        let html = '';
        const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        dayNames.forEach(d => {
            html += `<div class="cal-day-name">${d}</div>`;
        });

        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="cal-day empty"></div>`;
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentPYear}-${String(currentPMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            let planCount = 0;
            records.forEach(r => {
                if (r.date === dateStr && r.status !== 'Yapıldı') planCount++;
            });

            let summaryHtml = '';
            if (planCount > 0) summaryHtml += `<div class="cal-val" style="background:rgba(212,175,55,0.15); color:var(--dash-primary); font-size:10px;">${planCount} Plan</div>`;

            const isTodayClass = isToday(dateStr) ? 'today' : '';

            html += `<div class="cal-day ${isTodayClass}" data-date="${dateStr}" onclick="selectPDate('${dateStr}')">
                <div class="cal-date-num">${i}</div>
                <div class="cal-summary">${summaryHtml}</div>
            </div>`;
        }

        calContainer.innerHTML = html;
    };

    window.changePMonth = (offset) => {
        currentPMonth += offset;
        if (currentPMonth < 0) { currentPMonth = 11; currentPYear--; } 
        else if (currentPMonth > 11) { currentPMonth = 0; currentPYear++; }
        renderPCalendar();
    };

    window.selectPDate = (dateStr) => {
        selectedPDateStr = dateStr;
        
        document.querySelectorAll('#cal-p-grid .cal-day').forEach(el => el.classList.remove('selected'));
        const activeDay = document.querySelector(`#cal-p-grid .cal-day[data-date="${dateStr}"]`);
        if (activeDay) activeDay.classList.add('selected');

        const widget = document.getElementById('selected-p-day-widget');
        const title = document.getElementById('selected-p-day-title');
        const list = document.getElementById('selected-p-day-list');
        
        widget.style.display = 'block';
        title.innerText = formatDate(dateStr) + ' Planları';
        
        const dayRecords = records.filter(r => r.date === dateStr);
        
        if (dayRecords.length === 0) {
            list.innerHTML = '<div class="dash-empty" style="padding: 10px; font-size: 13px;">Bu tarihte plan yok.</div>';
        } else {
            list.innerHTML = '';
            dayRecords.forEach(r => {
                let priorityBadge = 'badge-primary';
                if (r.priority === 'Yüksek') priorityBadge = 'badge-danger';
                if (r.priority === 'Orta') priorityBadge = 'badge-warning';

                list.innerHTML += `
                    <div class="dash-list-item" style="padding: 10px 12px; ${r.status === 'Yapıldı' ? 'opacity:0.6;' : ''}">
                        <div class="dash-item-info">
                            <div class="dash-item-title" style="font-size: 13px; margin-bottom: 4px; ${r.status === 'Yapıldı' ? 'text-decoration:line-through;' : ''}">
                                ${r.title} <span class="dash-badge ${priorityBadge}" style="font-size: 10px; padding: 2px 6px;">${r.priority}</span>
                            </div>
                            <div class="dash-item-meta" style="font-size: 11px;">⏰ ${r.start_time} - ${r.end_time}</div>
                        </div>
                        <div style="text-align:right; display:flex; flex-direction:column; gap:6px;">
                            <select class="dash-select" style="padding:2px 6px; font-size:11px; width:auto;" onchange="updatePStatus(${r.id}, this.value)">
                                <option value="Yapılacak" ${r.status === 'Yapılacak' ? 'selected' : ''}>Yapılacak</option>
                                <option value="Yapıldı" ${r.status === 'Yapıldı' ? 'selected' : ''}>Yapıldı</option>
                                <option value="İptal" ${r.status === 'İptal' ? 'selected' : ''}>İptal</option>
                            </select>
                            <div style="display:flex; justify-content:flex-end; gap:4px;">
                                ${r.status !== 'Yapıldı' ? `<button class="dash-btn dash-btn-primary" style="padding:2px 6px; font-size:10px; box-shadow:none;" onclick="updatePStatus(${r.id}, 'Yapıldı'); showToast('Görev tamamlandı!')">Hemen Yap</button>` : ''}
                                <button class="dash-btn dash-btn-outline" style="padding:2px 6px; font-size:10px; color:var(--dash-danger); border-color:var(--dash-danger);" onclick="deletePRecord(${r.id})">Sil</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    };

    window.goToPAddRecord = () => {
        document.getElementById('p-date').value = selectedPDateStr;
        const formEl = document.getElementById('planner-form');
        formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        formEl.style.transition = '0.3s';
        formEl.style.transform = 'scale(1.02)';
        setTimeout(() => { formEl.style.transform = 'scale(1)'; }, 300);
    };

    const renderPlanRecords = () => {
        const s = pSearchQuery;
        let filtered = records.filter(r => {
            const mStat = pFilterStatus === 'All' || r.status === pFilterStatus;
            const mSearch = !s || (
                (r.title && r.title.toLowerCase().includes(s)) ||
                (r.category && r.category.toLowerCase().includes(s)) ||
                (r.description && r.description.toLowerCase().includes(s))
            );
            return mStat && mSearch;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="dash-empty">Aradığınız kriterlere uygun plan bulunamadı.</div>';
            return;
        }

        listContainer.innerHTML = '';
        filtered.forEach(r => {
            const isTdy = isToday(r.date);
            let priorityBadge = 'badge-primary';
            if (r.priority === 'Yüksek') priorityBadge = 'badge-danger';
            if (r.priority === 'Orta') priorityBadge = 'badge-warning';

            const div = document.createElement('div');
            div.className = `dash-list-item`;
            div.style.opacity = r.status === 'Yapıldı' ? '0.6' : '1';
            div.innerHTML = `
                <div class="dash-item-info">
                    <div class="dash-item-title" style="${r.status === 'Yapıldı' ? 'text-decoration:line-through;' : ''}">
                        ${r.title} 
                        ${isTdy ? '<span class="dash-badge badge-warning">Bugün</span>' : ''}
                    </div>
                    <div class="dash-item-meta">
                        <span>📅 ${formatDate(r.date)} | ⏰ ${r.start_time} - ${r.end_time}</span>
                    </div>
                    <div class="dash-item-meta" style="margin-top:4px;">
                        <span class="dash-badge badge-primary">${r.category}</span>
                        <span class="dash-badge ${priorityBadge}">Öncelik: ${r.priority}</span>
                    </div>
                    <div class="dash-item-meta" style="margin-top:4px;">${r.description || ''}</div>
                </div>
                <div style="text-align:right;">
                    <select class="dash-select" style="padding:4px 8px; font-size:12px; margin-bottom:8px; width:auto;" onchange="updatePStatus(${r.id}, this.value)">
                        <option value="Yapılacak" ${r.status === 'Yapılacak' ? 'selected' : ''}>Yapılacak</option>
                        <option value="Yapıldı" ${r.status === 'Yapıldı' ? 'selected' : ''}>Yapıldı</option>
                        <option value="İptal" ${r.status === 'İptal' ? 'selected' : ''}>İptal</option>
                    </select>
                    <br>
                    <div style="display:inline-flex; gap:6px;">
                        ${r.status !== 'Yapıldı' ? `<button class="dash-btn dash-btn-primary" style="padding:4px 8px; font-size:11px; box-shadow:none;" onclick="updatePStatus(${r.id}, 'Yapıldı'); showToast('Görev tamamlandı!')">Hemen Yap</button>` : ''}
                        <button class="dash-btn dash-btn-outline" style="padding:4px 8px; font-size:11px; color:var(--dash-danger); border-color:var(--dash-danger);" onclick="deletePRecord(${r.id})">Sil</button>
                    </div>
                </div>
            `;
            listContainer.appendChild(div);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerText = "Kaydediliyor...";

        const dateVal = document.getElementById('p-date').value;
        const startTimeVal = document.getElementById('p-start').value;
        const endTimeVal = document.getElementById('p-end').value;
        const titleVal = document.getElementById('p-title').value;
        const categoryVal = document.getElementById('p-category').value;
        const priorityVal = document.getElementById('p-priority').value;
        const descVal = document.getElementById('p-desc').value;
        const repeatEl = document.getElementById('p-repeat');
        const repeatVal = repeatEl && repeatEl.value ? parseInt(repeatEl.value) : 1;

        try {
            const repeatCount = repeatVal > 0 ? repeatVal : 1;
            const promises = [];
            const [year, month, day] = dateVal.split('-').map(Number);

            for (let i = 0; i < repeatCount; i++) {
                const currentDate = new Date(year, month - 1, day);
                currentDate.setDate(currentDate.getDate() + (i * 7));
                
                const y = currentDate.getFullYear();
                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;

                const currentTitle = repeatCount > 1 ? `${titleVal} (${i + 1}/${repeatCount}. Hafta)` : titleVal;

                promises.push(window.db.planner.create({
                    date: dateStr, start_time: startTimeVal, end_time: endTimeVal, 
                    title: currentTitle, category: categoryVal, priority: priorityVal, 
                    description: descVal, status: 'Yapılacak'
                }));
            }

            await Promise.all(promises);

            form.reset();
            await loadRecords();
            showToast('Plan Başarıyla Eklendi!');
        } catch (error) {
            alert("Kaydedilemedi: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Planı Ekle";
        }
    });

    window.deletePRecord = async (id) => {
        if (confirm("Bu planı silmek istediğinize emin misiniz?")) {
            await window.db.planner.delete(id);
            loadRecords();
        }
    };

    window.updatePStatus = async (id, status) => {
        await window.db.planner.updateStatus(id, status);
        loadRecords();
    };

    loadRecords();
}