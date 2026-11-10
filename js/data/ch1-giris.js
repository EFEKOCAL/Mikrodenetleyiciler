/*
 * ch1-giris.js — Bölüm 1: Mikrodenetleyiciye giriş.
 * Kaynak: mikrodenetleyici_ders_sunumhafta1_2.pptx slayt 6–28, Deney 1 föyü (teori kısmı).
 * Blok türleri için learn-view.js'e bakınız.
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch1',
    num: 1,
    title: 'Mikrodenetleyiciye Giriş',
    short: 'Giriş',
    navSub: 'μC nedir, CPU, anayollar, mimari',
    week: 'Hafta 1–2',
    source: 'Hafta 1–2 sunumu, slayt 6–28 · Deney 1 teori',
    objectives: [
      'Mikrodenetleyicinin 3 temel kısmını saymak ve mikroişlemciden farkını açıklamak',
      'Makine döngüsünü ve bir gidip-getirme (fetch) döngüsünün adımlarını sırayla anlatmak',
      'Adres, veri ve kontrol anayollarının görevini söylemek; n adres hattıyla kaç adres tanımlanır hesaplamak',
      'Mikrodenetleyicileri anayol genişliği, mimari, komut seti ve bellek tipine göre sınıflandırmak',
      'PIC16F877A\'yı bu dört ölçüte göre tanımlamak',
      'Assembler ile derleyicinin farkını ve programlama adımlarını açıklamak'
    ],
    outline: {
      topics: [['Mikrodenetleyici nedir, mikroişlemciden farkı', 'nedir'], ['CPU ve makine döngüsü', 'cpu'], ['Anayollar ve gidip-getirme döngüsü', 'anayol'], ['Mikrodenetleyici tipleri: anayol, mimari, komut seti, bellek', 'tipler'], ['PIC16F877A ve mikrodenetleyici seçimi', 'pic'], ['Programlama: assembly, derleyici, .hex', 'programlama']],
      concepts: ['Mikrodenetleyici (μC)', 'Mikroişlemci', 'CPU', 'Fetch / decode / execute', 'Makine döngüsü', 'Saat darbesi', 'Program sayacı (PC)', 'Komut kaydedicisi', 'Adres / veri / kontrol anayolu', '2ⁿ adres', 'Von Neumann', 'Harvard', 'CISC / RISC / SISC', 'Gömülü bellek', 'Assembler', 'Derleyici', '.hex dosyası', 'Programlayıcı'],
      why: 'Bu bölüm dersin "sözel" kısmının temelidir. Hocanın konu özeti sorularının (slayt 37) yarısı buradan.'
    },
    lessons: [
      {
        id: 'nedir',
        title: 'Mikrodenetleyici Nedir?',
        src: 'slayt 6–11',
        minutes: 6,
        blocks: [
          { t: 'def', term: 'Mikrodenetleyici', en: 'Microcontroller (μC)', html: '<b>Düşük kapasiteli bir bilgisayarın entegreye dönüşmüş halidir.</b> CPU, bellek ve giriş/çıkış birimi tek bir entegre devrenin (chip) içindedir.' },
          { t: 'h', text: 'Üç temel kısım' },
          { t: 'p', html: 'Bir mikrodenetleyici 3 temel kısımdan oluşur:' },
          { t: 'list', ordered: true, items: ['<b>Merkezi İşlem Birimi (CPU)</b>: komutları işleyen beyin', '<b>Hafıza</b>: RAM (geçici veri) ve ROM (program)', '<b>Giriş/Çıkış (I/O) birimi</b>: dış dünyayla bağlantı'] },
          { t: 'note', kind: 'exam', html: 'Slayt 37\'nin ilk iki sorusu: <b>"Mikrodenetleyici nedir?"</b> ve <b>"Genel yapısı nelerden oluşur?"</b> Cevap: tanım cümlesi + bu 3 kısım.' },
          { t: 'h', text: 'Mikrodenetleyici ve mikroişlemci' },
          { t: 'p', html: 'İki modu karşılaştır. Bloklara tıklayınca görevleri çıkar:' },
          { t: 'dg', id: 'mcu' },
          { t: 'compare', cols: [
            { title: 'Mikroişlemci (μP)', items: ['Yalnızca <b>CPU</b>dan oluşan entegre devre', 'RAM, ROM, G/Ç dışarıdan eklenir', 'Güçlü, genel amaçlı (PC, sunucu)'] },
            { title: 'Mikrodenetleyici (μC)', items: ['<b>RAM, ROM, G/Ç birimi ve CPU</b>dan oluşan entegre devre', 'Tek çip yeter: az parça, ucuz, az enerji', 'Tek bir işe adanmış (gömülü sistem)'] }
          ] },
          { t: 'h', text: 'Kullanım alanları' },
          { t: 'p', html: 'Bir cihaz bir şeyi <b>ölçüp karar verip bir şeyi sürüyorsa</b> içinde büyük ihtimalle mikrodenetleyici vardır:' },
          { t: 'list', items: ['Beyaz eşya: çamaşır makinesi, buzdolabı, mikrodalga fırın', 'Otomotiv: motor kontrol, ABS, hava yastığı, cam/kapı kontrolü', 'Tüketici elektroniği: kumanda, oyuncak, akıllı saat', 'Endüstri: makine kontrolü, sensör ve motor sürme', 'Tıbbi cihazlar, güvenlik sistemleri, IoT cihazları'] }
        ],
        checks: [
          { q: 'Bir mikrodenetleyicinin 3 temel kısmı nedir?', a: '1) Merkezi işlem birimi (CPU), 2) Hafıza (RAM, ROM), 3) Giriş/Çıkış (I/O) birimi.' },
          { q: 'Mikroişlemci ile mikrodenetleyici arasındaki fark nedir?', a: 'Mikroişlemci yalnızca CPU\'dan oluşan bir entegredir; bellek ve G/Ç dışarıdan eklenir. Mikrodenetleyici ise RAM, ROM, G/Ç birimi ve CPU\'yu tek entegrede toplar.' },
          { q: 'Bir çamaşır makinesinde neden mikroişlemci + ayrı bellek yerine mikrodenetleyici kullanılır?', a: 'Tek çip yeterli olduğu için daha ucuz, daha küçük ve daha az enerji harcar; çamaşır makinesinin işi (sensör oku, motor/valf sür) büyük işlem gücü gerektirmez.' }
        ]
      },
      {
        id: 'cpu',
        title: 'CPU ve Makine Döngüsü',
        src: 'slayt 12–14',
        minutes: 6,
        blocks: [
          { t: 'def', term: 'Merkezi İşlem Birimi', en: 'CPU', html: 'Bilgisayar ve mikrodenetleyicilerin <b>beynidir</b>. Sistemdeki bütün aktiviteleri kontrol eder ve veri üzerindeki bütün işlemleri yapar.' },
          { t: 'list', items: [
            'Sürekli olarak iki işlem yapar: komutları <b>gidip getirme (fetch)</b> ve <b>işleme</b>.',
            '<b>Komut kümesi</b> (instruction set) denen ikili kodlardan oluşan komutları anlar ve istenen işlemi gerçekleştirir.'
          ] },
          { t: 'h', text: 'İşlemcinin içindekiler (slayt 13)' },
          { t: 'table', head: ['Birim', 'Görevi'], rows: [
            ['<b>ALU</b> (Aritmetik Lojik Birim)', 'Toplama, çıkarma (aritmetik) ve AND, OR (lojik) işlemleri'],
            ['<b>Kontrol birimi</b> + kod çözücü', 'Komutu çözer, diğer birimlere ne yapacaklarını söyler'],
            ['<b>Kaydediciler</b> (register)', 'CPU içindeki çok hızlı küçük bellek hücreleri (PIC\'te W)'],
            ['<b>Program sayacı (PC)</b>', 'Sıradaki komutun bellekteki adresini tutar'],
            ['<b>Komut kaydedicisi (IR)</b>', 'Bellekten getirilen, çözülmeyi bekleyen komut kodu']
          ] },
          { t: 'h', text: 'Makine döngüsü' },
          { t: 'p', html: 'Bir komutu işlemek için işlemci:' },
          { t: 'list', ordered: true, items: [
            'Bellekten komutu <b>gidip getirmelidir</b> (fetch)',
            'Komuttaki kodu <b>çözmelidir</b> (decode)',
            'Komutun belirttiği işlemi <b>gerçekleştirmelidir</b> (execute)',
            'İşlem sonucu çıkan değeri belleğe <b>yazmalıdır</b> (write back)'
          ] },
          { t: 'p', html: 'Bu döngü <b>makine döngüsüdür</b>. Bir makine döngüsü = X saat (clock) darbesinden oluşur; X komuta bağlı olarak değişir ve işlem süresini belirler.' },
          { t: 'note', kind: 'extra', html: 'PIC16F877A\'da bir komut döngüsü <b>4 saat darbesidir</b> (Q1–Q4). 4 MHz osilatörde bir komut 4 / 4 MHz = <b>1 µs</b> sürer. Atlama (GOTO, CALL) komutları 2 döngü sürer. Bu "4" Zamanlayıcılar bölümündeki formülde tekrar karşına çıkacak.' }
        ],
        checks: [
          { q: 'Makine döngüsünü açıklayınız. (slayt 37)', a: 'Bir komutu işlemek için işlemcinin yaptığı 4 adımlık döngü: 1) komutu bellekten gidip getirme (fetch), 2) komutu çözme (decode), 3) komutun belirttiği işlemi gerçekleştirme (execute), 4) sonucu belleğe yazma. Bir makine döngüsü komuta bağlı olarak X saat darbesinden oluşur.' },
          { q: 'İşlemci ne iş yapar? (slayt 37)', a: 'Sistemdeki bütün aktiviteleri kontrol eder, veri üzerindeki bütün işlemleri yapar; sürekli olarak komutları gidip getirir ve işler. Komut kümesindeki ikili kodları anlayıp istenen işlemi gerçekleştirir.' },
          { q: 'Program sayacının (PC) görevi nedir?', a: 'Bellekten getirilecek sıradaki komutun adresini tutar; her gidip-getirmeden sonra otomatik olarak artar.' }
        ]
      },
      {
        id: 'anayol',
        title: 'Anayollar ve Gidip-Getirme Döngüsü',
        src: 'slayt 15–16',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'Anayol', en: 'Bus', html: 'Bir amaç doğrultusunda veri akışını sağlayan yapılar. Mikrodenetleyicilerde <b>3 anayol</b> vardır: <b>adres, veri ve kontrol</b>.' },
          { t: 'table', head: ['Anayol', 'Görevi'], rows: [
            ['<b>Adres anayolu</b>', 'Belirlenen adres bilgisini taşır. <b>n adres hattı → 2<sup>n</sup> adres</b> tanımlanabilir.'],
            ['<b>Veri anayolu</b>', 'CPU ile bellek arasında veya CPU ile G/Ç cihazları arasında veri iletişimini sağlar.'],
            ['<b>Kontrol anayolu</b>', 'Adres ve veri anayolu üzerinde taşınan verinin <b>senkronizasyonundan</b> sorumludur (OKU / YAZ sinyalleri).']
          ] },
          { t: 'p', html: '<b>Örnek (okuma-yazma):</b> CPU işlem yapacağı verinin adresini ADRES hattına yerleştirir, ardından KONTROL anayolu üzerinden okuma veya yazma sinyalini aktif eder.' },
          { t: 'h', text: '2ⁿ: kaç adres tanımlanabilir?' },
          { t: 'dg', id: 'bus' },
          { t: 'note', kind: 'fix', html: 'Slaytta "n adres hattı varsa <b>2n</b> adres" yazıyor; üs kaybolmuş. Doğrusu <b>2<sup>n</sup></b>: 16 bit → 2<sup>16</sup> = 65536 = 64K.' },
          { t: 'h', text: 'Bir gidip-getirme ve işleme döngüsünün adımları' },
          { t: 'list', ordered: true, items: [
            'Program sayacı (PC) içeriği <b>adres anayoluna</b> yerleştirilir',
            '<b>OKUMA</b> sinyali aktif edilir (kontrol anayolu)',
            'Veri (komut opcode\'u) RAM\'den okunur ve <b>veri anayoluna</b> yerleştirilir',
            'Opcode CPU\'nun içindeki <b>komut kaydedicisine</b> yüklenir',
            '<b>PC bir sonraki gidip-getirme için artırılır</b> (otomatik)'
          ] },
          { t: 'p', html: 'Aşağıda 3 komutluk küçük bir programı adım adım çalıştır. Hangi anayolun ne taşıdığını izle:' },
          { t: 'dg', id: 'fetch' },
          { t: 'note', kind: 'extra', html: 'Slayt komutun "RAM\'den" okunduğunu söyler: bu genel (Von Neumann) bilgisayar modelidir. PIC16F877A Harvard mimarisinde olduğu için komutlar ayrı bir <b>program belleğinden</b> (Flash) gelir. Adımların mantığı aynıdır.' }
        ],
        checks: [
          { q: 'Genel olarak mikrodenetleyicilerde kaç anayol bulunur? Görevleri nedir? (slayt 37)', a: '3 anayol: Adres anayolu (adres bilgisini taşır, n hat → 2ⁿ adres), Veri anayolu (CPU–bellek ve CPU–G/Ç arasında veri taşır), Kontrol anayolu (adres ve veri yolundaki aktarımın senkronizasyonu, oku/yaz sinyalleri).' },
          { q: '16 adres hattı olan bir sistemde kaç adres tanımlanabilir?', a: '2¹⁶ = 65536 = 64K adres.' },
          { q: 'Gidip-getirme döngüsünün 5 adımını sırayla say.', a: '1) PC içeriği adres anayoluna konur, 2) OKUMA sinyali aktif edilir, 3) opcode bellekten okunup veri anayoluna konur, 4) opcode komut kaydedicisine yüklenir, 5) PC bir sonraki komut için otomatik artırılır.' }
        ]
      },
      {
        id: 'tipler',
        title: 'Mikrodenetleyici Tipleri',
        src: 'slayt 17–23',
        minutes: 9,
        blocks: [
          { t: 'p', html: 'Mikrodenetleyiciler <b>4 ölçüte</b> göre sınıflandırılır: <b>anayol genişliği, mimari, komut seti ve bellek</b>.' },
          { t: 'h', text: '1) Anayol genişliğine göre' },
          { t: 'p', html: '<b>ALU\'nun sahip olduğu veri anayolunun boyutu</b> (kaç bitlik olduğu) tipi belirler: <b>4, 8, 16, 32, 64 bit</b>. "8 bitlik mikrodenetleyici" = ALU tek seferde 8 bitlik veriyle işlem yapar.' },
          { t: 'h', text: '2) Mimariye göre: Von Neumann ve Harvard' },
          { t: 'p', html: 'İki mimari veriyi, programı <b>saklama ve işleme</b> bakımından farklıdır. Zaman çizelgesini karşılaştır:' },
          { t: 'dg', id: 'arch' },
          { t: 'compare', cols: [
            { title: 'Von Neumann (Princeton)', items: ['Program ve veri <b>aynı bellekte</b>, tek yoldan', 'Avantajlar: <b>basitlik, maliyet düşüklüğü, esneklik</b> (uyumlanma)'] },
            { title: 'Harvard', items: ['Program ve veri <b>ayrı bellekte</b>, ayrı yollardan', 'Avantajlar: <b>daha hızlı işlem, daha fazla güvenlik, kaynakların verimli kullanımı</b>'] }
          ] },
          { t: 'h', text: '3) Komut setine göre' },
          { t: 'table', head: ['', 'CISC', 'RISC'], rows: [
            ['Açılım', 'Complex Instruction Set Computer', 'Reduced Instruction Set Computer'],
            ['Komut sayısı', 'Çok (yüzlerce), karmaşık', 'Az, basit (PIC16F877A: 35)'],
            ['Komut süresi', 'Farklı farklı, çok döngülü', 'Çoğu tek döngüde'],
            ['Komut uzunluğu', 'Değişken', 'Sabit (PIC: 14 bit)'],
            ['Programlama', 'Az satırla çok iş', 'Daha çok satır ama hızlı ve öngörülebilir'],
            ['Örnek', 'x86 (PC işlemcileri)', 'PIC, ARM, AVR']
          ] },
          { t: 'p', html: '<b>SISC</b> (Specific Instruction Set Computer): belirli bir uygulamaya özel komut seti (ör. sinyal işleme).' },
          { t: 'h', text: '4) Bellek tipine göre' },
          { t: 'compare', cols: [
            { title: 'Gömülü bellekli', items: ['Program ve veri belleği <b>çipin içinde</b>', 'Tek çip yeter (PIC16F877A)'] },
            { title: 'Harici bellekli', items: ['Bellek <b>dışarıdan</b> bağlanır', 'Daha esnek kapasite, ama daha çok parça ve pin'] }
          ] }
        ],
        checks: [
          { q: 'Mikrodenetleyiciler hangi 4 ölçüte göre sınıflandırılır?', a: 'Anayol genişliği (4/8/16/32/64 bit), mimari (Von Neumann / Harvard), komut seti (CISC / RISC / SISC), bellek tipi (gömülü / harici).' },
          { q: 'Harvard mimarisinin Von Neumann\'a göre avantajları nelerdir?', a: 'Program ve veri ayrı belleklerde, ayrı yollardan erişildiği için: daha hızlı işlem (komut ve veri aynı anda), daha fazla güvenlik, kaynakların verimli kullanımı. Von Neumann\'ın avantajları ise basitlik, düşük maliyet ve esneklik.' },
          { q: 'Bir mikrodenetleyicinin "8 bitlik" olması neyi ifade eder?', a: 'ALU\'nun veri anayolunun 8 bit olduğunu: işlemci tek seferde 8 bitlik veriyle işlem yapar.' }
        ]
      },
      {
        id: 'pic',
        title: 'PIC16F877A ve Mikrodenetleyici Seçimi',
        src: 'slayt 24–25',
        minutes: 4,
        blocks: [
          { t: 'def', term: 'PIC', en: 'Peripheral Interface Controller', html: 'Microchip firmasının mikrodenetleyici ailesi. Derste kullanılan model: <b>PIC16F877A</b>.' },
          { t: 'h', text: 'PIC16F877A dört ölçüte göre' },
          { t: 'table', head: ['Ölçüt', 'PIC16F877A'], rows: [
            ['Anayol genişliği', '<b>8 bitlik</b> bir mikrodenetleyici'],
            ['Mimari', '<b>Harvard</b> mimarisine göre tasarlanmış'],
            ['Komut seti', '<b>RISC</b> komut setine sahip (35 komut)'],
            ['Bellek', '<b>Gömülü belleğe</b> sahip']
          ] },
          { t: 'note', kind: 'exam', html: 'Bu dört satır birlikte sorulmaya çok uygun: "PIC16F877A\'yı sınıflandırınız." → 8 bit, Harvard, RISC, gömülü bellek.' },
          { t: 'h', text: 'Mikrodenetleyici seçimi neye göre yapılmalı?' },
          { t: 'list', ordered: true, items: ['<b>Uygulama alanına</b> (kaç pin, hangi çevre birimleri: ADC, PWM, haberleşme…)', '<b>Fiyat-performans</b>', '<b>Referans kaynak fazlalığı</b> (örnek kod, kitap, forum)', '<b>Tanıdık bir mimariye</b> sahip olması'] },
          { t: 'note', kind: 'extra', html: 'Listeye eklenebilecekler: güç tüketimi, çalışma gerilimi, bellek boyutu, geliştirme araçlarının (derleyici, programlayıcı) maliyeti, bulunabilirlik.' }
        ],
        checks: [
          { q: 'PIC16F877A\'yı anayol, mimari, komut seti ve bellek açısından tanımlayınız.', a: '8 bitlik, Harvard mimarisinde, RISC komut setine sahip, gömülü bellekli bir mikrodenetleyici.' },
          { q: 'Mikrodenetleyici seçerken dikkat edilecek 4 ölçüt nedir?', a: 'Uygulama alanı, fiyat-performans, referans kaynak fazlalığı, tanıdık bir mimariye sahip olması.' }
        ]
      },
      {
        id: 'programlama',
        title: 'Mikrodenetleyici Programlama',
        src: 'slayt 26–28 · Deney 1',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Mikrodenetleyici iki tür dille programlanır:' },
          { t: 'compare', cols: [
            { title: 'Assembly dili (makine dili)', items: ['Her satır bir işlemci komutu (MOVLW, ADDLW…)', 'Donanıma tam hakimiyet, en hızlı ve küçük kod', 'Yazması ve okuması zor; işlemciye özgü'] },
            { title: 'Yüksek ve orta seviyeli diller', items: ['Basic, C vb.', 'Hızlı geliştirme, okunabilir', 'Bank seçimi gibi ayrıntıları derleyici halleder'] }
          ] },
          { t: 'h', text: 'Assembler ve derleyici' },
          { t: 'def', term: 'Assembler', html: 'Assembly dilinde yazılmış programdan işlemci veya mikrodenetleyiciyi programlamak için gerekli dosyayı üretir (<b>*.hex</b> vb.).' },
          { t: 'def', term: 'Derleyici', en: 'Compiler', html: 'Yüksek ve orta seviyeli dillerden <b>önce assembly diline çevirir</b>, ardından mikrodenetleyiciyi programlamak için gerekli dosyayı üretir.' },
          { t: 'note', kind: 'lab', html: '<b>Deney 1:</b> Derleyici kodu üretirken <b>kod iyileştirmesi</b> yapar (en kısa çalışma süresi ve en az bellek) ve kaynak koddaki <b>hataları yakalayıp programcıya bildirir</b>. Derste <b>mikroC for PIC</b> (MikroElektronika) kullanılır: C kodunu makine diline çevirir ve <b>.hex</b> dosyasını üretir.' },
          { t: 'h', text: 'Programlama adımları' },
          { t: 'list', ordered: true, items: [
            '<b>Program kodu yazılır</b> (C veya assembly)',
            '<b>Derleyici veya assembler</b> yardımıyla programlama için gerekli dosya üretilir (PIC için <b>*.hex</b>)',
            'Bir <b>programlayıcı donanım</b> yardımıyla bu dosya mikrodenetleyicinin <b>program hafızasına yazdırılır</b>'
          ] },
          { t: 'note', kind: 'lab', html: 'Laboratuvarda 3. adım: mikroC\'de <b>Build → Build and Program</b> ile EasyPIC v7 kitindeki PIC programlanır. Simülasyonda ise .hex dosyası SimulIDE\'deki mikrodenetleyiciye yüklenir.' }
        ],
        checks: [
          { q: 'Derleyici ve assembler arasındaki fark nedir? (Deney 1)', a: 'Assembler, assembly dilindeki kodu doğrudan programlama dosyasına (.hex) çevirir. Derleyici ise yüksek/orta seviyeli dildeki (C, Basic) kodu önce assembly\'ye çevirir, sonra .hex dosyasını üretir. Derleyici ayrıca kod iyileştirme ve hata bildirme yapar.' },
          { q: 'Mikrodenetleyici programlama adımları nelerdir? (slayt 37)', a: '1) Program kodu yazılır, 2) derleyici veya assembler ile programlama dosyası (.hex) üretilir, 3) programlayıcı donanımla bu dosya mikrodenetleyicinin program hafızasına yazdırılır.' }
        ]
      }
    ]
  });
})(window.MC);
