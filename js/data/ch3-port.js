/*
 * ch3-port.js — Bölüm 3: Port yapıları (G/Ç donanımı).
 * Kaynak: hafta 1–2 sunumu slayt 48–56, hafta 4–5 sunumu slayt 2–5, Deney 3 föyü (teori), PIC16F877A veri sayfası.
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch3',
    num: 3,
    title: 'Port Yapıları',
    short: 'Portlar',
    navSub: 'TRIS/PORT, totem pole, pull-up, debounce',
    week: 'Hafta 1–2 · 4–5',
    source: 'Hafta 1–2 slayt 48–56 · Hafta 4–5 slayt 2–5 · Deney 3',
    objectives: [
      'PIC16F877A\'nın 5 portunu, pin sayılarını ve özel görevlerini saymak',
      'Mikrodenetleyicinin çalışması için gerekli temel bağlantıları söylemek',
      'İstenen giriş/çıkış düzeni için TRISx ve PORTx değerlerini hex olarak hesaplamak',
      'Totem pole ile açık kollektör/drain çıkış arasındaki farkı açıklamak',
      'Schmitt tetikleyici, pull-up / pull-down ve debounce kavramlarını açıklamak'
    ],
    outline: {
      topics: [['Portlar, pinler ve temel bağlantılar', 'portlar'], ['TRIS ve PORT kaydedicileri', 'tris'], ['Çıkış yapıları: totem pole ve açık drain', 'cikis'], ['Giriş yapıları: Schmitt, pull-up/down, debounce', 'giris']],
      concepts: ['PORTA–PORTE', '33 G/Ç', 'MCLR, VDD, VSS, OSC', 'TRISx: 0 = çıkış, 1 = giriş', 'PORTx', 'Latch', 'Totem pole', 'Açık kollektör / drain', 'Schmitt tetikleyici', 'Histerezis', 'Pull-up / pull-down', 'Yüzer giriş', 'Debounce'],
      why: 'TRIS/PORT hex hesabı vizede neredeyse kesin çıkar; ayrıca G/Ç uygulamalarının (Bölüm 5) donanım temeli.'
    },
    lessons: [
      {
        id: 'portlar',
        title: 'Portlar, Pinler ve Temel Bağlantılar',
        src: 'slayt 48–49 · Deney 3',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'PORT', html: 'Mikrodenetleyicilerin <b>dış dünya ile iletişim kurmak</b> için kullandığı yapılar. Giriş (buton, sensör) ve çıkış (LED sürme, LCD\'ye yazma) işlemleri G/Ç portları üzerinden yapılır.' },
          { t: 'p', html: 'PIC16F877A\'da <b>5 port</b>, toplam <b>33 G/Ç pini</b> vardır. Her port kendine özgü işlevler için tasarlanmıştır; istenirse temel giriş/çıkış için de kullanılır:' },
          { t: 'table', head: ['Port', 'Pin', 'Temel G/Ç dışındaki özelleşmiş görevi'], rows: [
            ['<b>PORTA</b>', '6', 'Analog girişler (AN0–AN4); RA4/T0CKI Timer0 harici saat girişi'],
            ['<b>PORTB</b>', '8', 'PIC programlama girişleri (RB3/PGM, RB6/PGC, <b>RB7/PGD</b>); RB0/INT harici kesme'],
            ['<b>PORTC</b>', '8', 'Seri haberleşme (USART TX/RX, I²C, SPI), CCP, Timer1 girişi'],
            ['<b>PORTD</b>', '8', 'Paralel veri aktarımı (Parallel Slave Port)'],
            ['<b>PORTE</b>', '3', 'Analog girişler (AN5–AN7)']
          ] },
          { t: 'note', kind: 'lab', html: '<b>Deney 3, örnek 1:</b> 40 nolu bacak hangi porta aittir? → <b>B portunun 7 nolu bacağı (RB7)</b>; özelleşmiş görevi <b>PGD</b>: programlama sırasında veri (DATA) transferini yapar. Özelleşmiş G/Ç kullanmayacağımız uygulamalarda <b>öncelikle D portu</b> kullanılır.' },
          { t: 'h', text: 'Temel bağlantılar (her uygulamada zorunlu)' },
          { t: 'table', head: ['Pin', 'Görevi'], rows: [
            ['<b>MCLR/Vpp</b> (1)', 'RESET girişi. Normal çalışmada <b>lojik 1</b> uygulanmalı (0 olursa PIC resette kalır).'],
            ['<b>VDD</b> (11, 32)', 'Pozitif besleme girişi (+5 V)'],
            ['<b>VSS</b> (12, 31)', 'GND bağlantısı'],
            ['<b>OSC1, OSC2</b> (13, 14)', 'Osilatör (kristal) bağlantı girişleri. Kristalin iki ucuna 22 pF kondansatör.']
          ] },
          { t: 'note', kind: 'extra', html: 'Deney 3\'teki D portu: PORTD ve TRISD\'nin tamamı ile <b>TRISE\'nin 4. biti (PSPMODE)</b> ilişkilidir. PSPMODE = 1 → D portu Parallel Slave modunda; 0 → normal giriş/çıkış.' }
        ],
        checks: [
          { q: 'PIC16F877A\'da kaç port vardır? Her birinde kaç pin bulunur?', a: '5 port, toplam 33 pin: PORTA 6, PORTB 8, PORTC 8, PORTD 8, PORTE 3.' },
          { q: 'Mikrodenetleyicinin çalışması için gerekli temel bağlantılar nelerdir? (Deney 3)', a: 'MCLR/Vpp (reset girişi, normalde lojik 1), VDD (+5 V besleme), VSS (GND), OSC1 ve OSC2 (harici osilatör/kristal bağlantısı, dahili osilatör kullanılmıyorsa).' },
          { q: '40 nolu bacak hangi porta aittir, özel görevi nedir?', a: 'RB7, B portunun 7. biti; PGD: programlama sırasında veri transferi.' }
        ]
      },
      {
        id: 'tris',
        title: 'TRIS ve PORT Kaydedicileri',
        src: 'slayt 50 · hafta 4–5 slayt 2–5',
        minutes: 10,
        blocks: [
          { t: 'def', term: 'TRISx', html: 'İlgili portun pinlerinin <b>giriş mi çıkış mı</b> olarak kullanılacağını belirler. Port ile çalışmaya başlamadan önce bu kaydediciye uygun sayı atanmalıdır. <b>0 → Çıkış</b>, <b>1 → Giriş</b>.' },
          { t: 'note', kind: 'exam', html: 'Hatırlama yolu: <b>0 = O</b>utput, <b>1 = I</b>nput. Rakamlar harflere benziyor.' },
          { t: 'def', term: 'PORTx', html: 'Pinlerin <b>0 V ile mi 5 V ile mi</b> gerilimlendirileceğini belirler: 0 V → 0, 5 V → 1. TRIS ile <b>giriş olarak tanımlanmış pinler bundan etkilenmez</b>; o pinler dışarıdaki gerilimi okur.' },
          { t: 'h', text: 'Dene: yön, yazma ve okuma' },
          { t: 'dg', id: 'trisport', tris: 0xf0, port: 0x0f },
          { t: 'note', kind: 'exam', html: 'Slayt 5 sorusu: "Giriş olarak tanımlanmış bir pine PORT ile 0 veya 1 gönderirsek ne olur?" → <b>Etkilenmez, çünkü çıkış olarak ayarlanmamıştır.</b> Dijital giriş pini yalnızca gerilimin 0 mı yoksa referansın üstünde mi (1) olduğunu okur.' },
          { t: 'h', text: 'Hesap yöntemi' },
          { t: 'list', ordered: true, items: ['8 kutu çiz: soldan sağa <b>RB7 … RB0</b>', 'Her kutuya: giriş → 1, çıkış → 0 (TRIS) ya da 5 V → 1, 0 V → 0 (PORT)', 'Sağdan 4\'lü grupla, her grubu hex basamağa çevir'] },
          { t: 'solve', title: 'Slayt 2', q: 'B portunun 0–3 numaralı pinleri (3 dahil) çıkış, diğerleri giriş olacak. TRISB\'ye hangi hex sayı atanmalı?', a: '<p>RB7 RB6 RB5 RB4 = giriş = 1111; RB3 RB2 RB1 RB0 = çıkış = 0000 → <b>1111 0000 = 0xF0</b>.</p>' },
          { t: 'solve', title: 'Slayt 3', q: 'B portunun 0, 2, 4, 6 numaralı pinleri çıkış, diğerleri giriş olacak. TRISB = ?', a: '<p>RB7=1, RB6=0, RB5=1, RB4=0, RB3=1, RB2=0, RB1=1, RB0=0 → <b>1010 1010 = 0xAA</b>.</p>' },
          { t: 'solve', title: 'Slayt 4', q: 'B portunun indeks numarası çift olan pinlerine 5 V, diğerlerine 0 V göndermek istiyoruz. TRISB ve PORTB = ?', a: '<p>Hepsi çıkış: <b>TRISB = 0x00</b>. Çift indisler (0, 2, 4, 6) = 1: 0101 0101 → <b>PORTB = 0x55</b>.</p>' },
          { t: 'h', text: 'Assembly ve C\'de yön ayarı (slayt 50)' },
          { t: 'compare', cols: [
            { title: 'Makine dilinde', items: ['1. TRIS kaydedicisinin olduğu RAM bankı seçilir (Bank 1)', '2. Çıkış olacak pin 0, giriş olacak pin 1 yapılır', '3. Tekrar Bank 0\'a dönülür'] },
            { title: 'C derleyicisinde', items: ['Doğrudan ilgili TRIS kaydedicisine veri yazılır: <code>TRISB = 0xF0;</code>', 'Bank seçme işlemi derleyici tarafından <b>otomatik</b> yapılır'] }
          ] },
          { t: 'dg', id: 'quiz', types: ['tris', 'port'] }
        ],
        checks: [
          { q: 'TRIS kaydedicisinde 0 ve 1 ne anlama gelir?', a: '0 → ilgili pin çıkış (Output), 1 → giriş (Input).' },
          { q: 'D portunun 7 ve 0 numaralı pinleri giriş, diğerleri çıkış olacak. TRISD = ?', a: '1000 0001 = 0x81.' },
          { q: 'TRISB = 0xFF iken PORTB = 0x00 yazılırsa B portundaki LED\'ler ne olur?', a: 'Hiçbir şey olmaz: tüm pinler giriş olduğu için PORTB\'ye yazılan değer pinlere çıkmaz (yalnızca çıkış tutucusuna yazılır).' }
        ]
      },
      {
        id: 'cikis',
        title: 'Çıkış Yapıları: Totem Pole ve Açık Drain',
        src: 'slayt 51–52',
        minutes: 5,
        blocks: [
          { t: 'compare', cols: [
            { title: 'Totem pole çıkış', items: ['Biri VDD\'ye, biri GND\'ye bağlı <b>iki transistör</b>', 'Pini hem 1\'e hem 0\'a sürer', '<b>Yüke enerji vermek için harici besleme bağlamaya gerek yok</b>'] },
            { title: 'Açık kollektör / açık drain çıkış', items: ['Yalnızca GND\'ye bağlı <b>tek transistör</b>', 'Pini sadece 0\'a çekebilir; 1\'de pin boşta (yüzer)', '<b>Yüke enerji vermek için harici besleme (pull-up) gerekir</b>'] }
          ] },
          { t: 'dg', id: 'outstage' },
          { t: 'note', kind: 'extra', html: '<b>Açık drain ne işe yarar?</b> Birden çok çıkış aynı hatta bağlanabilir (biri 0 çekerse hat 0 olur: "kablolu VE"); I²C hattı böyle çalışır. Ayrıca harici pull-up başka bir gerilime (ör. 12 V) bağlanarak farklı seviyede yük sürülebilir.' },
          { t: 'note', kind: 'extra', html: '<b>LED bağlarken:</b> Deney 3 devresinde LED\'lerle seri <b>330 Ω</b> direnç var: (5 V − ~2 V) / 330 Ω ≈ 9 mA. Direnç akımı sınırlar; PIC pini en fazla ~25 mA verebilir.' }
        ],
        checks: [
          { q: 'Totem pole ve açık kollektör çıkışların farkı nedir?', a: 'Totem pole çıkış iki transistörle pini hem 1 (VDD) hem 0 (GND) seviyesine sürer; yüke enerji vermek için harici beslemeye gerek yoktur. Açık kollektör/drain çıkış yalnızca 0\'a çekebilir; 1 durumunda pin boşta kalır, yüke enerji vermek için harici besleme (pull-up direnci) gerekir.' }
        ]
      },
      {
        id: 'giris',
        title: 'Giriş Yapıları: Schmitt Tetikleyici, Pull-up/down, Debounce',
        src: 'slayt 53–56',
        minutes: 9,
        blocks: [
          { t: 'h', text: 'Schmitt tetikleyici (slayt 53–54)' },
          { t: 'def', term: 'Schmitt tetikleyici', en: 'Schmitt trigger', html: 'İki farklı eşiği olan giriş devresi: yükselirken <b>V<sub>T+</sub></b>, düşerken <b>V<sub>T−</sub></b> geçilmelidir. Aradaki fark (<b>histerezis</b>) sayesinde gürültülü veya yavaş değişen sinyaller temiz 0/1\'e dönüşür.' },
          { t: 'dg', id: 'schmitt' },
          { t: 'h', text: 'Pull-up ve pull-down bağlantısı (slayt 55)' },
          { t: 'p', html: 'Buton açıkken pin hiçbir yere bağlı değilse <b>yüzer</b>: rastgele 0/1 okunur. Bir direnç, pini butona basılmadığında belirli bir seviyede tutar:' },
          { t: 'dg', id: 'pull' },
          { t: 'h', text: 'Sıçrama önleme: debounce (slayt 56)' },
          { t: 'p', html: 'Mekanik buton basıldığı anda birkaç milisaniye <b>açılıp kapanır (sıçrar)</b>. Program bunu birden çok basış sanabilir. İki çözüm yolu var:' },
          { t: 'list', ordered: true, items: ['<b>Donanımsal yöntem:</b> RC filtre (direnç + kondansatör) ve Schmitt tetikleyici ile sinyal yumuşatılır.', '<b>Yazılımsal yöntem:</b> Butona basıldığı algılandıktan sonra mikrodenetleyicide <b>belli bir süre gecikme</b> uygulanır.'] },
          { t: 'dg', id: 'bounce' },
          { t: 'note', kind: 'exam', html: 'Debounce süresi donanımdan donanıma değişir. Hassas devrelerde süre <b>lojik analizör</b> veya kaliteli <b>osiloskopla</b> ölçülmeli; diğer devrelerde <b>10 ms\'lik gecikme yeterli</b>dir.' },
          { t: 'code', text: 'if (PORTD.F0 == 1) {      // basıldı algılandı\n    Delay_ms(10);         // sıçrama bitsin\n    if (PORTD.F0 == 1) {  // hâlâ basılı: gerçek basış\n        sayac++;\n        while (PORTD.F0 == 1);  // bırakılmasını bekle\n    }\n}' }
        ],
        checks: [
          { q: 'Schmitt tetikleyici girişin faydası nedir?', a: 'İki farklı eşik (histerezis) kullandığı için gürültülü veya yavaş değişen giriş sinyali eşik etrafında gidip gelse de çıkış birden çok kez değişmez; temiz 0/1 üretir.' },
          { q: 'Pull-down bağlantıda butona basıldığında pin ne okunur? Pull-up\'ta?', a: 'Pull-down: basılıyken 1 (5 V), bırakılınca 0. Pull-up: basılıyken 0, bırakılınca 1.' },
          { q: 'Buton sıçraması (bounce) nedir, yazılımla nasıl önlenir?', a: 'Mekanik kontakların basma/bırakma anında birkaç ms boyunca açılıp kapanmasıdır; program tek basışı birden çok basış sanar. Yazılımla: basış algılandıktan sonra belli bir süre (çoğu devrede ~10 ms) gecikme uygulanır, sonra buton tekrar kontrol edilir.' }
        ]
      }
    ]
  });
})(window.MC);
