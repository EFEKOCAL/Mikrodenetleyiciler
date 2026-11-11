/*
 * diagrams.js — Bölüm 1–2 şekilleri: mikrodenetleyici blok yapısı, gidip-getir döngüsü, adres yolu,
 * Von Neumann / Harvard, RAM bellek haritası, ALU ve STATUS bayrakları, assembly adımlayıcı, adresleme modları.
 */
(function (MC) {
  'use strict';

  const esc = MC.esc;

  /* ------------------------------------------------------------ mcu: tek entegre mi, ayrı entegreler mi? */
  const BLOCKS = [
    ['cpu', 'CPU', 'Merkezi işlem birimi. Komutları bellekten getirir (fetch), çözer ve yürütür. ALU, kaydediciler ve kontrol birimini içerir.'],
    ['rom', 'Program belleği (ROM/Flash)', 'Yazdığın programın kalıcı olarak saklandığı yer. Elektrik gitse de silinmez. PIC16F877A\'da 8K word Flash.'],
    ['ram', 'Veri belleği (RAM)', 'Program çalışırken değişkenlerin geçici olarak tutulduğu yer. Elektrik gidince silinir. PIC16F877A\'da 368 bayt.'],
    ['io', 'G/Ç portları', 'Dış dünya ile bağlantı: LED, buton, sensör, röle… PIC16F877A\'da 33 G/Ç pini (PORTA–PORTE).'],
    ['tmr', 'Zamanlayıcılar', 'Zaman ölçme, gecikme, frekans üretme ve sayma. PIC16F877A\'da Timer0, Timer1, Timer2.'],
    ['adc', 'ADC', 'Analog gerilimi sayıya çevirir (sıcaklık, potansiyometre…). PIC16F877A\'da 10 bit, 8 kanal.'],
    ['com', 'Seri haberleşme', 'Başka cihazlarla veri alışverişi: USART, I²C, SPI.'],
    ['osc', 'Osilatör / saat', 'Tüm devreye kare dalga saat sinyali verir; her işlem bu saate göre ilerler.']
  ];
  MC.dg.add('mcu', {
    title: 'Mikroişlemci sistemi mi, mikrodenetleyici mi?',
    html: () => `<div class="dg-ctl"><button class="btn btn-sm on" data-m="mcu" type="button">Mikrodenetleyici (μC)</button><button class="btn btn-sm" data-m="mpu" type="button">Mikroişlemci (μP) sistemi</button></div>
      <div class="blk-wrap"><div class="blk-zone chip"><small>Tek entegre (chip) içinde</small><div class="blk-items" data-z="in"></div></div>
      <div class="blk-zone ext"><small>Kart üzerinde ayrı entegreler olarak</small><div class="blk-items" data-z="out"></div></div></div>
      <div class="dg-info">Bir bloğa tıkla.</div>`,
    init(el) {
      let mode = 'mcu';
      const draw = () => {
        const inside = BLOCKS.filter(([id]) => mode === 'mcu' || id === 'cpu');
        const outside = BLOCKS.filter(([id]) => mode === 'mpu' && id !== 'cpu');
        const btn = ([id, name]) => `<button type="button" class="blk${id === 'cpu' ? ' cpu' : ''}" data-b="${id}">${name}</button>`;
        el.querySelector('[data-z="in"]').innerHTML = inside.map(btn).join('');
        el.querySelector('[data-z="out"]').innerHTML = outside.map(btn).join('') || '<span class="hint">Hiçbiri: hepsi zaten entegrenin içinde.</span>';
        el.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === mode));
        el.querySelector('.dg-info').innerHTML = mode === 'mcu'
          ? '<b>Mikrodenetleyici:</b> CPU, bellek (RAM, ROM) ve G/Ç birimi <b>tek entegrede</b>. "Düşük kapasiteli bir bilgisayarın entegreye dönüşmüş hali."'
          : '<b>Mikroişlemci:</b> Entegrede yalnızca <b>CPU</b> var. Bellek ve G/Ç için karta ayrı entegreler eklenir (PC anakartı gibi).';
      };
      el.addEventListener('click', (e) => {
        const m = e.target.closest('[data-m]');
        if (m) { mode = m.dataset.m; draw(); return; }
        const b = e.target.closest('[data-b]');
        if (!b) return;
        const blk = BLOCKS.find((x) => x[0] === b.dataset.b);
        el.querySelectorAll('.blk').forEach((x) => x.classList.toggle('on', x === b));
        el.querySelector('.dg-info').innerHTML = `<b>${blk[1]}:</b> ${blk[2]}`;
      });
      draw();
    }
  });

  /* ------------------------------------------------------------ fetch: gidip-getir ve işle döngüsü */
  const PROG = [
    [0x0000, 0x3034, 'MOVLW 0x34', 'W ← 0x34'],
    [0x0001, 0x3E06, 'ADDLW 0x06', 'W ← W + 0x06'],
    [0x0002, 0x0086, 'MOVWF PORTB', 'PORTB ← W'],
    [0x0003, 0x2803, 'GOTO 0x0003', 'PC ← 0x0003']
  ];
  MC.dg.add('fetch', {
    title: 'Makine döngüsü: gidip getir → çöz → yürüt',
    html: () => `<div class="fetch" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,0.9fr) minmax(0,1fr);gap:10px;align-items:start">
        <div class="run-panel"><small>CPU</small>
          <div class="dg-stack">
            <div class="dg-b" data-k="pc"><small>PC (program sayacı)</small><b></b></div>
            <div class="dg-b" data-k="ir"><small>IR (komut kaydedicisi)</small><b></b></div>
            <div class="dg-b" data-k="dec"><small>Kod çözücü</small><b></b></div>
            <div class="dg-b" data-k="w"><small>ALU · W kaydedicisi</small><b></b></div>
          </div></div>
        <div class="run-panel"><small>Anayollar</small>
          <div class="dg-stack">
            <div class="dg-b" data-k="ab"><small>Adres yolu →</small><b></b></div>
            <div class="dg-b" data-k="cb"><small>Kontrol yolu</small><b></b></div>
            <div class="dg-b" data-k="db"><small>← Veri yolu</small><b></b></div>
            <div class="dg-b" data-k="pb"><small>PORTB</small><b></b></div>
          </div></div>
        <div class="run-panel"><small>Program belleği</small>
          <table class="calc-t"><thead><tr><th>Adres</th><th>Opcode</th><th>Komut</th></tr></thead><tbody>
          ${PROG.map(([a, o, m]) => `<tr data-row="${a}"><td>${MC.hex(a, 4)}</td><td>${MC.hex(o, 4)}</td><td>${m}</td></tr>`).join('')}</tbody></table></div>
      </div><div class="dg-info"></div>`,
    init(el) {
      const steps = [];
      let w = null;
      let pb = null;
      PROG.slice(0, 3).forEach(([a, o, m, eff], n) => {
        const base = { pc: a, ir: n ? PROG[n - 1][1] : null, dec: '', w, pb };
        steps.push({ ...base, on: ['pc', 'ab'], ab: a, text: `<b>1.</b> Program sayacının içeriği (<code>${MC.hex(a, 4)}</code>) adres yoluna konur.` });
        steps.push({ ...base, on: ['cb'], ab: a, cb: 'OKU', text: '<b>2.</b> Kontrol yolunda OKUMA sinyali aktif edilir.' });
        steps.push({ ...base, on: ['db', 'row'], ab: a, cb: 'OKU', db: o, row: a, text: `<b>3.</b> Bellek, o adresteki komutun kodunu (opcode <code>${MC.hex(o, 4)}</code>) veri yoluna koyar.` });
        steps.push({ ...base, on: ['ir'], ir: o, db: o, text: '<b>4.</b> Opcode CPU içindeki komut kaydedicisine (IR) yüklenir.' });
        steps.push({ ...base, on: ['pc'], ir: o, pc: a + 1, text: `<b>5.</b> PC otomatik artar: <code>${MC.hex(a + 1, 4)}</code>. Bir sonraki gidip-getirme buradan yapılacak.` });
        steps.push({ ...base, on: ['dec'], ir: o, pc: a + 1, dec: m, text: `<b>Çöz:</b> Kod çözücü <code>${MC.hex(o, 4)}</code> değerinin <b>${m}</b> komutu olduğunu anlar.` });
        if (n === 0) w = 0x34;
        if (n === 1) w = 0x3A;
        if (n === 2) pb = 0x3A;
        steps.push({ ...base, on: [n === 2 ? 'pb' : 'w'], ir: o, pc: a + 1, dec: m, w, pb, text: `<b>Yürüt ve yaz:</b> ${eff}. Sonuç ${n === 2 ? 'PORTB kaydedicisine (belleğe)' : 'W kaydedicisine'} yazılır. Döngü yeni komutla baştan başlar.` });
      });
      const show = (k, v) => { const b = el.querySelector(`[data-k="${k}"] b`); b.textContent = v == null || v === '' ? '—' : typeof v === 'number' ? MC.hex(v, k === 'w' || k === 'pb' ? 2 : 4) : v; };
      MC.stepper(el, steps, (s) => {
        ['pc', 'ir', 'dec', 'w', 'ab', 'cb', 'db', 'pb'].forEach((k) => show(k, s[k]));
        el.querySelectorAll('[data-k]').forEach((b) => { b.style.borderColor = s.on.includes(b.dataset.k) ? 'var(--accent)' : ''; b.style.background = s.on.includes(b.dataset.k) ? 'var(--accent-soft)' : ''; });
        el.querySelectorAll('[data-row]').forEach((r) => { r.className = +r.dataset.row === s.pc - (s.on.includes('row') ? 0 : 1) && s.on.includes('row') ? 'pick' : ''; });
        el.querySelector('.dg-info').innerHTML = s.text;
      });
    }
  });

  /* ------------------------------------------------------------ bus: n adres hattı → 2^n adres */
  MC.dg.add('bus', {
    title: 'Adres hattı sayısı ve adreslenebilir alan',
    html: () => `<div class="dg-ctl"><label>Adres hattı sayısı n = <b data-o="n"></b></label><input type="range" min="1" max="32" value="16" style="flex:1;min-width:160px"></div>
      <div class="dg-stats"><div class="dg-b"><small>Formül</small><b data-o="f"></b></div><div class="dg-b"><small>Adres sayısı</small><b data-o="c"></b></div><div class="dg-b"><small>Adres aralığı</small><b data-o="r"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      const r = el.querySelector('input');
      const k = (c) => (c >= 2 ** 30 ? `${c / 2 ** 30}G` : c >= 2 ** 20 ? `${c / 2 ** 20}M` : c >= 1024 ? `${c / 1024}K` : `${c}`);
      const draw = () => {
        const n = +r.value;
        const c = 2 ** n;
        el.querySelector('[data-o="n"]').textContent = n;
        el.querySelector('[data-o="f"]').textContent = `2^${n}`;
        el.querySelector('[data-o="c"]').textContent = `${c.toLocaleString('tr-TR')} = ${k(c)}`;
        el.querySelector('[data-o="r"]').textContent = `${MC.hex(0, Math.ceil(n / 4))} – ${MC.hex(c - 1, Math.ceil(n / 4))}`;
        const notes = { 13: '<b>PIC16F877A program sayacı 13 bittir:</b> 2<sup>13</sup> = 8192 = 8K komut adresi. 8K program belleğinin tamamına erişebilir.', 16: 'Slayttaki örnek: 16 adres hattı → 2<sup>16</sup> = 65536 = 64K adres.', 9: 'PIC16F877A veri belleği: 9 bit adres (RP1:RP0 + 7 bit) → 512 adres, 4 bank × 128.', 8: 'EEPROM 256 bayt: 8 bit adres yeter.' };
        el.querySelector('[data-o="i"]').innerHTML = notes[n] || 'Her hat 0 veya 1 olabilir; n hat 2<sup>n</sup> farklı adres kombinasyonu üretir.';
      };
      r.addEventListener('input', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ arch: Von Neumann ve Harvard zaman çizelgesi */
  MC.dg.add('arch', {
    title: 'Von Neumann ve Harvard: aynı 4 komut kaç adımda biter?',
    html: () => `<div class="dg-ctl"><button class="btn btn-sm on" data-a="vn" type="button">Von Neumann (Princeton)</button><button class="btn btn-sm" data-a="hv" type="button">Harvard</button></div>
      <div data-o="svg"></div><div data-o="tl" style="margin-top:10px"></div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      let a = 'vn';
      const box = (x, y, w, h, t, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#15212c" stroke="${c}" stroke-width="2"/><text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" fill="#e5edf2" font-size="14">${t}</text>`;
      const line = (x1, y1, x2, y2, c, t) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="4"/><text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" text-anchor="middle" fill="${c}" font-size="12">${t}</text>`;
      const draw = () => {
        el.querySelectorAll('[data-a]').forEach((b) => b.classList.toggle('on', b.dataset.a === a));
        el.querySelector('[data-o="svg"]').innerHTML = a === 'vn'
          ? `<svg viewBox="0 0 600 130">${box(20, 35, 140, 60, 'CPU', '#a78bfa')}${line(160, 65, 400, 65, '#2dd4bf', 'tek ortak yol (komut + veri)')}${box(400, 25, 180, 80, 'Bellek: program + veri', '#2dd4bf')}</svg>`
          : `<svg viewBox="0 0 600 160">${box(20, 50, 140, 60, 'CPU', '#a78bfa')}${line(160, 62, 400, 30, '#2dd4bf', 'komut yolu (14 bit)')}${box(400, 8, 180, 50, 'Program belleği', '#2dd4bf')}${line(160, 98, 400, 130, '#fbbf24', 'veri yolu (8 bit)')}${box(400, 105, 180, 50, 'Veri belleği (RAM)', '#fbbf24')}</svg>`;
        const cell = (t, c) => `<td style="text-align:center;color:${c};font-weight:700">${t}</td>`;
        const slots = a === 'vn' ? 8 : 5;
        let rows;
        if (a === 'vn') {
          const r = [];
          for (let i = 1; i <= 4; i++) r.push(cell('K' + i, '#2dd4bf'), cell('V' + i, '#fbbf24'));
          rows = `<tr><th>Ortak yol</th>${r.join('')}</tr>`;
        } else {
          rows = `<tr><th>Komut yolu</th>${[1, 2, 3, 4].map((i) => cell('K' + i, '#2dd4bf')).join('')}${cell('', '')}</tr><tr><th>Veri yolu</th>${cell('', '')}${[1, 2, 3, 4].map((i) => cell('V' + i, '#fbbf24')).join('')}</tr>`;
        }
        el.querySelector('[data-o="tl"]').innerHTML = `<div class="table-wrap"><table class="calc-t"><thead><tr><th>Zaman →</th>${Array.from({ length: slots }, (_, i) => `<th class="num">t${i + 1}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
        el.querySelector('[data-o="i"]').innerHTML = a === 'vn'
          ? 'K = komutu getir, V = veriye eriş. Tek yol olduğu için ikisi <b>aynı anda olamaz</b>: 4 komut <b>8 adımda</b> biter. Avantajı: <b>basit, ucuz, esnek</b> (bellek program ve veri arasında paylaşılır).'
          : 'Ayrı yollar sayesinde bir komutun verisine erişilirken <b>sonraki komut aynı anda getirilir</b>: 4 komut <b>5 adımda</b> biter. Avantajı: <b>hızlı, güvenli</b> (program verinin üzerine yazılamaz), yol genişlikleri ayrı seçilebilir (PIC: 14 bit komut, 8 bit veri).';
      };
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) { a = b.dataset.a; draw(); } });
      draw();
    }
  });

  /* ------------------------------------------------------------ memmap: PIC16F877A RAM / kaydedici haritası */
  const SFR = [
    ['INDF', 'INDF', 'INDF', 'INDF'], ['TMR0', 'OPTION_REG', 'TMR0', 'OPTION_REG'], ['PCL', 'PCL', 'PCL', 'PCL'], ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
    ['FSR', 'FSR', 'FSR', 'FSR'], ['PORTA', 'TRISA', '—', '—'], ['PORTB', 'TRISB', 'PORTB', 'TRISB'], ['PORTC', 'TRISC', '—', '—'],
    ['PORTD', 'TRISD', '—', '—'], ['PORTE', 'TRISE', '—', '—'], ['PCLATH', 'PCLATH', 'PCLATH', 'PCLATH'], ['INTCON', 'INTCON', 'INTCON', 'INTCON'],
    ['PIR1', 'PIE1', 'EEDATA', 'EECON1'], ['PIR2', 'PIE2', 'EEADR', 'EECON2'], ['TMR1L', 'PCON', 'EEDATH', '(ayrılmış)'], ['TMR1H', '—', 'EEADRH', '(ayrılmış)'],
    ['T1CON', '—', '', ''], ['TMR2', 'SSPCON2', '', ''], ['T2CON', 'PR2', '', ''], ['SSPBUF', 'SSPADD', '', ''],
    ['SSPCON', 'SSPSTAT', '', ''], ['CCPR1L', '—', '', ''], ['CCPR1H', '—', '', ''], ['CCP1CON', '—', '', ''],
    ['RCSTA', 'TXSTA', '', ''], ['TXREG', 'SPBRG', '', ''], ['RCREG', '—', '', ''], ['CCPR2L', '—', '', ''],
    ['CCPR2H', 'CMCON', '', ''], ['CCP2CON', 'CVRCON', '', ''], ['ADRESH', 'ADRESL', '', ''], ['ADCON0', 'ADCON1', '', '']
  ];
  // Bank 2–3'te 10h–1Fh arası genel amaçlı RAM'in başladığı yerdir (110h, 190h)
  function lookup(addr) {
    const bank = addr >> 7;
    const off = addr & 0x7f;
    if (off >= 0x70) return { bank, off, kind: 'gpr', name: off === addr ? 'Ortak GPR (tüm banklardan erişilir)' : `Ortak GPR → ${MC.hexH(off)} ile aynı hücre`, ok: true };
    if (bank >= 2 && off >= 0x10) return { bank, off, kind: 'gpr', name: 'Genel amaçlı RAM (GPR)', ok: true };
    if (bank === 1 && off >= 0x20) return off < 0x70 ? { bank, off, kind: 'gpr', name: 'Genel amaçlı RAM (GPR)', ok: true } : null;
    if (bank === 0 && off >= 0x20) return { bank, off, kind: 'gpr', name: 'Genel amaçlı RAM (GPR)', ok: true };
    const n = SFR[off] ? SFR[off][bank] : '';
    if (!n || n === '—' || n === '(ayrılmış)') return { bank, off, kind: 'na', name: 'Kullanılmayan / ayrılmış adres (0 okunur)', ok: false };
    return { bank, off, kind: 'sfr', name: `Özel amaçlı kaydedici: <b>${n}</b>`, ok: false };
  }
  MC.memLookup = lookup;
  MC.dg.add('memmap', {
    title: 'PIC16F877A veri belleği: 4 bank × 128 adres',
    html: () => `<div class="dg-ctl"><label>Adres (hex): <input type="text" value="${'86h'}" style="width:90px" data-o="in"></label><span class="hint">Örnek dene: 1Fh, 86h, 104h, 20h, A0h, F5h, 110h</span></div>
      <div class="dg-info" data-o="i" style="margin:0 0 10px"></div>
      <div class="table-wrap" style="max-height:330px;overflow:auto"><table class="mmap"><thead><tr><th>ofset</th><th>Bank 0<br><small>RP1:RP0=00</small></th><th>Bank 1<br><small>01</small></th><th>Bank 2<br><small>10</small></th><th>Bank 3<br><small>11</small></th></tr></thead><tbody>
      ${SFR.map((r, off) => `<tr><td class="a">${MC.hexH(off)}</td>${r.map((n, b) => {
        const a = (b << 7) | off;
        const gpr = b >= 2 && off >= 0x10;
        const t = gpr ? (off === 0x10 ? `GPR ${MC.hexH(a)}…` : '') : n;
        return `<td class="${gpr ? 'gpr' : !n || n === '—' || n === '(ayrılmış)' ? 'na' : 'sfr'}" data-a="${a}" title="${MC.hexH(a)}">${t || (gpr ? '⋮' : n || '—')}</td>`;
      }).join('')}</tr>`).join('')}
      <tr><td class="a">20h–6Fh</td><td class="gpr" data-a="32">GPR 20h–6Fh (80 B)</td><td class="gpr" data-a="160">GPR A0h–EFh (80 B)</td><td class="gpr">GPR (devam)</td><td class="gpr">GPR (devam)</td></tr>
      <tr><td class="a">70h–7Fh</td><td class="gpr" data-a="112">GPR 70h–7Fh (16 B)</td><td class="mir">→ 70h–7Fh</td><td class="mir">→ 70h–7Fh</td><td class="mir">→ 70h–7Fh</td></tr>
      </tbody></table></div>
      <p class="hint">GPR: Bank 0 = 20h–7Fh (96 B), Bank 1 = A0h–EFh (80 B), Bank 2 = 110h–16Fh (96 B), Bank 3 = 190h–1EFh (96 B) → toplam <b>368 bayt</b>. F0h–FFh, 170h–17Fh, 1F0h–1FFh, 70h–7Fh ile aynı hücrelerdir.</p>`,
    init(el) {
      const inp = el.querySelector('[data-o="in"]');
      const draw = () => {
        const a = MC.parseNum(/^[0-9a-f]+$/i.test(inp.value.trim()) ? inp.value.trim() + 'h' : inp.value);
        el.querySelectorAll('td.hit').forEach((t) => t.classList.remove('hit'));
        const o = el.querySelector('[data-o="i"]');
        if (!Number.isInteger(a) || a < 0 || a > 0x1ff) { o.innerHTML = 'Adres 000h–1FFh arasında olmalı (9 bit).'; return; }
        const r = lookup(a);
        if (!r) { o.innerHTML = `<b>${MC.hexH(a)}</b>: Bank 1'de F0h–FFh → 70h–7Fh ortak alanına yansır.`; return; }
        const cell = el.querySelector(`td[data-a="${r.kind === 'gpr' && r.off >= 0x20 ? (r.bank === 1 ? 160 : r.off >= 0x70 ? 112 : 32) : a}"]`);
        if (cell) { cell.classList.add('hit'); const wrap = cell.closest('.table-wrap'); wrap.scrollTop = Math.max(0, cell.offsetTop - wrap.clientHeight / 2); } // yalnızca tablo kayar, sayfa değil
        o.innerHTML = `<b>${MC.hexH(a)}</b> = Bank <b>${r.bank}</b> (RP1:RP0 = ${MC.bin(r.bank, 2)}), bank içi ofset ${MC.hexH(r.off)} (komuttaki 7 bit) → ${r.name}. ${r.ok ? '<span class="dg-ok">Buraya değişken tanımlanabilir.</span>' : '<span class="dg-bad">Buraya değişken tanımlanamaz.</span>'}`;
      };
      inp.addEventListener('input', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ alu: işlem sonucu ve STATUS bayrakları */
  const OPS = {
    ADDLW: { f: (w, k) => w + k, txt: 'W ← W + k', arith: 'add' },
    SUBLW: { f: (w, k) => k - w, txt: 'W ← k − W (dikkat: k eksi W!)', arith: 'sub' },
    ANDLW: { f: (w, k) => w & k, txt: 'W ← W AND k' },
    IORLW: { f: (w, k) => w | k, txt: 'W ← W OR k' },
    XORLW: { f: (w, k) => w ^ k, txt: 'W ← W XOR k' }
  };
  const PRESET = [['ADDLW', 0xf0, 0x10, 'Slayt: 0F0h + 10h'], ['SUBLW', 23, 20, 'Slayt: 20 − 23'], ['SUBLW', 23, 24, 'Slayt: 24 − 23'], ['SUBLW', 23, 23, 'Slayt: 23 − 23'], ['ADDLW', 0x34, 0x06, 'Slayt 58: 34h + 6h'], ['ADDLW', 0x0f, 0x01, 'DC örneği: 0Fh + 1']];
  MC.dg.add('alu', {
    title: 'ALU ve STATUS: işlem sonucuna göre Z, DC, C bayrakları',
    html: () => `<div class="dg-ctl">
        <select data-o="op">${Object.keys(OPS).map((o) => `<option>${o}</option>`).join('')}</select>
        <label>W = <input type="text" data-o="w" style="width:80px"></label>
        <label>k = <input type="text" data-o="k" style="width:80px"></label>
      </div>
      <div class="dg-ctl">${PRESET.map((p, i) => `<button class="btn btn-sm" type="button" data-p="${i}">${p[3]}</button>`).join('')}</div>
      <div class="dg-stats">
        <div class="dg-b"><small>İşlem</small><b data-o="t"></b></div>
        <div class="dg-b"><small>Sonuç (W)</small><b data-o="r"></b></div>
        <div class="dg-b"><small>Z (bit 2)</small><b data-o="z"></b></div>
        <div class="dg-b"><small>DC (bit 1)</small><b data-o="dc"></b></div>
        <div class="dg-b"><small>C (bit 0)</small><b data-o="c"></b></div>
      </div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      const $ = (k) => el.querySelector(`[data-o="${k}"]`);
      const set = (op, w, k) => { $('op').value = op; $('w').value = MC.hex(w); $('k').value = MC.hex(k); draw(); };
      const draw = () => {
        const op = OPS[$('op').value];
        const w = MC.parseNum($('w').value) & 255;
        const k = MC.parseNum($('k').value) & 255;
        if (Number.isNaN(w) || Number.isNaN(k)) return;
        const raw = op.f(w, k);
        const r = raw & 255;
        const z = r === 0 ? 1 : 0;
        let c = '—';
        let dc = '—';
        let why;
        if (op.arith === 'add') {
          c = raw > 255 ? 1 : 0;
          dc = (w & 15) + (k & 15) > 15 ? 1 : 0;
          why = `${MC.hex(w)} + ${MC.hex(k)} = ${MC.hex(raw, 3)}${raw > 255 ? ' → 9. bit taştı, W\'ye alt 8 bit kalır' : ''}. ` +
            `C=${c} (${c ? '7. bitten elde çıktı' : 'elde yok'}), DC=${dc} (alt nibble: ${MC.hex(w & 15, 1)} + ${MC.hex(k & 15, 1)} = ${MC.hex((w & 15) + (k & 15), 1)}${dc ? ' > F, elde var' : ' ≤ F'}).`;
        } else if (op.arith === 'sub') {
          c = k >= w ? 1 : 0;
          dc = (k & 15) >= (w & 15) ? 1 : 0;
          why = `k − W = ${k} − ${w} = ${k - w}${k - w < 0 ? ` → negatif, ikiye tümleyen: ${MC.hex(r)}` : ''}. PIC'te çıkarmada <b>C, borcun tersidir</b>: C=1 → borç yok (k ≥ W), C=0 → borç var (k < W). ` +
            `Bu yüzden: <b>${k > w ? 'k > W → Z=0, C=1 (büyük)' : k === w ? 'k = W → Z=1, C=1 (eşit)' : 'k < W → Z=0, C=0 (küçük)'}</b>.`;
        } else {
          why = 'Mantık işlemleri yalnızca <b>Z</b> bayrağını etkiler; C ve DC değişmez.';
        }
        $('t').textContent = op.txt.split(' (')[0];
        $('r').textContent = `${MC.hex(r)} = ${MC.bin(r)}`;
        $('z').textContent = z;
        $('dc').textContent = dc;
        $('c').textContent = c;
        $('i').innerHTML = `${why} Z=${z}: ${z ? 'sonuç sıfır' : 'sonuç sıfır değil'}.`;
      };
      el.addEventListener('input', draw);
      el.addEventListener('change', draw);
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { const p = PRESET[+b.dataset.p]; set(p[0], p[1], p[2]); } });
      set('ADDLW', 0xf0, 0x10);
    }
  });

  /* ------------------------------------------------------------ asmstep: bank seçimiyle PORTB'ye yazma */
  const ASM = {
    aa: [
      ['BCF STATUS,RP0', 'Bank 0 seçilir (RP0=0)', (s) => { s.rp0 = 0; }],
      ['BCF STATUS,RP1', 'RP1=0 → Bank 0', (s) => { s.rp1 = 0; }],
      ['CLRF PORTB', 'PORTB sıfırlanır', (s) => { s.write(0x06, 0); }],
      ['BSF STATUS,RP0', 'Bank 1 seçilir (RP0=1)', (s) => { s.rp0 = 1; }],
      ['MOVLW 0X00', 'W ← 00h', (s) => { s.w = 0; }],
      ['MOVWF TRISB', 'TRISB ← W: bütün pinler ÇIKIŞ', (s) => { s.write(0x86, s.w); }],
      ['BCF STATUS,RP0', 'Bank 0 seçilir', (s) => { s.rp0 = 0; }],
      ['MOVLW 0AAH', 'W ← AAh', (s) => { s.w = 0xaa; }],
      ['MOVWF PORTB', 'PORTB ← W (AAh = 1010 1010)', (s) => { s.write(0x06, s.w); }]
    ],
    add: [
      ['BCF STATUS,RP0', '', (s) => { s.rp0 = 0; }],
      ['BCF STATUS,RP1', 'BANK 0 SEÇİLİR', (s) => { s.rp1 = 0; }],
      ['CLRF PORTB', '', (s) => { s.write(0x06, 0); }],
      ['BSF STATUS,RP0', 'BANK 1 SEÇİLİR', (s) => { s.rp0 = 1; }],
      ['MOVLW 0X00', '', (s) => { s.w = 0; }],
      ['MOVWF TRISB', 'B PORTU ÇIKIŞ YAPILIR', (s) => { s.write(0x86, s.w); }],
      ['BCF STATUS,RP0', 'BANK 0 SEÇİLİR', (s) => { s.rp0 = 0; }],
      ['MOVLW 0X34', '', (s) => { s.w = 0x34; }],
      ['ADDLW 0X6', 'Toplama işlemi yapılır', (s) => { s.w = (s.w + 6) & 255; }],
      ['MOVWF PORTB', 'Sonuç B portuna gönderilir', (s) => { s.write(0x06, s.w); }]
    ]
  };
  MC.dg.add('asmstep', {
    title: 'Assembly adım adım: bank seçimi, TRISB ve PORTB',
    html: (p) => `<div class="dg-ctl"><label><input type="checkbox" data-o="bug"> Hata dene: <code>BSF STATUS,RP0</code> satırını unut</label></div>
      <div class="run"><pre class="run-code" data-o="code"></pre>
      <div class="run-side"><div class="run-panel"><small>Durum</small><div class="run-regs" data-o="regs"></div></div>
      <div class="run-panel"><small>PORTB çıkışları (LED)</small>${MC.ledRow('RB')}</div></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el, p) {
      const prog = ASM[p.prog || 'aa'];
      let host = null;
      const build = () => {
        const bug = el.querySelector('[data-o="bug"]').checked;
        const lines = prog.filter((l, i) => !(bug && i === 3));
        el.querySelector('[data-o="code"]').innerHTML = ['#include &lt;p16F877A.inc&gt;', ...lines.map(([c, n]) => `    ${c.padEnd(16)}${n ? '; ' + esc(n) : ''}`), 'END'].map((l) => `<span class="ln">${l}</span>`).join('');
        const st = { rp0: 0, rp1: 0, w: null, ram: { 0x06: null, 0x86: 0xff }, wrote: '' };
        st.write = (a, v) => {
          // Komut yalnızca 7 bit ofset taşır; gerçek adres = RP1:RP0 + ofset
          const real = ((st.rp1 << 1 | st.rp0) << 7) | (a & 0x7f);
          st.ram[real] = v;
          st.wrote = real === a ? '' : `⚠ ${MC.hexH(a)} yazılmak istendi ama bank ${st.rp1 << 1 | st.rp0} seçili olduğu için ${MC.hexH(real)} (${real === 0x06 ? 'PORTB' : real === 0x86 ? 'TRISB' : '?'}) adresine yazıldı!`;
        };
        const steps = [{ line: 0, snap: { rp0: 0, rp1: 0, w: null, portb: null, trisb: 0xff }, text: 'Reset sonrası: TRISB = FFh (tüm pinler giriş), RP1:RP0 = 00 (Bank 0). İleri ile her satırı çalıştır.' }];
        lines.forEach(([c, n, f], i) => {
          st.wrote = '';
          f(st);
          steps.push({ line: i + 1, snap: { rp0: st.rp0, rp1: st.rp1, w: st.w, portb: st.ram[0x06], trisb: st.ram[0x86] }, text: `<code>${c}</code>${n ? ' → ' + esc(n) : ''}. ${st.wrote}` });
        });
        const last = steps[steps.length - 1].snap;
        steps.push({ line: lines.length + 1, snap: last, text: last.trisb === 0 ? `Program bitti: TRISB=00h olduğu için pinler çıkış, PORTB=${MC.hex(last.portb)} LED'lerde görünüyor.` : '<b>Program bitti ama LED yanmıyor!</b> TRISB hâlâ FFh (giriş): Bank 1 seçilmeden yazılan değer PORTB\'ye gitti. Bank seçimi bu yüzden önemli; C derleyicisi bunu otomatik yapar.' });
        if (host) host.remove();
        el.querySelectorAll('.dg-steps').forEach((x) => x.remove());
        MC.stepper(el, steps, (s) => {
          el.querySelectorAll('.run-code .ln').forEach((l, i) => l.classList.toggle('cur', i === s.line));
          const v = s.snap;
          const fmt = (x) => (x == null ? 'xx' : MC.hex(x));
          el.querySelector('[data-o="regs"]').innerHTML = `<span>RP1:RP0 = <b>${v.rp1}${v.rp0}</b> (Bank ${v.rp1 << 1 | v.rp0})</span><span>W = <b>${fmt(v.w)}</b></span><span>TRISB = <b>${fmt(v.trisb)}</b></span><span>PORTB = <b>${fmt(v.portb)}</b></span>`;
          MC.setLeds(el, v.trisb === 0 && v.portb != null ? v.portb : 0);
          el.querySelector('[data-o="i"]').innerHTML = s.text;
        });
      };
      el.querySelector('[data-o="bug"]').addEventListener('change', build);
      build();
    }
  });

  /* ------------------------------------------------------------ addr: doğrudan ve dolaylı adresleme */
  MC.dg.add('addr', {
    title: 'Adresleme modları: sabit, doğrudan, dolaylı (FSR / INDF)',
    html: () => `<div class="run"><pre class="run-code" data-o="code"></pre><div class="run-side">
        <div class="run-panel"><small>Kaydediciler</small><div class="run-regs" data-o="regs"></div></div>
        <div class="run-panel"><small>RAM 20h–27h</small><div class="mem" data-o="mem"></div></div></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      const code = [
        ['MOVLW 0x55', 'immediate'], ['MOVWF 0x22', 'direct'], ['MOVLW 0x24', 'immediate'], ['MOVWF FSR', 'register'],
        ['MOVLW 0x99', 'immediate'], ['MOVWF INDF', 'indirect'], ['INCF FSR,F', 'register'], ['MOVWF INDF', 'indirect']
      ];
      el.querySelector('[data-o="code"]').innerHTML = code.map(([c, m]) => `<span class="ln">${c.padEnd(14)}; ${m}</span>`).join('');
      const ram = { 32: 0, 33: 0, 34: 0, 35: 0, 36: 0, 37: 0, 38: 0, 39: 0 };
      let w = null;
      let fsr = null;
      const steps = [{ line: -1, text: 'Komutlar işlenecek veriyi farklı yollarla gösterir. İleri ile her satırı çalıştır.' }];
      const snap = (line, text, ptr) => steps.push({ line, w, fsr, ram: { ...ram }, ptr, text });
      w = 0x55; snap(0, '<b>Sabit (immediate/literal):</b> İşlenecek değer komutun içinde: W ← 55h.');
      ram[0x22] = w; snap(1, '<b>Doğrudan (direct):</b> Komut RAM adresini doğrudan içerir: 22h adresine W yazıldı.', 0x22);
      w = 0x24; snap(2, 'W ← 24h. Bu sefer bu değeri bir <b>adres</b> olarak kullanacağız.');
      fsr = 0x24; snap(3, '<b>Kaydedici (register):</b> FSR ← W. FSR artık 24h adresini <b>gösteren bir işaretçi</b>.', 0x24);
      w = 0x99; snap(4, 'W ← 99h.', 0x24);
      ram[fsr] = w; snap(5, '<b>Dolaylı (indirect):</b> INDF fiziksel bir hücre değil; INDF\'ye yazmak "FSR\'nin gösterdiği adrese yaz" demek: 24h ← 99h.', fsr);
      fsr += 1; snap(6, 'FSR bir artırıldı → 25h. İşaretçi bir sonraki hücreyi gösteriyor. Dizi/tablo işlemlerinde döngüyle tüm hücreler gezilir.', fsr);
      ram[fsr] = w; snap(7, 'Aynı komut (MOVWF INDF) bu sefer 25h\'ye yazdı. C\'deki <b>pointer</b> mantığı budur.', fsr);
      MC.stepper(el, steps, (s) => {
        el.querySelectorAll('.run-code .ln').forEach((l, i) => l.classList.toggle('cur', i === s.line));
        const r = s.ram || ram;
        el.querySelector('[data-o="regs"]').innerHTML = `<span>W = <b>${s.w == null ? 'xx' : MC.hex(s.w)}</b></span><span>FSR = <b>${s.fsr == null ? 'xx' : MC.hex(s.fsr)}</b></span>`;
        el.querySelector('[data-o="mem"]').innerHTML = Object.keys(r).map((a) => `<div class="mem-c${+a === s.ptr ? ' v0 chg' : ''}"><small>${MC.hexH(+a)}</small><b>${MC.hex(s.line < 0 ? 0 : r[a])}</b>${+a === s.fsr ? '<i>← FSR</i>' : '<i>&nbsp;</i>'}</div>`).join('');
        el.querySelector('[data-o="i"]').innerHTML = s.text;
      });
    }
  });
})(window.MC);
