export const BADGES = {
  // --- SÜREKLİLİK ---
  WELCOME: {
    id: "WELCOME",
    name: "Akademik Başlangıç",
    description: "YDT Focus platformuna katılarak ilk adımını attın.",
    requirement: "Platforma ilk girişini gerçekleştir.",
    color: "#0a84ff", icon: "fa-university", difficulty: 1, category: "Süreklilik"
  },
  STREAK_7: {
    id: "STREAK_7",
    name: "Haftalık Disiplin",
    description: "7 gün boyunca kesintisiz çalışarak düzenli bir alışkanlık kurdun.",
    requirement: "7 günlük kesintisiz çalışma serisi yakala.",
    color: "#30d158", icon: "fa-arrow-trend-up", difficulty: 1, category: "Süreklilik"
  },
  STREAK_15: {
    id: "STREAK_15",
    name: "Yarım Ay İstikrarı",
    description: "15 gün boyunca hedeflerinden kopmadan ilerlemeyi başardın.",
    requirement: "15 günlük çalışma serisi yakala.",
    color: "#5e5ce6", icon: "fa-book-bookmark", difficulty: 2, category: "Süreklilik"
  },
  STREAK_30: {
    id: "STREAK_30",
    name: "Aylık Azim",
    description: "30 günlük muazzam bir çalışma serisiyle iradeni kanıtladın.",
    requirement: "30 günlük çalışma serisi yakala.",
    color: "#ff375f", icon: "fa-bolt-lightning", difficulty: 4, category: "Süreklilik"
  },
  STREAK_50: {
    id: "STREAK_50",
    name: "İstikrar Abidesi",
    description: "50 gün boyunca hiç ara vermeden çalışarak büyük bir başarıya ulaştın.",
    requirement: "50 günlük çalışma serisi yakala.",
    color: "#ff9f0a", icon: "fa-calendar-day", difficulty: 4, category: "Süreklilik"
  },
  STREAK_75: {
    id: "STREAK_75",
    name: "Disiplin Ustası",
    description: "75 günlük kesintisiz çalışma ile dil öğreniminde uzmanlaştın.",
    requirement: "75 günlük çalışma serisi yakala.",
    color: "#af52de", icon: "fa-medal", difficulty: 5, category: "Süreklilik"
  },
  STREAK_100: {
    id: "STREAK_100",
    name: "Efsanevi Seri",
    description: "100 günlük efsanevi çalışma disiplini ile zirveye ulaştın.",
    requirement: "100 günlük çalışma serisi yakala.",
    color: "#ff2d55", icon: "fa-fire", difficulty: 5, category: "Süreklilik"
  },
  CONSISTENT_STREAK: {
    id: "CONSISTENT_STREAK",
    name: "Düzenli Çalışma",
    description: "Haftalık hedeflerini aksatmadan tamamlayarak disiplinini tescilledin.",
    requirement: "3 hafta boyunca her gün giriş yaparak istikrarını koru.",
    color: "#ff9f0a", icon: "fa-shield", difficulty: 4, category: "Süreklilik"
  },
  WEEKEND_WARRIOR: {
    id: "WEEKEND_WARRIOR",
    name: "Hafta Sonu Azmi",
    description: "Hafta sonu tatillerinde bile hedeflerine zaman ayırmayı bildin.",
    requirement: "Cumartesi ve Pazar günlerini boş geçmeden çalış.",
    color: "#32d74b", icon: "fa-couch", difficulty: 2, category: "Süreklilik"
  },

  // --- KELİME BİLGİSİ ---
  WORDS_100: {
    id: "WORDS_100",
    name: "Kelime Temeli",
    description: "100 temel akademik kelime ile dil bilgine sağlam bir altyapı kurdun.",
    requirement: "Kelime bankana 100 kelime ekle.",
    color: "#ffd60a", icon: "fa-cubes", difficulty: 1, category: "Kelime Bilgisi"
  },
  WORDS_250: {
    id: "WORDS_250",
    name: "Kelime Gelişimi",
    description: "250 kelime ile akademik okumalar için ilk büyük adımı attın.",
    requirement: "Kelime bankana 250 kelime ekle.",
    color: "#64d2ff", icon: "fa-seedling", difficulty: 2, category: "Kelime Bilgisi"
  },
  WORDS_500: {
    id: "WORDS_500",
    name: "Kelime Uzmanı",
    description: "500 kelime ile akademik metinleri anlama kapasiteni üst seviyeye taşıdın.",
    requirement: "Kelime bankana 500 kelime ekle.",
    color: "#bf5af2", icon: "fa-medal", difficulty: 2, category: "Kelime Bilgisi"
  },
  WORDS_750: {
    id: "WORDS_750",
    name: "Kelime Bilgini",
    description: "750 kelime ile ileri düzey metinler üzerinde hakimiyet kurmaya başladın.",
    requirement: "Kelime bankana 750 kelime ekle.",
    color: "#ff9f0a", icon: "fa-graduation-cap", difficulty: 3, category: "Kelime Bilgisi"
  },
  WORDS_1000: {
    id: "WORDS_1000",
    name: "Kelime Üstadı",
    description: "1000 kelime ile lügatında profesyonel bir hakimiyet kurdun.",
    requirement: "Kelime bankana 1000 kelime ekle.",
    color: "#ff2d55", icon: "fa-crown", difficulty: 5, category: "Kelime Bilgisi"
  },
  WORDS_1500: {
    id: "WORDS_1500",
    name: "Lügat Mimarı",
    description: "1500 kelime ile dilin en karmaşık yapılarını çözme gücüne eriştin.",
    requirement: "Kelime bankana 1500 kelime ekle.",
    color: "#5e5ce6", icon: "fa-monument", difficulty: 5, category: "Kelime Bilgisi"
  },
  WORDS_2000: {
    id: "WORDS_2000",
    name: "Kelime Hazinesi",
    description: "2000 akademik kelime ile yaşayan bir kütüphaneye dönüştün.",
    requirement: "Kelime bankana 2000 kelime ekle.",
    color: "#ff375f", icon: "fa-gem", difficulty: 5, category: "Kelime Bilgisi"
  },
  MASTERY_STAR: {
    id: "MASTERY_STAR",
    name: "Kalıcı Öğrenme",
    description: "50 kelimeyi tamamen kalıcı hafızana alarak büyük başarı sergiledin.",
    requirement: "50 kelimeyi 'Hazine' seviyesine ulaştır.",
    color: "#007aff", icon: "fa-star", difficulty: 4, category: "Kelime Bilgisi"
  },
  MASTERY_STAR_100: {
    id: "MASTERY_STAR_100",
    name: "Hafıza Ustası",
    description: "100 kelimeyi nöral düzeyde sabitleyerek lügatını tescilledin.",
    requirement: "100 kelimeyi 'Hazine' seviyesine ulaştır.",
    color: "#5e5ce6", icon: "fa-brain", difficulty: 5, category: "Kelime Bilgisi"
  },
  QUICK_LEARNER: {
    id: "QUICK_LEARNER",
    name: "Hızlı Kavrama",
    description: "Kısa sürede yüksek sayıda kelime öğrenerek öğrenme hızını kanıtladın.",
    requirement: "Tek bir oturumda 20 kelimeyi 'Biliyorum' olarak işaretle.",
    color: "#ff375f", icon: "fa-bolt", difficulty: 2, category: "Kelime Bilgisi"
  },
  SYNONYM_SEEKER: {
    id: "SYNONYM_SEEKER",
    name: "Anlam Kaşifi",
    description: "Eş anlamlı kelimeleri keşfederek kelime hazneni zenginleştirdin.",
    requirement: "10 kelimeye başarılı bir şekilde eş anlamlı ekle.",
    color: "#64d2ff", icon: "fa-magnifying-glass", difficulty: 2, category: "Kelime Bilgisi"
  },

  // --- ANALİZ VE METİNLER ---
  READING_MASTER: {
    id: "READING_MASTER",
    name: "Metin Analisti",
    description: "Karmaşık metinleri çözümleyerek ileri düzey okuma yetkinliği sergiledin.",
    requirement: "Reading panelinde 20 okuma parçasını tamamla.",
    color: "#64d2ff", icon: "fa-microscope", difficulty: 3, category: "Dilbilimsel Analiz"
  },
  READING_PRO: {
    id: "READING_PRO",
    name: "Metin Uzmanı",
    description: "40 okuma parçasını analiz ederek okuma disiplinini geliştirdin.",
    requirement: "40 okuma parçasını tamamla.",
    color: "#30d158", icon: "fa-book-open", difficulty: 4, category: "Dilbilimsel Analiz"
  },
  READING_MASTER_50: {
    id: "READING_MASTER_50",
    name: "YDT Analiz Uzmanı",
    description: "50 farklı akademik metni çözümleyerek analiz derinliği kazandın.",
    requirement: "50 okuma parçasını tamamla.",
    color: "#ff375f", icon: "fa-book-open-reader", difficulty: 5, category: "Dilbilimsel Analiz"
  },
  READING_MASTER_75: {
    id: "READING_MASTER_75",
    name: "Literatür Kaşifi",
    description: "75 okuma parçasıyla akademik literatürde dev bir yol kat ettin.",
    requirement: "75 okuma parçasını tamamla.",
    color: "#ffd60a", icon: "fa-compass", difficulty: 5, category: "Dilbilimsel Analiz"
  },
  READING_MASTER_100: {
    id: "READING_MASTER_100",
    name: "Okuma Profesörü",
    description: "100 farklı akademik metin analiziyle okuma süreçlerinde uzmanlaştın.",
    requirement: "100 okuma parçasını başarıyla analiz et.",
    color: "#bf5af2", icon: "fa-book-atlas", difficulty: 5, category: "Dilbilimsel Analiz"
  },
  TRANSLATOR_PRO: {
    id: "TRANSLATOR_PRO",
    name: "Çeviri Analisti",
    description: "Metinler arasındaki anlam geçişlerini ustalıkla yönettin.",
    requirement: "Metin analiz araçlarını ve çeviriyi 50 kez kullan.",
    color: "#64d2ff", icon: "fa-language", difficulty: 3, category: "Dilbilimsel Analiz"
  },
  MISTAKE_CLEARER: {
    id: "MISTAKE_CLEARER",
    name: "Hata Avcısı",
    description: "Hatalarından ders çıkararak eksikliklerini başarıyla giderdin.",
    requirement: "Hata bankandan 20 kelimeyi başarıyla temizle.",
    color: "#ffcc00", icon: "fa-spell-check", difficulty: 3, category: "Dilbilimsel Analiz"
  },

  // --- AKADEMİK DİSİPLİN ---
  NIGHT_OWL: {
    id: "NIGHT_OWL",
    name: "Gece Çalışanı",
    description: "Gece saatlerinde gösterdiğin yoğun odaklanma ile hedeflerini aştın.",
    requirement: "Gece 00:00 - 04:00 saatleri arasında çalışma seansı yap.",
    color: "#5e5ce6", icon: "fa-feather", difficulty: 1, category: "Akademik Disiplin"
  },
  EARLY_BIRD: {
    id: "EARLY_BIRD",
    name: "Erken Odak",
    description: "Güne erken başlayarak zihinsel kapasiteni verimli şekilde kullandın.",
    requirement: "Sabah 05:00 - 08:00 saatleri arasında çalışma seansı yap.",
    color: "#ff9f0a", icon: "fa-compass", difficulty: 1, category: "Akademik Disiplin"
  },
  ACADEMIC_FOCUS: {
    id: "ACADEMIC_FOCUS",
    name: "Kesintisiz Odak",
    description: "Uzun süreli ve aralıksız çalışma seanslarıyla disiplinini sergiledin.",
    requirement: "Tek seferde 60 dakika kesintisiz akademik çalışma yap.",
    color: "#af52de", icon: "fa-brain", difficulty: 3, category: "Akademik Disiplin"
  },
  DAILY_CHAMPION: {
    id: "DAILY_CHAMPION",
    name: "Günlük Hedef",
    description: "Günlük hedeflerini tam kapasiteyle tamamlayarak günü verimli kapattın.",
    requirement: "Bir gün içerisinde 60 dakika aktif çalışma süresine ulaş.",
    color: "#34c759", icon: "fa-check-circle", difficulty: 2, category: "Akademik Disiplin"
  },
  MINUTES_500: {
    id: "MINUTES_500",
    name: "Yoğun Çalışma",
    description: "500 dakikalık çalışma süresiyle hedeflerine olan bağlılığını gösterdin.",
    requirement: "Toplam aktif çalışma süreni 500 dakikaya ulaştır.",
    color: "#ff3b30", icon: "fa-hourglass-half", difficulty: 2, category: "Akademik Disiplin"
  },
  MINUTES_1000: {
    id: "MINUTES_1000",
    name: "Zaman Yönetimi",
    description: "1000 dakikalık çalışma ile disiplinli bir program kurmayı başardın.",
    requirement: "Toplam aktif çalışma süreni 1000 dakikaya ulaştır.",
    color: "#007aff", icon: "fa-clock", difficulty: 3, category: "Akademik Disiplin"
  },
  MINUTES_2000: {
    id: "MINUTES_2000",
    name: "Zamanın Efendisi",
    description: "2000 dakikalık devasa çalışma süresiyle alanında otorite haline geldin.",
    requirement: "Toplam aktif çalışma süreni 2000 dakikaya ulaştır.",
    color: "#ff2d55", icon: "fa-graduation-cap", difficulty: 5, category: "Akademik Disiplin"
  },
  MINUTES_3500: {
    id: "MINUTES_3500",
    name: "Akademik Maraton",
    description: "3500 dakikalık çalışma ile dayanıklılığın zirvesine ulaştın.",
    requirement: "Toplam aktif çalışma süreni 3500 dakikaya ulaştır.",
    color: "#ffd60a", icon: "fa-person-running", difficulty: 5, category: "Akademik Disiplin"
  },
  MINUTES_5000: {
    id: "MINUTES_5000",
    name: "Çalışma Öncüsü",
    description: "5000 dakikalık çalışma ile platformun en disiplinli üyelerinden biri oldun.",
    requirement: "Toplam aktif çalışma süreni 5000 dakikaya ulaştır.",
    color: "#bf5af2", icon: "fa-vial", difficulty: 5, category: "Akademik Disiplin"
  },
  MARATHONER: {
    id: "MARATHONER",
    name: "Odak Maratonu",
    description: "Tek bir seansta gösterdiğin 120 dakikalık odaklanma ile iradeni kanıtladın.",
    requirement: "Tek seferde 120 dakika kesintisiz çalış.",
    color: "#ff375f", icon: "fa-stopwatch", difficulty: 4, category: "Akademik Disiplin"
  },

  // --- TOPLULUK ---
  SOCIAL_NEWBIE: {
    id: "SOCIAL_NEWBIE",
    name: "Sosyal Girişim",
    description: "Toplulukta ilk bağını kurarak akademik yardımlaşma sürecini başlattın.",
    requirement: "1 farklı kullanıcıyla arkadaşlık kur.",
    color: "#64d2ff", icon: "fa-user-plus", difficulty: 1, category: "Topluluk"
  },
  SOCIAL_SCHOLAR: {
    id: "SOCIAL_SCHOLAR",
    name: "Akademik Çevre",
    description: "5 arkadaş edinerek çalışma ağını genişletmeye başladın.",
    requirement: "5 farklı kullanıcıyla arkadaşlık kur.",
    color: "#5856d6", icon: "fa-user-group", difficulty: 2, category: "Topluluk"
  },
  SOCIAL_EXPERT: {
    id: "SOCIAL_EXPERT",
    name: "Bilgi Paylaşımı",
    description: "Geniş arkadaş çevrenle platformun en sosyal araştırmacılarından biri oldun.",
    requirement: "10 farklı kullanıcıyla arkadaşlık kur.",
    color: "#af52de", icon: "fa-users", difficulty: 3, category: "Topluluk"
  },
  SOCIAL_LEADER: {
    id: "SOCIAL_LEADER",
    name: "Topluluk Lideri",
    description: "20 arkadaş ile akademik bir topluluğun merkezine yerleştin.",
    requirement: "20 farklı kullanıcıyla arkadaşlık kur.",
    color: "#ff9500", icon: "fa-users-viewfinder", difficulty: 4, category: "Topluluk"
  },
  RANK_TOP_10: {
    id: "RANK_TOP_10",
    name: "Sıralama Adayı",
    description: "Liderlik tablosunda ilk 10'a girerek rekabetçi gücünü gösterdin.",
    requirement: "Liderlik tablosunda ilk 10 içerisinde yer al.",
    color: "#ffd60a", icon: "fa-list-ol", difficulty: 3, category: "Topluluk"
  },
  CHALLENGER: {
    id: "CHALLENGER",
    name: "Seçkin Öğrenci",
    description: "Liderlik tablosunda ilk 3'e girerek akademik üstünlüğünü kanıtladın.",
    requirement: "Liderlik tablosunda ilk 3 içerisinde yer al.",
    color: "#ff2d55", icon: "fa-award", difficulty: 4, category: "Topluluk"
  },
  RANK_NUMBER_ONE: {
    id: "RANK_NUMBER_ONE",
    name: "Zirve Sahibi",
    description: "Liderlik tablosunun 1. sırasına yerleşerek platformun en iyisi oldun.",
    requirement: "Liderlik tablosunda 1. sıraya ulaş.",
    color: "#ff375f", icon: "fa-trophy", difficulty: 5, category: "Topluluk"
  },
  LEGENDARY: {
    id: "LEGENDARY",
    name: "Akademik Efsane",
    description: "Platformdaki her alanda gösterdiğin üstün başarı ile efsaneler arasına girdin.",
    requirement: "Toplamda 30 farklı rozet kazan.",
    color: "#ffd60a", icon: "fa-star-and-crescent", difficulty: 5, category: "Topluluk"
  }
};
