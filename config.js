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
    "Yeni yaşımda alışılmışın dışına birlikte çıkmak için hepinizi yanımda görmeyi bekliyorum.",
    "",
    "Kartlar dağıtıldı. Yerinizi alın."
  ],

  // Açılışın genel hızı. 1 = ilk tasarımdaki tempo; 1.35 = yaklaşık üçte bir daha hızlı.
  // Geçişler, beklemeler, yazı makinesi ve okuma süresi bu çarpana bölünür.
  pace: 1.35,

  // Yazı makinesi hızı (milisaniye / harf, pace uygulanmadan önce). Daha yavaş için büyüt.
  typeSpeed: 46,
  // Metin bittikten sonra okuma süresi (milisaniye, pace uygulanmadan önce)
  readHold: 4500,

  // Bir davetlinin yanında getirebileceği en fazla kişi sayısı (sunucu 20'den fazlasını kabul etmez)
  maxCompanions: 20
};
