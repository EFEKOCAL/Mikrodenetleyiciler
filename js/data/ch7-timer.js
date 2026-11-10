/*
 * ch7-timer.js — Bölüm 7: Zamanlayıcılar (Timer) ve sayaçlar.
 * Kaynak: hafta 6 sunumu slayt 1–23, Uygulama 15–18, Deney 5 föyü, PIC16F877A veri sayfası (bölüm 5–7).
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch7',
    num: 7,
    title: 'Zamanlayıcılar ve Sayaçlar',
    short: 'Zamanlayıcılar',
    navSub: 'Timer0 hesabı, prescaler, Deney 5',
    week: 'Hafta 6',
    source: 'Hafta 6 sunumu, slayt 1–23 · Uygulama 15–18 · Deney 5',
    objectives: [
      'Zamanlayıcı/sayaç uygulamalarını saymak; asenkron sayacın frekansı nasıl böldüğünü açıklamak',
      'Timer0, Timer1 ve Timer2\'yi karşılaştırmak',
      'Timer0 için OPTION_REG, TMR0 ve INTCON ayarlarını yapmak',
      'Formülde neden "× 4" olduğunu açıklamak; istenen gecikme için ön ölçek ve TMR0 değerini hesaplamak',
      'Timer kesmesiyle kare dalga üretmek ve frekansını hesaplamak (Deney 5)',
      'Timer1\'in temel özelliklerini ve kaydedicilerini söylemek'
    ],
    outline: {
      topics: [['Sayaç temeli: asenkron sayaç ve frekans bölme', 'sayac'], ['Timer0, Timer1, Timer2', 'timerlar'], ['Timer0 kaydedicileri ve başlangıç ayarları', 'timer0'], ['Gecikme hesabı ve neden × 4', 'hesap'], ['Örnek çözüm kodu ve kare dalga', 'kod'], ['Örnek sorular 2 ve 3', 'ornek23'], ['Deney 5: Timer ile kare dalga üreteci', 'deney5'], ['Timer1 modülü', 'timer1']],
      concepts: ['Frekans üreteci / frekansmetre', 'Asenkron (ripple) sayaç', 'Flip-flop', 'Ön ölçekleme (prescale)', 'Taşma (overflow)', 'TMR0', 'OPTION_REG: T0CS, T0SE, PSA, PS2:PS0', 'INTCON: GIE, TMR0IE, TMR0IF', 'Komut döngüsü = 4 saat', 'TMR = max − (G·F)/(P·4)', 'Kare dalga: f = 1/(2T)', 'Timer1: TMR1H/TMR1L, T1CON', 'Timer2: PR2, postscaler'],
      why: 'Timer0 hesabı vizenin en olası hesap sorusu. Hocanın 3 örnek sorusu ve 4 uygulaması (15–18) bu hesabın farklı sayılarla tekrarı.'
    },
    lessons: [
      {
        id: 'sayac',
        title: 'Sayaç Temeli: Asenkron Sayaç',
        src: 'slayt 1–3 · Deney 5 teori',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Zamanlayıcılar/sayaçlar mikrodenetleyicilerin temel birimlerindendir. Zamanlayıcı ve sayaç uygulamaları (slayt 2):' },
          { t: 'list', items: ['<b>Frekans üreteci</b> (kare dalga, PWM, buzzer)', '<b>Frekansmetre</b> (bir sinyalin frekansını ölçme)', '<b>Çeşitli sayaç uygulamaları</b> (darbe sayma, ürün sayma)', 'Deney 5\'e göre ayrıca: LED parlaklık ayarı, servo motor açı kontrolü, zamanlama işleri'] },
          { t: 'p', html: 'Bu modüllerin temeli, sayısal tasarım dersinde görülen <b>flip-floplarla yapılan senkron/asenkron sayaçlardır</b>. Saymak için gereken saat darbesi ana osilatörden (dahili) veya dışarıdan (harici) alınabilir.' },
          { t: 'h', text: 'Başlangıç değeri ayarlanabilir 3 bit asenkron yukarı sayıcı (slayt 3)' },
          { t: 'p', html: 'Hocanın SimulIDE devresi (Uygulama 15 klasörü): 3 JK flip-flop, saat ve osiloskop. Saat darbesi ver, dalga şekillerini izle:' },
          { t: 'dg', id: 'counter3' },
          { t: 'note', kind: 'exam', html: 'Buradan iki fikir zamanlayıcıya taşınır: (1) <b>Başlangıç değeri</b> ayarlanırsa taşmaya kalan darbe sayısı değişir → TMR0\'a değer yazmanın sebebi. (2) Her flip-flop frekansı 2\'ye böler → <b>ön ölçekleyici</b> böyle bir asenkron sayaçtır.' }
        ],
        checks: [
          { q: 'Zamanlayıcı/sayaç modüllerinin 3 uygulama alanını yazınız.', a: 'Frekans üreteci, frekansmetre, çeşitli sayaç uygulamaları (ayrıca LED parlaklık, servo açı kontrolü).' },
          { q: '3 bitlik asenkron sayıcının Q2 çıkışının frekansı saat frekansının kaçta kaçıdır?', a: '1/8. Her flip-flop frekansı ikiye böler: Q0 = f/2, Q1 = f/4, Q2 = f/8.' }
        ]
      },
      {
        id: 'timerlar',
        title: 'Timer0, Timer1 ve Timer2',
        src: 'slayt 4–7 · Deney 5',
        minutes: 5,
        blocks: [
          { t: 'table', head: ['', 'Timer0', 'Timer1', 'Timer2'], rows: [
            ['Boyut', '<b>8 bit</b> (TMR0)', '<b>16 bit</b> (TMR1H + TMR1L)', '<b>8 bit</b> (TMR2)'],
            ['Okunabilir / yazılabilir', 'Evet', 'Evet', 'Evet'],
            ['Saat kaynağı', 'Dahili (F<sub>OSC</sub>/4) veya harici (RA4/T0CKI)', 'Dahili veya harici (RC0/T1CKI)', 'Yalnızca dahili (F<sub>OSC</sub>/4)'],
            ['Kesme anı', '<b>FFh → 00h</b> geçişinde', '<b>FFFFh → 0000h</b> geçişinde', '<b>TMR2 = PR2</b> olunca (sonra 00h\'den yeniden sayar)'],
            ['Ön ölçek', '1:2 … 1:256 (WDT ile paylaşılır)', '1:1, 1:2, 1:4, 1:8', '1:1, 1:4, 1:16 + <b>son ölçek</b> 1:1…1:16'],
            ['Kenar seçimi', 'Harici saatte var (T0SE)', 'Yok (yükselen kenarda sayar)', '—']
          ] },
          { t: 'note', kind: 'fix', html: 'Slayt 6\'da Timer2 için de "harici veya dahili saat girişi" ve "kenar seçimi" yazıyor (Timer0 slaytından kopyalanmış). Veri sayfasına göre <b>Timer2 yalnızca dahili saatle</b> (F<sub>OSC</sub>/4) çalışır; harici girişi ve kenar seçimi yoktur. Timer1\'in harici girişi var ama kenar seçimi yok.' },
          { t: 'note', kind: 'lab', html: 'Deney 5: "Timer0 ve Timer2 <b>8 bit</b>, Timer1 <b>16 bit</b>\'lik bir zamanlayıcıdır."' }
        ],
        checks: [
          { q: 'PIC16F877A\'daki zamanlayıcıların bit sayıları nedir?', a: 'Timer0 8 bit, Timer1 16 bit, Timer2 8 bit.' },
          { q: 'Timer0 ve Timer1 ne zaman kesme üretir?', a: 'Timer0: FFh\'ten 00h\'ye geçerken (taşma). Timer1: FFFFh\'ten 0000h\'ye geçerken.' },
          { q: 'Timer2\'nin sayma şekli Timer0\'dan nasıl farklıdır?', a: 'Timer2 00h\'den PR2 kaydedicisindeki değere kadar sayar, eşleşince tekrar 00h\'ye döner (ve son ölçek sonrası TMR2IF kurulur). Timer0 ise FFh\'e kadar sayıp taşar.' }
        ]
      },
      {
        id: 'timer0',
        title: 'Timer0 Kaydedicileri ve Başlangıç Ayarları',
        src: 'slayt 8–13 · Deney 5',
        minutes: 9,
        blocks: [
          { t: 'table', head: ['Kaydedici', 'Timer0 için görevi (Deney 5)'], rows: [
            ['<b>TMR0</b> (01h)', 'Timer0 değerini tutar'],
            ['<b>OPTION_REG</b> (81h)', 'Saat darbe girişi seçimi (dahili/harici), ön ölçekleme ayarları'],
            ['<b>INTCON</b> (0Bh)', 'Timer0 kesme ayarları (GIE, TMR0IE, TMR0IF)']
          ] },
          { t: 'h', text: 'OPTION_REG (slayt 10)' },
          { t: 'p', html: 'Hocanın kodundaki <code>OPTION_REG = 1</code> ile başla. Bitleri değiştirip ön ölçek oranının nasıl değiştiğine bak:' },
          { t: 'dg', id: 'reg', reg: 'OPTION_REG', value: 1 },
          { t: 'table', head: ['PS2:PS0', '000', '001', '010', '011', '100', '101', '110', '111'], rows: [['TMR0 oranı', '1:2', '1:4', '1:8', '1:16', '1:32', '1:64', '1:128', '1:256'], ['WDT oranı', '1:1', '1:2', '1:4', '1:8', '1:16', '1:32', '1:64', '1:128']] },
          { t: 'note', kind: 'exam', html: 'Kolay yol: TMR0 oranı = <b>2<sup>PS+1</sup></b>. PS = 1 → 1:4, PS = 2 → 1:8, PS = 0 → 1:2. Hocanın kodlarında OPTION_REG = 0, 1, 2 yazılır; T0CS = 0 (dahili saat) ve PSA = 0 (ön ölçek Timer0\'da) olduğu için değer doğrudan PS bitleridir.' },
          { t: 'h', text: 'Ön ölçekleme (prescale) (slayt 11–13)' },
          { t: 'def', term: 'Ön ölçekleme', en: 'Prescale', html: 'Yüksek frekanslı sinyali düşük frekanslı sinyale düşüren elektronik sayaç; diğer bir ifadeyle <b>frekans bölücü</b> devresi. Aslında bir <b>asenkron (ripple) sayaçtır</b>. <b>Amacı:</b> kullanıcıya ayarlanabilir, daha esnek bir zamanlayıcı/sayaç sağlamak (8 bitlik TMR0 tek başına en fazla 256 döngü sayabilir).' },
          { t: 'h', text: 'Timer0 başlangıç ayarları (slayt 9)' },
          { t: 'list', ordered: true, items: [
            '<b>OPTION_REG</b> ayarları: saat kaynağı (<b>T0CS</b>), harici saatte kenar (<b>T0SE</b>), ön ölçek ataması Timer mı WDT mi (<b>PSA</b>), ön ölçek oranı (<b>PS2:PS0</b>)',
            '<b>TMR0</b> kaydedicisine başlangıç değeri atanır',
            '<b>INTCON</b>\'dan kesme ayarları: <b>GIE = 1</b>, (PEIE = 1: TMR0 için gerekli değil), <b>TMR0IE = 1</b>, <b>TMR0IF = 0</b>'
          ] }
        ],
        checks: [
          { q: 'Timer0 için başlangıç ayarlarını sırayla yazınız.', a: '1) OPTION_REG: T0CS (saat kaynağı), T0SE (kenar), PSA (ön ölçek Timer0\'a), PS2:PS0 (oran). 2) TMR0\'a başlangıç değeri. 3) INTCON: GIE=1, TMR0IE=1, TMR0IF=0 (PEIE Timer0 için gerekmez).' },
          { q: 'OPTION_REG = 2 iken Timer0\'ın ön ölçek oranı nedir?', a: 'PS2:PS0 = 010 → 1:8 (T0CS=0 dahili saat, PSA=0 ön ölçek Timer0\'da).' },
          { q: 'Ön ölçekleme nedir, amacı nedir?', a: 'Yüksek frekanslı sinyali düşük frekansa bölen elektronik sayaç (frekans bölücü, asenkron sayaç). Amacı kullanıcıya ayarlanabilir, daha esnek bir zamanlayıcı sağlamak: 8 bitlik sayaçla daha uzun süreler ölçülebilir.' }
        ]
      },
      {
        id: 'hesap',
        title: 'Gecikme Hesabı ve Neden × 4',
        src: 'slayt 14–15, 17',
        minutes: 12,
        blocks: [
          { t: 'h', text: 'Formül (slayt 15)' },
          { t: 'def', term: 'TMRx değeri', html: '<b>TMRx_reg = Timer_max − (Gecikme × F<sub>OSC</sub>) / (Prescale × 4)</b><br>F<sub>OSC</sub>: ana osilatör frekansı · Timer_max: 8 bit için <b>256</b>, 16 bit için <b>65536</b>' },
          { t: 'h', text: 'Neden Prescaler × 4? (slayt 17)' },
          { t: 'p', html: '16F877A\'da 3 tür komut vardır (bit tabanlı, byte tabanlı, literal ve kontrol). <b>Hepsinin işlemesi için 4 saat darbesi</b> geçmesi gerekir. 4 MHz\'te bir komut 4 × (1/F<sub>OSC</sub>) = 4 / (4·10<sup>6</sup>) = <b>1 µs</b> sürer. Timer0 dahili modda her <b>komut döngüsünde</b> (F<sub>OSC</sub>/4) bir kez sayar. Dolayısıyla 4, prescaler\'a çarpan, başka bir deyişle çalışma frekansına bölendir.' },
          { t: 'p', html: 'Aynı formülün mantığı: Timer\'ın bir artışı = Prescale × 4 / F<sub>OSC</sub> saniye. Gecikme için gereken artış sayısı = Gecikme / (bir artış süresi). Taşmaya o kadar kalması için TMR0 = 256 − artış sayısı.' },
          { t: 'dg', id: 'tmr0', fosc: 4, ps: 4, tmr: 6 },
          { t: 'solve', title: 'Örnek soru 1 (slayt 14–15)', q: 'Ana osilatör frekansı 4 MHz olan PIC16F877\'nin TMR0 modülü kullanılarak 1 ms\'lik gecikme sağlayacak ayarlamaları yapınız.', a: '<p>TMR0 = 256 − (1 ms × 4 MHz) / (Prescale × 4) = 256 − 1000 / Prescale</p><ul><li>Prescale 2: 256 − 500 = <b>−244</b> → negatif, prescale artır</li><li>Prescale 4: 256 − 250 = <b>+6</b> → pozitif, kullanılabilir</li><li>Prescale 8: 256 − 125 = <b>+131</b> → kullanılabilir</li></ul><p><b>Cevap:</b> TMR0 = 6, prescale 1:4 (OPTION_REG = 1) <b>veya</b> TMR0 = 131, prescale 1:8 (OPTION_REG = 2). Bunlar Uygulama 15 ve 16\'nın değerleri.</p>' },
          { t: 'p', html: 'Hesap tablosu her ön ölçek için sonucu gösterir; geçerli bir satıra tıkla:' },
          { t: 'dg', id: 'timercalc', fosc: 4, delay: 1 },
          { t: 'note', kind: 'exam', html: 'Yöntem: önce Prescale = 2 dene; sonuç <b>negatifse</b> prescale\'ı büyüt. Sayım (G·F / P·4) <b>tam sayı</b> çıkan ve 256\'yı geçmeyen en küçük prescale genelde en hassas çözümdür. Birden fazla doğru cevap olabilir.' }
        ],
        checks: [
          { q: 'Timer formülünde neden 4 ile çarpılır?', a: 'PIC16F877A\'da her komut 4 saat darbesinde işlenir; Timer0 dahili modda her komut döngüsünde (F_OSC/4) bir kez sayar. Bu yüzden 4 prescaler\'a çarpan (frekansa bölen) olarak girer.' },
          { q: '4 MHz\'te bir komut kaç µs sürer?', a: '4 × (1 / 4 MHz) = 1 µs.' },
          { q: '4 MHz, prescale 1:4, TMR0 = 6 ile taşma kaç ms\'de bir olur?', a: '(256 − 6) × 4 × 4 / 4 MHz = 250 × 4 µs = 1 ms.' }
        ]
      },
      {
        id: 'kod',
        title: 'Örnek Çözüm Kodu ve Kare Dalga',
        src: 'slayt 16 · Uygulama 15, 16',
        minutes: 9,
        blocks: [
          { t: 'codex', title: 'Uygulama 15 (slayt 16): 4 MHz, 1 ms', rows: [
            ['void interrupt(){\n PORTB.F0=~PORTB.F0;', 'Her kesmede RB0 <b>değillenir</b> (tersine çevrilir) → kare dalga'],
            [' TMR0=6;', 'Başlangıç değeri <b>yeniden yüklenir</b>: bir sonraki taşma da 1 ms sonra olsun'],
            [' INTCON.TMR0IF=0;\n}', 'Bayrak kesme bitiminde <b>sıfırlanmalı</b>'],
            ['void init(){\n portb=0;\n trisb=0;', 'PORTB çıkış'],
            [' OPTION_REG=1;', 'T0CS=0, T0SE=x, PSA=0, PS2:PS0=001 → <b>prescale 1:4</b>'],
            [' TMR0=6;', 'Timer0 başlangıç değeri'],
            [' INTCON=0XA0;\n}', '1010 0000: <b>GIE=1, TMR0IE=1</b>'],
            ['while(1){\n portb.f7=1; Delay_ms(1000);\n portb.f7=0; Delay_ms(1000);\n}', 'Kodun çalıştığını görmek için RB7 1 s aralıkla yanıp söner; normalde gerek yok. <b>Ana program meşgulken bile</b> RB0 kare dalgası kesmeyle düzgün üretilir.']
          ] },
          { t: 'h', text: 'Kare dalganın frekansı' },
          { t: 'p', html: 'Pin her 1 ms\'de bir <b>değiştiği</b> için 1 ms yüksek + 1 ms alçak = <b>periyot 2 ms</b> → <b>f = 1 / 2 ms = 500 Hz</b>.' },
          { t: 'note', kind: 'exam', html: '<b>Kesme aralığı = yarım periyot.</b> İstenen frekans f ise kesme aralığı = 1 / (2f). 500 Hz için 1 ms, 1 kHz için 0,5 ms.' },
          { t: 'note', kind: 'extra', html: '<b>OPTION_REG = 1 ayrıntısı:</b> bit 7 (RBPU) = 0 olduğu için PORTB\'nin dahili pull-up dirençleri de açılır; PORTB çıkış olduğu için burada etkisi yok. <b>Gerçek frekans biraz düşük çıkar:</b> taşma ile TMR0=6 satırı arasında kesmeye giriş ve bağlam saklama için birkaç komut döngüsü geçer, ayrıca TMR0\'a yazınca 2 döngü sayılmaz. Hassas iş için TMR0\'a birkaç fazla değer yazılır.' },
          { t: 'p', html: '<b>Uygulama 16</b> aynı 1 ms\'yi diğer çözümle üretir: <code>OPTION_REG=2</code> (1:8), <code>TMR0=131</code>; ana döngü boş. İki çözümü hesap aracında karşılaştır:' },
          { t: 'dg', id: 'timercalc', fosc: 4, delay: 1, title: 'Uygulama 15 ve 16: 4 MHz, 1 ms (kare dalga 500 Hz)' }
        ],
        checks: [
          { q: 'INTCON = 0xA0 Timer0 için ne ayarlar?', a: 'GIE = 1 (genel kesme izni) ve TMR0IE = 1 (Timer0 taşma kesmesi izni). Diğer bitler 0; TMR0IF de sıfırlanmış olur.' },
          { q: 'Kesme fonksiyonunda TMR0 neden yeniden yüklenir?', a: 'Taşmadan sonra TMR0 00h\'den saymaya devam eder; başlangıç değeri yeniden yazılmazsa sonraki taşma 256 artış sonra olur ve süre değişir.' },
          { q: 'Timer kesmesi 1 ms\'de bir pini değilliyorsa üretilen kare dalganın frekansı nedir?', a: 'Periyot 2 ms (1 ms yüksek + 1 ms alçak) → 500 Hz.' }
        ]
      },
      {
        id: 'ornek23',
        title: 'Örnek Sorular 2 ve 3',
        src: 'slayt 19–20 · Uygulama 17, 18',
        minutes: 8,
        blocks: [
          { t: 'solve', title: 'Örnek soru 2 (slayt 19)', q: 'Ana osilatör frekansı 8 MHz olan PIC16F877\'nin TMR0 modülü kullanılarak 100 µs\'lik gecikme sağlayacak ayarlamaları yapınız.', a: '<p>TMR0 = 256 − (100 µs × 8 MHz) / (P × 4) = 256 − 200 / P</p><ul><li>P = 2: 256 − 100 = <b>156</b> (OPTION_REG = 0)</li><li>P = 4: 256 − 50 = <b>206</b> (OPTION_REG = 1)</li><li>P = 8: 256 − 25 = <b>231</b> (OPTION_REG = 2) ← Uygulama 17</li><li>P = 16: 12,5 → tam sayı değil</li></ul><p>Kare dalga olarak: periyot 200 µs → <b>5 kHz</b>.</p>' },
          { t: 'solve', title: 'Örnek soru 3 (slayt 20)', q: 'Ana osilatör frekansı 16 MHz olan PIC16F877\'nin TMR0 modülü kullanılarak 20 µs\'lik gecikme sağlayacak ayarlamaları yapınız.', a: '<p>TMR0 = 256 − (20 µs × 16 MHz) / (P × 4) = 256 − 80 / P</p><ul><li>P = 2: 256 − 40 = <b>216</b> (OPTION_REG = 0) ← Uygulama 18</li><li>P = 4: 236 · P = 8: 246 · P = 16: 251</li></ul><p>Kare dalga olarak: periyot 40 µs → <b>25 kHz</b>.</p>' },
          { t: 'note', kind: 'fix', html: 'Uygulama 18\'in yorumunda "PS2:PS0=001, prescaler=2" yazıyor; OPTION_REG = 0 → PS2:PS0 = <b>000</b>, oran <b>1:2</b>. Oran doğru, yorumdaki bit deseni kopyalanmış. Uygulama 16–17\'de de yorum 001 der ama değer 2 = <b>010</b> (1:8).' },
          { t: 'dg', id: 'timercalc', fosc: 8, delay: 100, unit: 'us', title: 'Kendi sayılarınla dene' },
          { t: 'dg', id: 'quiz', types: ['timer'] },
          { t: 'dg', id: 'quiz', types: ['option'] }
        ],
        checks: [
          { q: '8 MHz, prescale 1:8 ile 100 µs için TMR0 kaç olmalı?', a: '256 − (100 µs × 8 MHz)/(8 × 4) = 256 − 25 = 231.' },
          { q: '16 MHz, 20 µs, prescale 1:2 için TMR0 ve OPTION_REG kaç olmalı?', a: 'TMR0 = 256 − 320/8 = 216; OPTION_REG = 0 (PS = 000 → 1:2).' }
        ]
      },
      {
        id: 'deney5',
        title: 'Deney 5: Timer ile Kare Dalga Üreteci',
        src: 'Deney 5 föyü',
        minutes: 10,
        lab: true,
        blocks: [
          { t: 'note', kind: 'lab', html: '<b>Amaç:</b> Zamanlayıcı çalışma mantığını öğrenmek ve timer ile uygulama geliştirmek. İstenen işlem: <b>Timer0 ile frekansı 500 Hz olan bir kare dalga üreteci</b> tasarla, SimulIDE\'de test et (<b>F<sub>OSC</sub> = 8 MHz</b>).' },
          { t: 'solve', title: 'İstenen işlem: 500 Hz, 8 MHz', q: 'Hangi prescale ve TMR0 değeri kullanılmalı?', a: '<p>500 Hz → periyot 2 ms → kesme aralığı (yarım periyot) <b>1 ms</b>.</p><p>TMR0 = 256 − (1 ms × 8 MHz) / (P × 4) = 256 − 2000 / P</p><ul><li>P = 8: 256 − 250 = <b>6</b> → <code>OPTION_REG = 2; TMR0 = 6;</code></li><li>P = 16: 256 − 125 = <b>131</b> → <code>OPTION_REG = 3; TMR0 = 131;</code></li></ul><p>Kod: Uygulama 15\'teki gibi, ISR\'de <code>PORTD.F0 = ~PORTD.F0; TMR0 = 6; INTCON.TMR0IF = 0;</code>, init\'te <code>TRISD = 0; OPTION_REG = 2; TMR0 = 6; INTCON = 0xA0;</code></p>' },
          { t: 'dg', id: 'timercalc', fosc: 8, delay: 1, title: '500 Hz için: 8 MHz, 1 ms' },
          { t: 'h', text: 'Föy sorusu 2: verilen kodun frekansı' },
          { t: 'p', html: 'Föydeki kod: <b>F<sub>OSC</sub> = 8 MHz, OPTION_REG = 0 (1:2), TMR0 = 6</b>, RD0 her kesmede değilleniyor. Osiloskopta ölçülecek frekans?' },
          { t: 'solve', title: 'Föy sorusu 2', q: 'RD0\'daki kare dalganın frekansı kaçtır?', a: '<p>Kesme aralığı = (256 − 6) × 2 × 4 / 8 MHz = 250 × 1 µs = <b>250 µs</b>. Periyot = 2 × 250 µs = 500 µs → <b>f = 2 kHz</b>. (Gerçekte ölçülen değer kesme gecikmesi yüzünden 2 kHz\'ten biraz düşük çıkar.)</p><p>Dikkat: Bu kod 500 Hz üretmez; 500 Hz için prescale 1:8 olmalı (OPTION_REG = 2).</p>' },
          { t: 'dg', id: 'timercalc', fosc: 8, delay: 250, unit: 'us', title: 'Föy kodu: 8 MHz, 1:2, TMR0 = 6' },
          { t: 'h', text: 'Föy sorusu 3' },
          { t: 'table', head: ['Soru', 'Cevap'], rows: [
            ['Timer0 ne zaman kesme üretir?', 'TMR0 <b>FFh\'ten 00h\'ye geçerken</b> (taşma): TMR0IF = 1 olur; TMR0IE ve GIE açıksa kesme oluşur.'],
            ['Ön ölçekleme 1:16 ise TMR0\'ın 1 artması için saat darbe girişine kaç darbe uygulanmalı?', '<b>16</b> darbe (dahili modda 16 komut döngüsü = 64 osilatör darbesi).'],
            ['Timer0 saat darbe girişi seçimi hangi kaydediciden, hangi bitten yapılır?', '<b>OPTION_REG</b>\'in <b>T0CS</b> (5.) biti: 0 dahili komut saati, 1 RA4/T0CKI pini.']
          ] }
        ],
        checks: [
          { q: '8 MHz\'te Timer0 ile 500 Hz kare dalga için prescale ve TMR0 ne olmalı?', a: 'Kesme aralığı 1 ms. Prescale 1:8 → TMR0 = 6 (OPTION_REG = 2) veya prescale 1:16 → TMR0 = 131 (OPTION_REG = 3).' },
          { q: 'Ön ölçek 1:16 iken TMR0\'ın 1 artması için kaç saat darbesi gerekir?', a: '16 (Timer0\'ın saat girişine gelen darbe; dahili modda bunlar komut döngüleridir).' }
        ]
      },
      {
        id: 'timer1',
        title: 'Timer1 Modülü',
        src: 'slayt 21–23',
        minutes: 6,
        blocks: [
          { t: 'list', items: [
            '<b>2 farklı modda</b> çalışır: <b>zamanlayıcı (timer)</b> modu ve <b>sayaç (counter)</b> modu',
            '<b>16 bitlik</b>: TMR1H ve TMR1L adında iki 8 bitlik kaydedici',
            'Harici saat darbe giriş pini: <b>RC0/T1OSO/T1CKI</b>',
            '<b>FFFFh → 0000h</b> geçerken kesme üretir'
          ] },
          { t: 'h', text: 'T1CON kaydedicisi' },
          { t: 'dg', id: 'reg', reg: 'T1CON', value: 0x31 },
          { t: 'table', head: ['Kaydedici', 'Timer1 için'], rows: [
            ['TMR1L (0Eh), TMR1H (0Fh)', '16 bitlik sayaç değeri'],
            ['T1CON (10h)', 'Ön ölçek, osilatör, senkronizasyon, saat kaynağı, açma'],
            ['PIR1 (0Ch) · bit 0 TMR1IF', 'Taşma bayrağı'],
            ['PIE1 (8Ch) · bit 0 TMR1IE', 'Taşma kesmesi izni'],
            ['INTCON · GIE, PEIE', 'Timer1 <b>çevresel</b> bir kesmedir: <b>PEIE de 1 olmalı</b>']
          ] },
          { t: 'note', kind: 'extra', html: 'Timer1\'de formülde Timer_max = <b>65536</b>. Örnek: 4 MHz\'te 50 ms → sayım = 0,05 × 4·10<sup>6</sup> / (P × 4) = 50000 / P. P = 1: TMR1 = 65536 − 50000 = 15536 = <b>3CB0h</b> → TMR1H = 3Ch, TMR1L = B0h. Timer0 ile bu süre tek taşmayla mümkün değil (en fazla 256 × 256 µs ≈ 65,5 ms, ama tam değer çıkmaz).' },
          { t: 'dg', id: 'timercalc', fosc: 4, delay: 50, timer: 1, title: 'Timer1: 4 MHz, 50 ms' }
        ],
        checks: [
          { q: 'Timer1\'in iki çalışma modu nedir?', a: 'Zamanlayıcı (timer) modu: dahili F_OSC/4 saatiyle sayar. Sayaç (counter) modu: RC0/T1CKI pinindeki harici darbeleri sayar.' },
          { q: 'Timer1 kesmesi için hangi bitler gerekir?', a: 'PIE1.TMR1IE = 1, INTCON.PEIE = 1, INTCON.GIE = 1 (TMR1IF sıfırlanmış olmalı). Timer1\'i çalıştırmak için T1CON.TMR1ON = 1.' }
        ]
      }
    ]
  });
})(window.MC);
