/*
 * ch5-io.js — Bölüm 5: Giriş/çıkış uygulamaları.
 * Kaynak: hafta 4–5 sunumu slayt 6–17, hocanın Uygulama 4–14 kodları, Deney 3 föyü.
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch5',
    num: 5,
    title: 'Giriş/Çıkış Uygulamaları',
    short: 'G/Ç uygulamaları',
    navSub: 'LED desenleri, buton okuma, Deney 3',
    week: 'Hafta 4–5',
    source: 'Hafta 4–5 sunumu, slayt 6–17 · Uygulama 4–14 · Deney 3',
    objectives: [
      'Verilen bir LED desenini PORT değerleri dizisine çevirip döngü ve kaydırma ile kodlamak',
      'Hocanın çıkış örneklerindeki (Uygulama 4–10) her satırın PORTB\'ye etkisini söylemek',
      'Bir pini giriş yapıp butonu okumak; polling ve gecikmenin etkisini açıklamak',
      'Fonksiyon kullanarak tekrarlanan desenleri düzenlemek',
      'Deney 3\'ün kodunu ve devresini açıklamak; föy sorusunu çözmek'
    ],
    outline: {
      topics: [['Çıkış örnekleri 1–3: yak-söndür, doldur, kayan ışık', 'cikis1'], ['Çıkış örnekleri 4–7: gidip gelen, XOR, ikili, üçlü', 'cikis2'], ['Dijital giriş okuma: buton → LED', 'giris'], ['Fonksiyonlarla desen (Uygulama 14)', 'fonksiyon'], ['Deney 3: PORT yapıları ve G/Ç uygulaması', 'deney3']],
      concepts: ['while(1)', 'Delay_ms', 'PORTB*2+1', '<< ve >> ile kaydırma', 'XOR deseni', 'bit tipi, yön değişkeni', 'PORTD.F0 ile bit okuma', 'Polling (yoklama)', 'if / else', '&& ile iki buton', 'Fonksiyon çağrısı'],
      why: 'Vizede "şu deseni yapan programı yazınız" tipi kod sorusu çok olası. Önce deseni sayılara çevir, sonra döngüyü kur.'
    },
    lessons: [
      {
        id: 'cikis1',
        title: 'Çıkış Örnekleri 1–3',
        src: 'slayt 6–8 · Uygulama 4, 5, 6',
        minutes: 10,
        blocks: [
          { t: 'p', html: 'Her çıkış programının iskeleti aynıdır: <b>1)</b> TRIS ile pinleri çıkış yap, <b>2)</b> sonsuz döngüde PORT\'a desen yaz, <b>3)</b> desenler arasında bekle.' },
          { t: 'h', text: 'Desen → sayı dizisi' },
          { t: 'table', head: ['Örnek', 'İstenen', 'PORTB dizisi', 'İşlem'], rows: [
            ['1 (Uyg. 4)', 'Tümü 1 sn aralıkla yak-söndür', '00 → FF → 00 → FF …', 'Sabit yaz'],
            ['2 (Uyg. 5)', '2 sn aralıkla 0\'dan 7\'ye <b>doldurarak</b> yak', '1, 3, 7, 15, 31, 63, 127, 255 → 0', '<code>PORTB*2+1</code>'],
            ['3 (Uyg. 6)', '500 ms aralıkla <b>tek tek</b> yak-söndür, 7\'den sonra başa', '1, 2, 4, 8, 16, 32, 64, 128 → 1', '<code>PORTB&lt;&lt;1</code>']
          ] },
          { t: 'p', html: 'Üç uygulamayı simülatörde çalıştır. <b>Adım</b> düğmesi mikroC hata ayıklayıcısı gibi satır satır ilerletir:' },
          { t: 'dg', id: 'run', apps: ['u4', 'u5', 'u6'] },
          { t: 'note', kind: 'exam', html: '<b>Uygulama 5\'in hilesi:</b> <code>PORTB*2</code> bitleri sola kaydırır, <code>+1</code> en sağa yeni bir 1 ekler. <b>Uygulama 6\'nın hilesi:</b> <code>PORTB=1</code> ile başla, 7 kez <code>&lt;&lt;1</code> yap (i&lt;7), sonra tekrar 1 yaz. 8 kez kaydırsaydın 128 &lt;&lt; 1 = 256, 8 bite sığmaz → 0: bir tur tüm LED\'ler sönük kalırdı.' }
        ],
        checks: [
          { q: 'Uygulama 5\'te PORTB=0 iken <code>PORTB=PORTB*2+1</code> üç kez çalışırsa PORTB kaç olur?', a: '0→1→3→7. PORTB = 7 = 0000 0111: RB0, RB1, RB2 yanık.' },
          { q: 'Uygulama 6\'da for döngüsü neden <code>i&lt;7</code>?', a: 'Tek yanan LED RB0\'dan RB7\'ye 7 kaydırmada ulaşır. 8. kaydırmada 128<<1 = 256 olur ve 8 bitlik PORTB\'de 0 kalır; bunun yerine döngüden çıkılıp PORTB tekrar 1 yapılır.' }
        ]
      },
      {
        id: 'cikis2',
        title: 'Çıkış Örnekleri 4–7',
        src: 'slayt 9–12 · Uygulama 7, 8, 9, 10',
        minutes: 12,
        blocks: [
          { t: 'table', head: ['Örnek', 'Desen', 'Fikir'], rows: [
            ['4 (Uyg. 10)', 'Tek ışık RB0→RB7, sonra <b>geri döner</b>', '<code>bit yon</code> değişkeni: 0 iken &lt;&lt;1, 1 iken &gt;&gt;1. Uçlarda (128 ve 1) yön çevrilir.'],
            ['5 (Uyg. 7)', 'İki ışık uçlardan başlar, <b>ortada buluşup çaprazlanır</b>', '<code>sayi1</code> 128\'den sağa, <code>sayi2</code> 1\'den sola; <code>PORTB = sayi1 ^ sayi2</code>'],
            ['6 (Uyg. 8)', '<b>Yan yana iki ışık</b> sola kayar', 'PORTB = 3 (0b00000011), 7 kez &lt;&lt;1'],
            ['7 (Uyg. 9)', '<b>Üç ışık</b> soldan sağa kayıp tek tek düşer', 'PORTB = 0b11100000, 8 kez &gt;&gt;1']
          ] },
          { t: 'dg', id: 'run', apps: ['u10', 'u7', 'u8', 'u9'] },
          { t: 'note', kind: 'fix', html: 'Slaytlarda süreler 750 ms (örnek 4) ve 1200 ms (örnek 5); hocanın GitHub kodlarında 1000 ms. Uygulama 8 ve 9\'un .c dosyası depoda yok; kodlar .lst (derleyici listesi) dosyalarından satır satır geri çıkarıldı.' },
          { t: 'h', text: 'XOR deseni neden çalışır? (Uygulama 7)' },
          { t: 'table', head: ['i', 'sayi1', 'sayi2', 'sayi1 ^ sayi2'], rows: [
            ['0', '1000 0000', '0000 0001', '1000 0001'],
            ['1', '0100 0000', '0000 0010', '0100 0010'],
            ['2', '0010 0000', '0000 0100', '0010 0100'],
            ['3', '0001 0000', '0000 1000', '<b>0001 1000</b> (ortada yan yana)'],
            ['4', '0000 1000', '0001 0000', '<b>0001 1000</b> (çaprazlandılar)'],
            ['5…7', '…', '…', 'ayna görüntüsü: 0010 0100, 0100 0010, 1000 0001']
          ] },
          { t: 'note', kind: 'exam', html: 'Desen sorusunda yöntem: <b>1)</b> her adımı 8 bitlik satır olarak yaz, <b>2)</b> satırları hex/ondalık sayıya çevir, <b>3)</b> sayılar arasındaki ilişkiyi bul (×2, ×2+1, &lt;&lt;, &gt;&gt;, ^, sabit dizi). İlişki yoksa diziyi <code>char desen[] = {…};</code> olarak yaz ve döngüyle sırayla PORTB\'ye ver.' },
          { t: 'dg', id: 'quiz', types: ['shift'] }
        ],
        checks: [
          { q: 'Uygulama 10\'da yon değişkeni ne zaman 1, ne zaman 0 olur?', a: 'PORTB == 128 olunca (ışık RB7\'ye ulaşınca) yon = 1 (sağa kaydır). PORTB == 1 olunca (RB0\'a dönünce) yon = 0 (sola kaydır).' },
          { q: 'Uygulama 9\'da PORTB = 0b11100000 iken 3 kez >>1 yapılırsa PORTB ne olur?', a: '1110 0000 → 0111 0000 → 0011 1000 → 0001 1100 = 0x1C (RB4, RB3, RB2 yanık).' },
          { q: 'XOR (^) operatörü iki deseni nasıl birleştirir?', a: 'Bitler farklıysa 1, aynıysa 0 verir. Biri soldan biri sağdan gelen iki tek-bit desen XOR\'lanınca ikisi de yanık görünür; aynı bit üst üste gelseydi o bit sönerdi.' }
        ]
      },
      {
        id: 'giris',
        title: 'Dijital Giriş Okuma: Buton → LED',
        src: 'slayt 13–17 · Uygulama 11, 12, 13',
        minutes: 10,
        blocks: [
          { t: 'p', html: 'Dijital girişi okuyabilmek için ilgili pinin TRIS kaydedicisinde temsil edildiği alana <b>1</b> atanmalıdır. Örnek: B portunun 5 numaralı pininden giriş okunacaksa <b>TRISB = (xx1xxxxx)₂</b>; x = 0 veya 1 fark etmez (diğer pinlerin kullanımına göre).' },
          { t: 'table', head: ['Slayt', 'İstenen', 'Kod'], rows: [
            ['14', 'RD0 butonuna basılınca RB3 LED\'i yansın', 'Uygulama 11'],
            ['15', 'RD0\'a basılınca B portundaki tüm LED\'ler yansın, bırakınca sönsün', 'Uygulama 12'],
            ['15–17 arası', 'RD0 basılıyken tüm LED\'ler 1 sn aralıkla yanıp sönsün', 'Uygulama 13'],
            ['16', 'RD0\'a basılınca yak, RD1\'e basılınca söndür', 'Sitenin çözümü'],
            ['17', 'RD0: hepsini yak-söndür, RD1: kara şimşek', 'Sitenin çözümü']
          ] },
          { t: 'p', html: 'Butona tıklayınca basılı kalır, tekrar tıklayınca bırakılır. <b>Uygulama 13</b>\'te gecikme sürerken butonu bırakmanın hemen etki etmediğine dikkat et:' },
          { t: 'dg', id: 'run', apps: ['u11', 'u12', 'u13', 'g3', 'g4'] },
          { t: 'def', term: 'Yoklama', en: 'Polling', html: 'CPU\'nun bir girişi döngü içinde <b>sürekli kontrol etmesi</b>. Basit, ama CPU başka işle (ör. Delay_ms) meşgulken olay kaçırılabilir veya geç fark edilir. Çözümü: <b>kesmeler</b> (Bölüm 6).' },
          { t: 'note', kind: 'exam', html: 'Slayt 16 (iki buton) ile slayt 15\'in farkı: slayt 15\'te <code>else PORTB = 0;</code> var, buton bırakılınca LED söner. Slayt 16\'da else yok: LED\'ler RD1\'e basılana kadar <b>yanık kalır</b> (mandal davranışı). İki giriş pini olduğu için <code>TRISD = 0b00000011</code>.' }
        ],
        checks: [
          { q: 'D portunun 0 numaralı pinindeki butona basılınca RB3\'teki LED\'i yakan programı yazınız.', a: 'TRISB = 0; TRISD = 0b00000001; while(1){ if(PORTD.F0==1) PORTB.F3=1; else PORTB.F3=0; } (Uygulama 11)' },
          { q: 'Polling nedir, dezavantajı nedir?', a: 'CPU\'nun girişi döngü içinde sürekli kontrol etmesi. CPU başka işle (gecikme vb.) meşgulken olay geç fark edilir veya kaçırılır; ayrıca CPU sürekli meşgul olur.' },
          { q: 'B portunun 5 numaralı pini giriş olacak, diğer pinler çıkış. TRISB = ?', a: '0010 0000 = 0x20.' }
        ]
      },
      {
        id: 'fonksiyon',
        title: 'Fonksiyonlarla Desen: Uygulama 14',
        src: 'Uygulama 14 (_.c)',
        minutes: 5,
        blocks: [
          { t: 'p', html: 'Tekrar eden işleri <b>fonksiyona</b> koymak kodu okunur yapar. Buton basılıyken tek indisli, değilken çift indisli LED\'ler yanıp söner:' },
          { t: 'codex', rows: [
            ['void yaksondur_tek() {\n PORTB=0b10101010;\n Delay_ms(1000);\n PORTB=0;\n Delay_ms(1000);\n}', '<b>Tek</b> indisli pinler: RB1, RB3, RB5, RB7 (0xAA). Fonksiyon dönüş değeri olmadığı için <code>void</code>.'],
            ['void yaksondur_cift() {\n PORTB=0b01010101;\n ...\n}', '<b>Çift</b> indisli pinler: RB0, RB2, RB4, RB6 (0x55).'],
            ['if(PORTD.F0==1){\n  yaksondur_tek();\n}else{\n  yaksondur_cift();\n}', 'Fonksiyon çağrısı: dönüş adresi <b>donanım yığınına</b> yazılır, fonksiyon bitince (RETURN) oraya dönülür.']
          ] },
          { t: 'dg', id: 'run', app: 'u14' },
          { t: 'note', kind: 'extra', html: 'PIC16F877A\'nın yığını <b>8 seviyeli</b>dir: iç içe 8\'den fazla fonksiyon çağrısı (kesmeler dahil) yapılırsa en eski dönüş adresi kaybolur. Bu yüzden derin iç içe çağrılardan ve özyinelemeden (recursion) kaçınılır.' }
        ],
        checks: [
          { q: '0b10101010 değerinde hangi pinler yanar? Neden "tek" denmiş?', a: 'RB1, RB3, RB5, RB7: indis numarası tek olan pinler.' }
        ]
      },
      {
        id: 'deney3',
        title: 'Deney 3: PORT Yapıları ve G/Ç Uygulaması',
        src: 'Deney 3 föyü',
        minutes: 10,
        lab: true,
        blocks: [
          { t: 'note', kind: 'lab', html: '<b>Amaç:</b> Port yapılarının çalışmasını öğrenmek; simülasyon programı (SimulIDE) ve deney kiti (EasyPIC v7) üzerinde giriş/çıkış uygulaması yapmak. Ayarlar: PIC16F877A, <b>8 MHz, HS, Watchdog Disabled, Build Type: Release</b>.' },
          { t: 'solve', title: 'Föy örnek 2', q: '<code>TRISD = 0xAA;</code> atanınca D portunun hangi pinleri giriş, hangileri çıkış olur?', a: '<p>0xAA = 1010 1010 → RD7 giriş, RD6 çıkış, RD5 giriş, RD4 çıkış, RD3 giriş, RD2 çıkış, RD1 giriş, RD0 çıkış. <b>Tek indisler giriş, çift indisler çıkış.</b></p>' },
          { t: 'h', text: 'Föy örnek 3: iki buton, iki LED' },
          { t: 'p', html: 'D portunun 2 ve 3 nolu pinlerine buton bağlı. RD2\'ye basılınca bir LED yanar (diğeri söner), RD3\'e basılınca tersi:' },
          { t: 'dg', id: 'run', app: 'd3' },
          { t: 'note', kind: 'fix', html: 'Föyün soru metni LED\'ler için "<b>1 ve 7 nolu</b> pinler" diyor; verilen çözüm kodu ve yorumları ise <b>D0 ve D7</b> kullanıyor (<code>TRISD = 0b01111110</code> da RD0 ve RD7\'yi çıkış yapar). Kod kendi içinde tutarlı; soru metnindeki "1" aslında "0" olmalı.' },
          { t: 'h', text: 'İşlem basamakları' },
          { t: 'list', ordered: true, items: [
            'Kodu mikroC\'de yaz ve derle (.hex proje klasöründe oluşur)',
            'SimulIDE\'de devreyi kur (PIC, kristal + 2×22 pF, LED + 330 Ω, buton + pull-down direnci)',
            '.hex dosyasını mikrodenetleyiciye yükle, saat frekansını <b>8 MHz</b> gir, simülasyonu çalıştır',
            'EasyPIC v7\'yi USB ile bağla, ON/OFF\'u ON yap (LINK ışığı)',
            '<b>Build → Build and Program</b> ile kiti programla; D portu LED anahtarı <b>LEDS ON</b> olmalı',
            'ICD için Build Type: <b>ICD Debug</b>, tekrar programla; <b>Run → Start Debugger</b> ile adım adım izle'
          ] },
          { t: 'h', text: 'Föy sorusu 1: iki butona aynı anda basılınca' },
          { t: 'p', html: 'D7 ve D0 pinlerine bağlı 2 butona aynı anda basılınca D4 ve D5\'teki LED\'leri yakan kod:' },
          { t: 'dg', id: 'run', app: 'd3s' }
        ],
        checks: [
          { q: 'TRISD = 0b01111110 ne anlama gelir?', a: 'RD7 ve RD0 çıkış (0), RD1–RD6 giriş (1).' },
          { q: 'D7 ve D0\'daki iki butona aynı anda basılınca D4 ve D5 LED\'lerini yakan kodun TRISD değeri ve koşulu nedir?', a: 'TRISD = 0b10000001 (0x81); koşul if(PORTD.F7==1 && PORTD.F0==1) { PORTD.F4=1; PORTD.F5=1; } else { ikisini 0 yap }.' }
        ]
      }
    ]
  });
})(window.MC);
