/*
 * exam-view.js — Vize kampı: sınavda çıkacağı söylenen soru tiplerine göre hedefli çalışma.
 *   #/vize            sınav nasıl + sekmeler
 *   #/vize/ieee       yalnızca seçilen konu (lab görünümüyle aynı düzen)
 * Kaynak: sınıf arkadaşlarının notları ve geçen yılın sınavı (kesin değil), hocanın GitHub'ı, föyler.
 */
(function (MC) {
  'use strict';

  const dg = (b) => MC.dg.render(Object.assign({ t: 'dg' }, b));
  const BOX = [['Yeni', 'b0'], ['Tekrar et', 'b1'], ['Gelişiyor', 'b2'], ['Öğrenildi', 'b3']];
  const boxOf = (id) => ((MC.learnStore && MC.learnStore.data.q[id]) || { box: 0 }).box;
  const chOf = (id) => MC.lessons.chapters.find((c) => c.id === id);

  const SKELETONS = [
    ['Çıkış deseni (LED)', `int i;
void main() {
 TRISB = 0;              // 1) yön: çıkış
 PORTB = başlangıç;      // 2) ilk desen
 while(1){               // 3) sonsuz döngü
  for(i=0;i<N;i++){
   Delay_ms(t);
   PORTB = PORTB << 1;   // desen işlemi
  }
  PORTB = başlangıç;     // başa dön
 }
}`],
    ['Buton okuma', `void main() {
 TRISB = 0;              // LED'ler çıkış
 TRISD = 0b00000001;     // RD0 giriş
 while(1){
  if(PORTD.F0 == 1){     // == (iki eşittir!)
   ...                   // basılıyken
  }else{
   ...                   // bırakılınca
  }
 }
}`],
    ['Timer0 kesmesi', `void interrupt(){
 PORTB.F0 = ~PORTB.F0;   // iş
 TMR0 = X;               // yeniden yükle
 INTCON.TMR0IF = 0;      // bayrağı sil
}
void main() {
 TRISB = 0;
 OPTION_REG = PS;        // T0CS=0, PSA=0, PS2:0
 TMR0 = X;               // X = 256 − G·F/(P·4)
 INTCON = 0xA0;          // GIE + TMR0IE
 while(1);
}`],
    ['RB0 harici kesme', `void interrupt(){
 ...                     // iş
 INTCON.INTF = 0;        // bayrağı sil
}
void main() {
 TRISB = 0x01;           // RB0 giriş
 OPTION_REG.INTEDG = 1;  // 1 yükselen, 0 düşen
 INTCON.INTE = 1;
 INTCON.GIE = 1;
 while(1){ ... }
}`],
    ['7 segment', `char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,
                 0xB6,0xBE,0xE0,0xFE,0xF6};
// ortak katot; ortak anot: ~kod[i]
// sürücü varsa: PORTB = sayi;
// 2 hane:  PORTB = (s/10)*16 + s%10;
// 4 hane:  PORTC = 0b11101111; PORTB = birler;
//          Delay_ms(1); ... (her hane)`]
  ];
  const MISTAKES = [
    '<b>TRIS\'i unutmak</b> ya da 0/1\'i ters yazmak (1 = giriş, 0 = çıkış).',
    '<b>while(1)</b> yazmamak: program bir kez çalışıp biter.',
    '<code>if(PORTD.F0 = 1)</code>: tek eşittir atamadır, koşul her zaman doğru olur. Doğrusu <code>==</code>.',
    'Kesmede <b>bayrağı silmemek</b> (INTF, TMR0IF): program kesmeden çıkamaz.',
    'Timer kesmesinde <b>TMR0\'ı yeniden yüklememek</b>: ikinci kesmeden itibaren süre 256 sayım olur.',
    '1000\'e kadar sayan değişkeni <b>char</b> yapmak (en fazla 255). Geri sayımda <code>i&gt;=0</code> için <b>signed</b> tip gerekir.',
    'Kayan ışıkta <b>döngü sayısı</b>: 8 kaydırma tek ışığı kaybettirir (128&lt;&lt;1 = 0); 7 yeter.',
    'Kare dalgada kesme aralığını periyot sanmak: <b>kesme aralığı = yarım periyot</b>.',
    'Ortak anotta segment kodlarını tersine çevirmeyi unutmak (<code>~</code>).'
  ];
  const TOPICS = [
    ['kod', 'Kod yazma (4 soru bekleniyor)', 'Sıfırdan yazdırıyor; yarısı hocanın uygulamalarının biraz değişmiş hali. Lab föyleri ve ders kodları da kaynak.'],
    ['github', 'Hocanın 26 uygulaması', '"Hocanın GitHub\'ındaki örnekleri inceleyin." Aileler hâlinde: aynı iskelet, değişen birkaç satır.'],
    ['ieee', 'IEEE 754 hesabı', 'Geçen yıl bir hesap sorusu vardı. Hoca 11 Kasım\'da Uygulama 3\'ü −4.75 yaptı: negatif sayıya hazır ol.'],
    ['bellek', 'Tip boyutları ve absolute çakışması', '"Hangi tip kaç bayt" sorusu vardı. Ardışık adrese konan değişkenlerin üst üste binmesi hem teoride hem labda görüldü.'],
    ['dy', 'Doğru / yanlış', 'Geçen yıl doğru-yanlış bölümü vardı.'],
    ['timer', '★ Timer hesabı (kesin çıkar)', '"Kesin çıkar" diye paylaşılan soru: TMR_reg_değeri = Timer_max − (Gecikme × F<sub>osc</sub>) / (Prescale × 4). Geçen yıl kod sorusunun içindeydi: istenen süre için kodu yaz ya da verilen koddan frekansı bul.'],
    ['seg', '7 segment / sayıyı porta gönderme', 'Bu haftanın konusu: sayının bitleri pinlerde nasıl sinyale ve ışığa dönüşür.'],
    ['kaydirma', 'Buton, sola / sağa kaydırma', '"Butona basma, sola kaydırdık sağa kaydırdık tarz örneklere bakın."']
  ];

  const SECTIONS = {
    kod: () => {
      const qs = (MC.teacherQuestions || []).filter((q) => q.kind === 'code');
      return `<p class="hint">Her soru hocanın bir uygulamasının ya da föy kodunun <b>küçük bir değişikliği</b>. Yöntem: soruyu oku, <b>kâğıda sıfırdan yaz</b>, sonra çözümü aç ve puanlama listesini işaretle. Çözümlerin çoğu simülatörde satır satır çalışıyor.</p>
        <div class="btn-row"><a class="btn btn-primary" href="#/kod">⟳ Kod sorularını tek tek çalış (aralıklı tekrar)</a></div>
        <div class="table-wrap"><table><thead><tr><th>Soru</th><th>Neyin varyantı</th><th>Durum</th><th></th></tr></thead><tbody>
        ${qs.map((q) => { const b = BOX[boxOf(q.id)]; return `<tr><td>${q.q.replace(/<[^>]+>/g, '').slice(0, 120)}${q.q.replace(/<[^>]+>/g, '').length > 120 ? '…' : ''}</td><td>${q.set.replace('Kod yazma · ', '')}</td><td><span class="pill ${b[1]}">${b[0]}</span></td><td><a class="btn btn-sm" href="#/kod/${q.id}">Çöz</a></td></tr>`; }).join('')}
        </tbody></table></div>
        <h3 class="l-section">Ezberlenecek 5 iskelet</h3>
        <div class="skel-grid">${SKELETONS.map(([t, c]) => `<div class="skel"><b>${t}</b><pre class="l-code">${MC.esc(c)}</pre></div>`).join('')}</div>
        <h3 class="l-section">Kod sorusunda en sık puan kaybettiren hatalar</h3>
        <ul class="l-list">${MISTAKES.map((m) => `<li>${m}</li>`).join('')}</ul>
        <h3 class="l-section">Çözümleri çalıştır</h3>
        ${dg({ id: 'run', apps: MC.codeApps })}`;
    },
    github: () => `<p class="hint">Hocanın deposu (timurinan/Mikrodenetleyiciler-2026-2027) 11 Kasım\'da güncellendi: 7 segment için Uygulama 21–26 eklendi, Uygulama 3 değişti. Her ailede <b>ortak iskeleti</b> bir kez öğren, sonra yalnızca <b>değişen satırlara</b> bak; sınavdaki varyant da büyük ihtimalle böyle değişecek.</p>
      ${MC.ghFamilies.map((f) => `<section class="card fam"><div class="fam-h"><b>${f.title}</b><a class="pill b2" href="#/b/${f.ch}">B${chOf(f.ch).num}</a></div>
        <div class="fam-sd"><div><small>Ortak iskelet</small><span>${f.same}</span></div><div><small>Değişen</small><span>${f.diff}</span></div></div>
        <ul class="fam-list">${f.apps.map((a) => `<li><a href="${a.href}"><b>Uygulama ${a.n}</b></a><span>${a.what}</span></li>`).join('')}</ul></section>`).join('')}
      <p class="hint">Deney föylerinin kodları: Deney 3 (iki buton, iki LED), Deney 4 (RB0 kesmesi, INTF silinmezse), Deney 5 (500 Hz kare dalga). Hepsi ilgili bölümlerde ve <a href="#/lab/uygulamalar">LED simülatöründe</a>.</p>`,
    ieee: () => `<div class="card"><b>5 adımda IEEE 754 (32 bit)</b><ol class="l-list">
        <li><b>İşaret:</b> negatifse S = 1.</li><li><b>İkiliye çevir:</b> tam kısım 2\'ye bölerek, kesir kısmı 2 ile çarparak (0.75 → 1.5 → 1, 0.5 → 1.0 → 1: 0.11).</li>
        <li><b>Normalize et:</b> 1.xxx × 2<sup>e</sup> (virgülü ilk 1\'in arkasına kaydır).</li><li><b>Üs:</b> e + 127 → 8 bit.</li><li><b>Mantis:</b> virgülden sonrası, 23 bite 0 ile tamamla. S | üs | mantis → 4\'lü grupla → hex.</li></ol>
        <p><b>Örnek (Uygulama 3, −4.75):</b> 4.75 = 100.11₂ = 1.0011 × 2² → S = 1, üs = 2 + 127 = 129 = 1000 0001, mantis = 0011 000… → <code>1100 0000 1001 1000 0000 … 0</code> = <b>C0980000h</b>. RAM\'de: 00 00 98 C0.</p></div>
      ${dg({ id: 'quiz', types: ['ieee'] })}${dg({ id: 'quiz', types: ['ieeer'] })}${dg({ id: 'float' })}${dg({ id: 'mem', preset: 'u3' })}`,
    bellek: () => `<div class="table-wrap"><table><thead><tr><th>Tip</th><th>Bayt</th><th>Aralık</th></tr></thead><tbody>
        <tr><td>bit</td><td>1 bit</td><td>0, 1</td></tr><tr><td>char (unsigned)</td><td>1</td><td>0…255</td></tr><tr><td>signed char, short</td><td>1</td><td>−128…127</td></tr>
        <tr><td>int</td><td>2</td><td>−32768…32767</td></tr><tr><td>unsigned int</td><td>2</td><td>0…65535</td></tr><tr><td>long</td><td>4</td><td>±2,1 milyar</td></tr><tr><td>float, double</td><td>4</td><td>±1,5·10⁻⁴⁵ … ±3,4·10³⁸</td></tr></tbody></table></div>
      <p class="hint"><b>Çakışma kuralı:</b> n baytlık değişken adres, adres+1 … adres+n−1\'i kaplar. Başka bir değişken bu aralığa konursa ortak bayt(lar) paylaşılır: <b>en son yazılan kazanır</b>. Düşük bayt düşük adrestedir (little endian).</p>
      ${dg({ id: 'quiz', types: ['size'] })}${dg({ id: 'quiz', types: ['overlap'] })}${dg({ id: 'mem', preset: 'u2' })}${dg({ id: 'mem', preset: 'prob' })}`,
    dy: () => `<p class="hint">Her turda bankadan karışık 12 ifade gelir. Yanlış bildiklerinin açıklamasını oku; "neden yanlış" sorusu sınavda da sorulabilir.</p>${dg({ id: 'dy', n: 12 })}`,
    timer: () => `<div class="card"><b>Formül</b><p style="font:600 16px var(--mono);margin:8px 0">TMR_reg_değeri = Timer_max − (Gecikme × F<sub>osc</sub>) / (Prescale × 4)</p>
        <ul class="l-list"><li><b>Timer_max:</b> 8 bit Timer0 için 256 (16 bit Timer1 için 65536).</li><li><b>F<sub>osc</sub>:</b> ana osilatör frekansı (Hz).</li><li><b>Prescale:</b> bölme oranı (Timer0: 2, 4, 8 … 256).</li><li><b>4:</b> PIC\'te bir komut 4 saat darbesinde yürütülür; Timer0 her komut döngüsünde bir sayar.</li></ul>
        <p class="hint">Örnek: 4 MHz, 1 ms, prescale 4 → 256 − (0,001 × 4 000 000) / (4 × 4) = 256 − 250 = <b>6</b>. Sonuç negatifse ya da tam sayı çıkmıyorsa başka bir prescale dene.</p></div>
      <div class="card" style="margin-top:12px"><b>İki yönlü soru</b><ul class="l-list"><li><b>Kodu yaz:</b> istenen süre/frekans → kesme aralığı (kare dalgada yarım periyot) → <code>TMR0 = 256 − G·F/(P·4)</code>, tam sayı çıkan P\'yi seç → OPTION_REG\'in PS bitleri.</li>
        <li><b>Kodu oku:</b> OPTION_REG\'in son 3 bitinden P (000 → 1:2 … 111 → 1:256), TMR0\'dan sayım = 256 − TMR0 → aralık = sayım × P × 4 / F<sub>OSC</sub>; kare dalgada f = 1 / (2 × aralık).</li></ul></div>
      ${dg({ id: 'quiz', types: ['tmrcode'] })}${dg({ id: 'quiz', types: ['timer'] })}${dg({ id: 'quiz', types: ['option'] })}${dg({ id: 'timercalc', fosc: 8, delay: 1 })}`,
    seg: () => `${dg({ id: 'seg7', digit: 5 })}${dg({ id: 'quiz', types: ['seg'] })}${dg({ id: 'quiz', types: ['digit'] })}
      <p class="hint">Konunun tamamı: <a href="#/b/ch8">Bölüm 8 · 7 Segment Display</a>. Simülatörde Uygulama 21–26: <a href="#/lab/uygulamalar/u21">LED simülatörü</a>.</p>`,
    kaydirma: () => `${dg({ id: 'quiz', types: ['shift'] })}${dg({ id: 'bitops' })}${dg({ id: 'run', apps: ['u6', 'u10', 'u7', 'k3', 'k4', 'u13'] })}`
  };

  function render(root, parts) {
    const id = parts[1];
    const topic = TOPICS.find((t) => t[0] === id);
    const tabs = `<div class="lab-toc">${TOPICS.map(([k, t]) => `<a class="tab${k === id ? ' active' : ''}" href="#/vize/${k}">${t}</a>`).join('')}</div>`;
    let body;
    if (!topic) {
      const codeN = (MC.teacherQuestions || []).filter((q) => q.kind === 'code').length;
      body = `<section class="card l-chhead"><span class="tag">Vize hazırlığı · hedefli çalışma</span><h2>Vize kampı</h2>
        <p>Sınıf arkadaşlarının notlarına ve geçen yılın sınavına göre vizede şunlar bekleniyor. <span class="muted">Bunlar öğrenci gözlemi; hocanın resmi açıklaması değil.</span></p>
        <ul class="l-list"><li><b>Klasik + kod:</b> 4 civarı soru, kod yazdırma ağırlıklı ("en az 1 kod sorusu", geçen yıl 4). Kod <b>sıfırdan</b> yazdırılıyor; lab föylerindeki ve derste yazılan kodlardan, hocanın GitHub örneklerinin biraz değişmiş halleri.</li>
          <li><b>★ Timer hesabı "kesin çıkar":</b> <code>TMR = Timer_max − (Gecikme × F<sub>osc</sub>) / (Prescale × 4)</code>. Timer_max: Timer0 için 256 (Timer1 için 65536); 4: bir komut 4 saat darbesi.</li>
          <li><b>Hesap:</b> IEEE 754, veri tiplerinin kaç bayt olduğu.</li><li><b>Doğru / yanlış</b> bölümü.</li>
          <li><b>RAM adresleme:</b> ardışık adreslere (absolute) konan değişkenlerin üst üste binmesi ve çıktısı.</li><li><b>Örnek tipleri:</b> buton, sola/sağa kaydırma, timer, sayıyı bir porta/göstergeye gönderme.</li></ul>
        <div class="btn-row"><a class="btn btn-primary" href="#/kod">✎ ${codeN} kod sorusunu çalış</a><a class="btn" href="#/vize/timer">★ Timer hesabı</a><a class="btn" href="#/vize/dy">Doğru / yanlış turu</a><a class="btn" href="#/vize/ieee">IEEE 754</a></div></section>
        <div class="lab-cards">${TOPICS.map(([k, t, d]) => `<a class="card lab-card ex-card" href="#/vize/${k}"><b>${t}</b><small>${d}</small></a>`).join('')}</div>
        <p class="hint">Önerilen sıra: her gün <b>2 kod sorusu</b> (kâğıtta) + <b>1 doğru/yanlış turu</b> + hesap tiplerinden birkaç soru. Kısa ve karışık tekrar, tek uzun çalışmadan daha kalıcıdır.</p>`;
    } else {
      body = `${tabs}<section class="lab-sec"><h1 class="pg-title">${topic[1]}</h1><p class="hint">${topic[2]}</p>${SECTIONS[id]()}</section>`;
    }
    root.innerHTML = `<div class="page">${MC.pageTop(topic ? `<a href="#/vize">Vize kampı</a> › <b>${topic[1]}</b>` : '<b>Vize kampı</b>')}<div class="page-inner">${body}</div></div>`;
    MC.dg.mount(root);
  }

  MC.exam = { render };
})(window.MC);
