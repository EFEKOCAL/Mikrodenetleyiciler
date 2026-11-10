# μC Lab · Mikrodenetleyiciler

Mikrodenetleyiciler (BLM3007, PIC16F877A + mikroC) dersinin vizesine çalışmak için konu konu ilerleyen, simülasyonlu bir çalışma sitesi. Saf HTML, CSS ve JavaScript ile yazıldı; kurulum veya dış kütüphane gerektirmez.

**Canlı site:** https://efekocal.github.io/Mikrodenetleyiciler/

## Nasıl çalışır?

Site büyük bir **Başla** düğmesiyle açılır. Dersler tek ekranlık kartlar halinde dikey akar (kaydır, `↓` `↑` `Boşluk` ya da **Devam**). Her bölüm bir **konular ve kavramlar** sayfasıyla başlar, bir **bölüm tekrarıyla** biter.

Her ders aynı öğrenme döngüsünü izler:

1. **Okumadan önce düşün** (ön test): ders bir soruyla açılır.
2. **Oku + gör**: tanım, tablo ve etkileşimli şekil aynı ekranda.
3. **Hesapla**: TRIS, Timer0, ADC soruları her seferinde yeni sayılarla gelir.
4. **Kendini yokla**: ders sonunda cevaba bakmadan cevapla (geri çağırma pratiği).
5. **Aralıklı tekrar**: hocanın ve föylerin soruları; bir soru farklı günlerde iki kez bilinince "Öğrenildi" sayılır.

| Bölüm | Kaynak | Konular |
|---|---|---|
| 1 · Giriş | Hafta 1–2, slayt 6–28 | μC nedir, CPU, makine döngüsü, anayollar, Von Neumann/Harvard, RISC/CISC, programlama |
| 2 · PIC16F877A | Hafta 1–2, slayt 29–58 · Deney 2 | Özellikler, bellek ve banklar, assembly, W/STATUS, adresleme |
| 3 · Portlar | Hafta 1–2 slayt 48–56 · Hafta 4–5 | TRIS/PORT, totem pole, açık drain, Schmitt, pull-up/down, debounce |
| 4 · mikroC | Hafta 3, slayt 1–17 · Deney 1 | .hex süreci, proje ayarları, tipler, IEEE 754, absolute/org, operatörler |
| 5 · G/Ç uygulamaları | Hafta 4–5 · Uygulama 4–14 · Deney 3 | LED desenleri, buton okuma |
| 6 · Kesmeler | Hafta 3, slayt 18–26 · Deney 4 | Kesme adımları, INTCON, RB0 harici kesme |
| 7 · Zamanlayıcılar | Hafta 6 · Uygulama 15–18 · Deney 5 | Prescaler, TMR0 hesabı, kare dalga, Timer1 |
| 8 · ADC | Hafta 7 · Uygulama 19–20 | Nyquist, çözünürlük, ADCON0/1, TAD |

**Simülatörler:** hocanın GitHub'daki uygulamaları (Uygulama 4–14, Deney 3 ve 4 kodları) LED simülatöründe satır satır çalışır; Deney 4'te kesmeye girme ve `INTF` silinmezse ne olduğu da görülür. Ayrıca kaydedici bit düzenleyici, RAM haritası, ALU bayrakları, bellek yerleşimi (absolute çakışmaları), Timer0 içi, TMR hesaplayıcı, ADC hesaplayıcı ve örnekleme şekli var. Hepsi **Laboratuvar araçları** sayfasında da toplu duruyor.

Slaytlarda veya föylerde hata/eksik olan yerler "Slayttan farklı / dikkat" kutusunda doğrusuyla verilir. Veri sayfasından eklenen bilgiler "Ek bilgi" olarak işaretlidir.

## Kullanım

Canlı siteyi aç ya da depoyu indirip `index.html` dosyasına çift tıkla. İlerleme yalnızca tarayıcının kendi deposunda saklanır.

## Dosya yapısı

```
index.html                 uygulama kabuğu (çekmece menü + görünüm)
style.css                  koyu tema
js/
  core.js                  ad alanı, sayı biçimleri, şekil kaydı (MC.dg), adımlayıcı
  app.js                   yönlendirme ve menü
  data/ch1…ch8-*.js        dersler (bölüm başına bir dosya)
  data/apps.js             hocanın uygulamaları: satır satır çalışan üreteçler + bellek örnekleri
  data/teacher-questions.js  hocanın ve föylerin soruları, model cevaplar, anahtar noktalar
  views/learn-view.js      kart akışı, bölüm tekrarı, soru sayfası, aralıklı tekrar
  views/lab-view.js        laboratuvar araçları sayfası
  views/registers.js       PIC16F877A kaydedici bit tanımları + bit düzenleyici
  views/diagrams*.js       etkileşimli şekiller
```

### Yeni soru eklemek

`js/data/teacher-questions.js` dosyasının sonuna dosyanın başındaki şablonla bir nesne ekle.

### Ders blokları

`p`, `h` (yeni konu, yeni ekran), `def`, `list`, `compare`, `table`, `code`, `codex` (kod | açıklama), `note` (`exam`, `extra`, `fix`, `lab`), `dg` (etkileşimli şekil, ör. `{ t: 'dg', id: 'timercalc', fosc: 8, delay: 1 }`), `solve` (çözümü gizli soru), `br` (zorunlu ekran sonu).
