/*
 * ch2-pic.js — Bölüm 2: PIC16F877A mimarisi, bellek organizasyonu ve assembly.
 * Kaynak: hafta 1–2 sunumu slayt 29–47 ve 57–58, Deney 2 föyü, PIC16F877A veri sayfası (DS39582).
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch2',
    num: 2,
    title: 'PIC16F877A Mimarisi ve Assembly',
    short: 'PIC mimarisi',
    navSub: 'Bellek, bank, W, STATUS, assembly',
    week: 'Hafta 1–2',
    source: 'Hafta 1–2 sunumu, slayt 29–47, 57–58 · Deney 2',
    objectives: [
      'PIC16F877A\'nın temel özelliklerini (8K, 368 B, 256 B, 35 komut…) saymak',
      'Program sayacının neden 13 bit olduğunu hesaplamak',
      'Bellek organizasyonunu (program belleği, RAM bankları, EEPROM) açıklamak; bir adresin hangi bankta, neyin olduğunu bulmak',
      'Assembly komutunun 4 bölümünü ve temel komutları (MOVLW, ADDLW, SUBLW, MOVWF, BSF, BCF, CLRF) kullanmak',
      'Bir ALU işleminden sonra STATUS\'taki Z, DC, C bayraklarını bulmak',
      'Adresleme modlarını ayırt etmek; bank seçimli bir assembly programını izlemek'
    ],
    outline: {
      topics: [['PIC16F877A özellikleri ve blok yapısı', 'ozellik'], ['Bellek organizasyonu: program, RAM bankları, EEPROM', 'bellek'], ['Assembly komut yapısı ve temel komutlar', 'asm'], ['W, STATUS ve ALU bayrakları', 'status'], ['Adresleme modları', 'adresleme'], ['Assembly örnekleri: bank seçimi, TRISB, PORTB', 'asmornek'], ['Deney 2: kaydedicileri hata ayıklayıcıda izleme', 'deney2']],
      concepts: ['8K program belleği', '368 B RAM', '256 B EEPROM', '13 bit PC', 'Reset vektörü 0000h', 'Kesme vektörü 0004h', 'GPR / SFR', 'Bank, RP1:RP0', 'W kaydedicisi', 'STATUS: Z, DC, C', 'Etiket, mnemonic, operand, yorum', 'MOVLW, ADDLW, SUBLW, MOVWF', 'BSF, BCF, CLRF', 'Doğrudan / dolaylı adresleme', 'FSR / INDF'],
      why: 'Hesap sorularının (bayraklar, adresler, TRIS değerleri) temeli bu bölümde.'
    },
    lessons: [
      {
        id: 'ozellik',
        title: 'PIC16F877A Özellikleri ve Blok Yapısı',
        src: 'slayt 29–30 · Deney 2',
        minutes: 6,
        blocks: [
          { t: 'table', head: ['Özellik', 'PIC16F877A'], rows: [
            ['Program hafıza', '<b>8K</b> (8192 komut, her biri 14 bit)'],
            ['Veri belleği (RAM)', '<b>368 bayt</b>'],
            ['EEPROM veri belleği', '<b>256 bayt</b>'],
            ['Çalışma frekansı', '<b>20 MHz</b>\'e kadar'],
            ['Komut seti', '<b>35 komut</b> (RISC)'],
            ['Zamanlayıcı', '<b>3</b> adet (Timer0, Timer1, Timer2)'],
            ['CCP-PWM modülü', '<b>2</b> adet'],
            ['Haberleşme', '<b>USART, I²C, SPI</b>'],
            ['ADC', '<b>10 bit, 8 kanal</b>'],
            ['G/Ç', '<b>33</b> adet giriş-çıkış pini'],
            ['Programlanabilme', '<b>100 000</b> kez']
          ] },
          { t: 'note', kind: 'exam', html: 'Bu tablo hem slaytta hem Deney 2 föyünde birebir var. En çok karıştırılanlar: <b>368</b> (RAM) ile <b>256</b> (EEPROM), <b>35</b> komut, <b>33</b> G/Ç.' },
          { t: 'h', text: 'Blok diyagramı (slayt 30, Deney 2 Şekil 1)' },
          { t: 'table', head: ['Blok', 'Görevi'], rows: [
            ['<b>Flash program belleği</b>', 'Programcının yazdığı kodun mikrodenetleyicide tutulduğu <b>kalıcı</b> bellek (8K).'],
            ['<b>Program sayacı (PC)</b>', 'Program hafızasında koşturulacak işlem kodunun <b>adresini</b> tutan sayaç.'],
            ['<b>ALU ve W kaydedicisi</b>', 'Aritmetik (toplama, çıkarma) ve lojik (AND, OR) işlemler ALU\'da yapılır; ALU\'ya yardımcı temel kaydedici <b>W_REG</b>\'dir.'],
            ['<b>Genel amaçlı RAM ve kaydediciler</b>', 'Geçici değişken değerleri (RAM) ve koşulları, sonuçları, çevre birimlerinin ayarlarını tutan kaydediciler.'],
            ['<b>Veri anayolu</b>', '8 bit: RAM, ALU ve çevre birimleri arasında veri taşır.'],
            ['<b>Çevresel arabirimler</b>', 'Zamanlama, analog-sayısal çevrim, seri/paralel haberleşme…']
          ] },
          { t: 'h', text: 'Program sayacı kaç bit olmalı? (slayt 30)' },
          { t: 'p', html: 'PC, 8K program belleğinin <b>her adresini</b> gösterebilmeli. 8K = 8192 = 2<sup>13</sup> → <b>13 bit</b>. (Adres aralığı 0000h–1FFFh.)' },
          { t: 'note', kind: 'fix', html: 'Deney 2 föyü program sayacına "PCL" diyor. Tam olarak: PC <b>13 bittir</b>; alt 8 biti <b>PCL</b> kaydedicisinde (02h), üst 5 biti <b>PCLATH</b> üzerinden yazılır. PCL, PC\'nin yalnızca alt baytıdır.' }
        ],
        checks: [
          { q: 'PIC16F877A\'nın program sayacı kaç bit olmalıdır? Neden?', a: '13 bit. Program belleği 8K = 8192 = 2¹³ adres; her adresi gösterebilmek için 13 bit gerekir.' },
          { q: 'PIC16F877A\'da RAM, EEPROM ve program belleği kapasiteleri nedir?', a: 'Program belleği 8K (Flash), RAM 368 bayt, EEPROM 256 bayt.' },
          { q: 'PIC16F877A\'da kaç G/Ç pini, kaç zamanlayıcı ve kaç kanallı ADC vardır?', a: '33 G/Ç pini, 3 zamanlayıcı (Timer0/1/2), 10 bit 8 kanallı ADC.' }
        ]
      },
      {
        id: 'bellek',
        title: 'Bellek Organizasyonu',
        src: 'slayt 31–36 · Deney 2',
        minutes: 10,
        blocks: [
          { t: 'p', html: 'PIC16F877A belleği <b>3 ana kısımdan</b> oluşur:' },
          { t: 'list', ordered: true, items: ['<b>Program belleği</b> (Flash): kullanıcının yazdığı kodun saklandığı yer', '<b>Genel amaçlı RAM bellek</b>: genel amaçlı kaydediciler + özel amaçlı kaydediciler', '<b>Genel amaçlı EEPROM bellek</b>: kalıcı veri, dolaylı erişim'] },
          { t: 'h', text: '1. Program belleği' },
          { t: 'p', html: 'Kullanıcı tarafından yazılan kodun mikrodenetleyicide saklandığı yer. 8K × 14 bit.' },
          { t: 'list', items: ['<b>0000h: Reset vektörü.</b> Açılışta ve reset sonrası PC = 0000h; program buradan başlar.', '<b>0004h: Kesme vektörü.</b> Kesme gelince PC = 0004h (Kesmeler bölümü).'] },
          { t: 'note', kind: 'extra', html: 'Dönüş adreslerini tutan <b>8 seviyeli donanım yığını (stack)</b> program belleğinin parçası değildir; ayrı bir donanımdır. 8\'den fazla iç içe fonksiyon/kesme çağrısında eski adresin üzerine yazılır.' },
          { t: 'h', text: '2. RAM: genel ve özel amaçlı kaydediciler' },
          { t: 'compare', cols: [
            { title: 'Genel amaçlı kaydediciler (GPR)', items: ['Değişkenlerin tutulduğu alan', 'Programcı serbestçe kullanır', 'Toplam <b>368 bayt</b>'] },
            { title: 'Özel amaçlı kaydediciler (SFR)', items: ['CPU ve çevre birimlerini yöneten kaydediciler', 'STATUS, PORTB, TRISB, INTCON, ADCON0…', 'Değişken için <b>kullanılamaz</b>'] }
          ] },
          { t: 'p', html: 'RAM, <b>BANK</b> denen 4 bölüme ayrılmıştır (her biri 128 adres). Bank, STATUS kaydedicisindeki <b>RP1:RP0</b> bitleriyle seçilir. Bir adres yaz, haritada neyin olduğunu gör:' },
          { t: 'dg', id: 'memmap' },
          { t: 'note', kind: 'lab', html: 'Deney 2 örnekleri: <b>ADCON0 → 1Fh</b> (Bank 0). Kod yazarken bir değişkene sabit adres atanacaksa <b>önce o adresin genel amaçlı olup olmadığına</b> bakılmalı.' },
          { t: 'note', kind: 'fix', html: 'Deney 2 föyünde "TRISD kaydedicisi 86H ve 186H adreslerindedir" yazıyor. Veri sayfasına göre <b>86h ve 186h TRISB\'dir</b>; <b>TRISD 88h</b>\'dedir. Föy ayrıca yalnızca Bank 0 (20h–7Fh) ve Bank 1 (A0h–EFh) GPR alanlarını sayıyor; Bank 2 (110h–16Fh) ve Bank 3 (190h–1EFh) de genel amaçlıdır. Hepsi toplanınca 96 + 80 + 96 + 96 = <b>368</b>.' },
          { t: 'h', text: '3. Genel amaçlı EEPROM' },
          { t: 'list', items: ['16F877A\'da kapasite <b>256 bayt</b>.', '<b>Doğrudan erişime açık değildir</b>, dolaylı erişilir: adres EEADR\'ye, veri EEDATA\'ya yazılır, işlem EECON1/EECON2 ile başlatılır.', 'Elektrik kesilince silinmez: ayarları, kalibrasyon değerlerini saklamak için.'] }
        ],
        checks: [
          { q: 'PIC16F877A bellek organizasyonunu açıklayınız. (slayt 37)', a: '3 kısım: 1) Program belleği (8K Flash, kod burada; 0000h reset, 0004h kesme vektörü), 2) Genel amaçlı RAM (368 B; genel amaçlı kaydediciler GPR + özel amaçlı kaydediciler SFR; 4 banka ayrılmış, STATUS\'taki RP1:RP0 ile seçilir), 3) EEPROM (256 B, kalıcı, doğrudan değil dolaylı erişilir).' },
          { q: 'TRISA kaydedicisinin adresi nedir? (Deney 2)', a: '85h (Bank 1).' },
          { q: '104h adresine değişken tanımlanabilir mi? (Deney 2)', a: 'Hayır. 104h Bank 2\'dedir ve ofset 04h = FSR kaydedicisinin yansımasıdır (SFR). Bank 2\'de genel amaçlı alan 110h–16Fh\'dir.' }
        ]
      },
      {
        id: 'asm',
        title: 'Assembly Komut Yapısı',
        src: 'slayt 38–41 · hafta 6 slayt 17–18',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'Assembly dili komutları <b>4 bölüm</b> içerir:' },
          { t: 'codex', title: 'Örnek satırlar', rows: [
            ['main:', '<b>1. Etiket</b> (label): satıra verilen isim; GOTO/CALL ile buraya atlanır.'],
            ["\tmovlw d'23'", '<b>2. Mnemonic</b> (movlw): komutun kısa adı. <b>3. Operand</b> (d\'23\'): komutun üzerinde çalıştığı değer/adres. <code>d\'…\'</code> ondalık, <code>0x… / …h</code> onaltılık.'],
            ["\tsublw d'20'    ; Z=0, C=0 (20-23=-3)", '<b>4. Yorum</b>: noktalı virgülden sonrası; derleyici okumaz.']
          ] },
          { t: 'h', text: 'Temel komutlar' },
          { t: 'table', head: ['Komut', 'İşlem', 'Örnek'], rows: [
            ['<code>MOVLW k</code>', 'Sabit k değerini W\'ye atar', 'W=0 → MOVLW 0x34 → W=34h'],
            ['<code>ADDLW k</code>', 'W ← W + k', 'W=15, k=12 → W=27'],
            ['<code>SUBLW k</code>', 'W ← <b>k − W</b> (sıra ters!)', 'W=23, SUBLW 20 → 20−23 = −3'],
            ['<code>MOVWF f</code>', 'f ← W (W\'yi bir kaydediciye yaz)', 'MOVWF PORTB'],
            ['<code>CLRF f</code>', 'f ← 0', 'CLRF PORTB'],
            ['<code>BSF f,b</code> / <code>BCF f,b</code>', 'f\'nin b. bitini 1 / 0 yap', 'BSF STATUS,RP0'],
            ['<code>BTFSS f,b</code>', 'b. bit 1 ise sonraki komutu atla', 'BTFSS PORTB,7'],
            ['<code>GOTO k</code>', 'k adresine/etiketine atla', 'GOTO main'],
            ['<code>NOP</code>', 'Hiçbir şey yapma (1 döngü bekle)', 'NOP']
          ] },
          { t: 'note', kind: 'extra', html: 'İsimlendirme ipucu: <b>L</b> = literal (sabit), <b>W</b> = W kaydedicisi, <b>F</b> = file register (RAM\'deki kaydedici). MOV<b>LW</b> = literal\'i W\'ye; MOV<b>WF</b> = W\'yi F\'ye.' },
          { t: 'h', text: '35 komutun 3 türü ve opcode yapısı' },
          { t: 'p', html: 'PIC16F877A\'da 3 tür komut vardır; hepsi <b>14 bitlik</b> tek kelimedir (hafta 6 slayt 17–18):' },
          { t: 'table', head: ['Tür', 'Örnek', '14 bitin bölünüşü'], rows: [
            ['<b>Byte tabanlı</b>', 'MOVWF, ADDWF, CLRF', '6 bit opcode · 1 bit d (hedef W/f) · <b>7 bit f</b> (adres)'],
            ['<b>Bit tabanlı</b>', 'BSF, BCF, BTFSS', '4 bit opcode · 3 bit b (bit no) · <b>7 bit f</b>'],
            ['<b>Literal ve kontrol</b>', 'MOVLW, ADDLW, GOTO', '6 bit opcode · 8 bit k · (GOTO/CALL: 3 bit opcode · 11 bit adres)']
          ] },
          { t: 'note', kind: 'exam', html: 'Komutta RAM adresi için yalnızca <b>7 bit</b> yer var → 2<sup>7</sup> = 128 adres. RAM\'in tamamına (512 adres) ulaşmak için kalan 2 bit STATUS\'taki <b>RP1:RP0</b>\'dan gelir. <b>Bank yapısının sebebi budur.</b>' }
        ],
        checks: [
          { q: 'Assembly komutlarının 4 bölümü nedir?', a: 'Etiket, mnemonic (komut adı), operand (işlenen değer/adres), yorum.' },
          { q: 'W = 23 iken SUBLW 20 komutundan sonra W kaç olur?', a: 'SUBLW k: W ← k − W = 20 − 23 = −3 → W = FDh (ikiye tümleyen). C=0 (borç var), Z=0.' },
          { q: 'PIC16F877A\'da neden bank yapısı vardır?', a: 'Byte/bit tabanlı komutların 14 bitlik kelimesinde RAM adresi için yalnızca 7 bit vardır (128 adres). 4 × 128 = 512 adrese ulaşmak için kalan 2 bit STATUS\'taki RP1:RP0 bank seçim bitlerinden gelir.' }
        ]
      },
      {
        id: 'status',
        title: 'W, STATUS ve ALU Bayrakları',
        src: 'slayt 42–45 · Deney 2',
        minutes: 9,
        blocks: [
          { t: 'h', text: 'Temel birkaç kaydedici (slayt 42)' },
          { t: 'table', head: ['Kaydedici', 'Görevi'], rows: [
            ['<b>W</b>', 'ALU biriminin kullandığı ana kaydedici. Komut setindeki birçok komut bu kaydedici üzerinden işlem yapar.'],
            ['<b>STATUS</b> (durum)', 'ALU\'nun aritmetik durumunu, RESET durumunu ve veri belleği için BANK seçim bilgisini tutar.'],
            ['<b>TRISX</b>', 'PORT pinlerinin yönünü (giriş mi çıkış mı) belirler.'],
            ['<b>PORTX</b>', 'Mikrodenetleyicinin dış dünya ile ilişkisini sağlar.']
          ] },
          { t: 'h', text: 'STATUS kaydedicisi (slayt 43)' },
          { t: 'p', html: 'Bitlere tıkla, her bitin anlamı aşağıda çıksın. Deney 2\'de önemli olan son üç bit: <b>Z, DC, C</b>.' },
          { t: 'dg', id: 'reg', reg: 'STATUS', value: 0x1c },
          { t: 'h', text: 'ALU ile STATUS ilişkisi (slayt 44–45)' },
          { t: 'p', html: 'ALU\'da yapılan işlem sonucuna göre STATUS\'taki <b>bayraklar (flags)</b> değişir; programcı bu bayraklara göre karar aldırır (büyük, küçük, eşit). Hazır ayarlar slayttaki örnekler:' },
          { t: 'dg', id: 'alu' },
          { t: 'table', head: ['Bayrak', 'Ne zaman 1 olur? (Deney 2)'], rows: [
            ['<b>Z</b> (bit 2, Zero)', 'Aritmetik/lojik işlem sonucu <b>0</b> ise 1; 0\'dan farklıysa 0.'],
            ['<b>DC</b> (bit 1, Digit Carry)', 'Alt 4 bitten (3. bitten 4. bite) elde çıkarsa 1.'],
            ['<b>C</b> (bit 0, Carry/Borrow)', 'MSB (7. bit) üzerinde taşma olursa 1. <b>Çıkarmada tersine çalışır</b>: borç yoksa 1, borç varsa 0.']
          ] },
          { t: 'note', kind: 'exam', html: 'Slayt 45 örüntüsünü ezberle (SUBLW sonrası): <b>küçük → Z=0, C=0</b> · <b>büyük → Z=0, C=1</b> · <b>eşit → Z=1, C=1</b>. Slayt 44: <code>0F0h + 10h = 100h</code> → W = 00h, <b>Z=1, C=1</b>.' }
        ],
        checks: [
          { q: 'W = 0F0h iken ADDLW 10h çalışırsa W ve Z, C ne olur?', a: 'F0h + 10h = 100h; 8 bite sığmaz, W = 00h. Sonuç 0 → Z=1; 7. bitten taşma → C=1.' },
          { q: 'MOVLW 23 ve ardından SUBLW 24 çalışırsa Z ve C ne olur?', a: '24 − 23 = 1 (büyük): Z=0, C=1 (borç yok).' },
          { q: 'STATUS kaydedicisi hangi bilgileri tutar?', a: 'ALU\'nun aritmetik durumunu (Z, DC, C bayrakları), RESET durumunu (TO, PD) ve veri belleği bank seçim bilgisini (RP1, RP0, IRP).' }
        ]
      },
      {
        id: 'adresleme',
        title: 'Adresleme Modları',
        src: 'slayt 46–47',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Adresleme modu, komutun <b>işleyeceği veriye nasıl ulaşacağını</b> belirler (slayt 46):' },
          { t: 'table', head: ['Mod', 'Operand', 'Örnek'], rows: [
            ['<b>1. Immediate / literal</b>', 'Operand sabit bir değer', '<code>MOVLW 0x4</code>'],
            ['<b>2. Register</b>', 'Operand bir kaydedici', '<code>MOVWF STATUS</code>'],
            ['<b>3. Direct / absolute</b>', 'Operand bir RAM bellek adresi', '<code>MOVWF 0x20</code>'],
            ['<b>4. Register indirect</b>', 'Register içindeki değer adres bilgisini oluşturur', 'FSR = 0x24; INDF\'ye yaz'],
            ['<b>5. İndeksli</b>', 'İki register içindeki veri toplanarak adres oluşur', '(dizi[i]: taban + indis)'],
            ['<b>6. Memory indirect</b>', 'Register\'daki değer bir adres; o adresteki değer asıl adres (pointer mantığı)', '(işaretçinin işaretçisi)']
          ] },
          { t: 'p', html: 'PIC16F877A\'da dolaylı adresleme <b>FSR</b> (adres) ve <b>INDF</b> (o adresteki veri) kaydedicileriyle yapılır. Adım adım izle:' },
          { t: 'dg', id: 'addr' },
          { t: 'note', kind: 'extra', html: 'PIC16 donanımı ilk dört modu (sabit, kaydedici, doğrudan, FSR ile dolaylı) destekler. İndeksli ve memory indirect modları genel kavramlardır; PIC16\'da bunları yazılım (FSR\'ye toplama yapıp INDF kullanmak) sağlar.' }
        ],
        checks: [
          { q: 'Doğrudan ve dolaylı adreslemenin farkı nedir?', a: 'Doğrudan adreslemede komut, verinin RAM adresini kendisi içerir (MOVWF 0x20). Dolaylı adreslemede adres bir kaydedicide (PIC: FSR) tutulur; komut "FSR\'nin gösterdiği adres" üzerinde çalışır (INDF). FSR değiştirilerek aynı komut farklı adreslere erişir (dizi, pointer).' },
          { q: 'MOVLW 0x4 komutu hangi adresleme modunu kullanır?', a: 'Immediate (literal): işlenecek değer (4) komutun içindedir.' }
        ]
      },
      {
        id: 'asmornek',
        title: 'Assembly Örnekleri: Bank Seçimi ve PORTB',
        src: 'slayt 50, 57–58',
        minutes: 8,
        blocks: [
          { t: 'p', html: 'Slayt 57: B portunun tüm pinlerini çıkış yapıp <b>AAh</b> desenini yazan program. TRISB Bank 1\'de, PORTB Bank 0\'da olduğu için bank değiştirmek gerekir:' },
          { t: 'codex', title: 'slayt 57', rows: [
            ['BCF STATUS,RP0\nBCF STATUS,RP1', 'RP1:RP0 = 00 → <b>Bank 0</b> seçilir'],
            ['CLRF PORTB', 'PORTB sıfırlanır (LED\'ler sönük başlasın)'],
            ['BSF STATUS,RP0', 'RP0 = 1 → <b>Bank 1</b> (TRISB burada: 86h)'],
            ['MOVLW 0X00\nMOVWF TRISB', 'TRISB sıfırlanır: <b>bütün pinler çıkış</b>'],
            ['BCF STATUS,RP0', 'Tekrar <b>Bank 0</b>'],
            ['MOVLW 0AAH\nMOVWF PORTB', 'W\'ye AAh yüklenir, PORTB\'ye yazdırılır: 1010 1010']
          ] },
          { t: 'dg', id: 'asmstep', prog: 'aa' },
          { t: 'note', kind: 'exam', html: 'Slayt 50: <b>Makine dilinde</b> önce TRIS kaydedicisinin olduğu RAM bankı seçilir, sonra çıkış yapılacak pin <b>0</b> (Output), giriş yapılacak pin <b>1</b> (Input) yapılır. <b>C derleyicisinde</b> doğrudan TRIS kaydedicisine yazılır; <b>bank seçme işlemini derleyici otomatik yapar</b>.' },
          { t: 'h', text: 'Slayt 58: iki sayıyı topla, sonucu LED\'lerde göster' },
          { t: 'p', html: '<code>0x34 + 0x6 = 0x3A = 0011 1010</code>. Hata modunu da deneyebilirsin:' },
          { t: 'dg', id: 'asmstep', prog: 'add', title: 'Slayt 58: 34h + 06h → PORTB' }
        ],
        checks: [
          { q: 'Assembly\'de TRISB\'ye yazmadan önce neden BSF STATUS,RP0 yapılır?', a: 'TRISB Bank 1\'dedir (86h). Komut yalnızca 7 bitlik ofset (06h) taşır; Bank 1 seçilmezse yazma Bank 0\'daki aynı ofsete, yani PORTB\'ye gider.' },
          { q: 'Slayt 58 programı çalışınca PORTB\'de hangi LED\'ler yanar?', a: '34h + 06h = 3Ah = 0011 1010 → RB1, RB3, RB4, RB5 yanar.' }
        ]
      },
      {
        id: 'deney2',
        title: 'Deney 2: Kaydedicileri Hata Ayıklayıcıda İzleme',
        src: 'Deney 2 föyü',
        minutes: 7,
        lab: true,
        blocks: [
          { t: 'note', kind: 'lab', html: '<b>Amaç:</b> PIC16F877A\'nın genel yapısını ve register kavramını öğrenmek. Kod mikroC\'de yazılır, <b>Run → Start Debugger</b> ile adım adım çalıştırılır; değişkenler <b>Watch Values</b>\'a, adresler <b>View → Debug Windows → RAM</b> penceresinden okunur.' },
          { t: 'codex', title: 'İşlem basamağı 1', rows: [
            ['unsigned short int sayi1;\nunsigned short int sayi2;\nunsigned short int sonuc;', '1 baytlık işaretsiz değişkenler (0–255)'],
            ['sayi1=0x0f;\nsayi2=0xf0;', '0000 1111 ve 1111 0000'],
            ['sonuc =sayi1&sayi2;', 'Bit düzeyinde AND: ortak 1 yok → <b>sonuc = 0x00</b>, sonuç sıfır olduğu için <b>Z = 1</b>']
          ] },
          { t: 'p', html: 'Aynı işlemleri bit bit dene (operatörü değiştir):' },
          { t: 'dg', id: 'bitops', a: 0x0f, b: 0xf0, op: '&' },
          { t: 'table', head: ['Basamak', 'İşlem', 'sonuc', 'Beklenen bayrak'], rows: [
            ['1', '0x0F & 0xF0', '<b>0x00</b>', 'Z = 1 (lojik işlem C ve DC\'yi etkilemez)'],
            ['2', '0x0F | 0xF0', '<b>0xFF</b>', 'Z = 0'],
            ['3', 'sayi1 | 0xFF → 0xFF; sonra +2', '<b>0x01</b>', 'FFh + 2 = 101h: <b>C = 1</b>, <b>DC = 1</b> (F + 2 > F), Z = 0']
          ] },
          { t: 'note', kind: 'extra', html: 'Debugger\'da gördüğün STATUS, derleyicinin ürettiği <b>son</b> komuttan sonraki durumdur; aradaki MOVF gibi komutlar da Z\'yi değiştirebilir. Bu yüzden bayrakları, işlemi yapan satırdan hemen sonra not et. Sabit adresler: <b>STATUS 03h</b>, <b>PCL 02h</b>; değişkenlerin adresini derleyici seçer, RAM penceresinden oku.' }
        ],
        checks: [
          { q: 'Mikrodenetleyicide BANK yapısının avantajı nedir? (Deney 2)', a: 'Komut kelimesinde RAM adresi için 7 bit yeterli olur; komutlar kısa (14 bit) ve tek kelimelik kalır. Bank bitleriyle (RP1:RP0) 4 × 128 adrese erişilir. Sık kullanılan kaydediciler (STATUS, INTCON, PCL, FSR) tüm banklarda yansıtıldığı için bank değiştirmeden erişilir.' },
          { q: 'PIC16F877A\'da program belleğine değişken tanımlanabilir mi? (Deney 2)', a: 'Değişen bir değişken tanımlanamaz: Harvard mimarisinde program belleği (Flash) ayrıdır, çalışma sırasında RAM gibi yazılmaz. Ama sabitler (const, code belirleyicisi) program belleğine konabilir.' }
        ]
      }
    ]
  });
})(window.MC);
