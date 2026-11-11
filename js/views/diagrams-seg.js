/*
 * diagrams-seg.js — 7 segment display (hafta 7) ve doğru/yanlış alıştırması.
 *   MC.seg       segment desenleri, port ↔ segment dönüşümü, tek hanenin SVG çizimi
 *   seg7         etkileşimli gösterge: segmentlere tıkla, ortak katot/anot, BCD sürücü
 *   dy           doğru/yanlış turu (MC.tfBank)
 *
 * Bağlantı (slayt 3 ve Uygulama 21–22): a = RB7, b = RB6, c = RB5, d = RB4, e = RB3, f = RB2, g = RB1, dp = RB0.
 * Segment maskesi: bit 0 = a … bit 6 = g, bit 7 = dp.
 */
(function (MC) {
  'use strict';

  const $o = (el, k) => el.querySelector(`[data-o="${k}"]`);
  const NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  // Rakamların yanan segmentleri
  const LIT = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  const DIGIT = LIT.map((s) => [...s].reduce((m, c) => m | (1 << NAMES.indexOf(c)), 0));

  // Slayttaki bağlantıyla PORTB değeri ↔ segment maskesi (ortak katot: 1 = yanık)
  const fromPort = (v, ca) => {
    const x = ca ? ~v & 255 : v & 255;
    let m = 0;
    for (let i = 0; i < 7; i++) if ((x >> (7 - i)) & 1) m |= 1 << i;
    if (x & 1) m |= 0x80;
    return m;
  };
  const toPort = (m, ca) => {
    let v = 0;
    for (let i = 0; i < 7; i++) if ((m >> i) & 1) v |= 1 << (7 - i);
    if (m & 0x80) v |= 1;
    return ca ? ~v & 255 : v;
  };
  const digitOf = (m) => DIGIT.indexOf(m & 0x7f);
  // BCD → 7 segment sürücü (7448 / 74LS248, SimulIDE BcdTo7S): 0–9 rakam; 10–15 geçersiz, boş gösterilir
  const bcd = (n) => (n >= 0 && n <= 9 ? DIGIT[n] : 0);

  const SHAPE = {
    a: 'x="15" y="4" width="32" height="7"', b: 'x="48" y="12" width="7" height="34"', c: 'x="48" y="54" width="7" height="34"',
    d: 'x="15" y="89" width="32" height="7"', e: 'x="7" y="54" width="7" height="34"', f: 'x="7" y="12" width="7" height="34"', g: 'x="15" y="46.5" width="32" height="7"'
  };
  // Tek hane. state: 'on' tam yanık, 'dim' göz yanılması (son 20 ms içinde yandı), 'off'
  const svg = (m, opt = {}) => `<svg class="seg7${opt.click ? ' click' : ''}${opt.state === 'dim' ? ' dim' : ''}" viewBox="0 0 66 100" role="img" aria-label="7 segment: ${digitOf(m) >= 0 ? digitOf(m) : 'desen'}">
    ${NAMES.map((n, i) => `<rect ${SHAPE[n]} rx="3" class="sg${(m >> i) & 1 && opt.state !== 'off' ? ' on' : ''}" data-seg="${i}"><title>${n}</title></rect>`).join('')}
    <circle cx="60" cy="92" r="4" class="sg${m & 0x80 && opt.state !== 'off' ? ' on' : ''}" data-seg="7"><title>dp</title></circle>
    ${opt.labels ? NAMES.map((n) => { const [x, y] = { a: [31, 20], b: [43, 31], c: [43, 73], d: [31, 84], e: [19, 73], f: [19, 31], g: [31, 63] }[n]; return `<text x="${x}" y="${y}" class="sg-l">${n}</text>`; }).join('') : ''}
  </svg>`;

  MC.seg = { NAMES, DIGIT, fromPort, toPort, digitOf, bcd, svg };

  /* ------------------------------------------------------------ seg7: etkileşimli gösterge */
  MC.dg.add('seg7', {
    title: '7 segment: PORTB\'ye yazılan sayı segmentlere nasıl gider?',
    html: (p) => `<div class="dg-ctl">
        <div class="tabs" data-o="mode"><button class="tab" type="button" data-m="cc">Ortak katot</button><button class="tab" type="button" data-m="ca">Ortak anot</button><button class="tab" type="button" data-m="bcd">BCD sürücü (7448)</button></div>
        <span class="dg-row" data-o="digits">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button class="btn btn-sm" type="button" data-d="${d}">${d}</button>`).join('')}<button class="btn btn-sm btn-ghost" type="button" data-d="-1">Temizle</button></span>
      </div>
      <div class="seg-wrap"><div class="seg-big" data-o="disp"></div>
        <div class="table-wrap"><table class="calc-t seg-t"><thead><tr><th>Pin</th><th>Bit</th><th>Gerilim</th><th>Nereye</th><th>Durum</th></tr></thead><tbody data-o="rows"></tbody></table></div></div>
      <div class="dg-stats" style="margin-top:8px"><div class="dg-b"><small>PORTB (ikili)</small><b data-o="bin"></b></div><div class="dg-b"><small>Hex</small><b data-o="hex"></b></div><div class="dg-b"><small>Rakam</small><b data-o="dig"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el, p) {
      let mode = p.mode || 'cc';
      let mask = DIGIT[p.digit == null ? 2 : p.digit];
      let num = p.digit == null ? 2 : p.digit; // BCD modunda PORTB alt 4 bit
      const draw = () => {
        el.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('active', b.dataset.m === mode));
        const isBcd = mode === 'bcd';
        const ca = mode === 'ca';
        const m = isBcd ? bcd(num) : mask;
        const port = isBcd ? num & 15 : toPort(m, ca);
        $o(el, 'disp').innerHTML = svg(m, { click: !isBcd, labels: true }) + `<small>${isBcd ? 'Ortak katot, sürücü çıkışları a–g' : ca ? 'Ortak uç → +5 V (VDD)' : 'Ortak uç → GND'}</small>`;
        let rows;
        if (isBcd) {
          rows = [7, 6, 5, 4, 3, 2, 1, 0].map((b) => {
            const bit = (port >> b) & 1;
            const used = b < 4;
            return `<tr${used ? '' : ' class="muted"'}><td>RB${b}</td><td>${used ? `<button class="sw${bit ? ' on' : ''}" type="button" data-bit="${b}">${bit}</button>` : bit}</td><td>${bit ? '5 V' : '0 V'}</td><td>${used ? `sürücü girişi ${'ABCD'[b]} (2<sup>${b}</sup>)` : 'kullanılmıyor'}</td><td>${used ? '' : '—'}</td></tr>`;
          }).join('');
        } else {
          rows = [7, 6, 5, 4, 3, 2, 1, 0].map((b) => {
            const bit = (port >> b) & 1;
            const si = b === 0 ? 7 : 7 - b;
            const on = (m >> si) & 1;
            return `<tr><td>RB${b}</td><td><button class="sw${bit ? ' on' : ''}" type="button" data-bit="${b}">${bit}</button></td><td>${bit ? '5 V' : '0 V'}</td><td>segment <b>${b === 0 ? 'dp' : NAMES[si]}</b></td><td class="${on ? 'dg-ok' : 'muted'}">${on ? 'akım var → yanar' : 'sönük'}</td></tr>`;
          }).join('');
        }
        $o(el, 'rows').innerHTML = rows;
        $o(el, 'bin').textContent = '0b' + MC.bin(port);
        $o(el, 'hex').textContent = MC.hex(port);
        const d = digitOf(m);
        $o(el, 'dig').textContent = isBcd ? (num <= 9 ? num : 'geçersiz') : d >= 0 ? d + (m & 0x80 ? '.' : '') : '—';
        $o(el, 'i').innerHTML = isBcd
          ? `<b>Sürücü ile:</b> PORTB'ye doğrudan sayının kendisi yazılır: <code>PORTB = ${num};</code> → RB3…RB0 = <b>${MC.bin(num, 4)}</b> (BCD). 7448 bu 4 biti çözer ve a–g çıkışlarını kendisi sürer. Bir hane için <b>4 pin</b> yeter (doğrudan sürmede 7–8 pin).${num > 9 ? ' <span class="dg-warn">10–15 BCD değildir; sürücü anlamsız bir şekil gösterir (burada boş).</span>' : ''}`
          : `<b>Sinyalleşme:</b> <code>PORTB = 0b${MC.bin(port)};</code> yazılınca her bit kendi pinini ${ca ? '0 V ya da 5 V' : '5 V ya da 0 V'} yapar. ${ca ? 'Ortak <b>anotta</b> tüm LED\'lerin anodu +5 V\'ta; segmentin yanması için katodunun bağlı olduğu pin <b>0</b> olmalı (akım +5 V → LED → pin). Bu yüzden ortak anot kodu, ortak katot kodunun <b>bit bit tersidir</b> (<code>~</code>).' : 'Ortak <b>katotta</b> tüm LED\'lerin katodu GND\'de; pini <b>1</b> (5 V) olan segmentten akım geçer ve o segment yanar.'} Segmentlere tıklayarak kendi deseninin kodunu bul.`;
      };
      el.addEventListener('click', (e) => {
        const mb = e.target.closest('[data-m]');
        if (mb) { if (mb.dataset.m === 'bcd') num = Math.max(0, digitOf(mask)); else if (mode === 'bcd') mask = bcd(num) || DIGIT[0]; mode = mb.dataset.m; draw(); return; }
        const db = e.target.closest('[data-d]');
        if (db) { const d = +db.dataset.d; if (d < 0) { mask = 0; num = 0; } else { mask = DIGIT[d]; num = d; } draw(); return; }
        const bb = e.target.closest('[data-bit]');
        if (bb) {
          const b = +bb.dataset.bit;
          if (mode === 'bcd') num ^= 1 << b;
          else mask = fromPort(toPort(mask, mode === 'ca') ^ (1 << b), mode === 'ca');
          draw();
          return;
        }
        const sg = e.target.closest('[data-seg]');
        if (sg && mode !== 'bcd') { mask ^= 1 << +sg.dataset.seg; draw(); }
      });
      draw();
    }
  });

  /* ------------------------------------------------------------ dy: doğru / yanlış turu */
  MC.dg.add('dy', {
    title: 'Doğru / Yanlış',
    html: () => `<div class="dy-top"><span class="hint" data-o="pos"></span><span class="quiz-score" data-o="sc"></span></div>
      <div class="quiz-q" data-o="q"></div>
      <div class="btn-row" data-o="btns"><button class="btn l-ok" type="button" data-c="1">✓ Doğru</button><button class="btn l-bad" type="button" data-c="0">✗ Yanlış</button></div>
      <div class="quiz-res" data-o="r"></div>
      <div class="btn-row"><button class="btn btn-sm btn-primary" type="button" data-c="next" hidden>Sonraki ▶</button><button class="btn btn-sm btn-ghost" type="button" data-c="again">Yeni tur ↻</button></div>`,
    init(el, p) {
      const bank = (MC.tfBank || []).filter((x) => !p.tags || p.tags.some((t) => x.tag === t));
      const N = Math.min(p.n || 12, bank.length);
      let order;
      let i;
      let ok;
      const shuffle = (a) => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
      const show = () => {
        const s = order[i];
        $o(el, 'pos').textContent = `Tur: ${i + 1} / ${N}`;
        $o(el, 'q').innerHTML = s.s;
        $o(el, 'r').innerHTML = '';
        $o(el, 'btns').hidden = false;
        el.querySelector('[data-c="next"]').hidden = true;
      };
      const start = () => { order = shuffle(bank).slice(0, N); i = 0; ok = 0; $o(el, 'sc').textContent = ''; show(); };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        const c = b.dataset.c;
        if (c === 'again') { start(); return; }
        if (c === 'next') { if (i < N - 1) { i++; show(); } else { $o(el, 'q').innerHTML = `Tur bitti: <b>${ok} / ${N}</b> doğru. ${ok === N ? 'Hepsi doğru!' : 'Yanlışlarının açıklamasını oku, sonra yeni tura başla.'}`; $o(el, 'r').innerHTML = ''; $o(el, 'btns').hidden = true; b.hidden = true; } return; }
        const s = order[i];
        const good = (c === '1') === s.d;
        if (good) ok++;
        $o(el, 'sc').textContent = `${ok} / ${i + 1} doğru`;
        $o(el, 'btns').hidden = true;
        $o(el, 'r').innerHTML = `${good ? '<span class="dg-ok">✓ Doğru bildin.</span>' : '<span class="dg-bad">✗ Yanlış.</span>'} İfade <b>${s.d ? 'DOĞRU' : 'YANLIŞ'}</b>. ${s.a}`;
        el.querySelector('[data-c="next"]').hidden = false;
      });
      if (!bank.length) { $o(el, 'q').textContent = 'Soru bulunamadı.'; return; }
      start();
    }
  });
})(window.MC);
