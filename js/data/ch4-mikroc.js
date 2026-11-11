/*
 * ch4-mikroc.js — Bölüm 4: mikroC ile PIC programlama.
 * Kaynak: hafta 3 sunumu slayt 1–17, Deney 1 föyü, hocanın Uygulama 1–3 kodları.
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch4',
    num: 4,
    title: 'mikroC ile Programlama',
    short: 'mikroC',
    navSub: 'Tipler, absolute, operatörler, Deney 1',
    week: 'Hafta 3',
    source: 'Hafta 3 sunumu, slayt 1–17 · Deney 1 · Uygulama 1–3',
    objectives: [
      'C kodundan .hex dosyasına giden yolu ve derleyicinin ürettiği assembly\'yi okumak',
      'mikroC\'de proje oluşturmak, osilatör ve watchdog ayarlarını doğru seçmek, hata ayıklayıcıyı kullanmak',
      'mikroC veri tiplerinin boyut ve aralıklarını bilmek; taşmayı ve bellekte bayt sırasını açıklamak',
      'Taban dönüşümü, ikiye tümleme ve IEEE 754 sorularını çözmek (Deney 1 ön çalışma)',
      'Dizi, string, code/data belirleyicilerini kullanmak',
      'absolute ve org direktiflerini kullanmak; çakışan adresleri bulmak',
      'Aritmetik, ilişkisel, bit düzeyinde ve mantıksal operatörleri ayırt etmek'
    ],
    outline: {
      topics: [['Derleyici ile .hex elde etme; C ve assembly', 'derleme'], ['Deney 1: mikroC proje ayarları ve hata ayıklayıcı', 'proje'], ['Aritmetik tipler ve bellekte yerleşim', 'tipler'], ['Sayı sistemleri, ikiye tümleme, IEEE 754, ASCII', 'sayilar'], ['Diziler, string, bellek tip belirleyiciler', 'diziler'], ['Bağlayıcı direktifleri: absolute ve org', 'absolute'], ['asm bloğu ve operatörler', 'operator']],
      concepts: ['.c → .asm → .hex', '.lst dosyası', 'XT / HS osilatör', 'Watchdog timer', 'Debugger, Watch, RAM penceresi', 'bit, char, short, int, long, float', 'signed / unsigned', 'Taşma', 'Little endian', 'İkiye tümleme', 'IEEE 754', 'ASCII', 'const code / data / rx', 'absolute', 'org', 'asm { }', '& ile && farkı', '<<, >>, ^, ~', 'Operatör önceliği'],
      why: 'Uygulama 2\'deki adres çakışması ve "Problemi bulun" (slayt 12) tipik sınav sorusu. Deney 1 ön çalışması da hesap pratiği.'
    },
    lessons: [
      {
        id: 'derleme',
        title: 'Derleyici ile .hex Elde Etme',
        src: 'slayt 2–3',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'Derleyici kullanarak .hex dosyası elde etme aşamaları (slayt 2):' },
          { t: 'list', ordered: true, items: ['<b>.c</b>: C kaynak kodu yazılır', '<b>Derleyici</b> C kodunu <b>.asm</b> (assembly) koduna çevirir; bu sırada kod iyileştirmesi yapar ve hataları bildirir', '<b>Assembler</b> assembly\'yi makine koduna (opcode) çevirir', 'Sonuç: programlayıcıya verilecek <b>.hex</b> dosyası'] },
          { t: 'note', kind: 'extra', html: 'Hocanın GitHub deposundaki her uygulamada bu dosyaları görürsün: <b>.c</b> (kaynak), <b>.asm</b> (assembly), <b>.lst</b> (her komutun adresi ve opcode\'u), <b>.hex</b> (programlama dosyası), <b>.mcppi</b> (mikroC proje dosyası), <b>.cfg</b> (konfigürasyon ayarları).' },
          { t: 'h', text: 'Yüksek seviyeli dil ve assembly (slayt 3)' },
          { t: 'p', html: 'Aynı program, solda C, sağda derleyicinin ürettiği assembly. RB7 butonu 1 ise RB0 LED\'ini yakar:' },
          { t: 'codex', title: 'MyProject.c → MyProject.asm', rows: [
            ['TRISB=0xF0;', '<code>MOVLW 240</code> · <code>MOVWF TRISB</code>: 0xF0 = 240, önce W\'ye sonra TRISB\'ye. Üst 4 pin giriş, alt 4 pin çıkış.'],
            ['PORTB=0;', '<code>CLRF PORTB</code>: sıfıra özel tek komut.'],
            ['while(1){', '<code>L_main0:</code> etiketi. Döngünün sonundaki <code>GOTO L_main0</code> buraya döner.'],
            ['if(portb.f7==1)', '<code>BTFSS PORTB,7</code>: 7. bit 1 ise sonraki komutu atla. 0 ise sonraki <code>GOTO L_main2</code> çalışır, else kısmına gidilir.'],
            ['portb.f0=1;', '<code>BSF PORTB,0</code>, ardından <code>GOTO L_main3</code> ile else atlanır.'],
            ['else\n  portb.f0=0;', '<code>L_main2: BCF PORTB,0</code>'],
            ['}  // main sonu', '<code>GOTO $+0</code>: kendi üzerine sonsuz döngü. main biterse işlemci burada bekletilir.']
          ] },
          { t: 'note', kind: 'exam', html: 'C\'deki tek bir <code>if</code>, assembly\'de "bit test et + atla + GOTO" üçlüsüne dönüşür. Assembly\'de yüksek seviyeli kontrol yapıları yoktur; her şey atlama komutlarıyla kurulur.' },
          { t: 'note', kind: 'extra', html: 'Slayttaki listede bank seçim komutları gösterilmemiş; hocanın .lst dosyalarında görünür (<code>BSF STATUS,5</code> → Bank 1, TRISB\'ye yazmadan önce). C\'de bunu düşünmen gerekmez.' }
        ],
        checks: [
          { q: 'C kodundan .hex dosyasına hangi aşamalarla gidilir?', a: 'C kaynak kodu (.c) → derleyici assembly koduna (.asm) çevirir → assembler makine koduna çevirir → .hex dosyası üretilir; programlayıcı bunu mikrodenetleyiciye yazar.' },
          { q: '<code>if(portb.f7==1)</code> satırı assembly\'de hangi komutla yapılır?', a: 'BTFSS PORTB,7 (bit 1 ise sonraki komutu atla) ve ardından gelen GOTO ile.' }
        ]
      },
      {
        id: 'proje',
        title: 'Deney 1: mikroC Proje Ayarları ve Hata Ayıklayıcı',
        src: 'Deney 1 · Deney 3 işlem basamakları',
        minutes: 7,
        lab: true,
        blocks: [
          { t: 'h', text: 'Yeni proje (Project → New Project)' },
          { t: 'list', ordered: true, items: [
            '<b>Project Name</b> ve <b>Project Folder</b>: Türkçe karakter kullanma (yol dahil)',
            '<b>Device Name</b>: P16F877A',
            '<b>Device Clock</b>: osilatör frekansı (genelde 4, 8 veya 20 MHz)',
            'Varsa hazır kod dosyasını ekle (Add), yoksa Next',
            'Kütüphaneler: <b>Include ALL</b>',
            'Finish'
          ] },
          { t: 'h', text: 'Konfigürasyon (sigorta) ayarları: Project → Edit Project' },
          { t: 'table', head: ['Ayar', 'Ne seçilir, neden?'], rows: [
            ['<b>Oscillator Selection</b>', 'Osilatör, tüm sayısal tasarımlarda gereken <b>kare dalga saat sinyalini</b> üretir (mikrodenetleyicide kristal ile). Föy: 8 MHz\'e kadar <b>XT</b>, 8 MHz ve üstü <b>HS</b> (High Speed).'],
            ['<b>Watchdog Timer</b>', '<b>Disabled</b>. Aktifse belirlenen süre dolduğunda PIC kendini resetler; periyodik olarak sıfırlanmazsa kod sürekli baştan başlar.'],
            ['<b>Build Type</b>', 'Normalde <b>Release</b>; kit üzerinde adım adım izlemek için <b>ICD Debug</b> (Deney 3)']
          ] },
          { t: 'note', kind: 'fix', html: 'Veri sayfasına göre <b>XT modu 4 MHz\'e kadar</b>, <b>HS modu 4–20 MHz</b> içindir. Deney 3\'te 8 MHz kristal için <b>HS</b> seçiliyor; kural olarak 4 MHz\'in üstünde HS seç.' },
          { t: 'h', text: 'Derleme ve hata ayıklama' },
          { t: 'list', items: [
            '<b>Build → Build</b>: hata yoksa alttaki pencerede "Finished successfully"; varsa hata satırı ve açıklaması.',
            '<b>Run → Start Debugger</b>: kodu adım adım çalıştırıp doğruluğunu ve işleyişini takip et. Değişkenleri <b>Watch Values</b> listesine ekle.',
            '<b>View → Debug Windows → RAM</b>: hafızayı gör. Sayılar <b>16\'lık tabanda</b> gösterilir.',
            '<b>Build → Build and Program</b>: EasyPIC v7 kitini programlar (bağlantı varsa LINK ışığı yanar).'
          ] },
          { t: 'def', term: 'Debug ve ICD', en: 'In-Circuit Debugger', html: '<b>Debug</b> (böcek arama): programdaki hataları kodu adım adım çalıştırıp değişkenleri izleyerek bulma. <b>ICD</b>: programı <b>gerçek donanım üzerinde</b> çalışırken adım adım izlemeyi, kaydedici değerlerini okumayı sağlar (simülatör değil, gerçek PIC).' },
          { t: 'note', kind: 'lab', html: '<b>SimulIDE\'de çalıştırma (Deney 3):</b> Devreyi kur, mikrodenetleyiciye çift tıkla, <b>Program file</b> kısmına .hex dosyasının yolunu ver, <b>Clock frequency</b>\'yi mikroC\'deki ile aynı gir (ör. 8 MHz), simülasyonu başlat.' }
        ],
        checks: [
          { q: 'Mikrodenetleyicilerde kullanılan osilatörün amacı nedir? (Deney 1)', a: 'Tüm sayısal devrenin ihtiyaç duyduğu kare dalga saat sinyalini üretmek. Komutlar bu saate göre işlenir; PIC16F877A\'da bir komut döngüsü 4 saat darbesidir.' },
          { q: 'Watchdog timer neden kapalı (disabled) seçilir?', a: 'Açık olursa belirlenen süre dolunca PIC kendini resetler. Programda periyodik olarak sıfırlanmazsa kod sürekli baştan başlar.' },
          { q: 'Debug nedir? ICD ne amaçla kullanılır? (Deney 1)', a: 'Debug: kodu adım adım çalıştırıp değişken ve kaydedicileri izleyerek hata bulma. ICD (In-Circuit Debugger): bunu gerçek donanım (deney kiti) üzerinde çalışan program için yapmayı sağlar.' }
        ]
      },
      {
        id: 'tipler',
        title: 'Aritmetik Tipler ve Bellekte Yerleşim',
        src: 'slayt 4–5 · Deney 1',
        minutes: 9,
        blocks: [
          { t: 'p', html: 'mikroC tipleri: <b>void, bit, char, int, float, double</b>; <b>short, long, signed, unsigned</b> ön ekleriyle birlikte.' },
          { t: 'table', head: ['Tip', 'Bayt', 'Aralık'], rows: [
            ['bit, sbit', '1 bit', '0 veya 1'],
            ['(unsigned) char', '1', '0 … 255'],
            ['signed char', '1', '−128 … 127'],
            ['(signed) short (int)', '1', '−128 … 127'],
            ['unsigned short (int)', '1', '0 … 255'],
            ['(signed) int', '2', '−32768 … 32767'],
            ['unsigned (int)', '2', '0 … 65535'],
            ['(signed) long (int)', '4', '−2147483648 … 2147483647'],
            ['unsigned long (int)', '4', '0 … 4294967295'],
            ['float, double, long double', '4', '±1.5·10<sup>−45</sup> … ±3.4·10<sup>38</sup>']
          ] },
          { t: 'note', kind: 'exam', html: 'Tuzaklar: mikroC\'de <b>int 2 bayt</b> (PC\'de 4), <b>short 1 bayt</b> (PC\'de 2), <b>char varsayılan olarak unsigned</b>, <b>double = float</b> (4 bayt).' },
          { t: 'note', kind: 'fix', html: 'Slaytta float aralığı "−1.5 * 1045 .. +3.4 * 1038" görünüyor; üsler kaybolmuş. Anlamı: en küçük büyüklük ≈ 1.5·10<sup>−45</sup>, en büyük ≈ 3.4·10<sup>38</sup>. mikroC float\'ı Microchip AN575 32 bit formatıyla (IEEE 754 uyumlu) uygular.' },
          { t: 'h', text: 'Değişkenler RAM\'de nasıl durur? (Deney 1 örnek kodu)' },
          { t: 'p', html: 'Föydeki kodu adım adım çalıştır. <b>−250\'nin 1 baytlık signed short\'a ne yaptığına</b> dikkat et:' },
          { t: 'dg', id: 'mem', preset: 'deney1' },
          { t: 'note', kind: 'extra', html: '<b>Bayt sırası (little endian):</b> Çok baytlı değişkenlerde <b>düşük anlamlı bayt düşük adrese</b> yazılır. int −250 = FF06h → 21h\'de <b>06</b>, 22h\'de <b>FF</b>. Hocanın .lst dosyalarında da görünür: <code>INCF _i</code> sonra taşma olursa <code>INCF _i+1</code>.' },
          { t: 'dg', id: 'quiz', types: ['size'] }
        ],
        checks: [
          { q: 'mikroC\'de int, short, long ve float kaç bayttır?', a: 'int 2 bayt, short 1 bayt, long 4 bayt, float 4 bayt (double da 4 bayt).' },
          { q: 'signed short değişkene −250 atanırsa ne saklanır?', a: 'signed short 1 bayttır (−128…127); −250 sığmaz. −250\'nin alt 8 biti saklanır: −250 + 256 = 6 → 0x06.' },
          { q: '0x21 adresindeki int değişkene −250 atanınca 0x21 ve 0x22 adreslerinde ne görünür?', a: '−250 = FF06h; little endian: 0x21 = 06, 0x22 = FF.' }
        ]
      },
      {
        id: 'sayilar',
        title: 'Sayı Sistemleri, İkiye Tümleme, IEEE 754',
        src: 'Deney 1 ön çalışma',
        minutes: 10,
        lab: true,
        blocks: [
          { t: 'note', kind: 'lab', html: 'Deney 1\'in <b>ön çalışma</b> soruları laboratuvardan önce çözülüp götürülür. Hepsi bu dersteki araçlarla kontrol edilebilir.' },
          { t: 'h', text: 'Taban dönüşümü ve ikiye tümleme' },
          { t: 'list', items: ['<b>10 → 16:</b> 16\'ya böl, kalanları sondan başa yaz. 123 = 7·16 + 11 → <b>7Bh</b>', '<b>16 → 2:</b> her hex basamak 4 bit. FBh = 1111 1011', '<b>2 → 10:</b> basamak değerlerini topla. 1111 1011 = 128+64+32+16+8+2+1 = <b>251</b>', '<b>Negatif sayı (ikiye tümleme):</b> mutlak değeri ikiliye çevir → bitleri tersle → 1 ekle'] },
          { t: 'dg', id: 'numconv' },
          { t: 'solve', title: 'Ön çalışma 2–5', q: '(123)₁₀ = (?)₁₆ · (FB)₁₆ = (?)₂ = (?)₁₀ · −135 ve −248\'i ikiye tümleme ile 16\'lık tabanda gösteriniz.', a: '<p>123 = <b>7Bh</b>. FBh = <b>1111 1011</b>₂ = <b>251</b>.</p><p>−135: 8 bite sığmaz (−128 alt sınır) → 16 bit: 135 = 0000 0000 1000 0111 → tersle: 1111 1111 0111 1000 → +1: 1111 1111 0111 1001 = <b>FF79h</b>.</p><p>−248: 248 = 0000 0000 1111 1000 → tersle → +1: <b>FF08h</b>. (8 bitte yazılsaydı 08h olurdu ama bu +8 ile karışır; doğru gösterim 16 bit.)</p>' },
          { t: 'h', text: 'IEEE 754: float sayılar' },
          { t: 'p', html: '<b>IEEE 754 standardı</b> kayan noktalı (float) sayıların bilgisayarda ikili olarak nasıl gösterileceğini tanımlar. 32 bit: <b>1 bit işaret, 8 bit üs (127 eklenmiş), 23 bit mantis</b>.' },
          { t: 'dg', id: 'float' },
          { t: 'solve', title: 'Ön çalışma 7', q: '1453 sayısı 40h adresine atanmış bir float değişkene atanınca hafızada nasıl görünür?', a: '<p>1453 = 101 1010 1101₂ = 1.01101011010₂ × 2<sup>10</sup>. İşaret 0; üs 10 + 127 = 137 = 1000 1001; mantis 0110 1011 0100 0…</p><p>32 bit: 0 10001001 01101011010000000000000 = <b>44B5A000h</b> (IEEE 754). Küçük adrese düşük bayt: 40h = 00, 41h = A0, 42h = B5, 43h = 44.</p><p><i>Not:</i> mikroC kılavuzu Microchip AN575 formatını kullandığını belirtir; AN575\'te üs baytı önce gelir (89h 35h A0h 00h). Laboratuvarda RAM penceresinde hangisini gördüğünü not et.</p>' },
          { t: 'solve', title: 'Uygulama 3 (güncel): negatif sayı', q: '<code>float x = -4.75;</code> sayısının IEEE 754 (32 bit) gösterimini bulunuz.', a: '<ol><li>İşaret: negatif → <b>S = 1</b></li><li>4 = 100₂; 0.75 × 2 = 1.5 → 1, 0.5 × 2 = 1.0 → 1 → 0.11₂. 4.75 = <b>100.11₂</b></li><li>Normalize: <b>1.0011 × 2²</b></li><li>Üs: 2 + 127 = 129 = <b>1000 0001</b></li><li>Mantis: <b>0011</b> 0000 0000 0000 0000 000 (23 bit)</li><li>1 10000001 00110000000000000000000 → 1100 0000 1001 1000 0000 0000 0000 0000 = <b>C0980000h</b></li></ol><p>RAM\'de (little endian): 00 00 98 C0. Pozitif +4.75 olsaydı yalnızca ilk bit 0 olurdu: 40980000h.</p>' },
          { t: 'dg', id: 'quiz', types: ['ieee', 'ieeer'] },
          { t: 'h', text: 'ASCII' },
          { t: 'table', head: ['Karakter', 'ASCII (hex)', 'ASCII (ondalık)'], rows: [['\'A\'', '41h', '65'], ['\'a\'', '61h', '97'], ['\'1\'', '31h', '49']] },
          { t: 'note', kind: 'extra', html: 'Küçük harf = büyük harf + 20h (5. bit). Rakam karakteri = sayı + 30h. Ön çalışma 9: EasyPIC v7\'de desteklenen grafik LCD <b>128 × 64</b> piksel çözünürlüklüdür.' },
          { t: 'dg', id: 'quiz', types: ['base', 'twos'] }
        ],
        checks: [
          { q: '(FB)₁₆ sayısını ikili ve ondalık tabana çeviriniz.', a: '1111 1011₂ = 251₁₀.' },
          { q: '−135 sayısını 16 bit ikiye tümleme ile hex olarak yazınız.', a: 'FF79h.' },
          { q: 'IEEE 754 standardı neyi tanımlar?', a: 'Kayan noktalı (float) sayıların ikili gösterimini: 32 bitte 1 bit işaret, 8 bit üs (127 eklenmiş/bias), 23 bit mantis. Değer = (−1)^işaret × 1.mantis × 2^(üs−127).' }
        ]
      },
      {
        id: 'diziler',
        title: 'Diziler, String ve Bellek Tip Belirleyiciler',
        src: 'slayt 6–9',
        minutes: 6,
        blocks: [
          { t: 'h', text: 'Dizi tanımlama' },
          { t: 'p', html: 'Söz dizimi: <code>tip dizi_ismi[sabit-ifade]</code>' },
          { t: 'code', text: '#define MAX 50\nint   vector_one[10];          // 10 int: 20 bayt RAM!\nfloat vector_two[MAX];         // 50 float\nfloat vector_three[MAX - 20];  // 30 float\n\nint gunler[12] = {31,28,31,30,31,30,31,31,30,31,30,31};\nint gunler[]   = {31,28,31,30,31,30,31,31,30,31,30,31};  // boyutu derleyici sayar\n\nint a[3][2] = {{1,2}, {2,6}, {3,7}};   // çok boyutlu\nfloat m[50][20];                        // 50x20' },
          { t: 'note', kind: 'fix', html: 'Slaytta <code>#define MAX = 50</code> yazıyor; bu hatalı C\'dir (MAX yerine "= 50" konur ve <code>float v[= 50]</code> derlenmez). Doğrusu <code>#define MAX 50</code>. Ayrıca bir yorum <code>*\\</code> ile kapatılmış; doğrusu <code>*/</code>.' },
          { t: 'note', kind: 'extra', html: '<code>float vector_two[50]</code> = 200 bayt: 368 baytlık RAM\'in yarısından fazlası! Küçük mikrodenetleyicide dizi boyutuna dikkat.' },
          { t: 'h', text: 'String' },
          { t: 'code', text: "const char msg1[] = {'T', 'e', 's', 't', '\\0'};\nconst char msg2[] = \"Test\";   // ikisi aynı: sonda '\\0' (sonlandırıcı) var" },
          { t: 'p', html: 'String tanımlama özellikle <b>LCD</b> vb. uygulamalarda ekrana yazdırılacak ifadeler için kullanılır.' },
          { t: 'h', text: 'Hafıza tip belirleyiciler (slayt 8–9)' },
          { t: 'table', head: ['Belirleyici', 'Nereye koyar?', 'Örnek'], rows: [
            ['<b>code</b>', 'Sabit değişkenleri <b>program hafızasına</b> (Flash)', '<code>const code char txt[] = "ENTER PARAMETER:";</code>'],
            ['<b>data</b>', 'Değişkeni <b>veri RAM\'ine</b>', '<code>data unsigned char x;</code>'],
            ['<b>rx</b>', 'Değişkeni doğrudan <b>W (working) kaydedici</b> alanına', '<code>char rx y;</code> · <b>PIC16F877A için kullanılamaz</b>']
          ] },
          { t: 'note', kind: 'exam', html: 'Uzun sabit metinler (menü yazıları, tablolar) <b>code</b> ile Flash\'a konur; böylece kıt olan 368 baytlık RAM harcanmaz.' }
        ],
        checks: [
          { q: 'code ve data bellek tip belirleyicilerinin farkı nedir?', a: 'code: sabit değişkenleri program hafızasına (Flash) yazar, RAM harcamaz, çalışırken değiştirilemez. data: değişkeni veri RAM\'ine koyar.' },
          { q: '<code>int gunler[12]</code> dizisi RAM\'de kaç bayt kaplar?', a: '12 × 2 = 24 bayt (mikroC\'de int 2 bayt).' }
        ]
      },
      {
        id: 'absolute',
        title: 'Bağlayıcı Direktifleri: absolute ve org',
        src: 'slayt 10–12 · Uygulama 2–3',
        minutes: 8,
        blocks: [
          { t: 'p', html: 'Bir değişken veya fonksiyonun <b>önceden belirlenen bir adrese</b> yerleşmesi isteniyorsa bağlayıcıya (linker) <b>absolute</b> ve <b>org</b> ile adres bilgisi verilir.' },
          { t: 'codex', title: 'absolute: değişkeni RAM\'de sabit adrese koy', rows: [
            ['short x absolute 0x22;', 'x, 0x22 adresinde <b>1 bayt</b> kaplar'],
            ['int y absolute 0x23;', 'y, 0x23 <b>ve 0x24</b> adreslerinde 2 bayt kaplar'],
            ['const short ConstantArray[] = {1,2,3} absolute 0x1000;', 'Sabit dizi elemanları 0x1000\'den itibaren ardışık yerleşir (program belleği)']
          ] },
          { t: 'codex', title: 'org: fonksiyonu program belleğinde sabit adresten başlat', rows: [
            ['void func(int par) org 0x200 {\n  asm nop;\n}', 'Fonksiyon ROM\'da (program memory) <b>0x200</b> adresinden itibaren yazılır']
          ] },
          { t: 'h', text: 'Problemi bulun (slayt 12)' },
          { t: 'code', text: 'long jjjj absolute 0x30;\nchar i absolute 0x33;' },
          { t: 'solve', title: 'Slayt 12', q: 'Bu iki tanımda ne sorun var?', a: '<p><b>long 4 bayttır:</b> jjjj 0x30, 0x31, 0x32, <b>0x33</b> adreslerini kaplar. i de 0x33\'e yerleştirilmiş: <b>iki değişken aynı baytı paylaşıyor (çakışma)</b>. i\'ye yazmak jjjj\'nin en üst baytını bozar; jjjj\'ye yazmak i\'yi bozar. Çözüm: i\'yi 0x34 veya sonrasına koymak.</p>' },
          { t: 'dg', id: 'mem', preset: 'prob' },
          { t: 'h', text: 'Hocanın Uygulama 2\'si' },
          { t: 'p', html: 'Aynı hata bir de büyük bir sayıyla. Adımları izle; y\'ye ne olduğuna bak:' },
          { t: 'dg', id: 'mem', preset: 'u2' },
          { t: 'note', kind: 'exam', html: 'Uygulama 2\'de iki ayrı ders var: (1) <b>783238988</b> int\'e (2 bayt) sığmaz: yalnızca alt 16 biti kalır = 474Ch = 18252. (2) <b>int y absolute 0x25</b> 0x25–0x26\'yı kaplar; <b>short t absolute 0x26</b> çakışır. t=1 yazılınca y\'nin üst baytı 01 olur: y = 014Ch = <b>332</b>.' },
          { t: 'h', text: 'Uygulama 1 ve 3' },
          { t: 'p', html: 'Uygulama 1 (<code>int sayi; sayi=10;</code>) adres vermez: adresi derleyici seçer, RAM penceresinde 2 bayt (0A 00) görünür. Uygulama 3 float\'ın baytlarını gösterir:' },
          { t: 'dg', id: 'mem', preset: 'u3' },
          { t: 'note', kind: 'exam', html: 'Hoca <b>11 Kasım</b>\'da GitHub\'daki Uygulama 3\'ü <code>x=0.0625</code>\'ten <code>x=-4.75</code>\'e çevirdi: <b>negatif</b> bir sayının IEEE 754 gösterimi. −4.75 = C0980000h, RAM\'de 00 00 98 C0. Hesabın adımları "Sayı Sistemleri, IEEE 754" dersinde.' },
          { t: 'h', text: 'Alıştırma: çakışmada son değer' },
          { t: 'p', html: 'Sınavda "ardışık adreslere değişken koyduk, çıktı ne olur" diye sorulabilir. Kural: n baytlık değişken n ardışık adresi kaplar, <b>sonra yazılan ortak baytı ezer</b>, düşük bayt düşük adrestedir.' },
          { t: 'dg', id: 'quiz', types: ['overlap'] }
        ],
        checks: [
          { q: 'absolute ve org direktiflerinin farkı nedir?', a: 'absolute bir değişkeni (veya sabit diziyi) belirli bir adrese yerleştirir (genelde RAM). org bir fonksiyonun program belleğinde (ROM) hangi adresten başlayacağını belirtir.' },
          { q: '"long jjjj absolute 0x30; char i absolute 0x33;" tanımındaki problem nedir?', a: 'long 4 bayt olduğu için jjjj 0x30–0x33 aralığını kaplar; i de 0x33\'te. İki değişken 0x33 baytını paylaşır, birine yazmak diğerini bozar.' },
          { q: 'int y absolute 0x25 iken short t absolute 0x26 tanımlanırsa ne olur?', a: 'y 0x25 ve 0x26\'yı kaplar; t, y\'nin üst baytıyla çakışır. t\'ye yazılan değer y\'nin üst baytını değiştirir.' }
        ]
      },
      {
        id: 'operator',
        title: 'asm Bloğu ve Operatörler',
        src: 'slayt 13–17',
        minutes: 8,
        blocks: [
          { t: 'h', text: 'Derleyici içinde assembly (slayt 13)' },
          { t: 'code', text: 'asm {\n    block of assembly instructions\n}\n\nvoid main(){\n    TRISB=0;\n    asm{ bsf PORTB,0 };   // RB0 = 1\n    Delay_ms(250);\n    asm{ bcf PORTB,0 };   // RB0 = 0\n    Delay_ms(250);\n}' },
          { t: 'note', kind: 'extra', html: 'Bu örnekte <code>while(1)</code> yok: LED <b>bir kez</b> yanıp söner, sonra main biter ve derleyicinin eklediği <code>GOTO $+0</code> döngüsünde durur.' },
          { t: 'h', text: 'Operatörler ve öncelikleri (büyük sayı = önce)' },
          { t: 'table', head: ['Grup', 'Operatör', 'Anlamı', 'Öncelik'], rows: [
            ['Aritmetik (tekli)', '<code>+ - ++ --</code>', 'işaret, artırma, azaltma', '14'],
            ['Aritmetik', '<code>* / %</code>', 'çarpma, bölme, mod (kalan; float\'ta kullanılamaz)', '13'],
            ['Aritmetik', '<code>+ -</code>', 'toplama, çıkarma', '12'],
            ['Bit düzeyinde', '<code>&lt;&lt; &gt;&gt;</code>', 'sola / sağa kaydırma', '11'],
            ['İlişkisel', '<code>&lt; &gt; &lt;= &gt;=</code>', 'küçük, büyük…', '10'],
            ['İlişkisel', '<code>== !=</code>', 'eşit, eşit değil', '9'],
            ['Bit düzeyinde', '<code>&amp;</code> · <code>^</code> · <code>|</code>', 'AND · XOR · OR', '8 · 7 · 6'],
            ['Mantıksal', '<code>&amp;&amp;</code> · <code>||</code>', 'VE · VEYA', '5 · 4'],
            ['Tekli', '<code>~ !</code>', 'bit tersleme, mantıksal değil', '14']
          ] },
          { t: 'note', kind: 'exam', html: '<b>& ile && farkı:</b> <code>0x0F & 0xF0</code> = 0x00 (bit bit AND). <code>0x0F && 0xF0</code> = 1 (ikisi de sıfırdan farklı → doğru). Bitlerle uğraşırken & | ^ ~, koşullarda && || ! kullanılır. Öncelik tuzağı: <code>PORTB & 0x01 == 1</code> aslında <code>PORTB & (0x01 == 1)</code> olarak işlenir (== daha önce); parantez kullan.' },
          { t: 'dg', id: 'bitops' },
          { t: 'h', text: 'mikroC\'ye özgü: bit erişimi' },
          { t: 'p', html: '<code>PORTB.F3 = 1;</code> → yalnızca RB3\'ü değiştirir. <code>if (PORTD.F0 == 1)</code> → yalnızca RD0\'ı okur. <code>INTCON.TMR0IF = 0;</code> → kaydedicinin bitine adıyla erişim. Derleyici bunları BSF/BCF/BTFSS komutlarına çevirir.' },
          { t: 'note', kind: 'extra', html: 'Hocanın kodlarında <code>portb</code>, <code>trisd</code>, <code>portd.f0</code> gibi küçük harfli yazımlar da var: mikroC kaydedici adlarında büyük/küçük harf ayırmaz.' }
        ],
        checks: [
          { q: '0x0F & 0xF0 ve 0x0F && 0xF0 ifadelerinin sonuçları nedir?', a: '0x0F & 0xF0 = 0x00 (bit düzeyinde AND). 0x0F && 0xF0 = 1 (mantıksal VE: iki taraf da sıfırdan farklı).' },
          { q: '% operatörü float ile kullanılabilir mi?', a: 'Hayır. % tam sayı bölmesinin kalanını verir; kayan noktalı sayılarla kullanılamaz.' },
          { q: '0b00010110 >> 2 ve 0b00010110 << 1 kaçtır?', a: '0001 0110 >> 2 = 0000 0101 = 5; 0001 0110 << 1 = 0010 1100 = 44.' }
        ]
      }
    ]
  });
})(window.MC);
