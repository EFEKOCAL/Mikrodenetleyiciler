/*
 * exam.js — Vize kampı verisi.
 *   Kod yazma soruları (kind: 'code') → MC.teacherQuestions'a eklenir; aralıklı tekrara ve bölüm tekrarlarına girer.
 *     Çözüm kodu tek kaynaktan gelir: simülatörde çalışan MC.apps[kN].code (k7, k8 timer olduğu için burada).
 *   MC.tfBank   → doğru/yanlış soruları (dy şekli)
 *   MC.ghFamilies → hocanın GitHub'ındaki 26 uygulamanın aileleri: aynı iskelet, değişen birkaç satır
 */
(function (MC) {
  'use strict';

  const pre = (code) => `<pre>${MC.esc(code)}</pre>`;
  const K7 = `void interrupt(){
 PORTC.F2 = ~PORTC.F2;    // yarım periyotta bir tersle
 TMR0 = 6;                // yeniden yükle
 INTCON.TMR0IF = 0;       // bayrağı sil
}
void main() {
 TRISC = 0;
 PORTC = 0;
 OPTION_REG = 0b00000001; // T0CS=0, PSA=0, PS=001 → 1:4
 TMR0 = 6;
 INTCON = 0xA0;           // GIE=1, TMR0IE=1
 while(1);
}`;
  const K8 = `unsigned int sayac = 0;     // 1000 > 255: char yetmez!
void interrupt(){
 TMR0 = 6;                  // 4 MHz, 1:4 → 1 ms
 sayac++;
 if(sayac == 1000){         // 1000 × 1 ms = 1 s
  sayac = 0;
  PORTB.F0 = ~PORTB.F0;
 }
 INTCON.TMR0IF = 0;
}
void main() {
 TRISB = 0;
 PORTB = 0;
 OPTION_REG = 1;            // 1:4
 TMR0 = 6;
 INTCON = 0xA0;
 while(1);
}`;
  const code = (id) => pre(MC.apps[id].code);
  const C = (id, set, lesson, q, a, keys, extra) => Object.assign({ id, kind: 'code', set, lesson, q, a, keys }, extra || {});

  const CODE_Q = [
    C('k1', 'Kod yazma · Uygulama 6 varyantı', 'ch5/cikis1', 'D portuna bağlı 8 LED\'de <b>tek bir ışık RD7\'den RD0\'a</b> doğru 300 ms aralıkla kaysın; RD0\'dan sonra yeniden RD7\'den başlasın. Programı yazınız.',
      `${code('k1')}<p>Uygulama 6\'nın aynası: başlangıç 0x80 (RD7), <code>&lt;&lt;</code> yerine <code>&gt;&gt;</code>, 7 kaydırma.</p>`,
      ['TRISD = 0', 'Başlangıç PORTD = 0x80', 'for ile 7 kez PORTD >> 1', 'Her adımda Delay_ms(300)', 'while(1) içinde başa dönüş'], { try: '#/lab/kod/k1' }),
    C('k2', 'Kod yazma · Uygulama 5 varyantı', 'ch5/cikis1', 'B portundaki LED\'ler 250 ms aralıkla <b>soldan (RB7) başlayarak</b> tek tek dolsun; hepsi yanınca bu kez <b>sağdan (RB0) başlayarak</b> tek tek sönsün ve sonsuza dek tekrarlansın.',
      `${code('k2')}<p>Doldurma: sağa kaydır ve en sola 1 ekle (<code>| 0x80</code>). Boşaltma: sola kaydır, sağdan 0 girer. Uygulama 5\'teki <code>PORTB*2+1</code> fikrinin tersi.</p>`,
      ['TRISB = 0, başlangıç 0', '(PORTB >> 1) | 0x80 ile soldan doldurma', 'PORTB << 1 ile sağdan söndürme', 'Her iki döngü 8 adım', 'Delay_ms(250)'], { try: '#/lab/kod/k2' }),
    C('k3', 'Kod yazma · Uygulama 8 + 10 birleşimi', 'ch5/cikis2', 'B portunda <b>yan yana iki LED</b> (başlangıçta RB0–RB1) 200 ms aralıkla sola kaysın; RB6–RB7\'ye ulaşınca geri dönsün, RB0–RB1\'e gelince yine sola gitsin.',
      `${code('k3')}<p>Uygulama 10\'daki <code>bit yon</code> yöntemi, Uygulama 8\'in iki ışığıyla. Uçlar 0xC0 ve 0x03.</p>`,
      ['bit yon değişkeni', 'Başlangıç 0b00000011', 'yon==0 ise << 1, değilse >> 1', 'Uçlarda yön değiştirme (0xC0, 0x03)', 'Delay_ms(200)'], { try: '#/lab/kod/k3' }),
    C('k4', 'Kod yazma · Uygulama 10 + 11 birleşimi', 'ch5/giris', 'RD0\'daki buton <b>basılı değilken</b> B portundaki tek ışık 300 ms aralıkla <b>sola</b>, <b>basılıyken sağa</b> kaysın. Bir uçtan çıkan ışık diğer uçtan geri girsin.',
      `${code('k4')}<p>Buton yönü belirliyor (if/else), uçta kaybolmasın diye 0x80 → 0x01 ve 0x01 → 0x80 dönüşü yazılıyor.</p>`,
      ['TRISD = 0x01 (RD0 giriş)', 'if(PORTD.F0 == 0) sola, else sağa', 'Uçta sarma: 0x80 ↔ 0x01', 'Delay_ms(300)'], { try: '#/lab/kod/k4' }),
    C('k5', 'Kod yazma · Uygulama 26 buton mantığı', 'ch5/giris', 'RD0\'a her basışta B portundaki LED\'lerde <b>ikili</b> gösterilen sayı 1 artsın, RD1\'e her basışta 1 azalsın. Butonu <b>basılı tutmak yalnızca bir sayım</b> yapsın.',
      `${code('k5')}<p>Uygulama 26\'daki <code>pd0/pd1</code> kenar algılaması: "şimdi basılı VE önceki turda basılı değildi".</p>`,
      ['TRISD = 0b00000011', 'Önceki durum bayrağı (bit b0, b1)', 'Yalnızca yeni basışta say', 'Bırakınca bayrak 0', 'PORTB = sayi'], { try: '#/lab/kod/k5' }),
    C('k6', 'Kod yazma · Deney 4 varyantı', 'ch6/deney4', 'RB0/INT pinine bağlı butonun <b>düşen kenarında</b> D portundaki tüm LED\'ler tersine dönsün (kesme ile). Ana program bu sırada C portundaki LED\'leri 500 ms aralıkla yakıp söndürsün.',
      `${code('k6')}<p>Deney 4\'ten farkları: <code>INTEDG = 0</code> (düşen kenar) ve ISR\'de <code>PORTD = ~PORTD</code>. Bayrak silinmezse program kesmeden çıkamaz.</p>`,
      ['TRISB.0 = 1 (RB0 giriş)', 'OPTION_REG.INTEDG = 0', 'INTCON.INTE = 1 ve GIE = 1', 'ISR: PORTD = ~PORTD', 'ISR sonunda INTCON.INTF = 0'], { try: '#/lab/kod/k6' }),
    C('k7', 'Kod yazma · Uygulama 15 varyantı (timer hesabı)', 'ch7/kod', 'F<sub>OSC</sub> = 8 MHz. Timer0 kesmesi kullanarak <b>RC2 pininde 1 kHz</b> kare dalga üreten programı yazınız. Prescale ve TMR0 hesabını gösteriniz.',
      `<p>1 kHz → periyot 1 ms → pin her <b>0,5 ms</b>\'de tersine döner. Sayım = 0,5 ms × 8 MHz / (P × 4) = 1000 / P. P = 4 → 250 → <b>TMR0 = 256 − 250 = 6</b> (OPTION_REG = 1). (P = 8 → TMR0 = 131 de doğru.)</p>${pre(K7)}`,
      ['Yarım periyot 0,5 ms', 'TMR0 = 256 − G·F/(P·4) hesabı', 'OPTION_REG ön ölçek bitleri doğru', 'ISR: pin tersle + TMR0 yeniden yükle + TMR0IF = 0', 'INTCON = 0xA0'], { try: '#/lab/zaman' }),
    C('k8', 'Kod yazma · Timer ile uzun süre', 'ch7/kod', 'F<sub>OSC</sub> = 4 MHz. <b>Delay_ms kullanmadan</b>, Timer0 kesmesiyle RB0\'daki LED 1 sn yanık, 1 sn sönük olsun.',
      `<p>Timer0 en fazla 256 × 256 µs ≈ 65 ms sayabilir; 1 s için kesmeleri <b>sayarız</b>. 1 ms\'lik kesme (P = 4, TMR0 = 6) × 1000 = 1 s. Sayaç 1000\'e çıktığı için <b>char değil int</b> olmalı.</p>${pre(K8)}`,
      ['1 ms kesme: OPTION_REG = 1, TMR0 = 6', 'ISR içinde sayaç', 'Sayaç int (1000 > 255)', '1000\'de sıfırla ve pini tersle', 'TMR0 yeniden yükle, TMR0IF = 0'], { try: '#/lab/zaman' }),
    C('k9', 'Kod yazma · Uygulama 22 varyantı', 'ch8/ornek', '<b>Ortak anotlu</b> 7 segment display B portuna bağlı (a = RB7 … g = RB1). <b>9\'dan 0\'a</b> 500 ms aralıkla geri sayan, 0\'dan sonra tekrar 9\'a dönen programı <b>dizi</b> kullanarak yazınız.',
      `${code('k9')}<p>Ortak katot kodlarını diziye yaz, ortak anot için <code>~</code>. Geri sayımda <code>i</code> işaretli olmalı.</p>`,
      ['Segment kodu dizisi', 'Ortak anot: ~kod[i] (veya ters kodlar)', 'for(i=9; i>=0; i--)', 'i signed int', 'Delay_ms(500)'], { try: '#/lab/kod/k9' }),
    C('k10', 'Kod yazma · Uygulama 24 + 26 birleşimi', 'ch8/ornek', '<b>Ortak katotlu</b> 7 segment B portuna doğrudan bağlı (sürücü yok). RD0 butonuna <b>her basışta</b> gösterilen rakam 1 artsın (9\'dan sonra 0). Basılı tutmak tek sayım olsun.',
      `${code('k10')}`,
      ['Kod dizisi (ortak katot)', 'TRISD = 0x01', 'Kenar algılama bayrağı', 'sayac > 9 → 0', 'PORTB = kod[sayac]', 'Debounce gecikmesi'], { try: '#/lab/kod/k10' }),
    C('k11', 'Kod yazma · Uygulama 25 varyantı', 'ch8/sayac99', 'İki BCD sürücülü gösterge B portuna bağlı (onlar RB7…RB4, birler RB3…RB0). <b>00\'dan 59\'a</b> saniyede bir sayan, 59\'dan sonra 00\'a dönen programı yazınız.',
      `${code('k11')}`,
      ['/10 ve %10 ile basamaklara ayırma', 'Onlar ×16 (<<4) ile üst 4 bit', 'Tek PORTB yazımı', 'sayac > 59 → 0', 'Delay_ms(1000)'], { try: '#/lab/kod/k11' }),
    C('k12', 'Kod yazma · Uygulama 26 varyantı', 'ch8/mux', 'Uygulama 26 devresinde (veri RB3…RB0 sürücüye, hane seçimi RC7 binler … RC4 birler, ortak katot) göstergede sürekli <b>2026</b> yazan programı yazınız.',
      `${code('k12')}<p>Sayı sabit olduğu için basamaklar doğrudan yazılabilir. Her hane: seç (0 = seçili) → veri → 1 ms.</p>`,
      ['TRISB = 0, TRISC = 0', 'Doğru hane seçim değerleri (0b11101111 …)', 'Her haneye doğru basamak', 'Delay_ms(1) her hanede', 'while(1) içinde sürekli tarama'], { try: '#/lab/kod/k12' }),
    C('k13', 'Kod yazma · Uygulama 13 + 14 birleşimi', 'ch5/fonksiyon', 'RD0 basılıyken <b>çift</b> indisli LED\'ler, RD1 basılıyken <b>tek</b> indisli LED\'ler 250 ms aralıkla yanıp sönsün; ikisi de basılı değilse tüm LED\'ler sönük kalsın. Yanıp sönmeyi <b>parametreli bir fonksiyonla</b> yazınız.',
      `${code('k13')}`,
      ['TRISD = 0b00000011', 'Fonksiyon parametresi: desen', 'Çift 0x55, tek 0xAA', 'if / else if / else', 'Hiçbiri basılı değilse PORTB = 0'], { try: '#/lab/kod/k13' })
  ];
  MC.teacherQuestions.push(...CODE_Q);

  /* ------------------------------------------------------------ doğru / yanlış */
  const T = (d, s, a, tag) => ({ d, s, a, tag });
  MC.tfBank = [
    T(true, 'mikroC\'de <code>int</code> 2 bayttır.', 'PC\'de 4 bayt olsa da mikroC (PIC) için int 2 bayt (−32768…32767).', 'tip'),
    T(false, 'mikroC\'de <code>short</code> 2 bayttır.', 'short 1 bayttır (−128…127).', 'tip'),
    T(false, 'mikroC\'de <code>double</code> 8 bayttır.', 'mikroC\'de double = float = 4 bayt.', 'tip'),
    T(true, 'mikroC\'de <code>char</code> varsayılan olarak işaretsizdir (0…255).', 'char unsigned kabul edilir; işaretli için signed char yazılır.', 'tip'),
    T(true, '<code>unsigned char x = 250; x = x + 10;</code> sonrasında x = 4 olur.', '260 8 bite sığmaz: 260 − 256 = 4.', 'tip'),
    T(true, '<code>float</code> ve <code>long</code> değişkenler 4 bayt yer kaplar.', 'İkisi de 32 bit.', 'tip'),
    T(true, 'IEEE 754 tek duyarlıkta üs alanı 8 bit ve bias 127\'dir.', '1 bit işaret + 8 bit üs (gerçek üs + 127) + 23 bit mantis.', 'ieee'),
    T(false, 'IEEE 754\'te mantisin başındaki 1 de bellekte saklanır.', 'Normalize sayıda baştaki 1 her zaman vardır, saklanmaz (gizli bit); 23 bit yalnızca virgülden sonrası.', 'ieee'),
    T(true, 'IEEE 754\'te işaret biti 1 ise sayı negatiftir.', '−4.75 = C0980000h: ilk bit 1.', 'ieee'),
    T(false, '0.1 sayısı float olarak tam (hatasız) saklanabilir.', '0.1 ikili tabanda sonsuz devirli kesirdir; en yakın değer saklanır.', 'ieee'),
    T(true, '−4.75 sayısının IEEE 754 gösterimi C0980000h\'dir.', '4.75 = 100.11₂ = 1.0011 × 2² → S = 1, üs 129 = 1000 0001, mantis 0011 0…', 'ieee'),
    T(true, 'mikroC\'de çok baytlı değişkenlerin düşük anlamlı baytı düşük adrese yazılır.', 'Little endian: int −250 = FF06h → ilk adreste 06, sonrakinde FF.', 'bellek'),
    T(false, '<code>long jjjj absolute 0x30; char i absolute 0x33;</code> tanımlarında çakışma yoktur.', 'long 0x30–0x33\'ü kaplar; i de 0x33\'te: çakışma var.', 'bellek'),
    T(true, '<code>absolute</code> değişkeni, <code>org</code> ise fonksiyonu sabit bir adrese yerleştirir.', 'absolute → RAM\'de değişken (veya sabit dizi); org → fonksiyonun program belleğindeki başlangıç adresi.', 'bellek'),
    T(true, '<code>int y absolute 0x25; short t absolute 0x26;</code> tanımında t\'ye yazmak y\'nin üst baytını değiştirir.', 'y 0x25–0x26\'yı kaplar; 0x26 y\'nin üst baytıdır.', 'bellek'),
    T(true, 'PIC16F877A Harvard mimarisine sahiptir.', 'Program ve veri belleği ayrı yollardan erişilir.', 'genel'),
    T(true, 'PIC16F877A\'da komut kelimesi 14 bit, veri yolu 8 bittir.', '14 bitlik Flash program belleği, 8 bitlik RAM.', 'genel'),
    T(false, 'PIC16F877A\'nın donanım yığını 16 seviyelidir.', '8 seviyelidir.', 'genel'),
    T(true, '4 MHz kristalle bir komut döngüsü 1 µs sürer.', 'Bir komut döngüsü 4 saat darbesi: 4 × 0,25 µs.', 'genel'),
    T(true, 'Bank seçimi STATUS kaydedicisindeki RP1:RP0 bitleriyle yapılır.', 'Komutta adres için 7 bit var; hangi 128\'lik bank olduğunu RP1:RP0 söyler.', 'genel'),
    T(false, 'MCLR pini çalışma sırasında 0 V\'ta tutulmalıdır.', 'MCLR aktif düşüktür: 0 → reset. Çalışırken 1 (VDD) olmalı.', 'genel'),
    T(false, 'EEPROM\'daki veri enerji kesilince kaybolur.', 'EEPROM kalıcıdır; RAM geçicidir.', 'genel'),
    T(false, 'TRIS kaydedicisinde 1 çıkış, 0 giriş demektir.', 'Tersi: 1 = Input (giriş), 0 = Output (çıkış).', 'port'),
    T(false, '<code>PORTB = 0xFF;</code> B portunun tüm pinlerini çıkış yapar.', 'Yön TRISB ile belirlenir; PORTB çıkış seviyesini yazar.', 'port'),
    T(true, '<code>PORTB = PORTB &lt;&lt; 1;</code> işleminde en sağdaki bite 0 girer.', 'Sola kaydırmada sağdan 0 girer, en soldaki bit kaybolur.', 'port'),
    T(true, 'PORTB = 128 iken <code>PORTB = PORTB &lt;&lt; 1;</code> yapılırsa PORTB = 0 olur.', '256 8 bite sığmaz.', 'port'),
    T(false, '<code>&amp;</code> ve <code>&amp;&amp;</code> operatörleri her zaman aynı sonucu verir.', '0x0F & 0xF0 = 0; 0x0F && 0xF0 = 1.', 'port'),
    T(true, 'RA4 pini açık drain çıkışlıdır.', 'Yüksek seviye için dış pull-up gerekir.', 'port'),
    T(true, 'Schmitt tetikleyici girişte iki farklı eşik (histerezis) kullanır.', 'Gürültülü ve yavaş değişen girişlerde kararsız geçişleri önler.', 'port'),
    T(true, 'Buton arkı (bounce) için çoğu devrede yaklaşık 10 ms gecikme yeterlidir.', 'Slayt: çoğu devrede 10 ms.', 'port'),
    T(false, '<code>Delay_ms(1000)</code> çalışırken CPU butonu okumaya devam eder.', 'Delay yazılımla bekleme döngüsüdür; CPU başka iş yapmaz (polling\'in zayıf yanı).', 'port'),
    T(true, 'Kesme vektörü program belleğinde 0004h, reset vektörü 0000h adresindedir.', '', 'kesme'),
    T(true, 'GIE = 0 iken hiçbir kesme CPU\'ya ulaşmaz.', 'GIE genel izin anahtarıdır.', 'kesme'),
    T(false, 'Kesme bayrakları (INTF, TMR0IF) kesmeden çıkarken donanımca otomatik silinir.', 'Yazılımla silinmeli; silinmezse hemen tekrar kesmeye girilir.', 'kesme'),
    T(true, 'RB0/INT kesmesinin tetiklendiği kenar OPTION_REG\'in INTEDG biti ile seçilir.', 'INTEDG = 1 yükselen, 0 düşen kenar.', 'kesme'),
    T(true, 'Kesmeye girilince GIE otomatik 0 olur, RETFIE ile tekrar 1 olur.', 'Kesme içinde yeni kesme gelmesin diye.', 'kesme'),
    T(false, 'Timer0 16 bitlik bir zamanlayıcıdır.', 'Timer0 8 bit; Timer1 16 bit.', 'timer'),
    T(false, '<code>OPTION_REG = 0x01;</code> ile Timer0 ön ölçeği 1:2 olur.', 'PS = 001 → 1:4 (000 → 1:2).', 'timer'),
    T(true, 'TMR0 = 256 − G·F/(P·4) sonucu negatif çıkarsa daha büyük prescale seçilir.', 'Sayım 256\'yı aşıyor demektir.', 'timer'),
    T(true, 'Kare dalga üretirken kesme aralığı periyodun yarısıdır.', 'Pin her kesmede tersine döner: 1 ms kesme → 2 ms periyot → 500 Hz.', 'timer'),
    T(true, 'Timer0 kesme alt programında TMR0 yeniden yüklenmezse sonraki kesme 256 sayım sonra gelir.', 'Taşmadan sonra TMR0 00h\'den sayar.', 'timer'),
    T(false, 'Delay_ms ile bekleme, Timer kesmesinden daha hassastır ve CPU\'yu serbest bırakır.', 'Tersi: Timer donanımda sayar, CPU başka iş yapabilir.', 'timer'),
    T(true, 'Ortak katotlu displayde bir segmentin yanması için ilgili pine 1 verilir.', 'Katotlar GND\'de; pin 5 V olunca akım geçer.', 'seg'),
    T(false, 'Ortak anotlu displayde ortak uç GND\'ye bağlanır.', 'Ortak anot +5 V\'a bağlanır; segment 0 ile yanar.', 'seg'),
    T(true, 'Aynı bağlantıda ortak anot kodu, ortak katot kodunun bit bit tersidir.', 'Örnek: 0 → 0xFC (katot), 0x03 (anot).', 'seg'),
    T(true, 'BCD → 7 segment sürücü kullanınca bir hane için 4 pin yeterlidir.', 'RB3…RB0 = A…D girişleri.', 'seg'),
    T(false, 'Multiplexing\'de tüm haneler aynı anda yanar.', 'Haneler sırayla kısa süre yanar; göz hepsini yanık görür.', 'seg'),
    T(true, 'Ortak katotlu çok haneli göstergede seçilecek hanenin ortak ucu 0 V yapılır.', 'Slayt 12: hane pini 0 V, veri 1 = yanık.', 'seg'),
    T(true, 'Uygulama 25\'te sayac = 57 iken PORTB = 0x57 olur.', 'onlar 5 → 0x50, birler 7: 0x50 ^ 0x07 = 0x57.', 'seg'),
    T(false, '<code>sayac</code> unsigned int olsaydı Uygulama 25\'teki <code>if(sayac&lt;0)</code> kontrolü yine çalışırdı.', 'unsigned hiçbir zaman 0\'dan küçük olmaz; 0 − 1 = 65535.', 'seg')
  ];

  /* ------------------------------------------------------------ hocanın GitHub'ı: aileler */
  const U = (n, what, href) => ({ n, what, href });
  MC.ghFamilies = [
    { title: 'Bellek ve veri tipleri', ch: 'ch4', same: 'Değişken tanımla, değer ata, RAM penceresinde gör.', diff: 'Tip ve adres.', apps: [
      U(1, '<code>int sayi = 10;</code> adres derleyicide', '#/b/ch4/absolute'), U(2, 'absolute çakışması: int y 0x25, short t 0x26', '#/b/ch4/absolute'), U(3, 'float: önce 0.0625, <b>11 Kasım\'da −4.75</b> yapıldı (IEEE 754)', '#/b/ch4/absolute')] },
    { title: 'Çıkış desenleri (LED)', ch: 'ch5', same: 'TRISB = 0; while(1){ PORTB\'ye desen; Delay_ms; }', diff: 'Başlangıç değeri, işlem (<<, >>, ×2+1, ^), döngü sayısı, gecikme.', apps: [
      U(4, 'Hepsi yak-söndür (0x00 ↔ 0xFF)', '#/lab/uygulamalar/u4'), U(5, 'Doldur: PORTB*2+1', '#/lab/uygulamalar/u5'), U(6, 'Kayan ışık: PORTB<<1, i<7', '#/lab/uygulamalar/u6'), U(7, 'Çapraz geçiş: sayi1 ^ sayi2', '#/lab/uygulamalar/u7'), U(8, 'İkili ışık: PORTB = 3, <<1', '#/lab/uygulamalar/u8'), U(9, 'Üçlü ışık: 0xE0, >>1', '#/lab/uygulamalar/u9'), U(10, 'Gidip gelen: bit yon', '#/lab/uygulamalar/u10')] },
    { title: 'Buton (giriş)', ch: 'ch5', same: 'TRISD = 1; while(1){ if(PORTD.F0==1){…} else {…} }', diff: 'Basınca ne yapıldığı ve else olup olmadığı.', apps: [
      U(11, 'Basınca RB3 yanar', '#/lab/uygulamalar/u11'), U(12, 'Basınca hepsi yanar', '#/lab/uygulamalar/u12'), U(13, 'Basılıyken yak-söndür', '#/lab/uygulamalar/u13'), U(14, 'Fonksiyonla tek/çift', '#/lab/uygulamalar/u14')] },
    { title: 'Timer0 kesmesi', ch: 'ch7', same: 'interrupt(){ pin tersle; TMR0 = X; TMR0IF = 0; } · OPTION_REG, TMR0, INTCON = 0xA0', diff: 'Yalnızca OPTION_REG (prescale) ve TMR0 değeri: soru farklı F<sub>OSC</sub> / süre verir.', apps: [
      U(15, '4 MHz, 1 ms: 1:4, TMR0 = 6', '#/b/ch7/kod'), U(16, '4 MHz, 1 ms: 1:8, TMR0 = 131', '#/b/ch7/kod'), U(17, '8 MHz, 100 µs: 1:8, TMR0 = 231', '#/b/ch7/ornek23'), U(18, '16 MHz, 20 µs: 1:2, TMR0 = 216', '#/b/ch7/ornek23')] },
    { title: 'ADC', ch: 'ch9', same: 'ADCON1, ADCON0 ayarı; sonucu PORTB\'ye yaz.', diff: 'Kesme + ADRESH ya da ADC_Get_Sample + ölçekleme.', apps: [
      U(19, 'Kesmeli: adc_degeri = ADRESH', '#/b/ch9/kod'), U(20, 'ADC_Get_Sample(0) × 0,249', '#/b/ch9/kod')] },
    { title: '7 segment (11 Kasım\'da eklendi)', ch: 'ch8', same: 'TRISB = 0; PORTB\'ye rakamın kodu ya da kendisi; Delay_ms.', diff: 'Ortak katot/anot, sürücü var/yok, hane sayısı, buton.', apps: [
      U(21, '0–9 ortak katot (10 satır)', '#/lab/uygulamalar/u21'), U(22, '0–9 ortak anot (kodların tersi)', '#/lab/uygulamalar/u22'), U(23, '0–9 sürücü ile (PORTB = sayı)', '#/lab/uygulamalar/u23'), U(24, 'Buton + sürücü, 0–9', '#/lab/uygulamalar/u24'), U(25, '0–99, iki sürücü, /10 %10', '#/lab/uygulamalar/u25'), U(26, '0–9999, multiplexing, pd bayrağı', '#/lab/uygulamalar/u26')] }
  ];
})(window.MC);
