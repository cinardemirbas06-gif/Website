<?php
// Bu dosyayı cPanel Dosya Yöneticisi'nde "smtp-config.php" adıyla,
// contact.php ile AYNI klasöre kopyalayıp gerçek bilgilerinizi girin.
// smtp-config.php asla git'e commit edilmemelidir (.gitignore'da hariç tutulmuştur).

define('SMTP_USERNAME', 'iletisim@cinardemirbas.com.tr');
define('SMTP_PASSWORD', 'BURAYA_YENI_SIFRENIZI_YAZIN');
// Opsiyonel, boş bırakılırsa contact.php varsayılan olarak mail.cinardemirbas.com.tr kullanır
define('SMTP_HOST', 'mail.cinardemirbas.com.tr');
