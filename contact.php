<?php
// PHPMailer sınıflarını global ad alanına aktar
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Projenize eklediğiniz 'src' klasöründeki dosyaları çağırın
require 'src/Exception.php';
require 'src/PHPMailer.php';
require 'src/SMTP.php';

// smtp-config.php sunucuda elle oluşturulur ve asla git'e commit edilmez (bkz. smtp-config.example.php)
if (file_exists(__DIR__ . '/smtp-config.php')) {
    require __DIR__ . '/smtp-config.php';
}

header('Content-Type: application/json; charset=UTF-8');

$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

if (!$data || !is_array($data)) {
    respond(false, 'Geçersiz istek gönderildi.');
}

// Honeypot: bu alan görünmez şekilde forma eklenir, sadece botlar doldurur.
// Doluysa isteği sessizce başarılıymış gibi sonlandır (bot'a bilgi sızdırma, e-posta gönderme).
if (!empty($data['website'])) {
    respond(true, 'Mesajınız başarıyla gönderildi.');
}

// Gelen veriyi temizle
$name = sanitize($data['name'] ?? '');
$email = sanitize($data['email'] ?? '');
$phone = sanitize($data['phone'] ?? '');
$message = sanitize($data['message'] ?? '');

// Alanların boş olup olmadığını kontrol et
if (empty($name) || empty($email) || empty($phone) || empty($message)) {
    respond(false, 'Lütfen tüm alanları doldurun.');
}

// E-posta formatını doğrula
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Lütfen geçerli bir e-posta adresi girin.');
}

// Mesaj uzunluğunu kontrol et
if (strlen($message) < 10) {
    respond(false, 'Mesajınız çok kısa. Lütfen daha fazla bilgi verin.');
}

// PHPMailer'ı başlat
$mail = new PHPMailer(true);

try {
    // Sunucu Ayarları
    // $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Hata ayıklama için bu satırı aktif edebilirsiniz
    $smtpUser = defined('SMTP_USERNAME') ? SMTP_USERNAME : getenv('SMTP_USERNAME');
    $smtpPass = defined('SMTP_PASSWORD') ? SMTP_PASSWORD : getenv('SMTP_PASSWORD');
    $smtpHost = defined('SMTP_HOST') ? SMTP_HOST : getenv('SMTP_HOST');
    if (!$smtpUser || !$smtpPass) {
        error_log('contact.php: SMTP_USERNAME / SMTP_PASSWORD tanımlı değil (smtp-config.php eksik olabilir).');
        respond(false, 'Sunucu yapılandırma hatası. Lütfen daha sonra tekrar deneyin.');
    }

    $mail->isSMTP();
    $mail->Host       = $smtpHost ?: 'mail.cinardemirbas.com.tr';
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpUser;
    $mail->Password   = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL için 'ssl' -> ENCRYPTION_SMTPS, TLS için 'tls' -> ENCRYPTION_STARTTLS
    $mail->Port       = 465; // SSL için genellikle 465, TLS için 587
    $mail->CharSet    = 'UTF-8';

    // Gönderen ve Alıcılar
    $mail->setFrom($smtpUser, 'Çınar Demirbaş Web Formu'); // Gönderen adresi (genellikle username ile aynı)
    $mail->addAddress($smtpUser, 'Çınar Demirbaş'); // Mesajın gideceği adres
    $mail->addReplyTo($email, $name); // Kullanıcı 'yanıtla' dediğinde form dolduranın adresine gider

    // E-posta İçeriği
    $mail->isHTML(false); // E-postayı düz metin olarak gönder
    $mail->Subject = 'Siteden Yeni İletişim Formu Mesajı';
    
    $body = "Ad Soyad: {$name}\n";
    $body .= "E-posta: {$email}\n";
    $body .= "Telefon: {$phone}\n\n";
    $body .= "Mesaj:\n{$message}\n";
    $mail->Body = $body;

    $mail->send();
    respond(true, 'Mesaj başarıyla gönderildi.');

} catch (Exception $e) {
    // Hata durumunda loglama yapabilirsiniz: error_log("Mailer Error: {$mail->ErrorInfo}");
    respond(false, 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
}

/**
 * Gelen veriyi temel saldırılara karşı temizler.
 */
function sanitize(string $value): string
{
    $value = trim($value);
    $value = strip_tags($value);
    $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    return $value;
}

/**
 * JSON formatında bir yanıt oluşturur ve script'i sonlandırır.
 */
function respond(bool $success, string $message): void
{
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
