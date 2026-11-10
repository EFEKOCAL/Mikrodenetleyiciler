/*
 * ch6-kesme.js — Bölüm 6: Kesmeler (interrupts).
 * Kaynak: hafta 3 sunumu slayt 18–26, Deney 4 föyü, PIC16F877A veri sayfası (bölüm 14.11).
 */
(function (MC) {
  'use strict';

  MC.lessons.chapters.push({
    id: 'ch6',
    num: 6,
    title: 'Kesmeler',
    short: 'Kesmeler',
    navSub: 'Kesme adımları, INTCON, RB0, Deney 4',
    week: 'Hafta 3',
    source: 'Hafta 3 sunumu, slayt 18–26 · Deney 4',
    objectives: [
      'Kesmeyi tanımlamak ve yoklamaya (polling) göre neden önemli olduğunu açıklamak',
      'Harici ve dahili kesmelere örnek vermek',
      'Kesme işleminin 4 adımını (yığın, 04h vektörü, ISR, geri dönüş) sırayla anlatmak',
      'INTCON kaydedicisinin bitlerini açıklamak; bir kesme için gereken izin bitlerini söylemek',
      'RB0/INT harici kesme programını (Deney 4) yazmak ve INTF silinmezse ne olacağını açıklamak'
    ],
    outline: {
      topics: [['Kesme nedir, neden gerekir?', 'nedir'], ['Kesme işlem adımları', 'adimlar'], ['INTCON ve kesme kaynakları', 'intcon'], ['Deney 4: RB0 harici kesme uygulaması', 'deney4']],
      concepts: ['Kesme', 'Polling', 'Harici / dahili kesme', 'Kesme denetleyicisi', 'Yığın (stack)', 'Kesme vektörü 04h', 'ISR', 'RETFIE', 'Bağlam saklama', 'GIE, PEIE', 'Bayrak (IF) ve izin (IE)', 'INTE, INTF, INTEDG', '15 kesme kaynağı'],
      why: 'Kesme adımları sözel soru, INTCON değeri hesap sorusu olarak çıkar. Zamanlayıcı ve ADC uygulamaları da kesmeyle çalıştığı için bir sonraki iki bölümün temeli.'
    },
    lessons: [
      {
        id: 'nedir',
        title: 'Kesme Nedir, Neden Gerekir?',
        src: 'slayt 18–20 · Deney 4',
        minutes: 6,
        blocks: [
          { t: 'def', term: 'Kesme', en: 'Interrupt', html: 'Bir programın <b>daha önemli başka bir görevin yerine getirilmesi için kesilmesine</b> izin veren mekanizma. Bu görevler tuş takımından bir karakter okunması veya farenin yeni koordinatlarının alınması gibi işlemler olabilir. Kesmeler tarafından idare edilecek olaylar yalnızca donanım tasarımcılarının hayal gücüyle sınırlıdır.' },
          { t: 'h', text: 'Neden bu kadar önemli?' },
          { t: 'p', html: 'Kesmeler olmasaydı her program bu olayları kendisi kontrol etmek zorunda kalırdı: kendi çalışmasını kesip giriş aygıtlarındaki verileri kontrol etmek. Verilerin gelme sıklığı yüksek değilse, tüm olayların bu yöntemle yakalanma şansı oldukça düşük olurdu.' },
          { t: 'compare', cols: [
            { title: 'Yoklama (polling)', items: ['CPU girişe <b>sürekli kendisi bakar</b>', 'Bakmadığı anda (gecikme, başka iş) olay kaçabilir', 'CPU zamanı boşa harcanır', 'Uygulama 11–13 böyle çalışır'] },
            { title: 'Kesme (interrupt)', items: ['Olay olunca <b>donanım CPU\'ya haber verir</b>', 'CPU o an ne yapıyorsa bırakıp hemen ilgilenir', 'Ana program başka işe devam edebilir', 'Deney 4, Uygulama 15–19 böyle çalışır'] }
          ] },
          { t: 'note', kind: 'extra', html: 'Benzetme: kapıya gelen var mı diye her dakika kapıya bakmak (polling) ile kapı zili çalınca kalkmak (kesme).' },
          { t: 'h', text: 'İki grup kesme (slayt 19)' },
          { t: 'list', ordered: true, items: ['<b>Harici kesmeler:</b> dışarıdaki bir donanım veya sistemden gelen (tuş takımı, RB0/INT pinindeki buton)', '<b>Dahili kesmeler:</b> mikrodenetleyicinin içindeki çevresel birimlerin ürettiği (Timer kesmesi, USART kesmesi, ADC çevrim bitti)'] },
          { t: 'h', text: 'Kesme denetleyicisi (slayt 20)' },
          { t: 'p', html: 'Harici olay <b>kesme pininden</b>, dahili olay <b>çevre birimi devresinden</b> gelir. İkisi de <b>kesme denetleyicisine</b> gider. Denetleyici: <b>kesmeyi algılar</b>, istenmeyen kesmeleri <b>maskeler</b> (izin bitleri), <b>öncelik</b> belirler ve CPU\'ya <b>kesme isteği</b> gönderir. CPU ilgili program koduna geçer.' }
        ],
        checks: [
          { q: 'Kesme nedir? Neden önemlidir?', a: 'Bir programın daha önemli başka bir görev için kesilmesine izin veren mekanizmadır. Kesme olmasa program girişleri sürekli kendisi kontrol etmek (polling) zorunda kalır; CPU zamanı boşa gider ve kontrol edilmediği anlarda olaylar kaçırılabilir.' },
          { q: 'Harici ve dahili kesmeye birer örnek veriniz.', a: 'Harici: RB0/INT pinine bağlı butona basılması, tuş takımı. Dahili: Timer0 taşması, ADC çevriminin bitmesi, USART\'a veri gelmesi.' }
        ]
      },
      {
        id: 'adimlar',
        title: 'Kesme İşlem Adımları',
        src: 'slayt 21–23 · Deney 4',
        minutes: 9,
        blocks: [
          { t: 'p', html: 'Hocanın 4 adımı (slayt 22, Deney 4):' },
          { t: 'list', ordered: true, items: [
            '<b>Kesme algılanır.</b>',
            'Ana programda kalınan yerin adresi (<b>program sayacındaki</b> veri) <b>STACK</b> belleğe yazılır. DURUM (STATUS) kaydedicisi de aynı şekilde yığında saklanır.',
            '<b>04h adresi</b> (interrupt vektör) içindeki kesme servis alt programı adresi program sayacına (PC) yüklenir.',
            'Kesme alt programı işlemleri yapıldıktan sonra STACK bellekten PC ve DURUM kaydedicisi verileri <b>geri yüklenir</b> ve ana program <b>kaldığı yerden devam</b> eder.'
          ] },
          { t: 'p', html: 'Şimdi aynı süreci Deney 4 programı üzerinde, donanımın ve derleyicinin payıyla birlikte adım adım izle:' },
          { t: 'dg', id: 'intflow' },
          { t: 'note', kind: 'fix', html: 'Sınavda hocanın 4 adımını yaz. Ayrıntı: PIC16F877A donanımı yığına <b>yalnızca PC\'yi</b> yazar (8 seviyeli yığın, 13 bit). W ve STATUS\'u <b>mikroC\'nin kesme fonksiyonunun başına eklediği kod</b> RAM\'e kopyalar ve sonda geri yükler. Sonuç hocanın anlattığıyla aynıdır: ana program STATUS\'u bozulmadan devam eder.' },
          { t: 'h', text: 'Önemli ayrıntılar' },
          { t: 'list', items: [
            'Kesmeye girerken donanım <b>GIE = 0</b> yapar (kesme içinde yeni kesme gelmesin); <b>RETFIE</b> komutu dönüşte <b>GIE = 1</b> yapar.',
            'PIC16\'da tüm kesmeler <b>aynı adrese (0004h)</b> gider. Birden çok kesme açıksa ISR hangi bayrağın 1 olduğuna bakarak kaynağı bulur.',
            'mikroC\'de kesme fonksiyonunun adı <code>interrupt</code>\'tır; derleyici onu 0004h\'e yerleştirir.',
            'Bayrak (IF) donanımca 1 yapılır ama <b>yazılımla silinmelidir</b>; yoksa kesme bitince hemen yeniden tetiklenir.'
          ] }
        ],
        checks: [
          { q: 'Kesme işleminin adımlarını sırayla yazınız.', a: '1) Kesme algılanır. 2) Ana programda kalınan yerin adresi (PC) ve DURUM kaydedicisi STACK\'e (yığın) yazılır. 3) 04h adresi (kesme vektörü) PC\'ye yüklenir, kesme servis alt programı çalışır. 4) Alt program bitince PC ve DURUM yığından geri yüklenir, ana program kaldığı yerden devam eder.' },
          { q: 'PIC16F877A\'da kesme vektörünün adresi nedir?', a: '0004h (reset vektörü 0000h).' },
          { q: 'Kesmeye girerken ve çıkarken GIE bitine ne olur?', a: 'Girerken donanım GIE\'yi 0 yapar (iç içe kesme önlenir); RETFIE ile dönerken GIE tekrar 1 olur.' }
        ]
      },
      {
        id: 'intcon',
        title: 'INTCON ve Kesme Kaynakları',
        src: 'slayt 24–26 · Deney 4',
        minutes: 9,
        blocks: [
          { t: 'p', html: 'PIC16F877A\'da <b>15 kesme kaynağı</b> mevcut. Temel kesme ayarları <b>INTCON</b> kaydedicisinden yapılır. Harici kesme girişi olarak <b>RB0</b> kullanılır.' },
          { t: 'dg', id: 'reg', reg: 'INTCON', value: 0x90 },
          { t: 'table', head: ['Bit', 'Görev (Deney 4)'], rows: [
            ['<b>GIE</b> (7)', 'Global Interrupt Enable. 0: bütün kesmeler pasif; 1: ayarlanan tüm kesmeler aktif.'],
            ['<b>PEIE</b> (6)', 'Peripheral Interrupt Enable: çevresel arabirim kesmelerini aktifleştirir (ADC, Timer1, USART…).'],
            ['<b>INTE</b> (4)', 'RB0/harici kesmeyi aktifleştirir.'],
            ['<b>INTF</b> (1)', 'RB0/harici kesme bayrağı: 1 = algılandı. <b>Yazılımla sıfırlanmalı.</b>'],
            ['<b>INTEDG</b> (OPTION_REG bit 6)', 'Kenar seçimi: 1 = yükselen kenarda, 0 = düşen kenarda kesme.']
          ] },
          { t: 'h', text: 'Bayrak AND izin → GIE: kesme mantık diyagramı' },
          { t: 'p', html: 'Her kaynağın bir <b>bayrağı (IF)</b> ve bir <b>izin biti (IE)</b> vardır. Hazır ayarları dene, sonra GIE\'yi kapatıp ne olduğuna bak:' },
          { t: 'dg', id: 'intlogic' },
          { t: 'note', kind: 'exam', html: 'Kural: <b>INTCON içindeki kesmeler</b> (TMR0, INT, RB değişim) için <b>GIE + kendi IE</b>. <b>Çevresel kesmeler</b> (ADC, Timer1, Timer2, USART) için <b>GIE + PEIE + kendi IE</b> (PIE1\'de). Uygulama 15: <code>INTCON = 0xA0</code> = GIE + TMR0IE. Deney 4: GIE + INTE = <code>0x90</code>.' }
        ],
        checks: [
          { q: 'INTCON = 0xA0 hangi bitleri 1 yapar, ne anlama gelir?', a: '1010 0000: GIE (bit 7) ve TMR0IE (bit 5). Global kesme izni ve Timer0 taşma kesmesi açık.' },
          { q: 'ADC kesmesinin çalışması için hangi bitler 1 olmalı?', a: 'PIE1.ADIE (ADC kesme izni), INTCON.PEIE (çevresel kesme izni) ve INTCON.GIE (genel izin). Ayrıca kurulumda ADIF sıfırlanır.' },
          { q: 'PIC16F877A\'da harici kesme girişi hangi pindir? Kenarı nereden seçilir?', a: 'RB0/INT. Kenar OPTION_REG\'in INTEDG (6.) bitiyle seçilir: 1 yükselen, 0 düşen kenar.' }
        ]
      },
      {
        id: 'deney4',
        title: 'Deney 4: RB0 Harici Kesme Uygulaması',
        src: 'Deney 4 föyü',
        minutes: 12,
        lab: true,
        blocks: [
          { t: 'note', kind: 'lab', html: '<b>Amaç:</b> Kesme sinyalinin önemini, kesmeye hazırlığı ve kesme algılanınca gerçekleşen işlemleri anlamak; harici kesme uygulaması yapmak.' },
          { t: 'codex', title: 'Deney 4 kodu', rows: [
            ['interrupt(){', 'Kesme alt programı: derleyici 0004h\'e yerleştirir'],
            [' portd.f0=0;\n Delay_ms(1000);', 'LED 1 s söndürülür (öğretme amaçlı; gerçek projede ISR\'de uzun gecikme yapılmaz)'],
            [' INTCON.INTF=0;\n}', 'Kesme algılandı bayrağı <b>sıfırlanır</b>'],
            ['trisd=0;\nPORTD=0;\ntrisb=0xff;', 'D portu çıkış (LED), B portu giriş (RB0 butonu)'],
            ['OPTION_REG.F6=1;', 'INTEDG = 1: <b>yükselen kenar</b> tetikleme'],
            ['INTCON.INTE=1;\nINTCON.GIE=1;', 'Harici kesme izni, sonra global kesme izni'],
            ['while(1){\n portd.f0=1;\n}', 'Ana program LED\'i sürekli yakar']
          ] },
          { t: 'p', html: 'RB0 butonuna bas (0 → 1 yükselen kenar). Sonra <b>INTF=0 satırını sil</b> seçeneğini işaretleyip tekrar dene (föy adım 9):' },
          { t: 'dg', id: 'run', app: 'd4' },
          { t: 'h', text: 'Föy soruları için kaydedici değerleri' },
          { t: 'table', head: ['Kaydedici', 'Kurulumdan sonra', 'Açıklama'], rows: [
            ['TRISD', '<b>00h</b>', 'D portu çıkış'],
            ['PORTD', '<b>01h</b>', 'Döngüde RD0 = 1 (butona basılınca 1 s 00h)'],
            ['TRISB', '<b>FFh</b>', 'B portu giriş'],
            ['OPTION_REG', '<b>FFh</b>', 'Reset değeri zaten FFh; F6 = 1 yazmak değiştirmez. INTEDG = 1'],
            ['INTCON', '<b>90h</b>', 'GIE = 1, INTE = 1. Butona basılınca INTF = 1 → 92h; ISR içinde GIE = 0']
          ] },
          { t: 'note', kind: 'exam', html: '<b>Föy adım 9 (INTF silinmezse):</b> RETFIE ile dönülür, GIE tekrar 1 olur, ama INTF hâlâ 1 → kesme koşulu sağlanıyor → <b>hemen yeniden kesmeye girilir</b>. Ana program neredeyse hiç çalışamaz; LED sürekli sönük kalır (butona bir kez basmak yeter). Bayrağı yazılımla silmek bu yüzden zorunlu.' },
          { t: 'note', kind: 'lab', html: '<b>Kit ayarları:</b> SW3 anahtarı PORTB\'yi aktif edecek şekilde (PORTB LEDS OFF: RB0 buton olarak okunsun), PORTD LEDS ON. RB0 girişindeki anahtar <b>PULL-DOWN</b>: butona basınca 0 → 1, yani yükselen kenar.' }
        ],
        checks: [
          { q: 'OPTION_REG.INTEDG bitinin amacı nedir? Deney 4\'te ne olarak ayarlanmıştır?', a: 'RB0/INT kesmesinin hangi kenarda tetikleneceğini seçer. Programda 1: yükselen kenar (OPTION_REG.F6=1).' },
          { q: 'INTCON.INTE ve INTCON.GIE bitlerinin amacı nedir? Programda ne yapılmıştır?', a: 'INTE: RB0/INT harici kesmesine izin verir. GIE: tüm kesmelere genel izin verir. İkisi de programda 1 yapılmıştır.' },
          { q: 'Kesme fonksiyonundaki INTCON.INTF=0 satırı silinirse ne gözlenir? Neden?', a: 'Butona bir kez basınca LED sürekli sönük kalır. INTF silinmediği için kesmeden dönülür dönülmez kesme koşulu (GIE·INTE·INTF) yine doğru olur ve program sürekli kesmeye girer; ana döngüdeki portd.f0=1 çalışma fırsatı bulamaz.' }
        ]
      }
    ]
  });
})(window.MC);
