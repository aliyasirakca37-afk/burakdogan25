// Davet bilgileri. Bu dosyayı düzenleyip kaydetmen yeterli; sitenin geri kalanına dokunman gerekmez.
window.EVENT = {
  host: "Burak Doğan",

  // Katılım kayıt servisi. Boşsa aynı adres kullanılır; alan adı sürümünde otomatik doldurulur.
  apiBase: "https://burak-davet.higgsfield.app",

  // Kart başlığı
  title: "King's Night",
  titleLead: "The",
  kicker: "Private Party",

  // Üç sütun: yer, tarih, saat (alt satırlar küçük yazılır)
  place: "JW Marriott",
  placeSub: "Ankara",
  date: "5 Aralık 2026",
  dateSub: "Cumartesi",
  time: "20:00",
  timeSub: "Kapılar açılır",

  // Kıyafet ve not
  dressLabel: "Dress code",
  dress: "Smart Casual",
  surprise: "Sürprizlere hazır olun",

  // Daktiloda harf harf yazılan davet metni. Her satır ayrı bir paragraf; boş satır boşluk bırakır.
  letter: [
    "Her yıl biraz daha efsaneleşen o gecelere bir yenisini eklemeye hazır mısınız?",
    "",
    "Bu yıl konsept biraz farklı.",
    "",
    "Bu gece kimse kaybetmeyecek; ama kazanan çok olacak.",
    "",
    "Yeni yaşımda alışılmışın dışına birlikte çıkmak için hepinizi yanımda görmek istiyorum.",
    "",
    "Kartlar dağıtıldı. Yerinizi alın."
  ],

  // Yazı makinesi hızı (milisaniye / harf). Daha yavaş için büyüt.
  typeSpeed: 46,
  // Metin bittikten sonra okuma süresi (milisaniye)
  readHold: 4500
};
