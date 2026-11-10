/*
 * apps.js — Hocanın uygulamaları (github: Mikrodenetleyiciler-2026-2027) ve föy kodları,
 * LED simülatöründe satır satır çalışacak şekilde.
 *
 * Her uygulamanın run(io) fonksiyonu bir üreteçtir (generator):
 *   yield 7          → 7. satır çalıştı (anlık)
 *   yield [8, 1000]  → 8. satırda 1000 ms gecikme
 * io: TRISB, PORTB, TRISD, PORTD... kaydedicileri; io.in('RD0') giriş pininin durumunu okur.
 * Kesmeli uygulamalarda isr(io) kesme alt programı, irq(io) kesme isteği olup olmadığıdır.
 * code: hocanın kodu (baştaki boş satırlar atıldı). ex: satır → açıklama.
 */
(function (MC) {
  'use strict';

  const A = (MC.apps = {});

  A.u4 = {
    title: 'Uygulama 4 · Tüm LED\'leri yak-söndür', src: 'Çıkış örneği 1 (slayt 6)', ports: ['B'],
    code: `void main() {

TRISB=0X00;  //b portunun tüm pinleri çıkış olarak ayarlandı...

while(1){

 PORTB=0X00;
 Delay_ms(1000);
 PORTB=0XFF;
 Delay_ms(1000);
}

}`,
    ex: { 3: 'TRISB=0x00: B portunun 8 pininin hepsi çıkış (0 = Output).', 5: 'while(1): sonsuz döngü. Mikrodenetleyici programı hiç bitmez.', 7: 'PORTB=0x00: tüm pinler 0 V → LED\'ler sönük.', 9: 'PORTB=0xFF = 1111 1111: tüm pinler 5 V → LED\'ler yanık.', 8: '1 saniye bekle (yazılımla gecikme: CPU bu sırada başka iş yapmaz).', 10: '1 saniye bekle.' },
    *run(io) {
      io.TRISB = 0; yield 3;
      for (;;) {
        yield 5;
        io.PORTB = 0x00; yield 7;
        yield [8, 1000];
        io.PORTB = 0xff; yield 9;
        yield [10, 1000];
      }
    }
  };

  A.u5 = {
    title: 'Uygulama 5 · Sırayla doldur (×2+1)', src: 'Çıkış örneği 2 (slayt 7)', ports: ['B'], vars: (io) => `i = ${io.i}`,
    code: `int i;

void main() {

 TRISB=0X00;
 PORTB=0;
 while(1){

 for(i=0;i<=7;i++){
  PORTB=PORTB*2+1;
  Delay_ms(2000);
 }
 PORTB=0;
 }
}`,
    ex: { 10: 'PORTB*2 bitleri bir sola kaydırır, +1 en sağa yeni bir 1 ekler: 0→1→3→7→15→…→255. Yanan LED\'ler birer birer çoğalır.', 9: 'i=0…7: 8 tur, her turda bir LED daha yanar.', 13: '8 LED dolunca hepsi söndürülür, döngü baştan başlar.' },
    *run(io) {
      io.i = '?';
      io.TRISB = 0; yield 5;
      io.PORTB = 0; yield 6;
      for (;;) {
        yield 7;
        for (io.i = 0; io.i <= 7; io.i++) {
          yield 9;
          io.PORTB = (io.PORTB * 2 + 1) & 255; yield 10;
          yield [11, 2000];
        }
        yield 9;
        io.PORTB = 0; yield 13;
      }
    }
  };

  A.u6 = {
    title: 'Uygulama 6 · Kayan ışık (sola kaydırma)', src: 'Çıkış örneği 3 (slayt 8)', ports: ['B'], vars: (io) => `i = ${io.i}`,
    code: `int i;

void main() {
TRISB=0;
PORTB=1;

while(1){

 for(i=0;i<7;i++){
     Delay_ms(500);
     PORTB=PORTB<<1;
 }
 Delay_ms(500);
 PORTB=1;
}
}`,
    ex: { 5: 'PORTB=1 = 0000 0001: yalnızca RB0 yanık.', 11: 'PORTB<<1: tüm bitler bir sola kayar, sağdan 0 girer. Tek yanan LED bir sonraki pine geçer.', 9: 'i<7: 7 kaydırma yeter (RB0 → RB7).', 14: 'RB7\'den sonra başa dön: yeniden RB0.' },
    *run(io) {
      io.i = '?';
      io.TRISB = 0; yield 4;
      io.PORTB = 1; yield 5;
      for (;;) {
        yield 7;
        for (io.i = 0; io.i < 7; io.i++) {
          yield 9;
          yield [10, 500];
          io.PORTB = (io.PORTB << 1) & 255; yield 11;
        }
        yield 9;
        yield [13, 500];
        io.PORTB = 1; yield 14;
      }
    }
  };

  A.u7 = {
    title: 'Uygulama 7 · XOR ile çapraz geçiş', src: 'Çıkış örneği 5 (slayt 10)', ports: ['B'], vars: (io) => `sayi1 = ${io.s1} (${MC.bin(io.s1)}) · sayi2 = ${io.s2} (${MC.bin(io.s2)}) · i = ${io.i}`,
    code: `char sayi1=128;
char sayi2=1;

int i;
void main() {
TRISB=0;
PORTB=0;
while(1){
for(i=0;i<=7;i++){
 PORTB=sayi1^sayi2;
 Delay_ms(1000);
 sayi1=sayi1>>1;
 sayi2=sayi2<<1;
}
sayi1=128;
sayi2=1;
}
}`,
    ex: { 10: 'sayi1 soldan sağa, sayi2 sağdan sola giden tek bir 1 taşır. XOR (^) iki deseni birleştirir: farklı olan bitler 1 olur. Ortada buluştuklarında (i=3→4) iki LED yan yana yanar.', 12: 'sayi1>>1: 1 bir sağa kayar.', 13: 'sayi2<<1: 1 bir sola kayar.', 11: 'Slayt 1200 ms istiyor; hocanın kodu 1000 ms kullanıyor. Sınavda soruda verilen süreyi yaz.' },
    *run(io) {
      io.s1 = 128; io.s2 = 1; io.i = '?';
      io.TRISB = 0; yield 6;
      io.PORTB = 0; yield 7;
      for (;;) {
        yield 8;
        for (io.i = 0; io.i <= 7; io.i++) {
          yield 9;
          io.PORTB = io.s1 ^ io.s2; yield 10;
          yield [11, 1000];
          io.s1 >>= 1; yield 12;
          io.s2 = (io.s2 << 1) & 255; yield 13;
        }
        yield 9;
        io.s1 = 128; yield 15;
        io.s2 = 1; yield 16;
      }
    }
  };

  A.u8 = {
    title: 'Uygulama 8 · İkili kayan ışık', src: 'Çıkış örneği 6 (slayt 11) · kaynak .lst dosyasından', ports: ['B'], vars: (io) => `i = ${io.i}`,
    code: `int i;

void main() {

TRISB=0;

while(1){

PORTB=0b00000011;//PORTB=3; PORTB =0X03
 for(i=0;i<7;i++){
  Delay_ms(1500);
  PORTB=PORTB<<1;
 }
}
}`,
    ex: { 9: '0b00000011: RB0 ve RB1 yanık. Üç yazım da aynı sayı: 0b00000011 = 3 = 0x03.', 12: 'İki yanan LED birlikte sola kayar: 3→6→12→24→48→96→192. Son kaydırmada 192<<1 = 384 olur; 8 bite sığmadığı için 128 kalır ve hemen ardından PORTB yeniden 3 yapılır.' },
    *run(io) {
      io.i = '?';
      io.TRISB = 0; yield 5;
      for (;;) {
        yield 7;
        io.PORTB = 3; yield 9;
        for (io.i = 0; io.i < 7; io.i++) {
          yield 10;
          yield [11, 1500];
          io.PORTB = (io.PORTB << 1) & 255; yield 12;
        }
        yield 10;
      }
    }
  };

  A.u9 = {
    title: 'Uygulama 9 · Üçlü sağa kayma', src: 'Çıkış örneği 7 (slayt 12) · kaynak .lst dosyasından', ports: ['B'], vars: (io) => `i = ${io.i}`,
    code: `int i;
void main() {
TRISB=0;
PORTB=0b11100000;

while(1){

 for(i=0;i<=7;i++){
  Delay_ms(600);
  PORTB=PORTB>>1;
 }
 PORTB=0b11100000;
}
}`,
    ex: { 4: '0b11100000 = 0xE0: RB7, RB6, RB5 yanık.', 10: 'PORTB>>1: üç LED birlikte sağa kayar. Sağdan düşen bit kaybolur: 224→112→56→28→14→7→3→1→0.', 12: 'Desen bitince başa dön.' },
    *run(io) {
      io.i = '?';
      io.TRISB = 0; yield 3;
      io.PORTB = 0xe0; yield 4;
      for (;;) {
        yield 6;
        for (io.i = 0; io.i <= 7; io.i++) {
          yield 8;
          yield [9, 600];
          io.PORTB >>= 1; yield 10;
        }
        yield 8;
        io.PORTB = 0xe0; yield 12;
      }
    }
  };

  A.u10 = {
    title: 'Uygulama 10 · Gidip gelen ışık (bit yon)', src: 'Çıkış örneği 4 (slayt 9)', ports: ['B'], vars: (io) => `yon = ${io.yon} (${io.yon ? 'sağa: >>' : 'sola: <<'})`,
    code: `bit yon;//sağ 1-sol

void main() {
yon=0;
 TRISB=0;
 PORTB=1;
 Delay_ms(1000);
 while(1){
  if(yon==0){
   PORTB=PORTB<<1;
  }else{
   PORTB=PORTB>>1;
  }
  Delay_ms(1000);
  if(PORTB==128){
  yon=1;
  }
  if(PORTB==1){
   yon=0;
  }
 }
}`,
    ex: { 1: 'bit: mikroC\'ye özgü 1 bitlik tip (0 veya 1). Yön bilgisini tutmak için yeterli.', 10: 'yon=0: sola kaydır (RB0 → RB7 yönü).', 12: 'yon=1: sağa kaydır (RB7 → RB0 yönü).', 15: 'PORTB==128 (1000 0000): ışık en sola (RB7) ulaştı → yönü çevir.', 18: 'PORTB==1: ışık en sağa (RB0) döndü → yönü yine çevir.', 14: 'Slayt 750 ms istiyor; hocanın kodu 1000 ms kullanıyor.' },
    *run(io) {
      io.yon = 0; yield 4;
      io.TRISB = 0; yield 5;
      io.PORTB = 1; yield 6;
      yield [7, 1000];
      for (;;) {
        yield 8;
        yield 9;
        if (io.yon === 0) { io.PORTB = (io.PORTB << 1) & 255; yield 10; } else { io.PORTB >>= 1; yield 12; }
        yield [14, 1000];
        yield 15;
        if (io.PORTB === 128) { io.yon = 1; yield 16; }
        yield 18;
        if (io.PORTB === 1) { io.yon = 0; yield 19; }
      }
    }
  };

  A.u11 = {
    title: 'Uygulama 11 · Buton → tek LED', src: 'Dijital giriş okuma 1 (slayt 14)', ports: ['B', 'D'], inputs: ['RD0'],
    code: `void main() {
TRISB=0B00000000;
TRISD=0B00000001;

while(1){

if(PORTD.F0==1){
 PORTB.F3=1;
}else{
 PORTB.F3=0;
}
    }
}`,
    ex: { 3: 'TRISD=0b00000001: yalnızca RD0 giriş (buton), RD1–RD7 çıkış.', 7: 'PORTD.F0: D portunun 0. biti tek başına okunur (bit erişimi). Butona basılıysa 1 gelir.', 8: 'PORTB.F3=1: yalnızca RB3 pini 5 V olur; diğer pinler değişmez.', 10: 'Buton bırakılınca RB3 söner.' },
    *run(io) {
      io.TRISB = 0; yield 2;
      io.TRISD = 1; yield 3;
      for (;;) {
        yield 5;
        yield 7;
        if (io.in('RD0')) { io.PORTB |= 8; yield 8; } else { io.PORTB &= ~8; yield 10; }
      }
    }
  };

  A.u12 = {
    title: 'Uygulama 12 · Buton → tüm LED\'ler', src: 'Dijital giriş okuma 2 (slayt 15)', ports: ['B', 'D'], inputs: ['RD0'],
    code: `void main() {
TRISB=0B00000000;
TRISD=0B00000001;

while(1){

if(PORTD.F0==1){
 PORTB=255;
}else{
 PORTB=0;
}
    }
}`,
    ex: { 7: 'Döngü butonu sürekli yoklar (polling): CPU her turda pine bakar.', 8: 'PORTB=255 = 0xFF: bütün LED\'ler yanar.', 10: 'Buton bırakılınca hepsi söner.' },
    *run(io) {
      io.TRISB = 0; yield 2;
      io.TRISD = 1; yield 3;
      for (;;) {
        yield 5;
        yield 7;
        if (io.in('RD0')) { io.PORTB = 255; yield 8; } else { io.PORTB = 0; yield 10; }
      }
    }
  };

  A.u13 = {
    title: 'Uygulama 13 · Basılıyken yak-söndür', src: 'Dijital giriş okuma (slayt 15–17 arası)', ports: ['B', 'D'], inputs: ['RD0'],
    code: `void main() {
TRISB=0B00000000;
TRISD=0B00000001;

while(1){

if(PORTD.F0==1){
 PORTB=255;
 Delay_ms(1000);
 PORTB=0;
 Delay_ms(1000);
}else{
 PORTB=0;
}
    }
}`,
    ex: { 7: 'Buton yalnızca bu satırda okunur. Gecikmeler sürerken (2 s) bırakmak hemen etki etmez: tur bitene kadar beklenir. Polling\'in dezavantajı budur.', 9: 'Bekleme sırasında CPU butonu okumuyor.' },
    *run(io) {
      io.TRISB = 0; yield 2;
      io.TRISD = 1; yield 3;
      for (;;) {
        yield 5;
        yield 7;
        if (io.in('RD0')) {
          io.PORTB = 255; yield 8;
          yield [9, 1000];
          io.PORTB = 0; yield 10;
          yield [11, 1000];
        } else { io.PORTB = 0; yield 13; }
      }
    }
  };

  A.u14 = {
    title: 'Uygulama 14 · Fonksiyonlarla tek/çift LED', src: 'Dijital giriş okuma 4\'e benzer · _.c', ports: ['B', 'D'], inputs: ['RD0'],
    code: `void yaksondur_tek()  {
PORTB=0b10101010;
 Delay_ms(1000);
 PORTB=0;
 Delay_ms(1000);

}
void yaksondur_cift()  {
PORTB=0b01010101;
 Delay_ms(1000);
 PORTB=0;
 Delay_ms(1000);

}

void main() {
TRISB=0B00000000;
TRISD=0B00000001;

while(1){

if(PORTD.F0==1){
  yaksondur_tek();
}else{
 yaksondur_cift();
}
    }
}`,
    ex: { 2: '0b10101010: indisi TEK olan pinler (RB1, RB3, RB5, RB7).', 9: '0b01010101: indisi ÇİFT olan pinler (RB0, RB2, RB4, RB6).', 23: 'Fonksiyon çağrısı: dönüş adresi donanım yığınına (stack) yazılır, fonksiyon bitince oraya dönülür.', 22: 'Buton basılıysa tek, değilse çift indisli LED\'ler yanıp söner.' },
    *run(io) {
      io.TRISB = 0; yield 17;
      io.TRISD = 1; yield 18;
      for (;;) {
        yield 20;
        yield 22;
        if (io.in('RD0')) {
          yield 23;
          io.PORTB = 0xaa; yield 2; yield [3, 1000]; io.PORTB = 0; yield 4; yield [5, 1000]; yield 7;
        } else {
          yield 25;
          io.PORTB = 0x55; yield 9; yield [10, 1000]; io.PORTB = 0; yield 11; yield [12, 1000]; yield 14;
        }
      }
    }
  };

  A.g3 = {
    title: 'Giriş örneği 3 · İki butonla yak / söndür', src: 'Slayt 16 · bu sitenin çözümü (hocanın kodu yok)', ports: ['B', 'D'], inputs: ['RD0', 'RD1'],
    code: `void main() {
 TRISB = 0x00;        // B portu çıkış (LED)
 TRISD = 0b00000011;  // RD0 ve RD1 giriş (buton)
 PORTB = 0;
 while(1){
  if(PORTD.F0==1){
   PORTB = 0xFF;      // RD0'a basıldı: hepsini yak
  }
  if(PORTD.F1==1){
   PORTB = 0x00;      // RD1'e basıldı: söndür
  }
 }
}`,
    ex: { 6: 'Buton bırakılınca else yok: PORTB son değerini korur. LED\'ler RD1\'e basılana kadar yanık kalır (mandal davranışı).', 3: 'İki buton → iki giriş pini: bit 0 ve bit 1 = 1 → 0b00000011.' },
    *run(io) {
      io.TRISB = 0; yield 2;
      io.TRISD = 3; yield 3;
      io.PORTB = 0; yield 4;
      for (;;) {
        yield 5;
        yield 6;
        if (io.in('RD0')) { io.PORTB = 0xff; yield 7; }
        yield 9;
        if (io.in('RD1')) { io.PORTB = 0; yield 10; }
      }
    }
  };

  A.g4 = {
    title: 'Giriş örneği 4 · Yak-söndür ve kara şimşek', src: 'Slayt 17 · bu sitenin çözümü', ports: ['B', 'D'], inputs: ['RD0', 'RD1'], vars: (io) => `i = ${io.i}`,
    code: `int i;
void main() {
 TRISB = 0x00;
 TRISD = 0b00000011;
 PORTB = 0;
 while(1){
  if(PORTD.F0==1){          // hepsini 1 sn aralıkla yak-söndür
   PORTB = 0xFF;
   Delay_ms(1000);
   PORTB = 0x00;
   Delay_ms(1000);
  }
  if(PORTD.F1==1){          // kara şimşek: tek tek gidip gel
   for(i=0;i<8;i++){ PORTB = 1<<i; Delay_ms(100); }
   for(i=6;i>0;i--){ PORTB = 1<<i; Delay_ms(100); }
   PORTB = 0;
  }
 }
}`,
    ex: { 14: '1<<i: yalnızca i. biti 1 olan sayı. i=0..7 → ışık RB0\'dan RB7\'ye gider.', 15: 'i=6..1 → geri döner. Uçlardaki LED iki kez yanmasın diye 7 ve 0 tekrar edilmez.' },
    *run(io) {
      io.i = '?';
      io.TRISB = 0; yield 3;
      io.TRISD = 3; yield 4;
      io.PORTB = 0; yield 5;
      for (;;) {
        yield 6;
        yield 7;
        if (io.in('RD0')) { io.PORTB = 0xff; yield 8; yield [9, 1000]; io.PORTB = 0; yield 10; yield [11, 1000]; }
        yield 13;
        if (io.in('RD1')) {
          for (io.i = 0; io.i < 8; io.i++) { io.PORTB = 1 << io.i; yield 14; yield [14, 100]; }
          for (io.i = 6; io.i > 0; io.i--) { io.PORTB = 1 << io.i; yield 15; yield [15, 100]; }
          io.PORTB = 0; yield 16;
        }
      }
    }
  };

  A.d3 = {
    title: 'Deney 3 · Cevap 3 (iki buton, iki LED)', src: 'Deney 3 föyü, örnek 3', ports: ['D'], inputs: ['RD2', 'RD3'],
    code: `void main( ){
TRISD=0b01111110;// b ifadesi sayının binary bir sayı olduğunu bildirir.
PORTD=0;
 while(1){
 if(PORTD.f2==1){
 portd.f0=1; //D0 pinine bağlı olan LED'i enerjilendir
 portd.f7=0; //D7 pinine bağlı olan LED'i söndür.
 }
 if(PORTD.f3==1){
 portd.f7=1; //D7 pinine bağlı olan LED'i enerjilendir
 portd.f0=0; //D0 pinine bağlı olan LED'i söndür.
 }
 }// While sonu
}// Main bloğu sonu`,
    ex: { 2: '0b01111110: bit 7 ve bit 0 = 0 → RD7 ve RD0 ÇIKIŞ (LED); RD1–RD6 GİRİŞ. Butonlar RD2 ve RD3\'te.', 5: 'RD2 butonu: D0 LED\'i yanar, D7 söner.', 9: 'RD3 butonu: D7 yanar, D0 söner.' },
    *run(io) {
      io.TRISD = 0x7e; yield 2;
      io.PORTD = 0; yield 3;
      for (;;) {
        yield 4;
        yield 5;
        if (io.in('RD2')) { io.PORTD |= 1; yield 6; io.PORTD &= ~0x80; yield 7; }
        yield 9;
        if (io.in('RD3')) { io.PORTD |= 0x80; yield 10; io.PORTD &= ~1; yield 11; }
      }
    }
  };

  A.d3s = {
    title: 'Deney 3 · Soru 1 (iki butona aynı anda basılınca)', src: 'Deney 3 föyü, soru 1 · bu sitenin çözümü', ports: ['D'], inputs: ['RD7', 'RD0'],
    code: `void main() {
 TRISD = 0b10000001;   // RD7 ve RD0 giriş (buton), diğerleri çıkış
 PORTD = 0;
 while(1){
  if(PORTD.F7==1 && PORTD.F0==1){
   PORTD.F4=1;
   PORTD.F5=1;
  }else{
   PORTD.F4=0;
   PORTD.F5=0;
  }
 }
}`,
    ex: { 5: '&& (mantıksal VE): iki koşul birlikte doğruysa. Tek butona basmak yetmez.', 2: 'Giriş olacak pinler bit 7 ve bit 0 → 1000 0001 = 0x81.' },
    *run(io) {
      io.TRISD = 0x81; yield 2;
      io.PORTD = 0; yield 3;
      for (;;) {
        yield 4;
        yield 5;
        if (io.in('RD7') && io.in('RD0')) { io.PORTD |= 0x10; yield 6; io.PORTD |= 0x20; yield 7; } else { io.PORTD &= ~0x10; yield 9; io.PORTD &= ~0x20; yield 10; }
      }
    }
  };

  A.d4 = {
    title: 'Deney 4 · RB0 harici kesmesi', src: 'Deney 4 föyü', ports: ['D'], inputs: ['RB0'], isr: true,
    regs: (io) => `GIE=${io.GIE} INTE=${io.INTE} INTF=${io.INTF} INTEDG=${io.INTEDG}`,
    code: `interrupt(){
 portd.f0=0;
 Delay_ms(1000);
 INTCON.INTF=0; //kesme algılandı bayrağı sıfırlandı.
}// interrupt altprogram sonu
void main() {
 trisd=0;
 PORTD=0;
 trisb=0xff; //B portu giriş olarak ayarlandı
 OPTION_REG.F6=1; //Yükselen Kenar Tetikleme
 INTCON.INTE=1; //harici kesme aktif edildi
 INTCON.GIE=1; //global kesme aktif edildi.
 while(1){
 portd.f0=1;
 }// while sonu
}// Main sonu`,
    ex: { 10: 'OPTION_REG.F6 = INTEDG: 1 → RB0 pinindeki YÜKSELEN kenarda (0→1) kesme.', 11: 'INTE=1: RB0/INT harici kesmesine izin.', 12: 'GIE=1: genel kesme izni. Bu olmadan hiçbir kesme CPU\'ya ulaşmaz.', 14: 'Ana program LED\'i sürekli yakar.', 2: 'Kesme geldi: ana program bırakıldı, LED söndürüldü.', 3: 'Kesme içinde 1 s bekleme (öğretmek için; gerçek projede ISR kısa tutulur).', 4: 'INTF=0: bayrak YAZILIMLA silinir. Silinmezse kesmeden çıkar çıkmaz tekrar kesmeye girilir.' },
    irq: (io) => io.GIE && io.INTE && io.INTF,
    *isr(io) {
      io.PORTD &= ~1; yield 2;
      yield [3, 1000];
      if (!io.noClear) { io.INTF = 0; yield 4; }
      yield 5;
    },
    *run(io) {
      io.GIE = 0; io.INTE = 0; io.INTF = 0; io.INTEDG = 1; // OPTION_REG reset değeri FFh
      io.TRISD = 0; yield 7;
      io.PORTD = 0; yield 8;
      io.TRISB = 0xff; yield 9;
      io.INTEDG = 1; yield 10;
      io.INTE = 1; yield 11;
      io.GIE = 1; yield 12;
      for (;;) {
        yield 13;
        io.PORTD |= 1; yield 14;
      }
    },
    // RB0 yükselen kenarı INTF bayrağını kurar (INTEDG=1 iken); düşen kenar INTEDG=0 iken
    edge(io, pin, v) { if (pin === 'RB0' && v === io.INTEDG) io.INTF = 1; }
  };

  /* ------------------------------------------------------------ bellek yerleşimi örnekleri (mem şekli) */
  MC.memPresets = {
    deney1: {
      title: 'Deney 1 örnek kodu: değişkenler RAM\'de nasıl durur?',
      from: 0x20, to: 0x28,
      vars: [['isaretli_sayi', 'short', 0x20], ['isaretli_sayi_2byte', 'int', 0x21], ['isaretsiz_sayi', 'ushort', 0x23], ['float_sayi', 'float', 0x24], ['karakter', 'char', 0x28]],
      code: ['signed short int isaretli_sayi absolute 0x20;', 'signed int isaretli_sayi_2byte absolute 0x21;', 'unsigned short int isaretsiz_sayi absolute 0x23;', 'float float_sayi absolute 0x24;   //4 byte: 24,25,26,27', 'char karakter absolute 0x28;', 'void main() {', ' isaretli_sayi=-250;', ' isaretli_sayi_2byte=-250;', ' isaretsiz_sayi=250;', ' float_sayi=1453;', " karakter='A';", '}'],
      steps: [[6, 'isaretli_sayi', -250], [7, 'isaretli_sayi_2byte', -250], [8, 'isaretsiz_sayi', 250], [9, 'float_sayi', 1453], [10, 'karakter', 65]]
    },
    u2: {
      title: 'Uygulama 2: absolute ile adres verirken çakışma',
      from: 0x20, to: 0x27,
      vars: [['x', 'char', 0x20], ['y', 'int', 0x25], ['t', 'short', 0x26]],
      code: ['char x absolute 0x20;', 'int y absolute 0x25;', 'short t absolute 0x26;', '', 'void main() {', '', 'x=20; //0x14, 0b00010100', 'y=783238988;', 't=1;', '}'],
      steps: [[6, 'x', 20], [7, 'y', 783238988], [8, 't', 1]]
    },
    prob: {
      title: 'Slayt 12 "Problemi bulun": long ve char aynı adreste',
      from: 0x2e, to: 0x35,
      vars: [['jjjj', 'long', 0x30], ['i', 'char', 0x33]],
      code: ['long jjjj absolute 0x30;', 'char i absolute 0x33;', 'void main() {', ' jjjj = 0x11223344;   // örnek değer', ' i = 0xFF;            // örnek değer', '}'],
      steps: [[3, 'jjjj', 0x11223344], [4, 'i', 0xff]]
    },
    u3: {
      title: 'Uygulama 3: float x = 0.0625',
      from: 0x20, to: 0x23,
      vars: [['x', 'float', 0x20]],
      code: ['float x;   // adresi derleyici seçer (burada 0x20 varsayıldı)', '', 'void main() {', '', 'x=0.0625;', '}'],
      steps: [[4, 'x', 0.0625]]
    }
  };
})(window.MC);
