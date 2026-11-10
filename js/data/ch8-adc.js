/*
 * ch8-adc.js — Bölüm 8: Analog-sayısal çevrim (ADC).
 * Kaynak: hafta 7 sunumu slayt 1–21, Uygulama 19–20, PIC16F877A veri sayfası (bölüm 11).
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch8',
    num: 8,
    title: 'Analog-Sayısal Çevrim (ADC)',
    short: 'ADC',
    navSub: 'Nyquist, çözünürlük, ADCON0/1',
    week: 'Hafta 7',
    source: 'Hafta 7 sunumu, slayt 1–21 · Uygulama 19–20',
    objectives: [
      'Analog ve dijital sinyali, örneklemeyi ve nicemlemeyi açıklamak',
      'Nyquist şartını uygulayıp minimum örnekleme frekansını bulmak',
      'n bitlik ADC\'nin çözünürlüğünü, 1 bitlik gerilim adımını ve verilen gerilim için çıkışı hesaplamak',
      'PIC16F877A ADC modülünün kaydedicilerini (ADCON0, ADCON1, ADRESH/L, PIE1, PIR1) açıklamak',
      'ADC\'yi çalıştırma adımlarını ve T<sub>AD</sub> şartını söylemek',
      'Uygulama 19 ve 20\'yi satır satır açıklamak'
    ],
    outline: {
      topics: [['Sinyaller, örnekleme ve Nyquist', 'ornekleme'], ['Çözünürlük ve ADC hesabı', 'cozunurluk'], ['PIC16F877A ADC modülü ve kaydedicileri', 'modul'], ['ADC\'yi çalıştırma adımları ve T<sub>AD</sub> (çevrim saati)', 'calistirma'], ['Örnek kodlar: Uygulama 19 ve 20', 'kod']],
      concepts: ['Sürekli / ayrık zamanlı sinyal', 'Örnekleme', 'Nicemleme (quantization)', 'f<sub>s</sub> ≥ 2·f<sub>max</sub>', 'Nyquist değeri / frekansı', 'Örtüşme (aliasing)', 'Çözünürlük 2ⁿ', '1 bit = (V<sub>REF+</sub> − V<sub>REF−</sub>)/2ⁿ', 'ADCON0: ADON, CHS, GO/DONE', 'ADCON1: ADFM, PCFG', 'ADRESH / ADRESL', 'ADIF / ADIE', 'T<sub>AD</sub> ≥ 1,6 µs', '12 T<sub>AD</sub>', 'Polling / kesme ile okuma'],
      why: 'ADC hesabı (3,25 V örneği) ve Nyquist sorusu kısa hesap sorusu olarak çok uygun. Kaydedici değerlerinin (0x4E, 0x45) çözümü de kod okuma sorusu.'
    },
    lessons: [
      {
        id: 'ornekleme',
        title: 'Sinyaller, Örnekleme ve Nyquist',
        src: 'slayt 2–4',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'Sinyaller ikiye ayrılır: <b>sürekli zamanlı</b> ve <b>ayrık zamanlı</b>. Analog sinyaller sürekli zamanlı, dijital sinyaller ayrık zamanlı olarak kategorize edilir.' },
          { t: 'def', term: 'Analog-dijital dönüşüm', html: 'Analog sinyalin <b>örnekleme</b> yoluyla sayısala çevrilmesi ve alınan her örneğin ölçeklendirilip bitlere atanması (<b>nicemleme, quantization</b>).' },
          { t: 'def', term: 'ADC', en: 'A/D, A-D, A-to-D', html: 'Analog sinyali (ses, ışık, sıcaklık vb.) sayısal sinyale çeviren donanımların genel adı.' },
          { t: 'h', text: 'Doğru çevrim için iki şart (slayt 3)' },
          { t: 'list', ordered: true, items: ['Sinyalin <b>bant genişliği belirlenmeli</b>: frekans spektrumu (tayfı) olabilecek maksimum bir frekans aralığında sınırlanmalı', 'Örnekleme frekansı f<sub>s</sub> için <b>f<sub>s</sub> ≥ 2·f<sub>max</sub></b> sağlanmalı'] },
          { t: 'def', term: 'Nyquist', html: 'Minimum örnekleme frekansı <b>f<sub>s</sub> = 2·f<sub>max</sub></b>: buna <b>Nyquist değeri</b> denir. Herhangi bir f<sub>s</sub> değerinde <b>f<sub>s</sub>/2</b>\'ye karşılık gelen değere <b>Nyquist frekansı</b> denir.' },
          { t: 'dg', id: 'sampling' },
          { t: 'solve', title: 'Slayt 3 örneği', q: 'Frekansı 1 kHz olan bir sinyalin doğru şekilde sayısala çevrilebilmesi için minimum hangi örnekleme frekansı kullanılmalıdır?', a: '<p>f<sub>s</sub> = 2 × f<sub>max</sub> = 2 × 1 kHz = <b>2 kHz</b>.</p>' },
          { t: 'note', kind: 'extra', html: 'Şart sağlanmazsa yüksek frekanslı sinyal örneklerde daha düşük frekanslı bir sinyal gibi görünür: <b>örtüşme (aliasing)</b>. Pratikte f<sub>s</sub> 2·f<sub>max</sub>\'tan biraz yüksek seçilir (ör. ses için 20 kHz → 44,1 kHz).' }
        ],
        checks: [
          { q: 'Nyquist değeri ve Nyquist frekansı nedir?', a: 'Nyquist değeri: minimum örnekleme frekansı f_s = 2·f_max. Nyquist frekansı: herhangi bir örnekleme frekansı f_s için f_s/2 değeri.' },
          { q: 'En yüksek frekansı 4 kHz olan bir ses sinyali için minimum örnekleme frekansı nedir?', a: '2 × 4 kHz = 8 kHz.' },
          { q: 'Analog-dijital dönüşümün iki aşaması nedir?', a: 'Örnekleme (sinyalden belirli aralıklarla değer alma) ve nicemleme (her örneği ölçeklendirip bitlere atama).' }
        ]
      },
      {
        id: 'cozunurluk',
        title: 'Çözünürlük ve ADC Hesabı',
        src: 'slayt 5–6',
        minutes: 9,
        blocks: [
          { t: 'def', term: 'Çözünürlük', en: 'Resolution', html: 'n bitlik bir ADC\'nin analog sinyali maksimum kaç parçaya ayıracağını ifade eder: <b>2<sup>n</sup></b>. Aynı zamanda ADC\'nin yakalayabileceği (ölçebileceği) <b>en küçük gerilim değişimidir</b>.' },
          { t: 'list', items: [
            '10 bitlik ADC: 2<sup>10</sup> = <b>1024</b> çözünürlük → en iyi çözünürlük 1/1024 = tam skalanın <b>%0,0976</b>\'sı',
            'ADC çıkışındaki ikili sayı, analog gerilim seviyesini ifade eder',
            'Yüksek çözünürlük = daha hassas ölçüm. 10 V genlikli sinyal: <b>8 bit</b> ADC ile 10/256 ≈ <b>39 mV</b>, <b>14 bit</b> ADC ile 10/16384 ≈ <b>610 µV</b>\'luk değişim algılanır'
          ] },
          { t: 'h', text: 'Hesap (slayt 6)' },
          { t: 'def', term: 'Formüller', html: '<b>1 bit = (V<sub>REF+</sub> − V<sub>REF−</sub>) / 2<sup>n</sup></b><br><b>ADC çıkışı = (V<sub>IN</sub> − V<sub>REF−</sub>) / 1 bit</b> (tam kısmı)' },
          { t: 'solve', title: 'Slayt 6 örneği', q: '10 bitlik bir ADC girişinde 3,25 V varsa ADC çıkışındaki değer nedir? (V<sub>REF+</sub> = 5 V, V<sub>REF−</sub> = GND)', a: '<p>1 bit = (5 − 0) / 2<sup>10</sup> = 5 / 1024 = <b>4,882 mV</b></p><p>ADC çıkışı = 3250 mV / 4,882 mV = 665,71 → <b>665</b> = <b>(1010011001)₂</b> = 299h</p>' },
          { t: 'dg', id: 'adccalc', vin: 3.25 },
          { t: 'dg', id: 'quiz', types: ['adc', 'nyq'] }
        ],
        checks: [
          { q: '10 bitlik, 5 V referanslı bir ADC\'nin 1 bitlik adımı kaç mV\'tur?', a: '5 V / 1024 = 4,882 mV.' },
          { q: '8 bitlik ADC ile 10 V genlikli sinyalde algılanabilen en küçük değişim nedir?', a: '10 V / 256 ≈ 39 mV.' },
          { q: '10 bit, V_REF = 5 V ADC\'nin girişinde 2,5 V varsa çıkış kaçtır?', a: '2500 / 4,882 = 512,1 → 512 = 10 0000 0000₂ (tam skalanın yarısı).' }
        ]
      },
      {
        id: 'modul',
        title: 'PIC16F877A ADC Modülü ve Kaydedicileri',
        src: 'slayt 7–14',
        minutes: 11,
        blocks: [
          { t: 'list', items: ['<b>10 bit, 8 kanal</b> ADC modülü (AN0–AN7)', 'Referans girişleri <b>VDD, VSS</b> veya <b>RA2, RA3</b> (V<sub>REF−</sub>, V<sub>REF+</sub>) olarak ayarlanabilir', '<b>Uyku modundayken</b> de ADC modülünden veri okunabilir (dahili RC saatiyle)'] },
          { t: 'h', text: 'İlgili kaydediciler' },
          { t: 'table', head: ['Kaydedici', 'Görevi'], rows: [
            ['<b>ADCON0</b> (1Fh)', 'Yalnızca ADC ile ilgili: modülün <b>enerjilendirilmesi</b> (ADON), <b>kanal seçimi</b> (CHS2:0), <b>örnekleme hızı</b> (ADCS1:0), çevrimi başlatma (GO/DONE)'],
            ['<b>ADCON1</b> (9Fh)', 'PORTA ve PORTE bacaklarının <b>analog mu sayısal mı</b> olacağı (PCFG3:0), çevrim saatinin üst biti (ADCS2), sonucun <b>sağa/sola yaslı</b> alınması (ADFM)'],
            ['<b>ADRESH, ADRESL</b>', 'Çevrim sonucu elde edilen sayısal bilginin tutulduğu kaydediciler (10 bit, 2 bayta yayılır)'],
            ['<b>PIE1</b> bit 6 <b>ADIE</b>', '1 = ADC kesmesi açık, 0 = kapalı'],
            ['<b>PIR1</b> bit 6 <b>ADIF</b>', '1 = A/D çevrim tamamlandı, 0 = tamamlanmadı'],
            ['<b>INTCON</b>', 'ADC kesmesi için <b>GIE</b> ve <b>PEIE</b> 1 olmalı'],
            ['<b>TRISA, PORTA, TRISE, PORTE</b>', '8 analog girişin <b>5\'i A portunda, 3\'ü E portunda</b>: analog sinyal uygulanacak bacaklar <b>giriş</b> olarak ayarlanmalı']
          ] },
          { t: 'note', kind: 'fix', html: 'Slayt 10\'da "INTCON\'da GIE ve <b>PIE</b> aktif yapılmalı" yazıyor; INTCON\'daki bitin adı <b>PEIE</b>\'dir (peripheral interrupt enable). PIE1 ayrı bir kaydedicidir.' },
          { t: 'h', text: 'ADCON0' },
          { t: 'dg', id: 'reg', reg: 'ADCON0', value: 0x45 },
          { t: 'h', text: 'ADCON1' },
          { t: 'dg', id: 'reg', reg: 'ADCON1', value: 0x4e },
          { t: 'h', text: 'Sağa ve sola yaslı sonuç (ADFM)' },
          { t: 'p', html: '10 bitlik sonuç 16 bitlik ADRESH:ADRESL çiftine iki şekilde yerleşir. ADFM\'yi değiştir:' },
          { t: 'dg', id: 'adccalc', vin: 3.25, title: 'ADRESH / ADRESL yerleşimi' },
          { t: 'note', kind: 'exam', html: '<b>Sola yaslı (ADFM = 0):</b> ADRESH = üst 8 bit. Yalnızca ADRESH okunursa 8 bitlik sonuç elde edilir (sonuç / 4). <b>Sağa yaslı (ADFM = 1):</b> 10 bitin tamamı = ADRESH (alt 2 biti) × 256 + ADRESL.' }
        ],
        checks: [
          { q: 'ADCON0 ve ADCON1 kaydedicilerinde hangi ayarlar yapılır?', a: 'ADCON0: modülü açma (ADON), kanal seçimi (CHS2:0), çevrim saati (ADCS1:0), çevrimi başlatma (GO/DONE). ADCON1: A ve E portu pinlerinin analog/dijital ayarı ve referanslar (PCFG3:0), çevrim saatinin üst biti (ADCS2), sonucun sağa/sola yaslı olması (ADFM).' },
          { q: 'PIC16F877A\'da 8 analog girişin kaçı hangi portta?', a: '5\'i A portunda (AN0–AN4), 3\'ü E portunda (AN5–AN7).' },
          { q: 'ADIF ve ADIE bitleri hangi kaydedicilerdedir, anlamları nedir?', a: 'ADIF: PIR1 bit 6, A/D çevrim tamamlandı bayrağı. ADIE: PIE1 bit 6, A/D kesme izni.' }
        ]
      },
      {
        id: 'calistirma',
        title: 'ADC\'yi Çalıştırma Adımları ve TAD',
        src: 'slayt 15–18',
        minutes: 8,
        blocks: [
          { t: 'list', ordered: true, items: [
            '<b>A/D modülü konfigüre edilir:</b> ADCON1\'den analog/sayısal girişler ve referanslar; ADCON0\'dan kanal seçimi ve çevrim saati; modül açılır (ADON = 1)',
            '<b>A/D kesmeleri ayarlanır</b> (istenirse): ADIF = 0, ADIE = 1, PEIE = 1, GIE = 1',
            'Gerekli <b>veri toplama (acquisition) zamanı</b> kadar beklenir',
            '<b>Çevrim başlatılır:</b> ADCON0\'daki GO/DONE = 1',
            '<b>Çevrimin bitmesi beklenir:</b> kesme açık değilse GO/DONE bir döngüde sürekli kontrol edilir (<b>polling</b>; bitince donanım 0 yapar). Kesme açıksa çevrim bitince ADIF = 1 olur ve doğrudan kesme alt programına gidilir',
            '<b>Sonuç ADRESH ve ADRESL\'den okunur</b>; gerekiyorsa ADIF silinir'
          ] },
          { t: 'h', text: 'A/D çevrim saati: T<sub>AD</sub> (slayt 18)' },
          { t: 'list', items: ['1 bit için geçen çevrim süresi <b>T<sub>AD</sub></b> olarak ifade edilir.', '10 bitlik çevrim <b>minimum 12 T<sub>AD</sub></b> sürer.', 'Çevrim saati yazılımla seçilir: <b>7 farklı seçim</b> (2, 4, 8, 16, 32, 64 T<sub>OSC</sub> ve dahili RC).', '<b>Minimum T<sub>AD</sub> = 1,6 µs</b> garanti edilmelidir.'] },
          { t: 'table', head: ['ADCS2:ADCS1:ADCS0', 'Çevrim saati', 'T<sub>AD</sub> @ 4 MHz', 'T<sub>AD</sub> @ 8 MHz', 'T<sub>AD</sub> @ 20 MHz'], rows: [
            ['000', '2 T<sub>OSC</sub>', '0,5 µs ✗', '0,25 µs ✗', '0,1 µs ✗'],
            ['100', '4 T<sub>OSC</sub>', '1 µs ✗', '0,5 µs ✗', '0,2 µs ✗'],
            ['001', '8 T<sub>OSC</sub>', '<b>2 µs ✓</b>', '1 µs ✗', '0,4 µs ✗'],
            ['101', '16 T<sub>OSC</sub>', '4 µs ✓', '<b>2 µs ✓</b>', '0,8 µs ✗'],
            ['010', '32 T<sub>OSC</sub>', '8 µs ✓', '4 µs ✓', '<b>1,6 µs ✓</b>'],
            ['110', '64 T<sub>OSC</sub>', '16 µs ✓', '8 µs ✓', '3,2 µs ✓'],
            ['x11', 'F<sub>RC</sub> (dahili RC)', '2–6 µs', '2–6 µs', '2–6 µs']
          ] },
          { t: 'note', kind: 'exam', html: 'Seçim kuralı: T<sub>AD</sub> = bölen / F<sub>OSC</sub> ≥ 1,6 µs olan <b>en küçük bölen</b>. Uygulama 19\'da 16 T<sub>OSC</sub> seçilmiş: 8 MHz\'te 2 µs ✓. Çevrim süresi ≈ 12 × 2 µs = 24 µs.' }
        ],
        checks: [
          { q: 'ADC\'yi çalıştırmanın adımlarını yazınız.', a: '1) ADCON1 (analog pinler, referans) ve ADCON0 (kanal, çevrim saati) ayarlanır, ADON=1. 2) İstenirse kesme: ADIF=0, ADIE=1, PEIE=1, GIE=1. 3) Veri toplama süresi beklenir. 4) GO/DONE=1 ile çevrim başlatılır. 5) GO/DONE yoklanır (polling) veya ADIF kesmesi beklenir. 6) Sonuç ADRESH:ADRESL\'den okunur, ADIF silinir.' },
          { q: 'Minimum T_AD kaçtır? 10 bitlik çevrim kaç T_AD sürer?', a: 'Minimum T_AD = 1,6 µs; 10 bitlik çevrim en az 12 T_AD sürer.' },
          { q: '20 MHz\'te hangi A/D çevrim saati seçilmelidir?', a: '32 T_OSC (T_AD = 32 / 20 MHz = 1,6 µs). 16 T_OSC 0,8 µs verir, yetersiz.' }
        ]
      },
      {
        id: 'kod',
        title: 'Örnek Kodlar: Uygulama 19 ve 20',
        src: 'slayt 19–21 · Uygulama 19, 20',
        minutes: 10,
        blocks: [
          { t: 'p', html: 'Görev: <b>AN0\'a bağlı bir potansiyometreden okunan analog veri B portuna yazdırılacak</b> (8 LED).' },
          { t: 'codex', title: 'Uygulama 19 (kesme ile)', rows: [
            ['unsigned int adc_degeri;', 'Okunan değer (kesme ve ana program ortak kullanır)'],
            ['interrupt(){\n adc_degeri=ADRESH;', 'Çevrim bitince: sonucun <b>üst 8 biti</b> (sola yaslı) alınır'],
            [' PIR1.ADIF=0;\n ADCON0.GO=1;\n}', 'Bayrak silinir, <b>yeni çevrim başlatılır</b>: sürekli ölçüm'],
            ['ADCON1=0X4E;', '0100 1110: ADFM=0 (<b>sola yaslı</b>), ADCS2=1, PCFG=1110 (<b>yalnızca AN0 analog</b>, diğerleri sayısal; referans VDD/VSS)'],
            ['ADCON0=0X45;', '0100 0101: ADCS1:0=01 (ADCS2 ile 101 → <b>16 T<sub>OSC</sub></b>), CHS=000 (<b>kanal AN0</b>), <b>GO=1</b>, ADON=1 (modül enerjilendi)'],
            ['PIR1.ADIF=0;\nPIE1.ADIE=1;\nINTCON.PEIE=1;\nINTCON.GIE=1;', 'Kesme kurulumu: bayrak sıfır, ADC kesmesi, çevresel kesme, global kesme'],
            ['TRISA=1;\nTRISB=0; PORTB=0;\nTRISD=0; PORTD=0;', 'RA0/AN0 giriş; B ve D portları çıkış'],
            ['while(1){\n PORTB=adc_degeri;\n PORTD.F7=~PORTD.F7;\n}', 'Ana döngü son değeri LED\'lere yazar; RD7 sürekli değillenerek ana programın çalıştığını gösterir']
          ] },
          { t: 'note', kind: 'exam', html: '<b>İnce nokta:</b> ADCON0 = 0x45\'in bit 2\'si <b>GO/DONE</b>\'dir; yani bu satır modülü açarken <b>ilk çevrimi de başlatır</b>. Böylece ilk kesme gelir, kesme her seferinde GO=1 yaptığı için ölçüm kendi kendine sürer. (Ek: veri sayfası ADON ile GO\'nun aynı komutta 1 yapılmamasını önerir; ilk ölçümün veri toplama süresi eksik kalabilir.)' },
          { t: 'dg', id: 'adcsim' },
          { t: 'codex', title: 'Uygulama 20 (mikroC kütüphanesiyle, kesmesiz)', rows: [
            ['float adc_degeri;', 'Çarpma ondalıklı olacağı için float'],
            ['adc_degeri= ADC_Get_Sample(0);', 'mikroC fonksiyonu: <b>kanal 0</b>\'da çevrimi başlatır, bitmesini bekler (polling), <b>10 bitlik</b> sonucu (0–1023) döndürür'],
            ['adc_degeri=adc_degeri*0.249;', '10 bitlik veriyi 8 bite çevirmek için 255/1023 ≈ <b>0,249</b> ile çarpılır'],
            ['PORTB=adc_degeri;', 'float, 8 bitlik PORTB\'ye yazılırken tam kısmı kalır']
          ] },
          { t: 'note', kind: 'extra', html: 'Uygulama 19 kesmeyle çalışır: ana program ölçüm beklemeden kendi işini yapar. Uygulama 20 <b>yoklamayla</b> çalışır: ADC_Get_Sample çevrim bitene kadar CPU\'yu bekletir. İkisinin sonucu neredeyse aynıdır (d/4 ile d × 0,249).' },
          { t: 'p', html: 'ADC kesmesinin izin zincirini hazır ayarla kontrol et ("ADC (Uygulama 19)"):' },
          { t: 'dg', id: 'intlogic' }
        ],
        checks: [
          { q: 'ADCON1 = 0x4E ne ayarlar?', a: '0100 1110: ADFM = 0 (sola yaslı sonuç), ADCS2 = 1, PCFG3:0 = 1110 (yalnızca AN0 analog, diğerleri dijital; referans VDD/VSS).' },
          { q: 'ADCON0 = 0x45 ne ayarlar?', a: '0100 0101: ADCS1:0 = 01 (ADCS2=1 ile Fosc/16), CHS2:0 = 000 (kanal AN0), GO/DONE = 1 (çevrimi başlat), ADON = 1 (modül açık).' },
          { q: 'Uygulama 19\'da kesmede neden yalnızca ADRESH okunur?', a: 'Sonuç sola yaslı (ADFM = 0) olduğundan ADRESH 10 bitlik sonucun üst 8 bitini tutar; 8 LED\'e yazmak için bu yeterli (sonuç / 4).' },
          { q: 'Uygulama 20\'de neden 0,249 ile çarpılır?', a: '10 bitlik sonucu (0–1023) 8 bitlik aralığa (0–255) ölçeklemek için: 255 / 1023 ≈ 0,249.' }
        ]
      }
    ]
  });
})(window.MC);
