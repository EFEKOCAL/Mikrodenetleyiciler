/*
 * registers.js — PIC16F877A kaydedicilerinin bit tanımları (Microchip DS39582 veri sayfası)
 * ve bunları kullanan "reg" şekli: bitlere tıkla, değer hex/ikili/ondalık ve C satırı olarak çıksın.
 *
 * Kullanım: { t: 'dg', id: 'reg', reg: 'INTCON', value: 0xA0, lock: false }
 */
(function (MC) {
  'use strict';

  const ADC_CLK = ['F<sub>OSC</sub>/2', 'F<sub>OSC</sub>/8', 'F<sub>OSC</sub>/32', 'F<sub>RC</sub> (dahili RC)', 'F<sub>OSC</sub>/4', 'F<sub>OSC</sub>/16', 'F<sub>OSC</sub>/64', 'F<sub>RC</sub> (dahili RC)'];

  // PCFG3:PCFG0 → AN7..AN0 (A: analog, D: dijital, + / −: referans), Vref+, Vref−
  const PCFG = {
    0: ['AAAAAAAA', 'VDD', 'VSS'], 1: ['AAAA+AAA', 'AN3', 'VSS'], 2: ['DDDAAAAA', 'VDD', 'VSS'], 3: ['DDDA+AAA', 'AN3', 'VSS'],
    4: ['DDDDADAA', 'VDD', 'VSS'], 5: ['DDDD+DAA', 'AN3', 'VSS'], 6: ['DDDDDDDD', '—', '—'], 7: ['DDDDDDDD', '—', '—'],
    8: ['AAAA+−AA', 'AN3', 'AN2'], 9: ['DDAAAAAA', 'VDD', 'VSS'], 10: ['DDAA+AAA', 'AN3', 'VSS'], 11: ['DDAA+−AA', 'AN3', 'AN2'],
    12: ['DDDA+−AA', 'AN3', 'AN2'], 13: ['DDDD+−AA', 'AN3', 'AN2'], 14: ['DDDDDDDA', 'VDD', 'VSS'], 15: ['DDDD+−DA', 'AN3', 'AN2']
  };
  const pcfgText = (v) => {
    const [map, vp, vm] = PCFG[v & 15];
    const an = map.split('').map((c, i) => `AN${7 - i}=${c === 'A' ? 'analog' : c === 'D' ? 'dijital' : c === '+' ? 'V<sub>REF+</sub>' : 'V<sub>REF−</sub>'}`);
    const analog = an.filter((x) => !/dijital/.test(x));
    return `${analog.length ? analog.join(', ') : 'tüm pinler dijital'}; diğerleri dijital. Referans: V<sub>REF+</sub>=${vp}, V<sub>REF−</sub>=${vm}`;
  };

  const trisDef = (p) => ({
    addr: { A: '85h', B: '86h, 186h', C: '87h', D: '88h', E: '89h' }[p],
    what: `PORT${p} pinlerinin yönü. Her bit kendi pinini ayarlar.`,
    bits: [7, 6, 5, 4, 3, 2, 1, 0].map((b) => `TRIS${p}${b}`),
    bitDesc: () => ['Çıkış (0 = <b>O</b>utput)', 'Giriş (1 = <b>I</b>nput)'],
    c: `TRIS${p}`
  });
  const portDef = (p) => ({
    addr: { A: '05h', B: '06h, 106h', C: '07h', D: '08h', E: '09h' }[p],
    what: `PORT${p} pinlerinin lojik seviyesi. Çıkış pininde 1 = 5 V, 0 = 0 V. Okunduğunda pinin o anki durumu gelir.`,
    bits: [7, 6, 5, 4, 3, 2, 1, 0].map((b) => `R${p}${b}`),
    bitDesc: () => ['0 V (lojik 0)', '5 V (lojik 1)'],
    c: `PORT${p}`
  });

  const REG = {
    TRISA: trisDef('A'), TRISB: trisDef('B'), TRISC: trisDef('C'), TRISD: trisDef('D'),
    PORTA: portDef('A'), PORTB: portDef('B'), PORTC: portDef('C'), PORTD: portDef('D'),
    STATUS: {
      addr: '03h, 83h, 103h, 183h',
      what: 'ALU sonucunun durumu (Z, DC, C), reset nedeni (TO, PD) ve banka seçimi (RP1:RP0, IRP).',
      bits: ['IRP', 'RP1', 'RP0', 'TO', 'PD', 'Z', 'DC', 'C'],
      desc: {
        IRP: ['Dolaylı adreslemede Bank 0–1', 'Dolaylı adreslemede Bank 2–3'],
        RP1: null, RP0: null,
        TO: ['WDT zaman aşımı oldu', 'Açılış, CLRWDT veya SLEEP sonrası'],
        PD: ['SLEEP komutu çalıştı', 'Açılış veya CLRWDT sonrası'],
        Z: ['Sonuç sıfır değil', 'Sonuç SIFIR'],
        DC: ['Alt 4 bitten (nibble) elde yok', 'Alt 4 bitten elde var (4. bite taşma)'],
        C: ['Elde yok / çıkarmada BORÇ var', 'Elde var (7. bitten taşma) / çıkarmada borç yok']
      },
      fields: [{ name: 'RP1:RP0', hi: 6, lo: 5, cls: 'field-a', text: (v) => `Bank ${v} seçili (adres ${['00h–7Fh', '80h–FFh', '100h–17Fh', '180h–1FFh'][v]})` }],
      c: 'STATUS'
    },
    INTCON: {
      addr: '0Bh, 8Bh, 10Bh, 18Bh',
      what: 'Temel kesme ayarları: genel izin, çevresel izin ve TMR0 / RB0 / PORTB değişim kesmelerinin izin ve bayrak bitleri.',
      bits: ['GIE', 'PEIE', 'TMR0IE', 'INTE', 'RBIE', 'TMR0IF', 'INTF', 'RBIF'],
      desc: {
        GIE: ['Tüm kesmeler kapalı', 'Global kesme izni: izin verilen tüm kesmeler açık'],
        PEIE: ['Çevresel kesmeler kapalı', 'Çevresel (peripheral) kesmeler açık: ADC, Timer1, Timer2, USART…'],
        TMR0IE: ['TMR0 taşma kesmesi kapalı', 'TMR0 taşma kesmesi açık'],
        INTE: ['RB0/INT harici kesmesi kapalı', 'RB0/INT harici kesmesi açık'],
        RBIE: ['RB4–RB7 değişim kesmesi kapalı', 'RB4–RB7 değişim kesmesi açık'],
        TMR0IF: ['TMR0 taşmadı', 'TMR0 taşdı (FFh→00h). Yazılımla silinmeli'],
        INTF: ['RB0/INT kesmesi oluşmadı', 'RB0/INT kesmesi oluştu. Yazılımla silinmeli'],
        RBIF: ['RB4–RB7 değişmedi', 'RB4–RB7 pinlerinden en az biri değişti']
      },
      c: 'INTCON'
    },
    OPTION_REG: {
      addr: '81h, 181h',
      what: 'Timer0 saat kaynağı ve kenarı, ön ölçekleyici ataması ve oranı; ayrıca PORTB pull-up ve RB0 kesme kenarı.',
      bits: ['RBPU', 'INTEDG', 'T0CS', 'T0SE', 'PSA', 'PS2', 'PS1', 'PS0'],
      desc: {
        RBPU: ['PORTB dahili pull-up dirençleri AÇIK (aktif düşük bit)', 'PORTB pull-up dirençleri kapalı'],
        INTEDG: ['RB0/INT düşen kenarda kesme', 'RB0/INT yükselen kenarda kesme'],
        T0CS: ['TMR0 saat kaynağı: dahili komut saati (F<sub>OSC</sub>/4) → zamanlayıcı', 'TMR0 saat kaynağı: RA4/T0CKI pini → sayaç'],
        T0SE: ['T0CKI yükselen kenarda sayar', 'T0CKI düşen kenarda sayar'],
        PSA: ['Ön ölçekleyici Timer0\'a atanmış', 'Ön ölçekleyici WDT\'ye atanmış (Timer0 1:1)'],
        PS2: null, PS1: null, PS0: null
      },
      fields: [{ name: 'PS2:PS0', hi: 2, lo: 0, cls: 'field-a', text: (v, all) => (all >> 3) & 1 ? `WDT oranı 1:${1 << v} (TMR0 ön ölçeksiz, 1:1)` : `TMR0 ön ölçek oranı 1:${2 << v}` }],
      c: 'OPTION_REG'
    },
    ADCON0: {
      addr: '1Fh',
      what: 'A/D modülünü açma, kanal seçimi, çevrim saati (ADCS1:ADCS0) ve çevrimi başlatma.',
      bits: ['ADCS1', 'ADCS0', 'CHS2', 'CHS1', 'CHS0', 'GO/DONE', '—', 'ADON'],
      desc: {
        ADCS1: null, ADCS0: null, CHS2: null, CHS1: null, CHS0: null,
        'GO/DONE': ['Çevrim yok / bitti (donanım siler)', 'Çevrimi BAŞLAT / çevrim sürüyor'],
        '—': null,
        ADON: ['A/D modülü kapalı (akım çekmez)', 'A/D modülü enerjili (açık)']
      },
      fields: [
        { name: 'ADCS1:ADCS0', hi: 7, lo: 6, cls: 'field-a', text: (v) => `Çevrim saati seçiminin alt iki biti = ${MC.bin(v, 2)} (ADCON1.ADCS2 ile birlikte okunur)` },
        { name: 'CHS2:CHS0', hi: 5, lo: 3, cls: 'field-b', text: (v) => `Kanal AN${v} seçili` }
      ],
      c: 'ADCON0'
    },
    ADCON1: {
      addr: '9Fh',
      what: 'Sonucun hizalanması (ADFM), çevrim saatinin üst biti (ADCS2) ve A/E port pinlerinin analog/dijital ayarı (PCFG).',
      bits: ['ADFM', 'ADCS2', '—', '—', 'PCFG3', 'PCFG2', 'PCFG1', 'PCFG0'],
      desc: {
        ADFM: ['SOLA yaslı: ADRESH = sonucun üst 8 biti, ADRESL\'nin üst 2 biti = alt 2 bit', 'SAĞA yaslı: ADRESH\'nin alt 2 biti + ADRESL (8 bit) = 10 bit'],
        ADCS2: null, '—': null, PCFG3: null, PCFG2: null, PCFG1: null, PCFG0: null
      },
      fields: [
        { name: 'PCFG3:PCFG0', hi: 3, lo: 0, cls: 'field-b', text: (v) => `${MC.bin(v, 4)} → ${pcfgText(v)}` },
        { name: 'ADCS2', hi: 6, lo: 6, cls: 'field-a', text: (v) => `ADCS2=${v}. ADCON0'daki ADCS1:ADCS0 ile birlikte: ${v}xx (ör. ADCS1:0=01 ise ${ADC_CLK[(v << 2) | 1]})` }
      ],
      c: 'ADCON1'
    },
    PIE1: {
      addr: '8Ch',
      what: 'Çevresel birimlerin (peripheral) kesme izin bitleri. Çalışmaları için INTCON.PEIE ve GIE de 1 olmalı.',
      bits: ['PSPIE', 'ADIE', 'RCIE', 'TXIE', 'SSPIE', 'CCP1IE', 'TMR2IE', 'TMR1IE'],
      desc: { PSPIE: ['', 'Paralel slave port kesmesi açık'], ADIE: ['A/D kesmesi kapalı', 'A/D çevrim bitti kesmesi AÇIK'], RCIE: ['', 'USART alma kesmesi açık'], TXIE: ['', 'USART gönderme kesmesi açık'], SSPIE: ['', 'SSP (I²C/SPI) kesmesi açık'], CCP1IE: ['', 'CCP1 kesmesi açık'], TMR2IE: ['', 'TMR2 = PR2 eşleşme kesmesi açık'], TMR1IE: ['', 'TMR1 taşma kesmesi açık'] },
      c: 'PIE1'
    },
    PIR1: {
      addr: '0Ch',
      what: 'Çevresel birimlerin kesme bayrakları. Olay olunca donanım 1 yapar; yazılım silmelidir.',
      bits: ['PSPIF', 'ADIF', 'RCIF', 'TXIF', 'SSPIF', 'CCP1IF', 'TMR2IF', 'TMR1IF'],
      desc: { PSPIF: ['', 'PSP okuma/yazma oldu'], ADIF: ['A/D çevrim tamamlanmadı', 'A/D çevrim TAMAMLANDI'], RCIF: ['', 'USART alma tamponu dolu'], TXIF: ['', 'USART gönderme tamponu boş'], SSPIF: ['', 'SSP olayı oldu'], CCP1IF: ['', 'CCP1 olayı oldu'], TMR2IF: ['', 'TMR2 = PR2 eşleşmesi oldu'], TMR1IF: ['', 'TMR1 taştı (FFFFh→0000h)'] },
      c: 'PIR1'
    },
    T1CON: {
      addr: '10h',
      what: 'Timer1 ayarları: ön ölçek, osilatör, senkronizasyon, saat kaynağı ve açma/kapama.',
      bits: ['—', '—', 'T1CKPS1', 'T1CKPS0', 'T1OSCEN', 'T1SYNC', 'TMR1CS', 'TMR1ON'],
      desc: { '—': null, T1CKPS1: null, T1CKPS0: null, T1OSCEN: ['Timer1 osilatörü kapalı', 'Timer1 osilatörü açık'], T1SYNC: ['Harici saat senkronize edilir', 'Harici saat senkronize edilmez'], TMR1CS: ['Dahili saat (F<sub>OSC</sub>/4): zamanlayıcı modu', 'Harici saat (RC0/T1OSO/T1CKI): sayaç modu'], TMR1ON: ['Timer1 durdu', 'Timer1 çalışıyor'] },
      fields: [{ name: 'T1CKPS1:T1CKPS0', hi: 5, lo: 4, cls: 'field-a', text: (v) => `Ön ölçek 1:${1 << v}` }],
      c: 'T1CON'
    }
  };
  MC.REG = REG;
  MC.ADC_CLK = ADC_CLK;
  MC.pcfgText = pcfgText;

  /* ------------------------------------------------------------ "reg" şekli */

  MC.dg.add('reg', {
    html(p) {
      const r = REG[p.reg];
      return `<p class="hint" style="margin:0 0 8px"><b>${p.reg}</b> · adres ${r.addr} · ${r.what}</p>
        <div class="reg">
          <div class="reg-bits">${r.bits.map((n, i) => {
            const bit = 7 - i;
            const f = (r.fields || []).find((x) => bit <= x.hi && bit >= x.lo);
            const ro = n === '—' || p.lock;
            return `<button type="button" class="reg-bit${ro ? ' ro' : ''}${f ? ' ' + f.cls : ''}" data-bit="${bit}"${ro ? ' tabindex="-1"' : ''} title="${MC.esc(n)}"><span class="rb-n">bit ${bit}</span><span class="rb-name">${n}</span><span class="rb-v">0</span></button>`;
          }).join('')}</div>
          <div class="reg-vals">
            <div class="dg-b"><small>Hex</small><b data-o="hex"></b></div>
            <div class="dg-b"><small>İkili</small><b data-o="bin"></b></div>
            <div class="dg-b"><small>Ondalık</small><b data-o="dec"></b></div>
            ${p.lock ? '' : '<label class="dg-b"><small>Değer yaz</small><input type="text" data-o="in" placeholder="0xA0" style="width:90px;padding:3px 6px"></label>'}
          </div>
          <div class="reg-c" data-o="c"></div>
          <ul class="reg-desc" data-o="desc"></ul>
        </div>`;
    },
    init(el, p) {
      const r = REG[p.reg];
      let v = (p.value || 0) & 255;
      const draw = () => {
        el.querySelectorAll('.reg-bit').forEach((b) => {
          const on = (v >> +b.dataset.bit) & 1;
          b.classList.toggle('one', !!on);
          b.querySelector('.rb-v').textContent = on;
        });
        el.querySelector('[data-o="hex"]').textContent = MC.hex(v);
        el.querySelector('[data-o="bin"]').textContent = '0b' + MC.bin(v);
        el.querySelector('[data-o="dec"]').textContent = v;
        el.querySelector('[data-o="c"]').textContent = `${r.c} = ${MC.hex(v)};   // 0b${MC.bin(v)}`;
        const lines = [];
        if (r.bitDesc) {
          r.bits.forEach((n, i) => { const bit = 7 - i; lines.push(`<li><b>${n}</b> = ${(v >> bit) & 1} → ${r.bitDesc()[(v >> bit) & 1]}</li>`); });
        } else {
          r.bits.forEach((n, i) => {
            const bit = 7 - i;
            const d = r.desc[n];
            if (!d) return;
            const on = (v >> bit) & 1;
            if (!d[on]) return;
            lines.push(`<li class="${on ? '' : 'off'}"><b>${n}</b> = ${on} → ${d[on]}</li>`);
          });
          (r.fields || []).forEach((f) => {
            const fv = (v >> f.lo) & ((1 << (f.hi - f.lo + 1)) - 1);
            lines.unshift(`<li><b>${f.name}</b> = ${MC.bin(fv, f.hi - f.lo + 1)} → ${f.text(fv, v)}</li>`);
          });
        }
        el.querySelector('[data-o="desc"]').innerHTML = lines.join('');
      };
      if (!p.lock) {
        el.querySelector('.reg-bits').addEventListener('click', (e) => {
          const b = e.target.closest('.reg-bit');
          if (!b || b.classList.contains('ro')) return;
          v ^= 1 << +b.dataset.bit;
          draw();
        });
        const inp = el.querySelector('[data-o="in"]');
        inp.addEventListener('input', () => {
          const n = MC.parseNum(inp.value);
          if (Number.isInteger(n) && n >= 0 && n <= 255) { v = n; draw(); }
        });
      }
      draw();
    }
  });
})(window.MC);
