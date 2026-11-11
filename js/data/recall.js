/*
 * recall.js — Kalıcı öğrenme katmanı.
 *
 * MC.recall['bölüm/ders']: dersin teorisinden sonra gelen "serbest hatırlama" kartı.
 *   Öğrenci ekrana bakmadan yazar (geri çağırma pratiği), sonra anahtar noktalarla kendini puanlar.
 *   Sorular çoğunlukla "neden / nasıl" ve "üret" türündedir (ayrıntılandırma ve üretme etkisi).
 * MC.bridges['bölüm']: bölümler arası köprü.
 *   intro.uses   → bölüm başında: hangi eski bilgiyi kullanacaksın (ön düzenleyici)
 *   intro.builds → bu bölüm onların üstüne ne koyuyor
 *   links        → bölüm sonunda: önceki bölümlerle nasıl birleşiyor
 *   next         → sonraki bölüm bunun üstüne ne koyacak
 *   questions    → birden çok bölümü birleştiren sorular (bölüm tekrarında önce gelir)
 */
(function (MC) {
  'use strict';

  MC.recall = {
    /* ---------------- Bölüm 1 */
    'ch1/nedir': { q: 'Ekrana bakmadan yaz: Mikrodenetleyiciyi tanımla, 3 kısmını say ve bir çamaşır makinesinde neden mikroişlemci değil mikrodenetleyici kullanıldığını kendi cümlenle açıkla.',
      points: ['Düşük kapasiteli bilgisayarın entegreye dönüşmüş hali', 'CPU, hafıza (RAM/ROM), G/Ç birimi', 'Mikroişlemci yalnızca CPU; bellek ve G/Ç dışarıda', 'Tek çip: ucuz, küçük, az enerji, tek işe adanmış'] },
    'ch1/cpu': { q: 'Makine döngüsünün 4 adımını sırayla yaz. Sonra şunu açıkla: PC olmasaydı CPU sıradaki komutu nereden bilirdi?',
      points: ['Getir (fetch)', 'Çöz (decode)', 'Gerçekleştir (execute)', 'Sonucu yaz', 'PC sıradaki komutun adresini tutar ve her getirmede artar', 'Bir döngü X saat darbesi (PIC: komut başına 4)'] },
    'ch1/anayol': { q: 'Üç anayolun adını ve görevini yaz. Ardından "MOVLW 0x34" komutunun bellekten getirilmesini 5 adımda, hangi adımda hangi yolun kullanıldığını belirterek anlat. 13 adres hattıyla kaç adres tanımlanır?',
      points: ['Adres yolu: adres taşır (PC içeriği buraya konur)', 'Kontrol yolu: OKU sinyali', 'Veri yolu: opcode bellekten CPU\'ya gelir', 'Opcode komut kaydedicisine, PC artar', '2¹³ = 8192 = 8K'] },
    'ch1/tipler': { q: 'Dört sınıflandırma ölçütünü yaz. Harvard mimarisi neden daha hızlıdır? Zaman çizelgesini düşünerek bir cümleyle açıkla. RISC\'in 3 özelliğini say.',
      points: ['Anayol genişliği, mimari, komut seti, bellek tipi', 'Harvard: komut ve veri ayrı yollardan, aynı anda erişilir', 'VN: basit, ucuz, esnek', 'RISC: az komut, sabit uzunluk, çoğu tek döngü'] },
    'ch1/pic': { q: 'PIC16F877A\'yı dört ölçüte göre tek cümlede tanımla. Senin bir proje için mikrodenetleyici seçmen gerekse hangi 4 kritere bakardın?',
      points: ['8 bit', 'Harvard', 'RISC (35 komut)', 'Gömülü bellek', 'Uygulama alanı, fiyat-performans, referans kaynak, tanıdık mimari'] },
    'ch1/programlama': { q: 'Kodu yazmaktan PIC\'in içine yüklemeye kadar olan yolu anlat. Derleyicinin assembler\'dan fazla yaptığı iki işi yaz.',
      points: ['Kod yazılır', 'Derleyici/assembler → .hex', 'Programlayıcı ile program hafızasına yazılır', 'Derleyici önce assembly\'ye çevirir', 'Kod iyileştirme ve hata bildirme'] },

    /* ---------------- Bölüm 2 */
    'ch2/ozellik': { q: 'PIC16F877A tablosunu hafızadan doldur: program belleği, RAM, EEPROM, frekans, komut sayısı, timer, ADC, G/Ç. Program sayacının neden 13 bit olduğunu hesapla.',
      points: ['8K program', '368 B RAM', '256 B EEPROM', '20 MHz', '35 komut', '3 timer', '10 bit 8 kanal ADC', '33 G/Ç', '8K = 2¹³ → 13 bit'] },
    'ch2/bellek': { q: 'Belleğin 3 kısmını ve her birinin ne tuttuğunu yaz. "86h" adresi hangi bankta ve orada ne var? Neden oraya değişken koyamazsın?',
      points: ['Program belleği (kod, 0000h reset, 0004h kesme)', 'RAM: GPR (değişken) + SFR (kaydedici), 4 bank', 'EEPROM: kalıcı, dolaylı erişim', '86h = Bank 1, ofset 06h → TRISB (SFR)', 'Değişken yalnızca GPR alanına'] },
    'ch2/asm': { q: 'Bir assembly satırının 4 parçasını örnekle göster. MOVLW, MOVWF ve SUBLW ne yapar? Bank yapısının sebebini komut kelimesindeki bit sayısıyla açıkla.',
      points: ['Etiket, mnemonic, operand, yorum', 'MOVLW k: W ← k', 'MOVWF f: f ← W', 'SUBLW k: W ← k − W', 'Komutta adres için 7 bit → 128 adres; geri kalanı RP1:RP0'] },
    'ch2/status': { q: 'Z, DC ve C bayraklarının ne zaman 1 olduğunu yaz. SUBLW sonrası "küçük, büyük, eşit" için Z ve C değerlerini tablo olarak hafızadan çiz. C\'nin çıkarmada neden "ters" çalıştığını açıkla.',
      points: ['Z: sonuç 0', 'DC: alt 4 bitten elde', 'C: 7. bitten elde', 'Küçük Z=0 C=0, büyük Z=0 C=1, eşit Z=1 C=1', 'Çıkarmada C = borcun tersi (borç yok → 1)'] },
    'ch2/adresleme': { q: 'Sabit, doğrudan ve dolaylı adreslemeye birer PIC komutu örneği yaz. FSR ve INDF\'nin ne olduğunu ve dizide neden işe yaradığını açıkla.',
      points: ['Sabit: MOVLW 0x4', 'Doğrudan: MOVWF 0x20', 'Dolaylı: FSR = adres, INDF = o adresteki veri', 'FSR artırılınca aynı komut sonraki hücreye erişir (pointer)'] },
    'ch2/asmornek': { q: 'B portunun tüm pinlerini çıkış yapıp PORTB\'ye 55h yazan assembly programını ekrana bakmadan yaz. BSF STATUS,RP0 satırını unutursan ne olur?',
      points: ['Bank 0: BCF STATUS,RP0 / RP1', 'Bank 1: BSF STATUS,RP0', 'MOVLW 0 / MOVWF TRISB', 'Bank 0\'a dön', 'MOVLW 55h / MOVWF PORTB', 'Unutulursa TRISB yerine PORTB\'ye yazılır, pinler giriş kalır'] },
    'ch2/deney2': { q: 'Deney 2\'nin üç işlem basamağının sonuçlarını (sonuc ve bayraklar) hafızadan yaz. Lojik işlemler neden C ve DC\'yi değiştirmez?',
      points: ['0x0F & 0xF0 = 0x00, Z=1', '0x0F | 0xF0 = 0xFF, Z=0', '0xFF + 2 = 0x01, C=1, DC=1', 'AND/OR/XOR\'da toplama yok → elde oluşmaz, yalnızca Z etkilenir'] },

    /* ---------------- Bölüm 3 */
    'ch3/portlar': { q: 'Beş portu pin sayılarıyla ve birer özel görevleriyle yaz. Bir PIC\'in çalışması için mutlaka bağlanması gereken pinler nelerdir?',
      points: ['A 6 (analog), B 8 (programlama, RB0/INT), C 8 (seri haberleşme), D 8 (paralel), E 3 (analog)', 'Toplam 33', 'MCLR = 1', 'VDD, VSS', 'OSC1/OSC2 kristal'] },
    'ch3/tris': { q: 'Kendi sorununu üret ve çöz: D portunda 2 buton ve 3 LED olacak şekilde pinleri seç, TRISD\'yi hex olarak hesapla. Sonra LED\'lerden yalnızca birini yakan PORTD değerini yaz. Giriş pinine PORT ile yazınca neden bir şey olmaz?',
      points: ['Giriş = 1, çıkış = 0', 'Sıra RD7 … RD0, 4\'lü grupla', 'PORT: yanacak pin 1', 'Giriş pini dışarıdaki gerilimi okur; PORT yazımı pine çıkmaz'] },
    'ch3/cikis': { q: 'Totem pole ve açık drain çıkışı çiz (iki transistör / tek transistör) ve pine 1 yazınca her birinde pinin ne olduğunu yaz. Açık drain ile LED yakmak için ne eklemen gerekir?',
      points: ['Totem pole: 1 → VDD, 0 → GND; harici besleme gerekmez', 'Açık drain: 0 → GND, 1 → yüzer', 'Harici pull-up / besleme gerekir', 'PIC\'te RA4 açık drain'] },
    'ch3/giris': { q: 'Üç problemi ve çözümlerini eşleştirerek yaz: (1) gürültülü/yavaş giriş, (2) buton açıkken yüzen pin, (3) basışta birden çok sayım. Pull-down bağlantıda butona basınca ne okunur?',
      points: ['Schmitt tetikleyici: iki eşik, histerezis', 'Pull-up / pull-down direnci', 'Debounce: ~10 ms gecikme (veya RC donanım)', 'Pull-down: basınca 1'] },

    /* ---------------- Bölüm 4 */
    'ch4/derleme': { q: '.c dosyasından .hex dosyasına giden yolu yaz. "if(portb.f7==1)" satırının assembly\'de hangi komutlarla yapıldığını açıkla. Bunu bilmek neden işe yarar?',
      points: ['.c → derleyici → .asm → assembler → .hex', 'BTFSS PORTB,7 + GOTO', 'Assembly\'de yüksek seviyeli yapı yok, her şey atlama', '.lst dosyasında adres ve opcode görünür'] },
    'ch4/proje': { q: 'mikroC\'de yeni proje açarken girdiğin 4 bilgiyi ve Edit Project\'te seçtiğin 2 ayarı nedenleriyle yaz. Watchdog açık kalırsa programın nasıl davranacağını tahmin et.',
      points: ['Proje adı/klasör (Türkçe karakter yok)', 'P16F877A', 'Saat frekansı', 'Include ALL', 'Osilatör: 4 MHz üstü HS', 'WDT Disabled: yoksa sürekli reset, kod baştan başlar'] },
    'ch4/tipler': { q: 'mikroC tiplerinin boyutlarını yaz (char, short, int, long, float). −250\'yi önce signed short\'a sonra int\'e yazınca RAM\'de hangi baytlar görünür? Neden farklı?',
      points: ['char/short 1, int 2, long 4, float 4', 'short\'a −250 sığmaz → 06h', 'int: FF06h → küçük adreste 06, sonra FF', 'Little endian'] },
    'ch4/sayilar': { q: 'Kendin bir negatif sayı seç (−100 ile −300 arası) ve 16 bit ikiye tümleyenini adım adım bul. Sonra 0.5\'in IEEE 754 üssünü hesapla (bias 127).',
      points: ['Mutlak değer → ikili', 'Bitleri tersle', '+1', '0.5 = 1.0 × 2⁻¹ → üs −1 + 127 = 126', 'Sonuç hex ile kontrol (sayı araçları)'] },
    'ch4/diziler': { q: 'Bir dizi ve bir string tanımı yaz. code, data ve rx belirleyicilerinin farkını açıkla. Uzun bir menü metnini neden code ile tanımlarsın?',
      points: ['tip isim[boyut] = {…}', 'String sonunda \\0', 'code: Flash (program belleği)', 'data: RAM', 'rx: W alanı, 16F877A\'da yok', 'RAM 368 B kıt'] },
    'ch4/absolute': { q: 'absolute ile org\'un farkını yaz. Sonra kendin çakışan bir örnek üret: bir int ve bir char\'ı aynı bayta düşecek şekilde adresle ve char\'a yazınca int\'in nasıl değiştiğini hesapla.',
      points: ['absolute: değişkeni sabit adrese (RAM)', 'org: fonksiyonu program belleğinde sabit adrese', 'int 2 bayt kaplar', 'Ortak bayt değişince diğer değişkenin değeri de değişir'] },
    'ch4/operator': { q: '& ile &&, | ile ||, ~ ile ! arasındaki farkları birer örnekle yaz. Bir PORTB bitini set, clear ve toggle eden üç C satırını operatörlerle (F gösterimi olmadan) yaz.',
      points: ['& | ~ bit düzeyinde; && || ! mantıksal (sonuç 0/1)', 'Set: PORTB = PORTB | 0x08', 'Clear: PORTB = PORTB & ~0x08', 'Toggle: PORTB = PORTB ^ 0x08', '== önceliği &\'den yüksek: parantez'] },

    /* ---------------- Bölüm 5 */
    'ch5/cikis1': { q: 'Kâğıda yaz: 8 LED\'i sağdan sola sırayla dolduran, dolunca sıfırlayan programı (1 sn gecikmeyle). Sonra aynısını PORTB*2+1 yerine kaydırma ve OR ile yaz.',
      points: ['TRISB = 0', 'while(1) + for 8 tur', 'PORTB = PORTB*2+1 veya (PORTB<<1)|1', 'Delay_ms(1000)', 'Sonunda PORTB = 0'] },
    'ch5/cikis2': { q: 'Yeni bir desen tasarla: iki ışık ortadan (RB3, RB4) başlayıp uçlara doğru açılsın. Önce 4 satırlık PORTB değerlerini yaz, sonra hangi operatörle üretileceğini bul.',
      points: ['Satırlar: 0x18, 0x24, 0x42, 0x81', 'Sol yarı << , sağ yarı >>', 'İki yarı | veya ^ ile birleşir', 'Alternatif: sabit dizi + döngü'] },
    'ch5/giris': { q: 'Polling\'i tanımla ve Uygulama 13\'te butonu bırakınca LED\'lerin neden hemen sönmediğini açıkla. RD2 butonuna basılıyken RB0, bırakılınca RB7 yanan programı yaz.',
      points: ['Polling: girişi döngüde sürekli kontrol', 'Delay sırasında buton okunmaz', 'TRISD bit 2 = 1, TRISB = 0', 'if(PORTD.F2==1) … else …'] },
    'ch5/fonksiyon': { q: 'Fonksiyon çağrısında dönüş adresinin nereye yazıldığını ve PIC16F877A\'da bu yerin sınırını yaz. Bu sınır neden önemlidir?',
      points: ['Donanım yığını (stack)', '8 seviye', 'Fazla iç içe çağrıda eski adres kaybolur', 'Kesmeler de yığını kullanır'] },
    'ch5/deney3': { q: 'Deney 3\'ü hafızadan anlat: hangi ayarlar (MHz, osilatör, WDT), SimulIDE\'de .hex nasıl yüklenir, kitte neye dikkat edilir? TRISD = 0b01111110 hangi pinleri ne yapar?',
      points: ['8 MHz, HS, WDT kapalı, Release', 'SimulIDE: PIC\'e çift tıkla, program file = .hex, saat = 8 MHz', 'Build and Program, LINK ışığı, LEDS ON', 'RD7 ve RD0 çıkış, RD1–RD6 giriş'] },

    /* ---------------- Bölüm 6 */
    'ch6/nedir': { q: 'Kesmeyi tanımla ve polling ile karşılaştır (en az 2 fark). Kendi hayatından bir benzetme yaz. Harici ve dahili kesmeye PIC16F877A\'dan birer örnek ver.',
      points: ['Programı daha önemli görev için kesen mekanizma', 'Polling: CPU sürekli bakar, olay kaçabilir', 'Kesme: donanım haber verir, CPU başka iş yapabilir', 'Harici: RB0/INT', 'Dahili: Timer0, ADC, USART'] },
    'ch6/adimlar': { q: 'Kesme işleminin 4 adımını yaz. Sonra şu üç soruyu cevapla: GIE neden kesmeye girerken 0 olur? Neden tüm kesmeler 0004h\'e gider de ISR bayraklara bakar? Bayrak silinmezse ne olur?',
      points: ['Algıla → PC (ve STATUS) yığına → PC ← 04h → geri yükle, devam', 'GIE=0: iç içe kesme önlenir; RETFIE ile 1', 'Tek vektör: kaynak bayraktan anlaşılır', 'Bayrak silinmezse hemen tekrar kesme'] },
    'ch6/intcon': { q: 'INTCON\'un 8 bitini sırayla (7→0) hafızadan yaz. Timer0 kesmesi için INTCON değerini, ADC kesmesi için gereken tüm bitleri yaz. Aradaki fark neden var?',
      points: ['GIE PEIE TMR0IE INTE RBIE TMR0IF INTF RBIF', 'Timer0: 0xA0', 'ADC: GIE + PEIE + PIE1.ADIE', 'Çevresel kesmeler PEIE kapısından geçer'] },
    'ch6/deney4': { q: 'Deney 4 kodunu ekrana bakmadan yaz. Butona basınca olanları zaman sırasıyla anlat. INTCON.INTF=0 satırı silinirse ne gözlenir, neden?',
      points: ['ISR: portd.f0=0; Delay; INTF=0', 'main: TRISD=0, TRISB=0xFF, INTEDG=1, INTE=1, GIE=1, while(1) portd.f0=1', 'Basınca LED 1 s söner, sonra yanar', 'INTF silinmezse LED sürekli sönük: sürekli kesmeye girer'] },

    /* ---------------- Bölüm 7 */
    'ch7/sayac': { q: '3 bitlik asenkron sayıcının nasıl çalıştığını ve neden "frekans böldüğünü" açıkla. Bu fikir Timer0\'ın hangi parçasında karşına çıkar?',
      points: ['Her FF bir öncekinin çıkışıyla tetiklenir', 'Her FF frekansı 2\'ye böler: f/2, f/4, f/8', 'Başlangıç değeri taşmaya kalan darbeyi değiştirir', 'Ön ölçekleyici asenkron sayaçtır'] },
    'ch7/timerlar': { q: 'Üç zamanlayıcıyı bit sayısı, kesme anı ve ön ölçek seçenekleriyle tablo halinde hafızadan çiz.',
      points: ['Timer0: 8 bit, FFh→00h, 1:2…1:256', 'Timer1: 16 bit, FFFFh→0000h, 1:1…1:8', 'Timer2: 8 bit, TMR2 = PR2, ön ve son ölçek', 'Timer2 yalnızca dahili saat'] },
    'ch7/timer0': { q: 'Timer0\'ı kurmanın 3 adımını yaz. OPTION_REG\'in 8 bitini sırayla yaz ve OPTION_REG = 3 için ön ölçek oranını hesapla. Ön ölçekleme olmasaydı 4 MHz\'te Timer0 en fazla kaç µs sayabilirdi?',
      points: ['OPTION_REG → TMR0 → INTCON', 'RBPU INTEDG T0CS T0SE PSA PS2 PS1 PS0', '3 = PS 011 → 1:16', '256 × 1 µs = 256 µs'] },
    'ch7/hesap': { q: 'Formülü hafızadan yaz ve "×4"ün nereden geldiğini açıkla. Sonra şu soruyu kâğıtta çöz: 20 MHz\'te 0,2 ms için uygun prescale ve TMR0 değeri nedir?',
      points: ['TMR = 256 − G·F/(P·4)', 'Her komut 4 saat darbesi, Timer komut döngüsüyle sayar', '20 MHz, 0,2 ms: G·F/4 = 1000 → P = 2: −744 ✗', 'P = 4: 256 − 250 = 6 ✓ · P = 8: 256 − 125 = 131 ✓', 'Negatif çıkarsa prescale büyüt'] },
    'ch7/kod': { q: 'Uygulama 15\'i hafızadan yaz (interrupt, init, main). Kesmede üç satırın her birinin neden gerekli olduğunu açıkla. 1 ms\'de bir değillenen pinin frekansı neden 500 Hz?',
      points: ['PORTB.F0 = ~PORTB.F0 (kare dalga)', 'TMR0 = 6 (yeniden yükleme)', 'TMR0IF = 0 (bayrak)', 'OPTION_REG = 1, INTCON = 0xA0', 'Periyot = 2 × 1 ms → 500 Hz'] },
    'ch7/ornek23': { q: 'Örnek 2 ve 3\'ün cevaplarını hafızadan yaz. Sonra Uygulama 17 ve 18\'in OPTION_REG değerlerini ön ölçek bitlerine çevir.',
      points: ['8 MHz 100 µs: 256 − 200/P → 156 / 206 / 231', '16 MHz 20 µs: 256 − 80/P → 216 / 236 / 246 / 251', 'Uyg. 17: OPTION_REG = 2 → 010 → 1:8, TMR0 = 231', 'Uyg. 18: OPTION_REG = 0 → 000 → 1:2, TMR0 = 216'] },
    'ch7/deney5': { q: '8 MHz\'te 500 Hz kare dalga üreten programı yaz. Föydeki hazır kodun (OPTION_REG = 0, TMR0 = 6) neden 500 Hz değil 2 kHz ürettiğini hesapla.',
      points: ['500 Hz → kesme aralığı 1 ms', 'P = 8, TMR0 = 6, OPTION_REG = 2 (veya P = 16, TMR0 = 131)', 'Föy kodu: 250 × 2 × 0,5 µs = 250 µs', 'Periyot 500 µs → 2 kHz'] },
    'ch7/timer1': { q: 'Timer1\'in Timer0\'dan 3 farkını yaz. Timer1 kesmesi için Timer0\'dan farklı olarak hangi bit gerekir, neden?',
      points: ['16 bit (TMR1H/TMR1L)', 'Ön ölçek 1:1…1:8, Timer_max 65536', 'Harici giriş RC0/T1CKI, T1CON ile ayar', 'PEIE gerekir: Timer1 çevresel kesme (PIE1/PIR1)'] },

    /* ---------------- Bölüm 8 (7 segment) */
    'ch8/yapi': { q: 'Ekrana bakmadan anlat: PORTB = 0b11011010 yazılınca ortak katotlu göstergede ne olur? Akımın yolunu (pin → LED → ?) söyle. Aynı rakam ortak anotta kaç olur, neden?',
      points: ['Her bit kendi pinini 5 V / 0 V yapar', 'a = RB7 … g = RB1, dp = RB0', 'Ortak katot: 1 olan pinden LED\'e, katottan GND\'ye akım → yanar', '0xDA = a, b, d, e, g → "2"', 'Ortak anot: anotlar +5 V, 0 yakar → bit bit ters: 0x25'] },
    'ch8/ornek': { q: '0–9\'u 1 sn aralıkla gösteren programı dizi ve for ile hafızadan yaz (ortak katot). Ortak anota çevirmek için hangi tek değişiklik yeter?',
      points: ['char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,0xB6,0xBE,0xE0,0xFE,0xF6}', 'TRISB = 0', 'while(1){ for(i=0;i<10;i++){ PORTB = kod[i]; Delay_ms(1000); } }', 'Ortak anot: PORTB = ~kod[i]'] },
    'ch8/surucu': { q: 'BCD → 7 segment sürücünün ne yaptığını ve avantajını yaz. Uygulama 24\'te butonu basılı tutunca ne olur, neden?',
      points: ['4 bitlik BCD girişi (A–D) → a–g çıkışları', 'Bir hane 4 pin; PORTB = sayının kendisi', 'Kod tablosu gerekmez, ek entegre gerekir', 'Uyg. 24: Delay if içinde → basılı tutunca saniyede 1 artar', '10–15 BCD değil: 9\'dan sonra 0'] },
    'ch8/sayac99': { q: 'seven_segment_goster() fonksiyonunu (Uygulama 25) hafızadan yaz. sayac = 38 için her satırın sonucunu yaz. ×16 neden var?',
      points: ['onlar = sayac/10 → 3', 'birler = sayac%10 → 8', 'onlar*16 → 0x30 (<<4, üst sürücü)', 'veri = onlar ^ birler → 0x38', 'portb = veri', 'sayac signed: −1 → 99'] },
    'ch8/mux': { q: 'Multiplexing\'i tanımla. 4 haneli göstergede bir turun adımlarını yaz. Neden göz dört haneyi de yanık görür? pd1 değişkeni ne işe yarar?',
      points: ['Her haneyi tek port üzerinden sırayla kontrol', 'Hane seç (ortak katot: 0) → veri gönder → 1 ms bekle → sonraki', '4 ms tur = 250 Hz; göz ~20 ms\'den kısa sönmeyi görmez', 'Basamaklar: /1000, %1000/100, %100/10, %10', 'pd1: önceki basış durumu → basılı tutmak tek sayım'] },

    /* ---------------- Bölüm 9 (ADC) */
    'ch9/ornekleme': { q: 'Örnekleme ve nicemlemeyi tanımla. Nyquist şartını yaz ve şartı sağlamazsan ne olacağını açıkla. 15 kHz\'e kadar bileşen içeren bir sinyal için minimum f_s?',
      points: ['Örnekleme: belirli aralıklarla değer alma', 'Nicemleme: ölçekleyip bitlere atama', 'f_s ≥ 2·f_max', 'Aliasing: sahte düşük frekans', '30 kHz'] },
    'ch9/cozunurluk': { q: 'Çözünürlük formülünü ve 1 bitlik adımı yaz. Kendine bir soru üret ve çöz: 8 bitlik ADC, V_REF = 5 V, giriş 2 V → çıkış? Aynı soru 10 bitte?',
      points: ['Çözünürlük 2ⁿ', '1 bit = (V_REF+ − V_REF−)/2ⁿ', '8 bit: 19,53 mV → 2000/19,53 = 102', '10 bit: 4,882 mV → 409'] },
    'ch9/modul': { q: 'ADC ile ilgili kaydedicileri ve her birinin görevini yaz. ADFM = 0 ve 1 için 10 bitlik sonucun ADRESH/ADRESL\'ye yerleşimini çiz.',
      points: ['ADCON0: ADON, kanal, saat, GO/DONE', 'ADCON1: ADFM, ADCS2, PCFG', 'ADRESH/ADRESL: sonuç', 'PIE1.ADIE, PIR1.ADIF, INTCON GIE/PEIE', 'Sola yaslı: ADRESH = üst 8 bit; sağa yaslı: ADRESH alt 2 bit + ADRESL'] },
    'ch9/calistirma': { q: 'ADC\'yi çalıştırma adımlarını sırayla yaz. 8 MHz için T_AD\'yi 1,6 µs şartına göre seç ve bir çevrimin yaklaşık süresini hesapla.',
      points: ['ADCON1/ADCON0 ayarı, ADON', 'Kesme bitleri (isteğe bağlı)', 'Veri toplama bekle', 'GO = 1', 'Polling (GO/DONE) veya ADIF kesmesi', 'ADRESH/L oku', '8 MHz: 16 T_OSC = 2 µs, 12 × 2 = 24 µs'] },
    'ch9/kod': { q: 'Uygulama 19\'u hafızadan yaz. ADCON1 = 0x4E ve ADCON0 = 0x45\'i bitlerine ayırıp anlamını yaz. Uygulama 20 ile farkı nedir?',
      points: ['ISR: adc_degeri = ADRESH; ADIF = 0; GO = 1', '0x4E: sola yaslı, AN0 analog', '0x45: Fosc/16, AN0, GO=1, ADON=1', 'ADIE, PEIE, GIE = 1', 'Uyg. 20: ADC_Get_Sample (polling) ve × 0,249'] }
  };

  MC.bridges = {
    ch1: {
      intro: { uses: [], builds: 'Bu dersin temeli. Bilgisayar mimarisi dersinden bildiğin CPU, bellek ve yol kavramlarını <b>tek bir çipe</b> sığdırıyoruz. Burada öğrendiğin her kavram (PC, opcode, adres yolu, Harvard) sonraki bölümlerde somut bir PIC kaydedicisine dönüşecek.' },
      links: [],
      next: '<b>Bölüm 2</b> bu soyut parçaları PIC16F877A\'nın içinde somutlaştırır: "program belleği" 8K Flash olur, "PC" 13 bitlik bir sayaç, "ALU" W kaydedicisi ve STATUS bayraklarıyla çalışır, "adres yolu" ise 7 bitlik komut adresi + bank bitlerine bölünür.',
      questions: [
        { q: 'Bölüm 1\'deki "n adres hattı → 2ⁿ adres" kuralını kullanarak açıkla: 8K\'lık program belleği için kaç adres biti gerekir ve bu bilgi PIC\'in hangi kaydedicisinin boyutunu belirler?', a: '8K = 8192 = 2¹³ → 13 bit. Bu, program sayacının (PC) boyutudur: PC 13 bit olmalı ki program belleğinin her adresini gösterebilsin.' }
      ]
    },
    ch2: {
      intro: { uses: [['ch1', 'Makine döngüsü ve PC', 'anayol'], ['ch1', 'Harvard mimarisi, RISC', 'tipler']], builds: 'Bölüm 1\'deki genel CPU modelini <b>PIC16F877A\'nın gerçek parçalarına</b> eşleyeceksin: Harvard → ayrı 14 bitlik program ve 8 bitlik veri belleği; RISC → 35 komut; PC → 13 bit; ALU → W + STATUS bayrakları. Yeni olan: <b>bank yapısı</b> ve assembly.' },
      links: [['ch1', '<b>Harvard (B1) → iki ayrı bellek (B2):</b> komutlar 14 bitlik Flash\'tan, veriler 8 bitlik RAM\'den gelir. Komut kelimesinin 14 bit olması, adres alanını 7 bitle sınırlar → bank yapısının sebebi budur.'], ['ch1', '<b>Makine döngüsü (B1) → assembly (B2):</b> MOVLW 0x34 tam olarak fetch-decode-execute ile işlenir; opcode\'u (3034h) gördüğün komut kaydedicisi Bölüm 1\'deki IR\'dir.'], ['ch1', '<b>RISC (B1) → 35 komut (B2):</b> komutlar basit olduğu için "if" gibi yapılar birkaç komutla (BTFSS + GOTO) kurulur.']],
      next: '<b>Bölüm 3</b> RAM haritasında gördüğün TRISx ve PORTx kaydedicilerinin <b>pine bağlı donanımını</b> açar: bir bite 0/1 yazmak transistörleri nasıl açıp kapatır, giriş pini neden Schmitt tetikleyicili ve pull-up/down gerektirir.',
      questions: [
        { q: 'Bölüm 1 (Harvard, 14 bit komut) ve Bölüm 2 (bank) bilgilerini birleştir: "MOVWF TRISB" komutu neden bank seçimi gerektirir?', a: 'Harvard yapısında komutlar 14 bitlik kelimelerdir; byte tabanlı komutta 6 bit opcode ve 1 bit d\'den sonra adres için 7 bit kalır (128 adres). TRISB 86h\'dedir; 7 bit yalnızca 06h ofsetini taşır. Hangi 128\'lik bölgenin (bankın) kastedildiğini STATUS\'taki RP1:RP0 söyler; Bank 1 seçilmezse yazma 06h = PORTB\'ye gider.' },
        { q: 'Makine döngüsünü (B1) kullanarak açıkla: 4 MHz\'te "MOVLW 0x34 · ADDLW 0x06 · MOVWF PORTB" üç komutu kaç µs sürer ve STATUS\'ta hangi bayraklar oluşur?', a: 'Her komut 4 saat darbesi = 1 µs → 3 µs. 34h + 06h = 3Ah: sonuç 0 değil (Z=0), 7. bitten taşma yok (C=0), alt nibble 4 + 6 = Ah ≤ Fh → elde yok (DC=0). MOVLW ve MOVWF bayrakları etkilemez; bayrakları ADDLW belirler.' }
      ]
    },
    ch3: {
      intro: { uses: [['ch2', 'TRISx / PORTx kaydedicileri ve adresleri', 'bellek'], ['ch2', 'Bank seçimi', 'asmornek']], builds: 'Bölüm 2\'de TRISB ve PORTB\'yi RAM haritasında birer <b>adres</b> olarak gördün. Şimdi o bitlerin pinde neye dönüştüğünü öğreneceksin: <b>yön</b> (TRIS), <b>seviye</b> (PORT), çıkış katı (totem pole/açık drain) ve giriş katı (Schmitt, pull-up/down, debounce).' },
      links: [['ch2', '<b>Bank (B2) → TRIS (B3):</b> TRISx Bank 1\'de, PORTx Bank 0\'da. Assembly\'de bank değiştirmen gerekir; C\'de derleyici yapar.'], ['ch2', '<b>Bit komutları (B2) → tek pin (B3):</b> BSF PORTB,3 yalnızca RB3\'ü 1 yapar; C\'deki PORTB.F3 = 1 bu komuta derlenir.'], ['ch1', '<b>G/Ç birimi (B1) → portlar (B3):</b> mikrodenetleyicinin 3. temel parçası budur; 33 pin, 5 port.']],
      next: '<b>Bölüm 4</b> bu kaydedicilere artık assembly değil <b>C ile</b> yazmayı öğretir: veri tipleri, operatörler (özellikle bit operatörleri) ve derleyicinin senin yerine yaptıkları (bank seçimi, .hex üretimi).',
      questions: [
        { q: 'B2 ve B3\'ü birleştir: TRISB = 0xF0 yapmak için assembly\'de hangi adımlar gerekir ve sonuçta hangi pinler LED, hangileri buton için kullanılabilir?', a: 'BSF STATUS,RP0 (Bank 1) · MOVLW 0xF0 · MOVWF TRISB · BCF STATUS,RP0 (Bank 0). 0xF0 = 1111 0000: RB7–RB4 giriş (buton), RB3–RB0 çıkış (LED).' },
        { q: 'Pull-down bağlı bir buton RB0\'a bağlı. B3\'teki bilgiye göre basınca ne okunur ve bu, B2\'deki STATUS bayraklarıyla değil hangi kaydediciyle okunur?', a: 'Pull-down: basınca 5 V → 1 okunur. Okuma PORTB kaydedicisinin 0. bitinden yapılır (C\'de PORTB.F0, assembly\'de BTFSS PORTB,0). TRISB\'nin 0. biti 1 (giriş) olmalı.' }
      ]
    },
    ch4: {
      intro: { uses: [['ch1', 'Derleyici / assembler farkı', 'programlama'], ['ch2', 'RAM adresleri ve GPR alanı', 'bellek'], ['ch2', 'Assembly komutları', 'asm']], builds: 'Şimdiye kadar donanımı ve assembly\'yi gördün. Bu bölüm <b>C ile mikroC\'de</b> program yazmayı ekler: C satırlarının hangi assembly\'ye dönüştüğünü, değişkenlerin <b>RAM\'de kaç bayt kapladığını ve hangi adrese düştüğünü</b>, bit operatörleriyle tek pinlerin nasıl kontrol edildiğini.' },
      links: [['ch1', '<b>Derleyici (B1) → .asm ve .lst (B4):</b> slayt 3\'te C ve assembly yan yana; derleyicinin "önce assembly\'ye çevirir" cümlesinin somut hali.'], ['ch2', '<b>GPR alanı (B2) → absolute (B4):</b> absolute ile adres verirken o adresin genel amaçlı olduğundan ve çok baytlı tiplerin komşu adresleri de kapladığından emin olmalısın (Uygulama 2, slayt 12).'], ['ch2', '<b>W ve 8 bit ALU (B2) → tipler (B4):</b> 8 bitlik işlemcide int (2 B) ve long (4 B) işlemleri birden çok komutla yapılır; .lst\'de _i ve _i+1 olarak görünür.'], ['ch3', '<b>TRIS/PORT (B3) → C operatörleri (B4):</b> |, &, ^, ~ ile tek pin set/clear/toggle edilir.']],
      next: '<b>Bölüm 5</b> bu C bilgisini <b>port uygulamalarına</b> döker: döngüler, kaydırma (<<, >>) ve XOR ile LED desenleri, if ile buton okuma. Hocanın Uygulama 4–14\'ü.',
      questions: [
        { q: 'B2 + B4: "int sayac absolute 0x6F;" tanımı neden sorunlu olabilir? (İpucu: int kaç bayt, 70h–7Fh nedir?)', a: 'int 2 bayttır: 6Fh ve 70h\'yi kaplar. 6Fh Bank 0\'ın normal GPR alanının sonu, 70h ise tüm banklardan erişilen ortak alanın başıdır. Yine GPR\'dir ama değişken iki farklı bölgeye yayılır; başka bir değişken 70h\'ye absolute ile konursa çakışır. Genel kural: çok baytlı değişkenin kapladığı tüm adresler boş ve GPR olmalı.' },
        { q: 'B2 (STATUS) + B4 (tipler): unsigned char x = 200; x = x + 100; işleminden sonra x kaç olur, ALU\'da hangi bayrak kurulur?', a: '300 8 bite sığmaz: 300 − 256 = 44 → x = 44. Toplama 7. bitten taştığı için C = 1.' }
      ]
    },
    ch5: {
      intro: { uses: [['ch3', 'TRIS ve PORT hesabı', 'tris'], ['ch3', 'Pull-down, debounce', 'giris'], ['ch4', '<<, >>, ^ operatörleri', 'operator'], ['ch4', 'Veri tipleri (char 8 bit)', 'tipler']], builds: 'Üç bölümü tek programda birleştiriyorsun: TRIS ile yön (B3), C döngü ve operatörleriyle desen (B4), PORTB\'ye yazma. Yeni olan: <b>desen → sayı dizisi → döngü</b> düşünme yöntemi ve <b>polling</b> ile buton okuma.' },
      links: [['ch3', '<b>TRIS (B3) → her programın ilk satırı (B5):</b> çıkış için TRISB = 0, buton için ilgili TRIS biti 1.'], ['ch4', '<b>Tip boyutu (B4) → taşma (B5):</b> PORTB 8 bit; 128<<1 = 256 sığmaz, 0 olur. Uygulama 6\'da i<7 olmasının sebebi.'], ['ch4', '<b>Bit operatörleri (B4) → desenler (B5):</b> <<, >> kayan ışık; ×2+1 doldurma; ^ çapraz geçiş.'], ['ch3', '<b>Pull-down (B3) → if(PORTD.F0==1) (B5):</b> basılı = 1 okunur; debounce gerekirse Delay_ms(10).']],
      next: '<b>Bölüm 6</b> polling\'in zayıf yanını (Uygulama 13: gecikme sırasında buton okunmuyor) çözer: <b>kesmeler</b>. Buton artık döngüde yoklanmaz; olay olunca donanım CPU\'yu durdurup haber verir.',
      questions: [
        { q: 'B3 + B4 + B5: RB4–RB7\'ye LED, RD0\'a pull-down buton bağlı. Butona basılıyken üst 4 LED\'in yanıp söndüğü (500 ms), bırakınca söndüğü programı yaz.', a: 'TRISB = 0x0F (üst 4 çıkış; alt 4 kullanılmıyor, giriş kalabilir) veya 0x00; TRISD = 0x01. while(1){ if(PORTD.F0==1){ PORTB = 0xF0; Delay_ms(500); PORTB = 0; Delay_ms(500); } else PORTB = 0; }' },
        { q: 'B2 + B5: Uygulama 6\'daki "PORTB = PORTB << 1" satırı hocanın .lst dosyasında RLF ve BCF komutlarına derlenmiş. BCF neden gerekiyor? (İpucu: RLF, C bayrağını en sağa sokar.)', a: 'RLF (rotate left through carry) bitleri sola kaydırırken C bayrağındaki değeri 0. bite sokar. C\'deki << ise sağdan 0 girmesini ister; derleyici bu yüzden kaydırmadan sonra 0. biti BCF ile temizler.' }
      ]
    },
    ch6: {
      intro: { uses: [['ch5', 'Polling ve dezavantajı', 'giris'], ['ch2', 'Program belleği: 0004h, 8 seviyeli yığın', 'bellek'], ['ch5', 'Fonksiyon çağrısı ve dönüş adresi', 'fonksiyon'], ['ch3', 'RB0/INT pini', 'portlar']], builds: 'Fonksiyon çağrısını (B5) biliyorsun: dönüş adresi yığına yazılır. <b>Kesme, donanımın programın ortasında kendiliğinden yaptığı bir fonksiyon çağrısıdır</b>: adresi 0004h\'te (B2), tetikleyicisi bir olay (RB0, Timer, ADC). Yeni olan: izin/bayrak bitleri (INTCON) ve bayrağı yazılımla silme zorunluluğu.' },
      links: [['ch5', '<b>Polling (B5) → kesme (B6):</b> aynı buton görevi; Uygulama 11 sürekli yoklar, Deney 4 donanımın haber vermesini bekler.'], ['ch5', '<b>Fonksiyon çağrısı (B5) → kesme (B6):</b> ikisinde de dönüş adresi 8 seviyeli yığına yazılır; farkı: kesmeyi donanım başlatır ve RETURN yerine RETFIE kullanılır (GIE = 1).'], ['ch2', '<b>Bellek haritası (B2) → INTCON (B6):</b> INTCON tüm banklarda yansıtılır (0Bh, 8Bh…): kesme içinde bank ne olursa olsun erişilir. 0004h kesme vektörü program belleğindedir.'], ['ch2', '<b>STATUS (B2) → bağlam saklama (B6):</b> ISR ana programın Z/C bayraklarını bozabilir; bu yüzden W ve STATUS saklanıp geri yüklenir.']],
      next: '<b>Bölüm 7</b> en önemli dahili kesme kaynağını açar: <b>Timer0</b>. "Kesme ne zaman gelsin?" sorusunu artık bir sayaç ve ön ölçekleyiciyle sen ayarlayacaksın; kesme içinde pin değilleyerek kare dalga üreteceksin.',
      questions: [
        { q: 'B5 + B6: Uygulama 13\'ü (buton basılıyken 1 s yak-söndür) kesmeyle yazsaydın ne değişirdi? Butona basma anı neden kaçmazdı?', a: 'Buton RB0/INT\'e bağlanır, INTE ve GIE açılır. Basış anında (kenar) donanım INTF\'yi kurar ve o an Delay_ms çalışıyor olsa bile CPU kesmeye gider. Polling\'de ise buton yalnızca if satırına gelindiğinde okunduğu için gecikme sırasında olan değişiklik geç fark edilir.' },
        { q: 'B2 + B6: Kesme içinde 7 iç içe fonksiyon çağrısı olan bir program, ana programda 2 seviye derindeyken kesme alırsa ne olur?', a: 'Yığın 8 seviyelidir. Ana programın 2 seviyesi + kesmenin dönüş adresi 1 + ISR\'deki 7 çağrı = 10 > 8: en eski dönüş adresleri üzerine yazılır, dönüşte program yanlış adrese gider (çöker).' }
      ]
    },
    ch7: {
      intro: { uses: [['ch6', 'INTCON: GIE, TMR0IE, TMR0IF; ISR', 'intcon'], ['ch1', 'Makine döngüsü = saat darbeleri', 'cpu'], ['ch4', 'Bit operatörü ~ (değilleme)', 'operator'], ['ch2', 'OPTION_REG\'in RAM\'deki yeri (81h)', 'bellek']], builds: 'Kesmeyi biliyorsun (B6). Şimdi kesmenin <b>ne zaman</b> geleceğini sen belirliyorsun: komut döngüsünü (B1: 4 saat darbesi) sayan bir sayaç, onu bölen bir ön ölçekleyici ve taşma anında kurulan TMR0IF. Yeni olan: <b>TMR = 256 − G·F/(P·4)</b> hesabı ve kare dalga frekansı.' },
      links: [['ch1', '<b>Makine döngüsü (B1) → ×4 (B7):</b> formüldeki 4, bir komutun 4 saat darbesi sürmesinden gelir.'], ['ch6', '<b>INTCON (B6) → Timer0 kesmesi (B7):</b> INTCON = 0xA0 = GIE + TMR0IE. ISR\'de TMR0IF silinmezse Deney 4\'teki INTF hatasının aynısı olur.'], ['ch4', '<b>~ operatörü (B4) → kare dalga (B7):</b> PORTB.F0 = ~PORTB.F0 her kesmede pini terslerken periyot = 2 × kesme aralığı.'], ['ch3', '<b>RA4/T0CKI (B3) → sayaç modu (B7):</b> T0CS = 1 olunca Timer0 bu pindeki dış darbeleri sayar.']],
      next: '<b>Bölüm 8</b> (hafta 7) port bilgisini bir göstergeye bağlar: <b>7 segment display</b>. PORTB\'ye yazılan sayının her biti bir segmenti yakar; çok haneli göstergede haneler sırayla birkaç ms yakılır (multiplexing). Ardından <b>Bölüm 9</b> ADC\'yi ekler.',
      questions: [
        { q: 'B1 + B6 + B7: 4 MHz\'te ISR\'ye girip bağlamı saklamak 12 komut sürüyorsa Uygulama 15\'in kare dalgası tam 500 Hz olur mu? Nasıl düzeltirsin?', a: 'Olmaz. Taşmadan TMR0 = 6 yazılana kadar ~12 µs geçer; bu sürede sayılan değer TMR0 yeniden yazılınca kaybolur, her yarım periyot ~1,012 ms olur → ~494 Hz. Düzeltme: TMR0\'a 6 yerine kayıp döngüleri telafi eden daha büyük değer yazmak (prescale 1:4 için ~3 artış → TMR0 = 9) ya da TMR0 += 6 gibi o anki değere ekleyerek yüklemek.' },
        { q: 'B2 + B7: OPTION_REG = 1 yazınca PORTB\'deki butonlar için ne değişir? (İpucu: bit 7.)', a: 'Bit 7 RBPU = 0 olur → PORTB\'nin dahili pull-up dirençleri açılır. Girişe ayarlı PORTB pinleri buton basılı değilken 1 okunur (pull-up). Uygulama 15\'te PORTB çıkış olduğu için etkisi yok, ama aynı projede PORTB\'ye pull-down butonlar bağlanırsa okuma mantığı değişir.' }
      ]
    },
    ch8: {
      intro: { uses: [['ch3', 'TRIS / PORT: bir bitin pinde 5 V ya da 0 V olması', 'tris'], ['ch4', '/, %, <<, ~ operatörleri ve diziler', 'operator'], ['ch5', 'Buton okuma (polling) ve LED desenleri', 'giris'], ['ch7', 'Gecikme ve Timer kesmesi', 'kod']], builds: 'Şimdiye kadar PORTB\'nin her biti tek bir LED\'i yakıyordu (B5). 7 segment göstergede aynı 8 bit <b>birlikte bir rakam</b> çizer: sayı → bit deseni → pin gerilimleri → yanan segmentler. Yeni olan: ortak anot/katot, BCD sürücü, sayıyı basamaklara ayırma ve haneleri sırayla yakma (multiplexing).' },
      links: [['ch3', '<b>PORT çıkışı (B3) → segment (B8):</b> PORTB\'ye 1 yazmak pini 5 V yapar; ortak katotlu göstergede o segmentten akım geçer.'], ['ch4', '<b>~ operatörü (B4) → ortak anot (B8):</b> aynı bağlantıda ortak anot kodu ortak katot kodunun bit bit tersidir.'], ['ch4', '<b>/ ve % (B4) → basamaklar (B8):</b> sayac/10 onlar, sayac%10 birler; ×16 = <<4 üst 4 bite taşır.'], ['ch5', '<b>Buton (B5) → sayaç (B8):</b> Uygulama 24–26 Uygulama 11\'deki if(PORTD.F0==1) kalıbını kullanır; Uygulama 26 bir de önceki durumu (pd) tutar.'], ['ch7', '<b>Timer (B7) → tarama (B8):</b> multiplexing\'de her hanenin süresi Delay_ms(1) ile; Timer0 kesmesiyle yapılırsa buton gecikmesinde titreme olmaz.']],
      next: '<b>Bölüm 9</b> ADC\'dir; sunumu önce "hafta 7" adıyla paylaşıldı ama derste henüz işlenmedi. Vizeye kadar asıl iş: <b>Vize kampı</b>ndaki kod yazma soruları ve hesap alıştırmaları.',
      questions: [
        { q: 'B4 + B8: Uygulama 25\'te sayac signed int yerine unsigned char tanımlansaydı aşağı butonuyla 0\'dan aşağı inince ne olurdu?', a: 'unsigned char 0 − 1 = 255 olur; if(sayac<0) hiç doğru olmaz. sayac>99 kontrolü yalnızca yukarı butonunda var, bu yüzden sayac 255\'te kalır: onlar = 25, ×16 = 400 → 8 bite sığmaz (0x90), birler 5 → PORTB = 0x95: göstergede anlamsız "95". Doğru tip signed int.' },
        { q: 'B5 + B7 + B8: 4 haneli multiplexing taramasını Timer0 kesmesine taşımak istiyorsun (4 MHz). 1 ms\'lik kesme için ayar ne olur, ISR\'de ne yapılır?', a: 'OPTION_REG = 1 (1:4), TMR0 = 6, INTCON = 0xA0. ISR: TMR0 = 6; sıradaki haneyi seç (PORTC), o hanenin basamağını PORTB\'ye yaz, hane sayacını 0→1→2→3→0 artır; TMR0IF = 0. Ana döngü yalnızca butonları okur; Delay_ms(100) sırasında bile tarama sürer, titreme olmaz.' }
      ]
    },
    ch9: {
      intro: { uses: [['ch6', 'PEIE ve çevresel kesmeler', 'intcon'], ['ch7', 'Osilatörden türetilen saat, × bölen hesabı', 'hesap'], ['ch3', 'PORTA/PORTE analog pinleri', 'portlar'], ['ch4', 'Tipler: 10 bit sonuç int/float\'a', 'tipler']], builds: 'Şimdiye kadar pinler yalnızca 0 ya da 1 idi (B3). ADC ile bir pinin <b>gerilimini sayıya</b> çevireceksin. Kurulum kalıbı Timer0\'la aynı: kaydedicileri ayarla (ADCON0/1), kesme izinlerini aç (PEIE dahil, B6), olay olunca bayrağı sil (ADIF). Yeni olan: Nyquist, çözünürlük ve 10 bitin iki kaydediciye yerleşimi.' },
      links: [['ch3', '<b>Dijital giriş (B3) → analog giriş (B9):</b> PCFG bitleri bir pinin Schmitt\'li dijital giriş mi analog giriş mi olacağını seçer; analog pin yine TRIS ile giriş yapılmalı.'], ['ch6', '<b>Çevresel kesme (B6) → ADC kesmesi (B9):</b> GIE + PEIE + ADIE; ISR\'de ADIF silinir.'], ['ch7', '<b>Saat bölme (B7) → T_AD (B9):</b> Timer\'da F_OSC/4 bölünüyordu; ADC\'de F_OSC 2…64\'e bölünür ve T_AD ≥ 1,6 µs olmalı.'], ['ch4', '<b>Tipler (B4) → ölçekleme (B9):</b> 10 bitlik sonuç (0–1023) 8 bitlik PORTB\'ye ya ADRESH (sola yaslı, /4) ya da × 0,249 ile sığdırılır.']],
      next: 'Vize kapsamının sonu. Şimdi <b>Hocanın soruları</b> sayfasında kart moduyla karışık tekrar yap ve Laboratuvar araçlarındaki alıştırmaları her gün birkaç tur çöz: aralıklı ve karışık tekrar, tek seferlik uzun çalışmadan daha kalıcıdır.',
      questions: [
        { q: 'B6 + B7 + B9: Timer0 kesmesi ile ADC kesmesini aynı programda açarsan ISR kaynağı nasıl anlar? İzin bitleri ne olmalı?', a: 'İki kesme de 0004h\'e gelir. ISR içinde if(INTCON.TMR0IF) { … TMR0IF = 0; } ve if(PIR1.ADIF) { … ADIF = 0; } ile bayraklara bakılır. İzinler: GIE = 1, TMR0IE = 1 (INTCON), PEIE = 1 ve PIE1.ADIE = 1.' },
        { q: 'B7 + B9: 1 kHz\'e kadar bileşen içeren bir sinyali Timer0 ile düzenli aralıklarla örneklemek istiyorsun (4 MHz). Örnekleme aralığı en fazla kaç µs olmalı ve Timer0 ayarı ne olabilir?', a: 'Nyquist: f_s ≥ 2 kHz → aralık ≤ 500 µs. 4 MHz\'te 500 µs: 500 / (P × 1 µs) → P = 2 ile 250 → TMR0 = 6 (OPTION_REG = 0). Her Timer0 kesmesinde GO = 1 yapılarak çevrim başlatılır (pratikte biraz daha sık örneklemek daha iyidir).' }
      ]
    }
  };
})(window.MC);
