/*
 * ch8-7seg.js — Bölüm 8: 7 segment display uygulamaları (hafta 7, 11 Kasım 2026).
 * Kaynak: hafta 7 sunumu slayt 1–15, hocanın GitHub'ındaki Uygulama 21–26 (aynı gün eklendi).
 */
(function (MC) {
  'use strict';

  // Slayttaki bağlantı: a = RB7 … g = RB1, dp = RB0. Ortak katot kodları; ortak anot = bit bit tersi.
  const LIT = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  const cc = (s) => [...s].reduce((v, c) => v | (1 << (7 - 'abcdefg'.indexOf(c))), 0);
  const bin = (v) => v.toString(2).padStart(8, '0').replace(/(\d{4})/, '$1 ');
  const hx = (v) => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
  const codeRows = LIT.map((s, d) => [String(d), [...s].join(', '), `<code>${bin(cc(s))}</code>`, hx(cc(s)), `<code>${bin(~cc(s) & 255)}</code>`, hx(~cc(s) & 255)]);

  MC.lessons.chapters.push({
    id: 'ch8',
    num: 8,
    title: '7 Segment Display Uygulamaları',
    short: '7 segment',
    navSub: 'Ortak anot/katot, sürücü, multiplexing',
    week: 'Hafta 7',
    source: 'Hafta 7 sunumu, slayt 1–15 · Uygulama 21–26',
    objectives: [
      'PORTB\'ye yazılan bir sayının bitlerinin segmentleri nasıl yaktığını (sinyalleşmeyi) adım adım anlatmak',
      'Ortak katot ve ortak anot göstergede herhangi bir rakamın PORT değerini hesaplamak',
      '0–9 sayan programı hem 10 satırla hem dizi ile yazmak (Uygulama 21–22)',
      'BCD → 7 segment sürücünün ne işe yaradığını ve kodu nasıl kısalttığını açıklamak (Uygulama 23–24)',
      'Bir sayıyı /10, %10 ile basamaklara ayırıp iki sürücüye tek PORTB yazımıyla göndermek (Uygulama 25)',
      'Multiplexing\'i tanımlamak; 4 haneli 0–9999 sayıcının kodunu ve butonun tek sayım yapmasını açıklamak (Uygulama 26)'
    ],
    outline: {
      topics: [['Yapı ve sinyalleşme: sayı segmentlere nasıl gider?', 'yapi'], ['Örnek: 0–9 sayan gösterge (Uygulama 21, 22)', 'ornek'], ['7 segment sürücü: BCD ile 4 pin (Uygulama 23, 24)', 'surucu'], ['0–99 sayıcı: basamaklara ayırma (Uygulama 25)', 'sayac99'], ['Multiplexing: 4 haneli 0–9999 sayıcı (Uygulama 26)', 'mux']],
      concepts: ['Segment a–g, dp', 'Ortak katot (common cathode)', 'Ortak anot (common anode)', 'Segment kodu tablosu', '~ ile ortak anot kodu', 'Dizi ile kod tablosu', 'BCD', 'BCD → 7 segment sürücü (7448 / 74LS248)', '/10 ve %10', '×16 = <<4', 'Multiplexing', 'Hane seçimi (aktif 0)', 'Göz yanılması (kalıcılık)', 'Kenar algılama (pd0, pd1)'],
      why: 'Bu haftanın konusu ve hoca kodlarını aynı gün GitHub\'a koydu. "Şu sayıyı göstergede gösteren kodu yazınız" ve "ortak anotta 5 için PORTB kaçtır" tipi sorular vizeye çok uygun. Uygulama 25–26, Bölüm 5\'teki buton okumayı ve Bölüm 4\'teki / ve % operatörlerini birleştiriyor.'
    },
    lessons: [
      {
        id: 'yapi',
        title: 'Yapı ve Sinyalleşme: Sayı Segmentlere Nasıl Gider?',
        src: 'slayt 2–3, 6',
        minutes: 11,
        blocks: [
          { t: 'p', html: '7 segment display, <b>7 adet çubuk şeklinde LED</b> (a, b, c, d, e, f, g) ve bir <b>nokta</b> (dp) ile rakam gösteren bir göstergedir. Her segment ayrı bir LED\'dir; hangi segmentlerin yanacağını mikrodenetleyicinin pinleri belirler.' },
          { t: 'def', term: 'Ortak katot', en: 'Common cathode', html: 'Bütün LED\'lerin <b>katotları birleştirilip GND\'ye</b> bağlanır. Bir segmentin yanması için onun pinine <b>1 (5 V)</b> verilir.' },
          { t: 'def', term: 'Ortak anot', en: 'Common anode', html: 'Bütün LED\'lerin <b>anotları birleştirilip +5 V\'a</b> bağlanır. Bir segmentin yanması için onun pinine <b>0 (0 V)</b> verilir.' },
          { t: 'h', text: 'Sayıyı porta göndermek: sinyal nasıl oluşur?' },
          { t: 'p', html: 'Slayttaki devrede (slayt 3) bağlantı: <b>RB7 → a, RB6 → b, RB5 → c, RB4 → d, RB3 → e, RB2 → f, RB1 → g</b> (RB0 = dp, kullanılmıyor). "2" rakamını ortak katotlu göstergede yazmak için:' },
          { t: 'list', ordered: true, items: [
            '<b>Şekli çiz:</b> 2 için yanan segmentler <b>a, b, d, e, g</b>.',
            '<b>Pinleri bul:</b> a = RB7, b = RB6, d = RB4, e = RB3, g = RB1 → bu bitler <b>1</b>, diğerleri 0.',
            '<b>Sayıyı yaz:</b> RB7…RB0 = 1101 1010 = <b>0xDA</b> → <code>PORTB = 0b11011010;</code>',
            '<b>Ne olur?</b> CPU bu sayıyı PORTB kaydedicisine yazar; her bit kendi pinini 5 V ya da 0 V yapar. 5 V olan pinden LED\'e, oradan ortak katot üzerinden GND\'ye <b>akım geçer</b> ve o segment yanar. 0 V olan pinde gerilim farkı yok, akım yok, segment sönük.'
          ] },
          { t: 'dg', id: 'seg7', digit: 2 },
          { t: 'note', kind: 'exam', html: '"Sayıları belli bir yere gönderdiğimizde nasıl sinyalleşiyor?" sorusunun cevabı bu: <b>sayı = pinlerin gerilim deseni</b>. PORTB\'ye yazılan her 1, o pinden 5 V çıkması demek. Göstergede ise o pin bir LED\'e bağlı olduğu için desen ışığa dönüşür. Ortak anotta aynı mantık ters işler: 0 yazılan pin LED\'i yakar.' },
          { t: 'h', text: 'Kod tablosu (slayt 5–6)' },
          { t: 'table', head: ['Rakam', 'Yanan segmentler', 'Ortak katot', 'Hex', 'Ortak anot', 'Hex'], rows: codeRows },
          { t: 'note', kind: 'exam', html: '<b>Ezberleme, türet:</b> şekli çiz → yanan segmentleri a…g sırasıyla 1 yaz → RB0 (dp) = 0 ekle. Ortak anot kodu aynı bağlantıda ortak katot kodunun <b>bit bit tersidir</b>: <code>PORTB = ~0xDA;</code> = 0x25. Slayt 6\'daki ortak anot kodları bunu doğruluyor (dp biti de terslendiği için 1, yani nokta sönük).' },
          { t: 'note', kind: 'extra', html: 'Gerçek devrede her segmente <b>akım sınırlama direnci</b> (ör. 330 Ω) konur; slayttaki simülasyonda yok. PIC\'in bir pini en fazla 25 mA verebilir.' }
        ],
        checks: [
          { q: 'Ortak katotlu göstergede (a = RB7 … g = RB1) 7 rakamı için PORTB kaç olmalı?', a: '7 → a, b, c yanık → 1110 0000 = 0xE0.' },
          { q: 'Ortak anotlu göstergede PORTB = 0b10011111 hangi rakamı gösterir?', a: 'Ortak anotta 0 olan pinler yanar: RB6 (b) ve RB5 (c) → "1". (Tersi 0110 0000 = ortak katotta 1\'in kodu.)' },
          { q: 'Ortak katot ile ortak anot arasındaki fark nedir? Segment ne zaman yanar?', a: 'Ortak katotta LED katotları GND\'ye bağlı, segment pini 1 (5 V) olunca yanar. Ortak anotta anotlar +5 V\'a bağlı, segment pini 0 (0 V) olunca yanar. Aynı bağlantıda kodlar birbirinin bit bit tersidir.' }
        ]
      },
      {
        id: 'ornek',
        title: 'Örnek: 0–9 Sayan Gösterge',
        src: 'slayt 4–6 · Uygulama 21, 22',
        minutes: 8,
        blocks: [
          { t: 'p', html: '<b>Slayt 4:</b> 16F877 mikrodenetleyicisinin B portuna bağlı olan 7 segment display üzerinde 0\'dan başlayarak 9\'a kadar tüm rakamları <b>1 sn aralıklarla</b> görüntüleyen programı yazıp devreyi çalıştıralım. 9\'dan sonra sayma tekrar 0\'a dönüp devam edecektir.' },
          { t: 'p', html: 'Hocanın çözümü her rakam için iki satır yazar (PORTB = kod; Delay_ms(1000);): Uygulama 21 ortak katot, 22 ortak anot. Üçüncü sekme aynı işi dizi ve for ile yapar:' },
          { t: 'dg', id: 'run', apps: ['u21', 'u22', 'segdizi'] },
          { t: 'note', kind: 'exam', html: 'Sınavda <b>dizi + for</b> ile yazmak daha kısa ve hata payı daha az: <code>char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,0xB6,0xBE,0xE0,0xFE,0xF6};</code> sonra <code>PORTB = kod[i];</code>. Ortak anot için yalnızca <code>PORTB = ~kod[i];</code>. Rakam ile dizi indisi aynı olduğu için "sayaç değerini göster" demek <code>PORTB = kod[sayac];</code> demek.' },
          { t: 'solve', title: 'Varyant', q: 'Ortak katotlu göstergede yalnızca çift rakamları (0, 2, 4, 6, 8) 500 ms aralıkla sırayla gösteren programı yazınız.', a: '<pre class="l-code">char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,0xB6,0xBE,0xE0,0xFE,0xF6};\nint i;\nvoid main() {\n TRISB = 0;\n while(1){\n  for(i=0;i&lt;10;i=i+2){\n   PORTB = kod[i];\n   Delay_ms(500);\n  }\n }\n}</pre><p>Tek fark: döngü 2\'şer artıyor. Dizi yerine 5 ayrı satır (0xFC, 0xDA, 0x66, 0xBE, 0xFE) da doğru.</p>' }
        ],
        checks: [
          { q: 'Uygulama 21\'i ortak anotlu göstergeye uyarlamak için ne değişir?', a: 'Her PORTB değeri bit bit terslenir (Uygulama 22): 0xFC → 0x03, 0x60 → 0x9F … Dizi kullanılıyorsa yalnızca PORTB = ~kod[i];' },
          { q: '0–9\'u dizi kullanarak 1 sn aralıkla gösteren programın döngüsünü yazınız.', a: 'for(i=0;i<10;i++){ PORTB = kod[i]; Delay_ms(1000); } — kod[] ortak katot kodları, TRISB = 0.' }
        ]
      },
      {
        id: 'surucu',
        title: '7 Segment Sürücü: BCD ile 4 Pin',
        src: 'slayt 7–9 · Uygulama 23, 24',
        minutes: 9,
        blocks: [
          { t: 'def', term: '7 segment sürücü', en: 'BCD to 7-segment decoder', html: 'Girişine 4 bitlik <b>BCD</b> sayı (A, B, C, D) uygulanan ve a–g çıkışlarını <b>kendisi</b> üreten entegre. Slayttaki devrede <b>74XX248</b> (ortak katot için; ortak anot için 7447 türü kullanılır).' },
          { t: 'compare', cols: [
            { title: 'Doğrudan sürme (Uyg. 21–22)', items: ['Bir hane için 7–8 pin', 'Programda segment kod tablosu gerekir', 'Ek entegre yok'] },
            { title: 'Sürücü ile (Uyg. 23–24)', items: ['Bir hane için <b>4 pin</b> (RB3…RB0)', 'PORTB\'ye <b>sayının kendisi</b> yazılır: <code>PORTB = 5;</code>', 'Ek entegre (7448/74LS248) gerekir'] }
          ] },
          { t: 'table', head: ['Sayı', 'D (RB3)', 'C (RB2)', 'B (RB1)', 'A (RB0)'], rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), ...[3, 2, 1, 0].map((b) => String((n >> b) & 1))]) },
          { t: 'dg', id: 'seg7', mode: 'bcd', digit: 5, title: 'Sürücü ile: RB3…RB0 bitlerine tıkla' },
          { t: 'h', text: 'Slayt 9: bir önceki devreyi sürücüyle yapalım' },
          { t: 'p', html: '<b>Uygulama 23</b> aynı 0–9 sayımını yapar ama segment kodu yerine 0, 1, 2 … 9 yazar. <b>Uygulama 24</b> RD0 butonu basılı tutulduğu sürece saniyede bir sayar:' },
          { t: 'dg', id: 'run', apps: ['u23', 'u24'] },
          { t: 'note', kind: 'exam', html: 'Uygulama 24\'te <code>Delay_ms(1000)</code> <b>if\'in içinde</b>: buton basılı değilken bekleme yok, program butonu sürekli yoklar. Basılı tutunca her saniye 1 artar. <code>TRISD = 1</code> → yalnızca RD0 giriş.' },
          { t: 'note', kind: 'extra', html: '10–15 (1010–1111) BCD değildir; 7448 bu girişlerde rakam olmayan şekiller gösterir. Bu yüzden 9\'dan sonra mutlaka 0\'a dönülür.' }
        ],
        checks: [
          { q: 'Sürücülü göstergede 6 rakamı için PORTB kaç yazılır? Doğrudan sürmede (ortak katot) kaç?', a: 'Sürücüyle PORTB = 6 (0000 0110). Doğrudan ortak katotta 0xBE (a, c, d, e, f, g).' },
          { q: 'BCD → 7 segment sürücü kullanmanın avantajı nedir?', a: 'Bir hane için 7 yerine 4 pin yeter; programda segment kodu tablosu gerekmez, sayı doğrudan yazılır. Bedeli: ek bir entegre.' }
        ]
      },
      {
        id: 'sayac99',
        title: '0–99 Sayıcı: Basamaklara Ayırma',
        src: 'slayt 10–11 · Uygulama 25',
        minutes: 10,
        blocks: [
          { t: 'p', html: '<b>Örnek 3:</b> 0–99 sayan 7 segment gösterge. İki sürücü PORTB\'yi paylaşır: <b>onlar</b> basamağı RB7…RB4\'e, <b>birler</b> RB3…RB0\'a bağlı. RD1 butonu yukarı, RD0 aşağı sayar.' },
          { t: 'codex', title: 'seven_segment_goster(): bir sayıyı iki BCD haneye bölmek', rows: [
            ['onlar=sayac/10;', 'Tam sayı bölme: 57 / 10 = <b>5</b>'],
            ['birler=sayac%10;', 'Kalan: 57 % 10 = <b>7</b>'],
            ['onlar=onlar*16;', '×16 = 4 bit sola kaydırma (<code>&lt;&lt;4</code>): 5 → 0x50, üst 4 bite taşındı'],
            ['veri=onlar^birler;', '0x50 ^ 0x07 = <b>0x57</b>. Bitler çakışmadığı için ^, | ve + aynı sonucu verir'],
            ['portb=veri;', 'RB7…RB4 = 0101 → üst sürücü "5", RB3…RB0 = 0111 → alt sürücü "7"']
          ] },
          { t: 'dg', id: 'run', app: 'u25' },
          { t: 'note', kind: 'fix', html: 'Slayt 10\'daki kod yukarı butonunu <code>portd.f7</code> ile okuyor; slayt 11\'deki devrede butonlar <b>RD0 ve RD1</b>\'e bağlı ve hocanın GitHub\'daki Uygulama 25\'i de <code>portd.f1</code> kullanıyor. Doğrusu <b>RD1</b>. Ayrıca <code>init()</code> ve <code>seven_segment_goster()</code> dönüş tipi yazılmadan tanımlanmış; mikroC kabul ediyor ama sınavda <code>void</code> yazmak doğru olan.' },
          { t: 'note', kind: 'exam', html: 'Basamak ayırma kalıbı: 2 basamak <code>/10</code>, <code>%10</code>. 4 basamak <code>/1000</code>, <code>(%1000)/100</code>, <code>(%100)/10</code>, <code>%10</code>. <code>sayac</code> <b>signed int</b> olmalı: aşağı sayarken −1\'e düşüp <code>if(sayac&lt;0)</code> ile 99\'a dönebilmesi için. Butona basılı tutunca 500 ms\'de bir sayar (otomatik tekrar).' }
        ],
        checks: [
          { q: 'Uygulama 25\'te sayac = 83 iken PORTB kaç olur?', a: 'onlar = 8 → ×16 = 0x80; birler = 3; veri = 0x83 (1000 0011).' },
          { q: 'onlar = onlar*16 satırı yerine hangi operatör kullanılabilir? Neden 16?', a: 'onlar = onlar << 4. 16 = 2⁴: sayı 4 bit sola kayar ve üst sürücünün bağlı olduğu RB7…RB4\'e gelir.' },
          { q: 'sayac unsigned int tanımlansaydı aşağı sayarken ne olurdu?', a: '0\'dan 1 azaltınca 65535 olurdu; if(sayac<0) hiç doğru olmaz, 99\'a dönülmezdi. Gösterge anlamsız değer (6553 / 5 …) gösterirdi.' }
        ]
      },
      {
        id: 'mux',
        title: 'Multiplexing: 4 Haneli Gösterge',
        src: 'slayt 12–15 · Uygulama 26',
        minutes: 12,
        blocks: [
          { t: 'def', term: 'Multiplexing', en: 'Çoğullama', html: 'Birden fazla göstergeli bir 7 segment display dizisinin içerisindeki <b>her bir haneyi tek mikrodenetleyici portu üzerinden</b> kontrol etme işlemi. Haneler sırayla, çok kısa sürelerle yakılır.' },
          { t: 'p', html: 'Her hane bir pin üzerinden seçilir. Ortak katotlu displayde aktif edilmek istenen haneyi kontrol eden pin <b>0 V</b> yapılır, veri ise <b>1 = LED yanık</b> olarak gönderilir. Ortak anotlu displayde durum tam tersidir (slayt 12).' },
          { t: 'list', ordered: true, items: ['<b>Haneyi seç:</b> <code>PORTC = 0b11101111;</code> (yalnızca RC4 = 0 → birler hanesi)', '<b>Veriyi gönder:</b> <code>PORTB = birler;</code> (sürücüye BCD)', '<b>Bekle:</b> <code>Delay_ms(1);</code>', '<b>Sonraki hane:</b> RC5 (onlar), RC6 (yüzler), RC7 (binler)… ve başa dön'] },
          { t: 'p', html: 'Bir tur 4 × 1 ms = 4 ms: her hane saniyede 250 kez yanar. Göz yaklaşık 20 ms\'den kısa sönmeleri fark etmediği için <b>dört hanenin hepsini sürekli yanıyor</b> görür. Simülatörü <b>Ağır çekim</b>de çalıştır ve aynı anda yalnızca bir hanenin gerçekten yandığını gör:' },
          { t: 'dg', id: 'run', app: 'u26' },
          { t: 'note', kind: 'exam', html: '<b>Uygulama 25 ile 26\'nın buton farkı:</b> 25\'te basılı tutmak 500 ms\'de bir sayar. 26\'da <code>pd1</code> bayrağı var: <code>if(portd.f1==1 &amp;&amp; pd1==0)</code> yalnızca <b>yeni basışta</b> doğru olur, bırakınca <code>pd1=0</code>. Yani bir basış = bir sayım (kenar algılama).' },
          { t: 'note', kind: 'extra', html: 'Butona basınca <code>delay_ms(100)</code> sürerken tarama durur: son seçilen hane (binler) yanık kalır, diğerleri söner, gösterge kısa bir an titrer. Daha iyi çözüm taramayı <b>Timer0 kesmesine</b> koymak (Bölüm 7): her 1 ms\'lik kesmede bir sonraki haneyi yak. Pin sayısı: 4 hane doğrudan sürülseydi 28 pin; multiplexing + sürücüyle 4 (veri) + 4 (seçim) = <b>8 pin</b>.' },
          { t: 'solve', title: 'Slayt 14 örnek sorusu', q: '0 ile 9999 arası sayıcı devre tasarlanacak. D portuna bağlı 2 butondan aşağı ve yukarı sayma sağlanacak. 4\'lü seven segment display C portundan kontrol edilecek. Gerekli devreyi tasarlayarak kodu yazınız.', a: '<p><b>Devre:</b> RD1 (yukarı) ve RD0 (aşağı) butonları pull-down dirençlerle; RB3…RB0 → BCD sürücünün A…D girişleri → a–g tüm hanelerde ortak; RC7…RC4 → 4 hanenin ortak katotları (RC7 binler … RC4 birler).</p><p><b>Kod:</b> Uygulama 26. İskelet: <code>init()</code> (TRISB = 0, TRISC = 0, TRISD = 0xFF) · basamaklara ayır (/1000, %1000/100, %100/10, %10) · her hane için PORTC seç → PORTB veri → Delay_ms(1) · butonlarda <code>pd</code> bayrağıyla tek sayım, 9999\'dan sonra 0, 0\'dan önce 9999.</p>' }
        ],
        checks: [
          { q: 'Multiplexing nedir? Ortak katotlu göstergede bir haneyi seçmek için hane pini ne olmalı?', a: 'Çok haneli göstergede her haneyi tek port üzerinden sırayla, kısa sürelerle yakarak kontrol etmek. Ortak katotta seçilen hanenin pini 0 V, veri 1 = yanık. Ortak anotta tersi.' },
          { q: 'Uygulama 26\'da sayac = 4729 iken yuzler ve onlar kaçtır?', a: 'yuzler = (4729 % 1000) / 100 = 729 / 100 = 7. onlar = (4729 % 100) / 10 = 29 / 10 = 2.' },
          { q: 'Aynı anda yalnızca bir hane yandığı halde neden dördü de yanıyor görünür?', a: 'Her hane 4 ms\'de bir (250 Hz) yeniden yakılır. Göz ~20 ms\'den kısa sönmeleri fark etmez (görüntü kalıcılığı), bu yüzden hepsini sürekli yanık görür.' },
          { q: 'Uygulama 26\'daki pd1 değişkeni ne işe yarar?', a: 'Butonun önceki turda basılı olup olmadığını tutar. Yalnızca basılı ve pd1 == 0 iken sayılır, sonra pd1 = 1; buton bırakılınca pd1 = 0. Böylece basılı tutmak tek sayım yapar.' }
        ]
      }
    ]
  });
})(window.MC);
