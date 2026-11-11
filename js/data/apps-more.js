/*
 * apps-more.js — 7 segment uygulamaları (hocanın GitHub'ı, Uygulama 21–26, 11 Kasım 2026'da eklendi)
 * ve "Kod yazma" sorularının çözümleri (k1…k13). apps.js ile aynı biçim; satır numaraları koddan bulunur.
 */
(function (MC) {
  'use strict';

  const A = MC.apps;
  // at(code)('metin', n): n. satırdan SONRA 'metin' geçen ilk satırın numarası (1'den başlar)
  const at = (code) => {
    const lines = code.split('\n');
    return (s, after = 0) => {
      for (let i = after; i < lines.length; i++) if (lines[i].includes(s)) return i + 1;
      throw new Error(`Satır bulunamadı: ${s}`);
    };
  };
  // MC.seg views/diagrams-seg.js'te tanımlı (sonra yüklenir); yalnızca çalışma anında kullanılır
  const digitName = (v, ca) => { const d = MC.seg.digitOf(MC.seg.fromPort(v, ca)); return d >= 0 ? d : '?'; };

  /* ------------------------------------------------------------ Uygulama 21 / 22: doğrudan sürme */
  const U21 = `void main() {

TRISB=0;

while(1){
 PORTB=0B11111100;//0
 Delay_ms(1000);

 PORTB=0B01100000; //1
 Delay_ms(1000);

 PORTB=0B11011010; //2
 Delay_ms(1000);
   PORTB=0B11110010; //3
 Delay_ms(1000);

 PORTB=0B01100110;//4
 Delay_ms(1000);
 PORTB = 0B10110110; // 5
Delay_ms(1000);

PORTB = 0B10111110; // 6
Delay_ms(1000);

PORTB = 0B11100000; // 7
Delay_ms(1000);

PORTB = 0B11111110; // 8
Delay_ms(1000);

PORTB = 0B11110110; // 9
Delay_ms(1000);


}
}`;
  const U22 = `void main() {

TRISB=0;

while(1){

PORTB = 0B00000011; // 0
Delay_ms(1000);

PORTB = 0B10011111; // 1
Delay_ms(1000);

PORTB = 0B00100101; // 2
Delay_ms(1000);

PORTB = 0B00001101; // 3
Delay_ms(1000);

PORTB = 0B10011001; // 4
Delay_ms(1000);

PORTB = 0B01001001; // 5
Delay_ms(1000);

PORTB = 0B01000001; // 6
Delay_ms(1000);

PORTB = 0B00011111; // 7
Delay_ms(1000);

PORTB = 0B00000001; // 8
Delay_ms(1000);

PORTB = 0B00001001; // 9
Delay_ms(1000);
}
}`;
  // Kodda sırayla geçen "PORTB…=0B…" satırlarını bulup döngüyü kurar
  const directApp = (code, ca) => {
    const L = at(code);
    const steps = [];
    code.split('\n').forEach((l, i) => { const m = l.match(/PORTB\s*=\s*0B([01]{8})/i); if (m) steps.push([i + 1, parseInt(m[1], 2)]); });
    const ex = {};
    steps.forEach(([ln, v], d) => { ex[ln] = `PORTB = ${MC.bin(v)} (${MC.hex(v)}) → ${ca ? '0 olan' : '1 olan'} pinlerin segmentleri yanar: <b>${d}</b>. ${d === 0 ? (ca ? 'Ortak anot: yanacak segmentin pini 0 V olmalı (akım +5 V → LED → pin).' : 'Ortak katot: yanacak segmentin pini 5 V olmalı (akım pin → LED → GND).') : ''}`; });
    ex[L('TRISB')] = 'TRISB = 0: B portunun 8 pini çıkış. RB7…RB1 segment a…g, RB0 nokta (dp).';
    return {
      ex,
      *run(io) {
        io.TRISB = 0; yield L('TRISB');
        for (;;) {
          yield L('while(1)');
          for (const [ln, v] of steps) { io.PORTB = v; yield ln; yield [ln + 1, 1000]; }
        }
      }
    };
  };
  A.u21 = Object.assign({ title: 'Uygulama 21 · 0–9 ortak katot', src: 'Hafta 7 slayt 4–5 · doğrudan sürme', ports: ['B'], seg: { kind: 'direct' }, code: U21 }, directApp(U21, false));
  A.u22 = Object.assign({ title: 'Uygulama 22 · 0–9 ortak anot', src: 'Hafta 7 slayt 6 · kodlar ortak katodun tersi', ports: ['B'], seg: { kind: 'direct', ca: true }, code: U22 }, directApp(U22, true));

  /* ------------------------------------------------------------ Uygulama 23: sürücü ile */
  const U23 = `void main() {

TRISB=0;

while(1){

PORTB = 0;
Delay_ms(1000);

PORTB =  1;
Delay_ms(1000);

PORTB = 2;
Delay_ms(1000);

PORTB =  3;
Delay_ms(1000);

PORTB =  4 ;
Delay_ms(1000);

PORTB =  5;
Delay_ms(1000);

PORTB = 6;
Delay_ms(1000);

PORTB = 7;
Delay_ms(1000);

PORTB = 8;
Delay_ms(1000);

PORTB = 9;
Delay_ms(1000);
}
}`;
  {
    const L = at(U23);
    const steps = [];
    U23.split('\n').forEach((l, i) => { const m = l.match(/^PORTB\s*=\s*(\d)/); if (m) steps.push([i + 1, +m[1]]); });
    A.u23 = {
      title: 'Uygulama 23 · 0–9 sürücü ile', src: 'Hafta 7 slayt 9 · BCD → 7 segment sürücü', ports: ['B'], seg: { kind: 'bcd' }, code: U23,
      ex: { [L('TRISB')]: 'Yalnızca RB3…RB0 kullanılır: sürücünün A, B, C, D (BCD) girişleri.', [steps[0][0]]: 'Sürücü varken segment kodu yazılmaz: <b>sayının kendisi</b> yazılır. PORTB = 0 → RB3…RB0 = 0000.', [steps[5][0]]: 'PORTB = 5 = 0000 0101: sürücü 0101\'i çözer ve a, c, d, f, g çıkışlarını yakar.' },
      *run(io) {
        io.TRISB = 0; yield L('TRISB');
        for (;;) { yield L('while(1)'); for (const [ln, v] of steps) { io.PORTB = v; yield ln; yield [ln + 1, 1000]; } }
      }
    };
  }

  /* ------------------------------------------------------------ Uygulama 24: buton + sürücü */
  const U24 = `unsigned int sayac;
void main() {

TRISB=0;
TRISD=1;
sayac=0;

while(1){

 if(PORTD.F0==1){
 sayac=sayac+1;
 if(sayac==10){
  sayac=0;
 }
  PORTB=sayac;
  Delay_ms(1000);
 }
}
}`;
  {
    const L = at(U24);
    A.u24 = {
      title: 'Uygulama 24 · Butonla 0–9 sayaç', src: 'Hafta 7 · sürücülü gösterge, RD0 butonu', ports: ['B', 'D'], inputs: ['RD0'], seg: { kind: 'bcd' }, code: U24, vars: (io) => `sayac = ${io.sayac}`,
      ex: { [L('TRISD')]: 'TRISD = 1 = 0000 0001: yalnızca RD0 giriş (buton).', [L('if(PORTD.F0==1)')]: 'Buton basılı mı? Basılı tutulduğu sürece her 1 saniyede bir sayar (gecikme if\'in içinde).', [L('if(sayac==10)')]: '9\'dan sonra 0\'a dön: gösterge tek hane.', [L('PORTB=sayac')]: 'Sürücü olduğu için sayı doğrudan PORTB\'ye yazılır.' },
      *run(io) {
        io.sayac = '?';
        io.TRISB = 0; yield L('TRISB');
        io.TRISD = 1; yield L('TRISD');
        io.sayac = 0; yield L('sayac=0');
        for (;;) {
          yield L('while(1)');
          yield L('if(PORTD.F0==1)');
          if (io.in('RD0')) {
            io.sayac++; yield L('sayac=sayac+1');
            yield L('if(sayac==10)');
            if (io.sayac === 10) { io.sayac = 0; yield L('sayac=0;', L('if(sayac==10)')); }
            io.PORTB = io.sayac; yield L('PORTB=sayac');
            yield [L('Delay_ms(1000)'), 1000];
          }
        }
      }
    };
  }

  /* ------------------------------------------------------------ Uygulama 25: 0–99, iki sürücü */
  const U25 = `int sayac=0;
int onlar;
int birler;
int veri;

init(){
 trisb=0;
 portb=0;
 trisd=0xff;
}

   seven_segment_goster(){
     onlar=sayac/10;
     birler=sayac%10;
     onlar=onlar*16;
     veri=onlar^birler;
     portb=veri;
   }

void main() {
 init();

 while(1){
  if(portd.f1==1){
  delay_ms(500);
  sayac=sayac+1;
  if(sayac>99)
  sayac=0;
    }
   if(portd.f0==1){
  delay_ms(500);
  sayac=sayac-1;
  if(sayac<0)
  sayac=99;
    }
    seven_segment_goster();
 }//while son
}// main son`;
  {
    const L = at(U25);
    const up = L('if(portd.f1==1)');
    const dn = L('if(portd.f0==1)');
    A.u25 = {
      title: 'Uygulama 25 · 0–99 yukarı/aşağı sayıcı', src: 'Hafta 7 slayt 10–11 · iki BCD sürücü', ports: ['B', 'D'], inputs: ['RD1', 'RD0'], seg: { kind: 'bcd2' }, code: U25,
      vars: (io) => `sayac = ${io.sayac} · onlar = ${io.onlar} · birler = ${io.birler} · veri = ${io.veri == null || io.veri === '?' ? '?' : `${io.veri} (${MC.hex(io.veri)})`}`,
      ex: {
        [L('trisd=0xff')]: 'D portu tamamen giriş: butonlar RD1 (yukarı) ve RD0 (aşağı).',
        [L('onlar=sayac/10')]: 'Tam sayı bölmesi: 57 / 10 = 5 (onlar basamağı).',
        [L('birler=sayac%10')]: 'Mod (kalan): 57 % 10 = 7 (birler basamağı).',
        [L('onlar=onlar*16')]: '×16 = 4 bit sola kaydırma (onlar<<4): onlar basamağı PORTB\'nin üst 4 bitine (RB7…RB4) taşınır → üstteki sürücü.',
        [L('veri=onlar^birler')]: 'Üst 4 bit ile alt 4 bit hiç çakışmadığı için XOR burada toplama/OR ile aynı sonucu verir: 0x50 ^ 0x07 = 0x57.',
        [L('portb=veri')]: 'PORTB = 0x57: RB7…RB4 = 0101 (5), RB3…RB0 = 0111 (7). Her sürücü kendi 4 bitini çözer.',
        [up]: 'Basılı tutulursa her 500 ms\'de bir sayar (otomatik tekrar). Gecikme aynı zamanda ark (bounce) etkisini de örter.',
        [L('if(sayac<0)')]: 'sayac signed int olduğu için −1 olabilir; unsigned olsaydı 0\'dan sonra 65535 olurdu ve bu kontrol hiç doğru olmazdı.'
      },
      *run(io) {
        io.sayac = 0; io.onlar = '?'; io.birler = '?'; io.veri = '?';
        const show = function* () {
          yield L('seven_segment_goster();', L('sayac=99'));
          io.onlar = Math.trunc(io.sayac / 10); yield L('onlar=sayac/10');
          io.birler = io.sayac % 10; yield L('birler=sayac%10');
          io.onlar *= 16; yield L('onlar=onlar*16');
          io.veri = io.onlar ^ io.birler; yield L('veri=onlar^birler');
          io.PORTB = io.veri & 255; yield L('portb=veri');
        };
        yield L('init();');
        io.TRISB = 0; yield L('trisb=0');
        io.PORTB = 0; yield L('portb=0');
        io.TRISD = 0xff; yield L('trisd=0xff');
        for (;;) {
          yield L('while(1)');
          yield up;
          if (io.in('RD1')) { yield [up + 1, 500]; io.sayac++; yield up + 2; yield up + 3; if (io.sayac > 99) { io.sayac = 0; yield up + 4; } }
          yield dn;
          if (io.in('RD0')) { yield [dn + 1, 500]; io.sayac--; yield dn + 2; yield dn + 3; if (io.sayac < 0) { io.sayac = 99; yield dn + 4; } }
          yield* show();
        }
      }
    };
  }

  /* ------------------------------------------------------------ Uygulama 26: 0–9999, multiplexing */
  const U26 = `int sayac=0;
int binler;
int yuzler;
int onlar;
int birler;
int veri;
bit pd0;
bit pd1;

init(){
 trisb=0;
 trisc=0;
 portb=0;
 portc=0;
 trisd=0xff;
}
 seven_segment_goster(){
     binler=sayac/1000;
     yuzler=(sayac%1000)/100;
     onlar=(sayac%100)/10;
     birler=sayac%10;
     PORTC=0B11101111;
     PORTB=birler;
     Delay_ms(1);
     PORTC=0B11011111;
     PORTB=onlar;
     Delay_ms(1);
     PORTC=0B10111111;
     PORTB=yuzler;
     Delay_ms(1);
     PORTC=0B01111111;
     PORTB=binler;
     Delay_ms(1);
   }
void main() {
 init();

 while(1){
  if(portd.f1==1&&pd1==0){
  pd1=1;
  delay_ms(100);
  sayac=sayac+1;
  if(sayac>9999)
  sayac=0;
    }else if(portd.f1==0){
    pd1=0;
    }
   if(portd.f0==1&&pd0==0){
   pd0=1;
  delay_ms(100);
  sayac=sayac-1;
  if(sayac<0)
  sayac=9999;
    }
  else if(portd.f0==0){
  pd0=0;
  }
    seven_segment_goster();
 }//while son
}// main son`;
  {
    const L = at(U26);
    const up = L('if(portd.f1==1&&pd1==0)');
    const dn = L('if(portd.f0==1&&pd0==0)');
    const g = L('seven_segment_goster(){');
    const sel = [['0B11101111', 'birler'], ['0B11011111', 'onlar'], ['0B10111111', 'yuzler'], ['0B01111111', 'binler']].map(([pc, v]) => { const ln = L(`PORTC=${pc}`); return { ln, pc: parseInt(pc.slice(2), 2), v }; });
    A.u26 = {
      title: 'Uygulama 26 · 0–9999, multiplexing', src: 'Hafta 7 slayt 12–15 · 4 haneli gösterge', ports: ['B', 'C', 'D'], inputs: ['RD1', 'RD0'], seg: { kind: 'mux' }, slowmo: true, code: U26,
      vars: (io) => `sayac = ${io.sayac} · binler ${io.binler} · yüzler ${io.yuzler} · onlar ${io.onlar} · birler ${io.birler} · pd1 = ${io.pd1} · pd0 = ${io.pd0}`,
      ex: {
        [L('bit pd0')]: 'pd0 / pd1: butonun bir önceki turda basılı olup olmadığı. Basılı tutmak yalnızca bir sayım yapsın diye (kenar algılama).',
        [L('binler=sayac/1000')]: 'Basamaklara ayırma: 4729 / 1000 = 4.',
        [L('yuzler=(sayac%1000)/100')]: '(4729 % 1000) / 100 = 729 / 100 = 7.',
        [L('onlar=(sayac%100)/10')]: '(4729 % 100) / 10 = 29 / 10 = 2.',
        [sel[0].ln]: 'Hane seçimi: RC4 = 0, diğerleri 1. Ortak katotlu göstergede seçili hanenin ortak ucu <b>0 V</b> olmalı (slayt 12). RC4 en sağdaki hane: birler.',
        [sel[0].ln + 1]: 'Veri: birler basamağı sürücüye. Dikkat: PORTC önce değiştiği için yeni hane bir an eski veriyi gösterir (gölgelenme); hızda göz bunu görmez.',
        [sel[0].ln + 2]: '1 ms bu haneyi yanık tut. 4 hane × 1 ms = 4 ms\'de bir tur → her hane saniyede 250 kez yanar; göz hepsini aynı anda yanıyor sanır.',
        [sel[3].ln]: 'RC7 = 0: en soldaki hane (binler).',
        [up]: 'Yalnızca butona yeni basıldıysa (pd1 == 0) say. Basılı tutmak tek sayım: Uygulama 25\'teki otomatik tekrardan farkı bu.',
        [up + 2]: 'Bu 100 ms boyunca tarama durur: son seçilen hane (binler) yanık kalır, diğerleri söner → basışta kısa bir titreme olur. Göz yanılması kutusunu açıp kapatarak gör.',
        [L('}else if(portd.f1==0){')]: 'Buton bırakılınca pd1 = 0: bir sonraki basış yeniden sayılabilir.'
      },
      *run(io) {
        io.sayac = 0; io.binler = '?'; io.yuzler = '?'; io.onlar = '?'; io.birler = '?'; io.pd0 = 0; io.pd1 = 0;
        yield L('init();');
        io.TRISB = 0; yield L('trisb=0');
        io.TRISC = 0; yield L('trisc=0');
        io.PORTB = 0; yield L('portb=0');
        io.PORTC = 0; yield L('portc=0');
        io.TRISD = 0xff; yield L('trisd=0xff');
        for (;;) {
          yield L('while(1)');
          yield up;
          if (io.in('RD1') && !io.pd1) { io.pd1 = 1; yield up + 1; yield [up + 2, 100]; io.sayac++; yield up + 3; yield up + 4; if (io.sayac > 9999) { io.sayac = 0; yield up + 5; } } else { yield up + 6; if (!io.in('RD1')) { io.pd1 = 0; yield up + 7; } }
          yield dn;
          if (io.in('RD0') && !io.pd0) { io.pd0 = 1; yield dn + 1; yield [dn + 2, 100]; io.sayac--; yield dn + 3; yield dn + 4; if (io.sayac < 0) { io.sayac = 9999; yield dn + 5; } } else { yield dn + 7; if (!io.in('RD0')) { io.pd0 = 0; yield dn + 8; } }
          yield L('seven_segment_goster();', dn);
          yield g;
          io.binler = Math.trunc(io.sayac / 1000); yield g + 1;
          io.yuzler = Math.trunc((io.sayac % 1000) / 100); yield g + 2;
          io.onlar = Math.trunc((io.sayac % 100) / 10); yield g + 3;
          io.birler = io.sayac % 10; yield g + 4;
          for (const s of sel) { io.PORTC = s.pc; yield s.ln; io.PORTB = io[s.v]; yield s.ln + 1; yield [s.ln + 2, 1]; }
        }
      }
    };
  }

  /* ------------------------------------------------------------ sitenin çözümü: dizi ile 0–9 */
  const SD = `char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,
                 0xB6,0xBE,0xE0,0xFE,0xF6}; // 0…9, ortak katot
int i;
void main() {
 TRISB = 0;
 while(1){
  for(i=0;i<10;i++){
   PORTB = kod[i];        // ortak anotta: PORTB = ~kod[i];
   Delay_ms(1000);
  }
 }
}`;
  {
    const L = at(SD);
    const KOD = [0xfc, 0x60, 0xda, 0xf2, 0x66, 0xb6, 0xbe, 0xe0, 0xfe, 0xf6];
    A.segdizi = {
      title: 'Dizi ile 0–9 (kısa çözüm)', src: 'Bu sitenin çözümü · Uygulama 21\'in 10 satırı yerine dizi + for', ports: ['B'], seg: { kind: 'direct' }, code: SD, vars: (io) => `i = ${io.i}${io.i >= 0 && io.i < 10 ? ` · kod[i] = ${MC.hex(KOD[io.i])} → ${digitName(KOD[io.i])}` : ''}`,
      ex: { 1: 'Segment kodlarını bir diziye koy: kod[n] = n rakamının PORTB değeri. Sınavda 10 ayrı satır yazmaktan hem kısa hem hataya kapalı.', [L('PORTB = kod[i]')]: 'Rakam = dizinin indisi. Ortak anot için tek fark: <code>PORTB = ~kod[i];</code>' },
      *run(io) {
        io.i = '?';
        io.TRISB = 0; yield L('TRISB');
        for (;;) {
          yield L('while(1)');
          for (io.i = 0; io.i < 10; io.i++) { yield L('for('); io.PORTB = KOD[io.i]; yield L('PORTB = kod[i]'); yield [L('Delay_ms'), 1000]; }
          yield L('for(');
        }
      }
    };
  }

  /* ============================================================ Kod yazma sorularının çözümleri */
  const K = {};
  K.k1 = { title: 'K1 · RD7 → RD0 kayan ışık', ports: ['D'], vars: (io) => `i = ${io.i}`, code: `int i;
void main() {
 TRISD = 0;               // D portu çıkış
 while(1){
  PORTD = 0x80;           // yalnızca RD7 yanık
  for(i=0;i<7;i++){
   Delay_ms(300);
   PORTD = PORTD >> 1;    // ışık bir sağa
  }
  Delay_ms(300);
 }
}`,
  *run(io) { const L = at(K.k1.code); io.i = '?'; io.TRISD = 0; yield L('TRISD'); for (;;) { yield L('while'); io.PORTD = 0x80; yield L('0x80'); for (io.i = 0; io.i < 7; io.i++) { yield L('for('); yield [L('Delay_ms(300)'), 300]; io.PORTD >>= 1; yield L('>> 1'); } yield L('for('); yield [L('Delay_ms(300);', L('>> 1')), 300]; } } };

  K.k2 = { title: 'K2 · Soldan doldur, sağdan boşalt', ports: ['B'], vars: (io) => `i = ${io.i}`, code: `int i;
void main() {
 TRISB = 0;
 PORTB = 0;
 while(1){
  for(i=0;i<8;i++){
   PORTB = (PORTB >> 1) | 0x80;  // sağa kaydır, en sola yeni 1
   Delay_ms(250);
  }
  for(i=0;i<8;i++){
   PORTB = PORTB << 1;           // sağdan 0 girer: RB0'dan söner
   Delay_ms(250);
  }
 }
}`,
  *run(io) { const L = at(K.k2.code); const f2 = L('for(', L('0x80')); io.i = '?'; io.TRISB = 0; yield L('TRISB'); io.PORTB = 0; yield L('PORTB = 0'); for (;;) { yield L('while'); for (io.i = 0; io.i < 8; io.i++) { yield L('for('); io.PORTB = (io.PORTB >> 1) | 0x80; yield L('0x80'); yield [L('Delay_ms'), 250]; } for (io.i = 0; io.i < 8; io.i++) { yield f2; io.PORTB = (io.PORTB << 1) & 255; yield L('<< 1'); yield [L('Delay_ms', L('<< 1')), 250]; } } } };

  K.k3 = { title: 'K3 · Gidip gelen ikili ışık', ports: ['B'], vars: (io) => `yon = ${io.yon}`, code: `bit yon;                  // 0: sola, 1: sağa
void main() {
 TRISB = 0;
 PORTB = 0b00000011;      // RB1-RB0
 yon = 0;
 while(1){
  Delay_ms(200);
  if(yon==0) PORTB = PORTB << 1;
  else       PORTB = PORTB >> 1;
  if(PORTB == 0b11000000) yon = 1;   // sol uç
  if(PORTB == 0b00000011) yon = 0;   // sağ uç
 }
}`,
  *run(io) { const L = at(K.k3.code); io.TRISB = 0; yield L('TRISB'); io.PORTB = 3; yield L('PORTB = 0b'); io.yon = 0; yield L('yon = 0;'); for (;;) { yield L('while'); yield [L('Delay_ms'), 200]; yield L('if(yon==0)'); if (io.yon === 0) io.PORTB = (io.PORTB << 1) & 255; else { io.PORTB >>= 1; yield L('else'); } yield L('0b11000000'); if (io.PORTB === 0xc0) io.yon = 1; yield L('== 0b00000011'); if (io.PORTB === 3) io.yon = 0; } } };

  K.k4 = { title: 'K4 · Butonla yön değiştiren ışık', ports: ['B', 'D'], inputs: ['RD0'], code: `void main() {
 TRISB = 0;
 TRISD = 0b00000001;      // RD0 giriş (buton)
 PORTB = 1;
 while(1){
  Delay_ms(300);
  if(PORTD.F0 == 0){      // basılı değil: sola
   if(PORTB == 0x80) PORTB = 0x01;   // uçtan çıkan diğer uçtan girer
   else PORTB = PORTB << 1;
  }else{                  // basılı: sağa
   if(PORTB == 0x01) PORTB = 0x80;
   else PORTB = PORTB >> 1;
  }
 }
}`,
  *run(io) { const L = at(K.k4.code); io.TRISB = 0; yield L('TRISB'); io.TRISD = 1; yield L('TRISD'); io.PORTB = 1; yield L('PORTB = 1'); for (;;) { yield L('while'); yield [L('Delay_ms'), 300]; yield L('if(PORTD.F0'); if (!io.in('RD0')) { yield L('== 0x80'); if (io.PORTB === 0x80) io.PORTB = 1; else { io.PORTB = (io.PORTB << 1) & 255; yield L('<< 1'); } } else { yield L('== 0x01'); if (io.PORTB === 1) io.PORTB = 0x80; else { io.PORTB >>= 1; yield L('>> 1'); } } } } };

  K.k5 = { title: 'K5 · İki butonla ikili sayaç', ports: ['B', 'D'], inputs: ['RD0', 'RD1'], vars: (io) => `sayi = ${io.sayi} · b0 = ${io.b0} · b1 = ${io.b1}`, code: `unsigned char sayi = 0;
bit b0;                   // RD0 önceki turda basılı mıydı?
bit b1;
void main() {
 TRISB = 0;
 TRISD = 0b00000011;      // RD0, RD1 giriş
 PORTB = 0;
 b0 = 0; b1 = 0;
 while(1){
  if(PORTD.F0==1 && b0==0){ b0 = 1; sayi++; Delay_ms(20); }
  else if(PORTD.F0==0) b0 = 0;
  if(PORTD.F1==1 && b1==0){ b1 = 1; sayi--; Delay_ms(20); }
  else if(PORTD.F1==0) b1 = 0;
  PORTB = sayi;           // sayı LED'lerde ikili görünür
 }
}`,
  ex: { 10: 'Yeni basış = şimdi basılı VE önceki turda basılı değildi. 20 ms bekleme arkı (bounce) örter.', 11: 'Bırakılınca bayrak sıfırlanır; bir sonraki basış sayılabilir.', 12: 'unsigned char: 0\'dan 1 azaltınca 255 olur (8 bit taşma).' },
  *run(io) { const L = at(K.k5.code); io.sayi = 0; io.b0 = 0; io.b1 = 0; io.TRISB = 0; yield L('TRISB'); io.TRISD = 3; yield L('TRISD'); io.PORTB = 0; yield L('PORTB = 0'); yield L('b0 = 0;'); for (;;) { yield L('while'); yield L('if(PORTD.F0'); if (io.in('RD0') && !io.b0) { io.b0 = 1; io.sayi = (io.sayi + 1) & 255; yield [L('if(PORTD.F0'), 20]; } else { yield L('else if(PORTD.F0'); if (!io.in('RD0')) io.b0 = 0; } yield L('if(PORTD.F1'); if (io.in('RD1') && !io.b1) { io.b1 = 1; io.sayi = (io.sayi + 255) & 255; yield [L('if(PORTD.F1'), 20]; } else { yield L('else if(PORTD.F1'); if (!io.in('RD1')) io.b1 = 0; } io.PORTB = io.sayi; yield L('PORTB = sayi'); } } };

  K.k6 = { title: 'K6 · RB0 kesmesi ile tersle', ports: ['C', 'D'], inputs: ['RB0'], isr: true, regs: (io) => `GIE=${io.GIE} INTE=${io.INTE} INTF=${io.INTF} INTEDG=${io.INTEDG}`, code: `void interrupt(){
 PORTD = ~PORTD;          // D LED'lerini tersle
 INTCON.INTF = 0;         // bayrağı yazılımla sil
}
void main() {
 TRISB = 0x01;            // RB0/INT giriş
 TRISC = 0; TRISD = 0;
 PORTC = 0; PORTD = 0;
 OPTION_REG.INTEDG = 0;   // düşen kenar (1 → 0)
 INTCON.INTE = 1;         // RB0 kesmesine izin
 INTCON.GIE = 1;          // genel kesme izni
 while(1){
  PORTC = 0xFF; Delay_ms(500);
  PORTC = 0x00; Delay_ms(500);
 }
}`,
  ex: { 9: 'INTEDG = 0: kesme düşen kenarda. Pull-down butonda düşen kenar butonu <b>bırakırken</b> oluşur: simülatörde RB0\'a bas, sonra bırak.', 2: 'Kesme alt programı kısa: yalnızca tersle ve bayrağı sil.' },
  irq: (io) => io.GIE && io.INTE && io.INTF,
  edge(io, pin, v) { if (pin === 'RB0' && v === io.INTEDG) io.INTF = 1; },
  *isr(io) { io.PORTD = ~io.PORTD & 255; yield 2; io.INTF = 0; yield 3; yield 4; },
  *run(io) { const L = at(K.k6.code); io.GIE = 0; io.INTE = 0; io.INTF = 0; io.INTEDG = 1; io.TRISB = 1; yield L('TRISB'); io.TRISC = 0; io.TRISD = 0; yield L('TRISC'); io.PORTC = 0; io.PORTD = 0; yield L('PORTC = 0;'); io.INTEDG = 0; yield L('INTEDG'); io.INTE = 1; yield L('INTE = 1'); io.GIE = 1; yield L('GIE = 1'); for (;;) { yield L('while'); io.PORTC = 0xff; yield [L('0xFF'), 500]; io.PORTC = 0; yield [L('PORTC = 0x00'), 500]; } } };

  K.k9 = { title: 'K9 · Ortak anot 9 → 0 geri sayım', ports: ['B'], seg: { kind: 'direct', ca: true }, vars: (io) => `i = ${io.i}`, code: `char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,
                 0xB6,0xBE,0xE0,0xFE,0xF6}; // ortak KATOT kodları
int i;                    // signed: i>=0 kontrolü için şart
void main() {
 TRISB = 0;
 while(1){
  for(i=9;i>=0;i--){
   PORTB = ~kod[i];       // ortak anot: bitleri tersle
   Delay_ms(500);
  }
 }
}`,
  ex: { 3: 'i unsigned char olsaydı 0\'dan sonra i-- = 255 olur, i>=0 hep doğru kalır: sonsuz döngü ve dizinin dışına taşma!', 8: '~ bit tersleme: ortak katot kodu 0xFC (0) → 0x03 (ortak anot 0).' },
  *run(io) { const L = at(K.k9.code); const KOD = [0xfc, 0x60, 0xda, 0xf2, 0x66, 0xb6, 0xbe, 0xe0, 0xfe, 0xf6]; io.i = '?'; io.TRISB = 0; yield L('TRISB'); for (;;) { yield L('while'); for (io.i = 9; io.i >= 0; io.i--) { yield L('for('); io.PORTB = ~KOD[io.i] & 255; yield L('~kod'); yield [L('Delay_ms'), 500]; } yield L('for('); } } };

  K.k10 = { title: 'K10 · Butona her basışta +1 (doğrudan)', ports: ['B', 'D'], inputs: ['RD0'], seg: { kind: 'direct' }, vars: (io) => `sayac = ${io.sayac} · basildi = ${io.bas}`, code: `char kod[10] = {0xFC,0x60,0xDA,0xF2,0x66,
                 0xB6,0xBE,0xE0,0xFE,0xF6}; // ortak katot
char sayac = 0;
bit basildi;
void main() {
 TRISB = 0;
 TRISD = 0x01;            // RD0 buton
 basildi = 0;
 PORTB = kod[0];
 while(1){
  if(PORTD.F0==1 && basildi==0){
   basildi = 1;
   sayac++;
   if(sayac > 9) sayac = 0;
   PORTB = kod[sayac];
   Delay_ms(20);          // ark (bounce) için
  }
  if(PORTD.F0==0) basildi = 0;
 }
}`,
  *run(io) { const L = at(K.k10.code); const KOD = [0xfc, 0x60, 0xda, 0xf2, 0x66, 0xb6, 0xbe, 0xe0, 0xfe, 0xf6]; io.sayac = 0; io.bas = 0; io.TRISB = 0; yield L('TRISB'); io.TRISD = 1; yield L('TRISD'); yield L('basildi = 0;'); io.PORTB = KOD[0]; yield L('kod[0]'); for (;;) { yield L('while'); yield L('if(PORTD.F0==1'); if (io.in('RD0') && !io.bas) { io.bas = 1; yield L('basildi = 1'); io.sayac++; yield L('sayac++'); if (io.sayac > 9) io.sayac = 0; yield L('sayac > 9'); io.PORTB = KOD[io.sayac]; yield L('kod[sayac]'); yield [L('Delay_ms'), 20]; } yield L('if(PORTD.F0==0)'); if (!io.in('RD0')) io.bas = 0; } } };

  K.k11 = { title: 'K11 · 00–59 saniye sayacı (2 sürücü)', ports: ['B'], seg: { kind: 'bcd2' }, vars: (io) => `sayac = ${io.sayac}`, code: `int sayac = 0;
void main() {
 TRISB = 0;
 while(1){
  PORTB = (sayac/10)*16 + sayac%10;   // onlar üst 4 bit, birler alt 4 bit
  Delay_ms(1000);
  sayac++;
  if(sayac > 59) sayac = 0;
 }
}`,
  ex: { 5: '×16 = <<4. Örnek: 37 → (3)·16 + 7 = 0x37. Aynı satır Uygulama 25\'teki gibi XOR ile de yazılabilir: (sayac/10)*16 ^ sayac%10.' },
  *run(io) { const L = at(K.k11.code); io.sayac = 0; io.TRISB = 0; yield L('TRISB'); for (;;) { yield L('while'); io.PORTB = Math.trunc(io.sayac / 10) * 16 + (io.sayac % 10); yield L('*16'); yield [L('Delay_ms'), 1000]; io.sayac++; yield L('sayac++'); if (io.sayac > 59) io.sayac = 0; yield L('> 59'); } } };

  K.k12 = { title: 'K12 · 4 hanede sabit "2026"', ports: ['B', 'C'], seg: { kind: 'mux' }, slowmo: true, code: `void main() {
 TRISB = 0; TRISC = 0;
 while(1){
  PORTC = 0b11101111; PORTB = 6; Delay_ms(1);  // birler (RC4)
  PORTC = 0b11011111; PORTB = 2; Delay_ms(1);  // onlar  (RC5)
  PORTC = 0b10111111; PORTB = 0; Delay_ms(1);  // yüzler (RC6)
  PORTC = 0b01111111; PORTB = 2; Delay_ms(1);  // binler (RC7)
 }
}`,
  ex: { 4: 'Ortak katotlu göstergede seçili hanenin ortak ucu 0 V: yalnızca RC4 = 0. Veri sürücüye BCD olarak gider.' },
  *run(io) { const L = at(K.k12.code); io.TRISB = 0; io.TRISC = 0; yield L('TRISB'); const rows = [[0xef, 6], [0xdf, 2], [0xbf, 0], [0x7f, 2]]; for (;;) { yield L('while'); for (let r = 0; r < 4; r++) { const ln = L('PORTC', L('while') + r); io.PORTC = rows[r][0]; yield ln; io.PORTB = rows[r][1]; yield ln; yield [ln, 1]; } } } };

  K.k13 = { title: 'K13 · Fonksiyonla tek/çift LED', ports: ['B', 'D'], inputs: ['RD0', 'RD1'], code: `void yaksondur(char desen){
 PORTB = desen;
 Delay_ms(250);
 PORTB = 0;
 Delay_ms(250);
}
void main() {
 TRISB = 0;
 TRISD = 0b00000011;      // RD0, RD1 giriş
 while(1){
  if(PORTD.F0==1)      yaksondur(0b01010101);  // çift: RB0,2,4,6
  else if(PORTD.F1==1) yaksondur(0b10101010);  // tek: RB1,3,5,7
  else                 PORTB = 0;
 }
}`,
  *run(io) { const L = at(K.k13.code); const call = function* (v, ln) { yield ln; io.PORTB = v; yield 2; yield [3, 250]; io.PORTB = 0; yield 4; yield [5, 250]; yield 6; }; io.TRISB = 0; yield L('TRISB'); io.TRISD = 3; yield L('TRISD'); for (;;) { yield L('while'); yield L('if(PORTD.F0'); if (io.in('RD0')) yield* call(0x55, L('if(PORTD.F0')); else { yield L('else if'); if (io.in('RD1')) yield* call(0xaa, L('else if')); else { io.PORTB = 0; yield L('else    '); } } } } };

  Object.entries(K).forEach(([id, app]) => { A[id] = Object.assign({ src: 'Kod yazma sorusunun çözümü (bu site)' }, app); });
  MC.codeApps = Object.keys(K);
})(window.MC);
