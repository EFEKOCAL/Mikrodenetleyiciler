/*
 * diagrams-io.js — port yapıları ve C programlama şekilleri:
 * trisport, outstage, schmitt, pull, bounce, run (LED simülatörü), mem, bitops, numconv, float.
 */
(function (MC) {
  'use strict';

  const esc = MC.esc;
  const $o = (el, k) => el.querySelector(`[data-o="${k}"]`);

  /* ------------------------------------------------------------ trisport: TRIS + PORT + dış dünya */
  MC.dg.add('trisport', {
    title: 'TRISB ve PORTB birlikte: yön, çıkış ve okuma',
    html: () => `<div class="table-wrap"><table class="calc-t" style="text-align:center"><thead><tr><th></th>${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<th style="text-align:center">RB${b}</th>`).join('')}</tr></thead><tbody>
      <tr><th>TRISB (yön)</th>${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<td><button class="sw" type="button" data-t="${b}"></button></td>`).join('')}</tr>
      <tr><th>PORTB'ye yaz</th>${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<td><button class="sw" type="button" data-w="${b}"></button></td>`).join('')}</tr>
      <tr><th>Dışarıdan (buton)</th>${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<td><button class="sw" type="button" data-x="${b}"></button></td>`).join('')}</tr>
      <tr><th>Pin / LED</th>${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<td><span class="led" data-bit="${b}" style="display:inline-block"></span></td>`).join('')}</tr>
      </tbody></table></div>
      <div class="dg-stats" style="margin-top:8px"><div class="dg-b"><small>TRISB</small><b data-o="t"></b></div><div class="dg-b"><small>PORTB'ye yazılan (latch)</small><b data-o="w"></b></div><div class="dg-b"><small>PORTB okunursa</small><b data-o="r"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el, p) {
      let tris = p.tris == null ? 0xf0 : p.tris;
      let lat = p.port == null ? 0x0f : p.port;
      let ext = 0;
      const draw = (msg) => {
        el.querySelectorAll('[data-t]').forEach((b) => { const v = (tris >> b.dataset.t) & 1; b.textContent = v ? '1 · G' : '0 · Ç'; b.classList.toggle('on', !!v); b.title = v ? 'Giriş (Input)' : 'Çıkış (Output)'; });
        el.querySelectorAll('[data-w]').forEach((b) => { const v = (lat >> b.dataset.w) & 1; b.textContent = v; b.classList.toggle('on', !!v); b.style.opacity = (tris >> b.dataset.w) & 1 ? 0.45 : 1; });
        el.querySelectorAll('[data-x]').forEach((b) => { const bit = +b.dataset.x; const isIn = (tris >> bit) & 1; b.textContent = isIn ? ((ext >> bit) & 1 ? '5V' : '0V') : '—'; b.disabled = !isIn; b.classList.toggle('on', isIn && !!((ext >> bit) & 1)); });
        const pin = (lat & ~tris) | (ext & tris);
        el.querySelectorAll('.led[data-bit]').forEach((l) => { const bit = +l.dataset.bit; l.classList.toggle('on', !((tris >> bit) & 1) && !!((lat >> bit) & 1)); l.style.opacity = (tris >> bit) & 1 ? 0.25 : 1; });
        $o(el, 't').textContent = `${MC.hex(tris)} = ${MC.bin(tris)}`;
        $o(el, 'w').textContent = `${MC.hex(lat)} = ${MC.bin(lat)}`;
        $o(el, 'r').textContent = `${MC.hex(pin & 255)} = ${MC.bin(pin)}`;
        $o(el, 'i').innerHTML = msg || 'TRIS biti <b>0 → çıkış</b> (0 = <b>O</b>utput), <b>1 → giriş</b> (1 = <b>I</b>nput). Giriş pinine PORT ile yazmayı dene: LED değişmez, çünkü o pin dışarıdan gelen gerilimi okur.';
      };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.t) { tris ^= 1 << b.dataset.t; draw(); }
        if (b.dataset.w) {
          const bit = +b.dataset.w;
          lat ^= 1 << bit;
          draw((tris >> bit) & 1 ? `RB${bit} giriş olarak ayarlı: PORTB'ye yazılan değer pin çıkışını <b>etkilemez</b> (sadece çıkış tutucusuna/latch yazılır). Pin hâlâ dışarıdan gelen gerilimi okur.` : `RB${bit} çıkış: yazılan ${(lat >> bit) & 1} pine ${(lat >> bit) & 1 ? '5 V' : '0 V'} olarak çıktı.`);
        }
        if (b.dataset.x) { ext ^= 1 << b.dataset.x; draw(`RB${b.dataset.x} giriş: pindeki gerilim değişti, PORTB okunduğunda bu bit ${(ext >> b.dataset.x) & 1} gelir.`); }
      });
      draw();
    }
  });

  /* ------------------------------------------------------------ outstage: totem pole / açık drain */
  MC.dg.add('outstage', {
    title: 'Çıkış katı: totem pole ve açık drain (open drain)',
    html: () => `<div class="dg-ctl"><span>Yazılımın pine yazdığı değer:</span><button class="btn btn-sm" data-v="0" type="button">0</button><button class="btn btn-sm on" data-v="1" type="button">1</button>
      <label><input type="checkbox" data-o="pu"> Açık drain çıkışa harici pull-up direnci bağla</label></div>
      <div class="l-compare" data-o="cols"></div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      let v = 1;
      const part = (t, s, cls) => `<div class="dg-b" style="text-align:center;${cls || ''}"><small>${t}</small><b style="font-size:13px">${s}</b></div>`;
      const draw = () => {
        const pu = $o(el, 'pu').checked;
        el.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('on', +b.dataset.v === v));
        const on = 'border-color:var(--ok);color:var(--ok)';
        const tp = [part('VDD (+5 V)', '━━━━'), part('Üst transistör', v ? 'İLETİMDE (kapalı anahtar)' : 'kesimde (açık anahtar)', v ? on : ''), part('PİN', v ? '5 V → lojik 1' : '0 V → lojik 0', 'border-color:var(--accent)'), part('Alt transistör', v ? 'kesimde' : 'İLETİMDE', v ? '' : on), part('GND (0 V)', '━━━━')];
        const odTop = pu ? part('Harici pull-up direnci', 'pini VDD\'ye çeker', 'border-style:dashed') : part('Üst transistör', 'YOK', 'opacity:.5');
        const odPin = v ? (pu ? '5 V (dirençten) → lojik 1' : 'YÜZER (Z): belirsiz!') : '0 V → lojik 0';
        const od = [part('VDD (+5 V)', pu ? '━━━━' : '(bağlı değil)'), odTop, part('PİN', odPin, `border-color:${v && !pu ? 'var(--danger)' : 'var(--accent)'}`), part('Alt transistör', v ? 'kesimde' : 'İLETİMDE', v ? '' : on), part('GND (0 V)', '━━━━')];
        $o(el, 'cols').innerHTML = `<div class="l-cmp"><b>Totem pole (push-pull)</b><div class="dg-stack">${tp.join('')}</div></div><div class="l-cmp"><b>Açık kollektör / açık drain</b><div class="dg-stack">${od.join('')}</div></div>`;
        $o(el, 'i').innerHTML = v && !pu
          ? 'Açık drain çıkış 1 yazılınca pini hiçbir yere bağlamaz: pin <b>yüzer</b>. Yüke enerji vermek için <b>harici besleme / pull-up direnci gerekir</b>. Totem pole ise 1\'de pini kendi üst transistörüyle VDD\'ye bağlar: harici beslemeye gerek yok.'
          : 'Totem pole iki transistörle hem 5 V verebilir (source) hem 0 V\'a çekebilir (sink). Açık drain yalnızca 0 V\'a çekebilir. (Ek) PIC16F877A\'da <b>RA4/T0CKI</b> pini açık drain çıkıştır; diğer pinler totem pole.';
      };
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { v = +b.dataset.v; draw(); } });
      el.addEventListener('change', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ schmitt: gürültülü girişte tek eşik ve histerezis */
  MC.dg.add('schmitt', {
    title: 'Schmitt tetikleyici: gürültülü girişte temiz çıkış',
    html: () => `<div class="dg-ctl"><label>Gürültü genliği <input type="range" min="0" max="80" value="45" data-o="n"></label><span class="hint">Tek eşik 2,5 V · Schmitt eşikleri V<sub>T+</sub> = 3 V, V<sub>T−</sub> = 2 V</span></div><div data-o="svg"></div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      const draw = () => {
        const amp = +$o(el, 'n').value / 100;
        const N = 400;
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
        const vin = [];
        for (let i = 0; i < N; i++) { const t = i / N; const base = t < 0.5 ? t * 2 * 5 : (1 - t) * 2 * 5; vin.push(Math.min(5, Math.max(0, base + rnd() * amp * 2.4))); }
        const cmp = vin.map((v) => (v > 2.5 ? 1 : 0));
        const sch = [];
        let st = 0;
        vin.forEach((v) => { if (!st && v > 3) st = 1; else if (st && v < 2) st = 0; sch.push(st); });
        const edges = (a) => a.reduce((s, v, i) => s + (i && v !== a[i - 1] ? 1 : 0), 0);
        const W = 600;
        const x = (i) => 40 + (i / (N - 1)) * (W - 50);
        const path = (arr, y0, h, max) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${(y0 + h - (v / max) * h).toFixed(1)}`).join('');
        const yv = (v) => 10 + 100 - (v / 5) * 100;
        $o(el, 'svg').innerHTML = `<svg viewBox="0 0 ${W} 300">
          <text x="4" y="20" fill="#8a9cab" font-size="11">Giriş</text>
          <line x1="40" x2="${W - 10}" y1="${yv(2.5)}" y2="${yv(2.5)}" stroke="#a78bfa" stroke-dasharray="4 4"/>
          <line x1="40" x2="${W - 10}" y1="${yv(3)}" y2="${yv(3)}" stroke="#fbbf24" stroke-dasharray="2 4"/>
          <line x1="40" x2="${W - 10}" y1="${yv(2)}" y2="${yv(2)}" stroke="#fbbf24" stroke-dasharray="2 4"/>
          <path d="${path(vin, 10, 100, 5)}" fill="none" stroke="#2dd4bf" stroke-width="1.5"/>
          <text x="4" y="155" fill="#a78bfa" font-size="11">Tek eşik</text>
          <path d="${path(cmp, 140, 50, 1)}" fill="none" stroke="#a78bfa" stroke-width="2"/>
          <text x="4" y="245" fill="#fbbf24" font-size="11">Schmitt</text>
          <path d="${path(sch, 230, 50, 1)}" fill="none" stroke="#fbbf24" stroke-width="2"/>
        </svg>`;
        $o(el, 'i').innerHTML = `Tek eşikli girişte çıkış <b class="dg-bad">${edges(cmp)}</b> kez değişti (gürültü eşiğin etrafında gidip geldikçe sahte darbeler). Schmitt tetikleyicide <b class="dg-ok">${edges(sch)}</b> kez: yükselirken 3 V'u, düşerken 2 V'u geçmesi gerekir. Aradaki fark (<b>histerezis</b>) gürültüyü yutar.`;
      };
      $o(el, 'n').addEventListener('input', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ pull: pull-up / pull-down */
  MC.dg.add('pull', {
    title: 'Buton bağlantısı: pull-up ve pull-down',
    html: () => `<div class="dg-ctl"><button class="btn btn-sm" data-m="none" type="button">Direnç yok</button><button class="btn btn-sm" data-m="up" type="button">Pull-up</button><button class="btn btn-sm on" data-m="down" type="button">Pull-down</button>
      <button class="push" type="button" data-o="btn">BUTON</button></div>
      <div class="dg-stats"><div class="dg-b"><small>Bağlantı</small><b data-o="c" style="font-size:12.5px"></b></div><div class="dg-b"><small>Pin gerilimi</small><b data-o="v"></b></div><div class="dg-b"><small>PORT biti okunur</small><b data-o="l"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      let m = 'down';
      let pr = false;
      const draw = () => {
        el.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
        $o(el, 'btn').classList.toggle('on', pr);
        $o(el, 'btn').textContent = pr ? 'BASILI' : 'BUTON (bas)';
        const C = { none: 'Buton: VDD ↔ pin, başka bağlantı yok', up: 'Direnç: VDD ↔ pin · Buton: pin ↔ GND', down: 'Buton: VDD ↔ pin · Direnç: pin ↔ GND' };
        let v;
        let l;
        if (m === 'none') { v = pr ? '5 V' : 'yüzer (?)'; l = pr ? '1' : '0 ya da 1 (belirsiz!)'; }
        if (m === 'up') { v = pr ? '0 V' : '5 V'; l = pr ? '0' : '1'; }
        if (m === 'down') { v = pr ? '5 V' : '0 V'; l = pr ? '1' : '0'; }
        $o(el, 'c').textContent = C[m];
        $o(el, 'v').textContent = v;
        $o(el, 'l').textContent = l;
        $o(el, 'i').innerHTML = {
          none: 'Buton açıkken pin hiçbir yere bağlı değil: <b>yüzer</b>, gürültüden rastgele 0/1 okunur. Bu yüzden direnç şart.',
          up: '<b>Pull-up:</b> Direnç pini normalde 1\'e çeker; butona basınca pin GND\'ye bağlanır → <b>basınca 0</b> okunur (aktif düşük). (Ek) PORTB\'de dahili pull-up var: OPTION_REG.RBPU = 0 ile açılır.',
          down: '<b>Pull-down:</b> Direnç pini normalde 0\'a çeker; butona basınca pin 5 V\'a bağlanır → <b>basınca 1</b> okunur (aktif yüksek). Laboratuvar kitinde (EasyPIC v7) buton jumper\'ı PULL-DOWN seçilince <code>if(PORTD.F0==1)</code> basılı demektir.'
        }[m];
      };
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) { m = b.dataset.m; draw(); } if (e.target.closest('[data-o="btn"]')) { pr = !pr; draw(); } });
      draw();
    }
  });

  /* ------------------------------------------------------------ bounce: buton sıçraması ve yazılımsal debounce */
  MC.dg.add('bounce', {
    title: 'Buton sıçraması (bounce) ve yazılımla önleme',
    html: () => `<div class="dg-ctl"><label>Algıladıktan sonraki gecikme: <b data-o="dv"></b> <input type="range" min="0" max="20" value="0" data-o="d"></label></div><div data-o="svg"></div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      // Basma (0–4,8 ms) ve bırakma (30–33,1 ms) anlarındaki sıçrama geçişleri
      const tr = [0, 0.4, 0.9, 1.6, 2.1, 3.0, 3.6, 4.8, 30, 30.5, 31.3, 32.0, 33.1];
      const level = (t) => { let v = 0; tr.forEach((x) => { if (t >= x) v = 1 - v; }); return v; };
      const draw = () => {
        const d = +$o(el, 'd').value;
        $o(el, 'dv').textContent = `${d} ms`;
        let st = 'idle';
        let until = -1;
        const hits = [];
        for (let t = 0; t <= 45; t += 0.05) {
          if (t < until) continue;
          const v = level(t);
          if (st === 'idle' && v === 1) { hits.push(t); st = 'held'; until = t + d; } else if (st === 'held' && v === 0) { st = 'idle'; until = t + d; }
        }
        const W = 600;
        const x = (t) => 20 + (t / 45) * (W - 30);
        let dpath = `M${x(0)},90`;
        let lv = 0;
        tr.forEach((t) => { dpath += `L${x(t)},${lv ? 30 : 90}L${x(t)},${lv ? 90 : 30}`; lv = 1 - lv; });
        dpath += `L${x(45)},90`;
        $o(el, 'svg').innerHTML = `<svg viewBox="0 0 ${W} 130"><path d="${dpath}" fill="none" stroke="#2dd4bf" stroke-width="2"/>
          ${hits.map((t) => `<rect x="${x(t)}" y="22" width="${Math.max(2, x(t + d) - x(t))}" height="76" fill="rgba(251,191,36,.18)" stroke="#fbbf24"/><circle cx="${x(t)}" cy="18" r="5" fill="#fbbf24"/>`).join('')}
          <text x="${x(0)}" y="122" fill="#8a9cab" font-size="11">0 ms: basıldı</text><text x="${x(30)}" y="122" fill="#8a9cab" font-size="11">30 ms: bırakıldı</text></svg>`;
        $o(el, 'i').innerHTML = `Tek bir basışta program <b class="${hits.length === 1 ? 'dg-ok' : 'dg-bad'}">${hits.length}</b> basış saydı (sarı noktalar). ${hits.length === 1 ? 'Gecikme sıçrama süresini (~5 ms) aştığı için sahte geçişler görmezden gelindi.' : 'Mekanik kontak birkaç ms boyunca açılıp kapanıyor; her yükselen kenar yeni basış sanılıyor.'} Slayt: <b>çoğu devrede 10 ms gecikme yeterli</b>; hassas devrelerde süre lojik analizör veya osiloskopla ölçülür.`;
      };
      $o(el, 'd').addEventListener('input', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ run: hocanın uygulamaları için LED simülatörü */
  const SPEEDS = [['slow', 'Satır satır (yavaş)', 380, 1], ['1', 'Gerçek zaman', 0, 1], ['4', '4× hızlı', 0, 4]];
  const portOf = (pin) => ({ port: pin[1], bit: +pin[2] });

  MC.dg.add('run', {
    title: 'Simülatör: kodu satır satır çalıştır',
    html(p) {
      const list = p.apps || [p.app];
      return `${list.length > 1 ? `<div class="tabs" data-o="tabs" style="margin-bottom:10px">${list.map((id) => `<button class="tab" type="button" data-app="${id}">${esc(MC.apps[id].title.split(' · ')[0])}</button>`).join('')}</div>` : ''}
        <div class="dg-ctl"><b data-o="title"></b><span class="hint" data-o="src"></span></div>
        <div class="run"><pre class="run-code" data-o="code"></pre>
        <div class="run-side">
          <div class="run-panel" data-o="leds"></div>
          <div class="run-panel" data-o="ins" hidden><small>Girişler (tıkla: bas / bırak)</small><div class="dg-row" data-o="insb"></div></div>
          <div class="run-panel"><small>Kaydediciler</small><div class="run-regs" data-o="regs"></div></div>
          <div class="run-ctl">
            <button class="btn btn-sm btn-primary" type="button" data-c="play">▶ Çalıştır</button>
            <button class="btn btn-sm" type="button" data-c="step">Adım</button>
            <button class="btn btn-sm btn-ghost" type="button" data-c="reset">Sıfırla</button>
            <select data-o="speed">${SPEEDS.map(([k, t]) => `<option value="${k}"${k === '1' ? ' selected' : ''}>${t}</option>`).join('')}</select>
          </div>
          <label class="hint" data-o="ncw" hidden><input type="checkbox" data-o="nc"> Föy adım 9: <code>INTCON.INTF=0;</code> satırını sil</label>
        </div></div>
        <div class="dg-info run-msg" data-o="msg"></div>`;
    },
    init(el, p) {
      let app;
      let io;
      let gen;
      let isrGen;
      let inIsr;
      let lastMain;
      let playing = false;
      let timer = null;
      let simMs = 0;
      let line = 0;

      const readPin = (pin) => { const { port, bit } = portOf(pin); return (io['TRIS' + port] >> bit) & 1 ? io.inputs[pin] || 0 : (io['PORT' + port] >> bit) & 1; };
      const codeLines = () => app.code.split('\n').map((l, i) => (app.isr && io && io.noClear && i === 3 ? ' // INTCON.INTF=0;   ← föy adım 9: bu satır silindi' : l));

      const load = (id) => {
        stop();
        app = MC.apps[id];
        el.querySelectorAll('[data-app]').forEach((b) => b.classList.toggle('active', b.dataset.app === id));
        $o(el, 'title').textContent = app.title;
        $o(el, 'src').textContent = app.src || '';
        $o(el, 'ncw').hidden = !app.isr;
        reset();
      };
      const reset = () => {
        stop();
        io = { TRISA: 0xff, TRISB: 0xff, TRISC: 0xff, TRISD: 0xff, PORTA: 0, PORTB: 0, PORTC: 0, PORTD: 0, inputs: {}, noClear: $o(el, 'nc').checked };
        io.in = readPin;
        gen = app.run(io);
        isrGen = null;
        inIsr = false;
        lastMain = 0;
        simMs = 0;
        line = 0;
        $o(el, 'code').innerHTML = codeLines().map((l) => `<span class="ln">${esc(l) || ' '}</span>`).join('');
        $o(el, 'leds').innerHTML = (app.ports || ['B']).map((pt) => `<small>PORT${pt}</small>${MC.ledRow('R' + pt)}`).join('<div style="height:8px"></div>');
        $o(el, 'ins').hidden = !(app.inputs && app.inputs.length);
        $o(el, 'insb').innerHTML = (app.inputs || []).map((pin) => `<button class="push" type="button" data-pin="${pin}">${pin}: bırakıldı</button>`).join('');
        draw('▶ Çalıştır ile programı başlat ya da <b>Adım</b> ile hata ayıklayıcıdaki gibi satır satır ilerle.');
      };
      const draw = (msg) => {
        el.querySelectorAll('.run-code .ln').forEach((l, i) => l.classList.toggle('cur', i === line - 1));
        const cur = el.querySelector('.run-code .ln.cur');
        if (cur) { const box = $o(el, 'code'); if (cur.offsetTop < box.scrollTop || cur.offsetTop > box.scrollTop + box.clientHeight - 30) box.scrollTop = cur.offsetTop - 60; }
        (app.ports || ['B']).forEach((pt) => {
          el.querySelectorAll(`.led[data-bit]`).forEach(() => {});
          const rowLeds = [...el.querySelectorAll('[data-o="leds"] .leds')][(app.ports || ['B']).indexOf(pt)];
          rowLeds.querySelectorAll('.led-cell').forEach((c) => {
            const bit = +c.querySelector('.led').dataset.bit;
            const isIn = (io['TRIS' + pt] >> bit) & 1;
            c.querySelector('.led').classList.toggle('on', !isIn && !!((io['PORT' + pt] >> bit) & 1));
            c.querySelector('.led').style.opacity = isIn ? 0.3 : 1;
            c.querySelector('small').innerHTML = `R${pt}${bit}${isIn ? '<span class="pin-in"> G</span>' : ''}`;
          });
        });
        const regs = (app.ports || ['B']).map((pt) => `<span>TRIS${pt} = <b>${MC.hex(io['TRIS' + pt])}</b></span><span>PORT${pt} = <b>${MC.hex(io['PORT' + pt])}</b> <span class="muted">${MC.bin(io['PORT' + pt])}</span></span>`);
        if (app.vars) regs.push(`<span>${app.vars(io)}</span>`);
        if (app.regs) regs.push(`<span>${app.regs(io)}</span>`);
        regs.push(`<span>Süre: <b>${(simMs / 1000).toFixed(1)} s</b></span>`);
        if (inIsr) regs.push('<span class="dg-warn">Yığın: [dönüş adresi → while döngüsü]</span>');
        $o(el, 'regs').innerHTML = regs.join('');
        if (msg != null) $o(el, 'msg').innerHTML = msg;
      };
      const stepOnce = () => {
        if (app.isr && !inIsr && app.irq(io)) {
          inIsr = true;
          io.GIE = 0;
          isrGen = app.isr(io);
          line = 1;
          return { ms: 0, msg: '<b>KESME!</b> GIE=1, INTE=1, INTF=1. Donanım: o anki komut biter, dönüş adresi (PC) <b>yığına</b> yazılır, GIE otomatik 0 olur, PC ← <b>0004h</b> (kesme vektörü) → kesme alt programı.' };
        }
        const r = (inIsr ? isrGen : gen).next();
        if (r.done) {
          if (inIsr) {
            inIsr = false;
            io.GIE = 1;
            line = lastMain;
            return { ms: 0, msg: `<b>RETFIE:</b> dönüş adresi yığından PC'ye geri yüklendi, GIE tekrar 1. Ana program kaldığı yerden devam ediyor.${io.INTF ? ' <span class="dg-bad">Ama INTF hâlâ 1! Kesme koşulu sürüyor → hemen tekrar kesmeye girilecek.</span>' : ''}` };
          }
          playing = false;
          return { ms: 0, msg: 'Program bitti.' };
        }
        const v = r.value;
        line = Array.isArray(v) ? v[0] : v;
        if (!inIsr) lastMain = line;
        const ms = Array.isArray(v) ? v[1] : 0;
        simMs += ms;
        const ex = app.ex && app.ex[line];
        return { ms, msg: ms ? `<b>Delay_ms(${ms})</b>: CPU ${ms} ms boyunca bekleme döngüsünde. ${ex || ''}` : ex || `${line}. satır çalıştı.` };
      };
      const sp = () => SPEEDS.find((s) => s[0] === $o(el, 'speed').value);
      const tick = () => {
        if (!playing) return;
        const [, , lineMs, k] = sp();
        let budget = lineMs ? 1 : 80;
        while (budget-- > 0) {
          const s = stepOnce();
          draw(s.msg);
          if (!playing) { setPlayBtn(); return; }
          if (s.ms) { timer = setTimeout(tick, s.ms / k + lineMs); return; }
          if (lineMs) { timer = setTimeout(tick, lineMs); return; }
        }
        timer = setTimeout(tick, 30);
      };
      const setPlayBtn = () => { el.querySelector('[data-c="play"]').textContent = playing ? '⏸ Durdur' : '▶ Çalıştır'; };
      function stop() { playing = false; clearTimeout(timer); if (app) setPlayBtn(); }

      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-app]');
        if (a) { load(a.dataset.app); return; }
        const c = e.target.closest('[data-c]');
        if (c) {
          if (c.dataset.c === 'play') { playing = !playing; setPlayBtn(); if (playing) tick(); else clearTimeout(timer); }
          if (c.dataset.c === 'step') { stop(); const s = stepOnce(); draw(s.msg); }
          if (c.dataset.c === 'reset') reset();
          return;
        }
        const pin = e.target.closest('[data-pin]');
        if (pin) {
          const name = pin.dataset.pin;
          const v = io.inputs[name] ? 0 : 1;
          io.inputs[name] = v;
          pin.classList.toggle('on', !!v);
          pin.textContent = `${name}: ${v ? 'BASILI (1)' : 'bırakıldı'}`;
          if (app.edge) app.edge(io, name, v);
          draw();
        }
      });
      $o(el, 'nc').addEventListener('change', () => { if (app.isr) reset(); });
      // Kart görünümden çıkınca simülasyonu durdur (arka planda boşuna çalışmasın)
      if ('IntersectionObserver' in window) new IntersectionObserver((en) => { if (!en[0].isIntersecting) stop(); }).observe(el);
      load((p.apps || [p.app])[0]);
    }
  });

  /* ------------------------------------------------------------ mem: değişkenlerin RAM'deki baytları */
  const TYPES = { char: [1, false, 'char (unsigned)'], short: [1, true, 'signed short'], ushort: [1, false, 'unsigned short'], int: [2, true, 'int (signed)'], uint: [2, false, 'unsigned int'], long: [4, true, 'long (signed)'], float: [4, null, 'float'] };
  const RANGE = { char: [0, 255], short: [-128, 127], ushort: [0, 255], int: [-32768, 32767], uint: [0, 65535], long: [-2147483648, 2147483647] };
  function enc(type, val) {
    const [n] = TYPES[type];
    if (type === 'float') { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, val, true); return [0, 1, 2, 3].map((i) => dv.getUint8(i)); }
    const mod = 2 ** (8 * n);
    let u = ((Math.trunc(val) % mod) + mod) % mod;
    const out = [];
    for (let i = 0; i < n; i++) { out.push(u % 256); u = Math.floor(u / 256); }
    return out;
  }
  function dec(type, bytes) {
    const [n, signed] = TYPES[type];
    if (type === 'float') { const dv = new DataView(new ArrayBuffer(4)); bytes.forEach((b, i) => dv.setUint8(i, b)); return +dv.getFloat32(0, true).toPrecision(7); }
    let u = 0;
    for (let i = n - 1; i >= 0; i--) u = u * 256 + bytes[i];
    return signed && u >= 2 ** (8 * n - 1) ? u - 2 ** (8 * n) : u;
  }
  MC.memEnc = enc;
  MC.memDec = dec;
  MC.dg.add('mem', {
    html: (p) => `<div class="dg-title">${MC.memPresets[p.preset].title}</div><div class="run"><pre class="run-code" data-o="code"></pre>
      <div class="run-side"><div class="run-panel"><small>RAM (16'lık tabanda, küçük adres solda)</small><div class="mem" data-o="mem"></div></div>
      <div class="run-panel"><small>Değişkenler (baytlardan geri okunan)</small><div class="vars" data-o="vars"></div></div></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el, p) {
      const P = MC.memPresets[p.preset];
      $o(el, 'code').innerHTML = P.code.map((l) => `<span class="ln">${esc(l) || ' '}</span>`).join('');
      const ram = {};
      for (let a = P.from; a <= P.to; a++) ram[a] = 0;
      const owner = {};
      P.vars.forEach(([n, t, a], vi) => { for (let i = 0; i < TYPES[t][0]; i++) (owner[a + i] = owner[a + i] || []).push(vi); });
      const read = (vi) => { const [, t, a] = P.vars[vi]; return dec(t, Array.from({ length: TYPES[t][0] }, (_, i) => ram[a + i] || 0)); };
      const steps = [{ line: -1, ram: { ...ram }, chg: [], text: `Değişken tanımları RAM'de yer ayırır. Renkler hangi baytın hangi değişkene ait olduğunu gösterir.${Object.values(owner).some((o) => o.length > 1) ? ' <b class="dg-bad">Kırmızı hücreler iki değişkene birden ait: çakışma!</b>' : ''} (Başlangıç değerleri 00 gösterildi; gerçekte RAM açılışta belirsizdir.)` }];
      P.steps.forEach(([ln, name, val]) => {
        const vi = P.vars.findIndex((v) => v[0] === name);
        const [, t, a] = P.vars[vi];
        const before = P.vars.map((_, i) => read(i));
        const bytes = enc(t, val);
        bytes.forEach((b, i) => { ram[a + i] = b; });
        const chg = bytes.map((_, i) => a + i);
        const notes = [];
        const shown = t === 'char' && P.preset === 'deney1' ? `'A' (ASCII ${val} = ${MC.hex(val)})` : val;
        notes.push(`<code>${esc(P.code[ln].trim())}</code> → ${TYPES[t][0]} bayt yazıldı: ${bytes.map((b) => MC.hex(b)).join(' ')} (adres ${MC.hexH(a)}'den başlayarak, <b>düşük bayt düşük adreste</b>).`);
        const r = RANGE[t];
        if (r && (val < r[0] || val > r[1])) notes.push(`<span class="dg-bad">${shown} bu tipe sığmaz (${TYPES[t][2]}: ${r[0]} … ${r[1]}).</span> Fazla bitler atılır; saklanan değer <b>${read(vi)}</b>.`);
        if (t === 'float') notes.push(`IEEE 754: ${val} = ${MC.hex(new DataView(new Uint8Array(bytes).buffer).getUint32(0, true), 8)}. (Not: mikroC kılavuzu Microchip AN575 formatını kullandığını söyler; AN575'te bayt düzeni farklıdır. Laboratuvarda RAM penceresinden kontrol et.)`);
        P.vars.forEach((v2, i) => { if (i !== vi && read(i) !== before[i]) notes.push(`<span class="dg-bad">⚠ ${v2[0]} değişkeninin değeri de değişti: ${before[i]} → ${read(i)}!</span> Çünkü ortak bayt(lar) var.`); });
        steps.push({ line: ln, ram: { ...ram }, chg, text: notes.join(' ') });
      });
      MC.stepper(el, steps, (s) => {
        el.querySelectorAll('.run-code .ln').forEach((l, i) => l.classList.toggle('cur', i === s.line));
        $o(el, 'mem').innerHTML = Object.keys(s.ram).map((a) => {
          const o = owner[a] || [];
          return `<div class="mem-c${o.length > 1 ? ' clash' : o.length ? ' v' + (o[0] % 5) : ''}${s.chg.includes(+a) ? ' chg' : ''}"><small>${MC.hex(+a)}</small><b>${MC.hexH(s.ram[a]).slice(0, 2)}</b><i>${o.map((i) => P.vars[i][0]).join('+') || '·'}</i></div>`;
        }).join('');
        Object.assign(ram, s.ram);
        $o(el, 'vars').innerHTML = P.vars.map(([n, t, a], i) => `<div><b>${n}</b><span class="muted">${TYPES[t][2]}, ${TYPES[t][0]} B @ ${MC.hex(a)}</span><span>= ${read(i)}</span></div>`).join('');
        $o(el, 'i').innerHTML = s.text;
      });
    }
  });

  /* ------------------------------------------------------------ bitops: bit düzeyinde operatörler */
  const BOPS = [['&', 'AND'], ['|', 'OR'], ['^', 'XOR'], ['~', 'NOT (~a)'], ['<<', 'sola kaydır'], ['>>', 'sağa kaydır']];
  MC.dg.add('bitops', {
    title: 'Bit düzeyinde operatörler (8 bit, unsigned char)',
    html: () => `<div class="dg-ctl">${BOPS.map(([o, t]) => `<button class="btn btn-sm" type="button" data-op="${o}">${esc(o)} <span class="muted">${t}</span></button>`).join('')}</div>
      <div class="reg" style="gap:6px"><small class="hint">a (bitlere tıkla)</small><div class="reg-bits" data-o="a"></div>
      <small class="hint" data-o="bl">b</small><div class="reg-bits" data-o="b"></div>
      <small class="hint">sonuç</small><div class="reg-bits" data-o="r"></div></div>
      <div class="reg-c" data-o="c" style="margin-top:8px"></div><div class="dg-info" data-o="i"></div>`,
    init(el, p) {
      let a = p.a == null ? 0x0f : p.a;
      let b = p.b == null ? 0xf0 : p.b;
      let op = p.op || '&';
      const bits = (v, k, ro) => [7, 6, 5, 4, 3, 2, 1, 0].map((i) => `<button type="button" class="reg-bit${(v >> i) & 1 ? ' one' : ''}${ro ? ' ro' : ''}" data-k="${k}" data-bit="${i}"><span class="rb-n">${i}</span><span class="rb-v">${(v >> i) & 1}</span></button>`).join('');
      const draw = () => {
        const sh = op === '<<' || op === '>>';
        const n = b & 7;
        const r = { '&': a & b, '|': a | b, '^': a ^ b, '~': ~a & 255, '<<': (a << n) & 255, '>>': a >> n }[op];
        $o(el, 'a').innerHTML = bits(a, 'a');
        $o(el, 'b').innerHTML = op === '~' ? '' : sh ? `<div class="dg-row" style="grid-column:1/-1"><button class="btn btn-sm" type="button" data-n="-1">−</button><b class="mono">kaydırma = ${n}</b><button class="btn btn-sm" type="button" data-n="1">+</button></div>` : bits(b, 'b');
        $o(el, 'bl').textContent = op === '~' ? '' : sh ? 'kaç bit?' : 'b';
        $o(el, 'r').innerHTML = bits(r, 'r', true);
        el.querySelectorAll('[data-op]').forEach((x) => x.classList.toggle('on', x.dataset.op === op));
        $o(el, 'c').textContent = op === '~' ? `~${MC.hex(a)} = ${MC.hex(r)}` : sh ? `${MC.hex(a)} ${op} ${n} = ${MC.hex(r)}` : `${MC.hex(a)} ${op} ${MC.hex(b)} = ${MC.hex(r)}`;
        $o(el, 'i').innerHTML = {
          '&': 'AND: iki bit de 1 ise 1. <b>Maskeleme</b> için: istenmeyen bitleri 0\'la. Ör. <code>x & 0x0F</code> alt 4 biti bırakır.',
          '|': 'OR: bitlerden biri 1 ise 1. <b>Bit set etme</b> için: <code>PORTB = PORTB | 0x08</code> RB3\'ü yakar, diğerlerine dokunmaz.',
          '^': 'XOR: bitler farklıysa 1. <b>Bit tersleme (toggle)</b> için: <code>x ^ 0xFF</code> tüm bitleri çevirir. Uygulama 7 bu operatörle çapraz deseni üretir.',
          '~': 'NOT: her biti tersler. <code>PORTB.F0 = ~PORTB.F0</code> bir pini sürekli değiştirerek kare dalga üretir (Timer uygulamaları).',
          '<<': `Sola kaydırma: bitler ${n} sola gider, sağdan 0 girer, soldan taşan bit kaybolur. 1 sola kaydırmak = 2 ile çarpmak (taşma yoksa).`,
          '>>': `Sağa kaydırma: bitler ${n} sağa gider, sağdan düşen bit kaybolur; unsigned sayıda soldan 0 girer. 1 sağa kaydırmak = 2'ye bölmek (tam sayı).`
        }[op];
      };
      el.addEventListener('click', (e) => {
        const o = e.target.closest('[data-op]');
        if (o) { op = o.dataset.op; if ((op === '<<' || op === '>>') && b > 7) b = 1; draw(); return; }
        const n = e.target.closest('[data-n]');
        if (n) { b = Math.min(7, Math.max(0, (b & 7) + +n.dataset.n)); draw(); return; }
        const bt = e.target.closest('.reg-bit');
        if (!bt || bt.classList.contains('ro')) return;
        if (bt.dataset.k === 'a') a ^= 1 << bt.dataset.bit; else b ^= 1 << bt.dataset.bit;
        draw();
      });
      draw();
    }
  });

  /* ------------------------------------------------------------ numconv: taban dönüşümü ve ikiye tümleyen */
  MC.dg.add('numconv', {
    title: 'Sayı tabanları ve ikiye tümleme',
    html: () => `<div class="dg-ctl"><label>Sayı: <input type="text" data-o="in" value="-135" style="width:120px"></label>
      <select data-o="bits"><option value="8">8 bit (1 bayt)</option><option value="16" selected>16 bit (2 bayt)</option></select>
      <span class="hint">Yazım: 123, 0x7B, 7Bh, 0b1111011</span></div>
      <div class="dg-stats"><div class="dg-b"><small>Ondalık</small><b data-o="d"></b></div><div class="dg-b"><small>Hex</small><b data-o="h"></b></div><div class="dg-b"><small>İkili</small><b data-o="b" style="font-size:13px"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      const draw = () => {
        const n = MC.parseNum($o(el, 'in').value);
        const bits = +$o(el, 'bits').value;
        const o = $o(el, 'i');
        if (!Number.isInteger(n)) { o.textContent = 'Tam sayı yaz.'; return; }
        const max = 2 ** bits;
        const fits = n >= -(max / 2) && n < max;
        const u = ((n % max) + max) % max;
        const s = u >= max / 2 ? u - max : u;
        $o(el, 'd').textContent = n < 0 ? `${n}` : `${u}${s !== u ? ` (signed: ${s})` : ''}`;
        $o(el, 'h').textContent = MC.hex(u, bits / 4);
        $o(el, 'b').textContent = MC.binGroup(u, bits);
        if (!fits) { o.innerHTML = `<span class="dg-bad">${n}, ${bits} bite sığmaz</span> (signed: ${-(max / 2)} … ${max / 2 - 1}, unsigned: 0 … ${max - 1}). Saklanırsa yalnızca alt ${bits} bit kalır: ${MC.hex(u, bits / 4)}.`; return; }
        if (n < 0) {
          const a = -n;
          const inv = ~a & (max - 1);
          o.innerHTML = `<b>İkiye tümleme adımları:</b> 1) |${n}| = ${a} = ${MC.binGroup(a, bits)} · 2) Bitleri tersle: ${MC.binGroup(inv, bits)} · 3) 1 ekle: ${MC.binGroup(u, bits)} = <b>${MC.hex(u, bits / 4)}</b>. En soldaki bit 1 → sayı negatif.`;
        } else {
          o.innerHTML = `Hex için ikiliyi sağdan 4'lü grupla: ${MC.binGroup(u, bits)} → ${MC.hex(u, bits / 4)}. ${u < 128 && bits === 8 ? '' : ''}${u >= max / 2 ? `Bu bit deseni signed tipte <b>${s}</b> olarak okunur (en soldaki bit 1).` : ''}`;
        }
      };
      el.addEventListener('input', draw);
      el.addEventListener('change', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ float: IEEE 754 tek duyarlık */
  MC.dg.add('float', {
    title: 'IEEE 754 (32 bit float): işaret · üs · mantis',
    html: () => `<div class="dg-ctl"><label>Ondalık sayı: <input type="text" data-o="in" value="1453" style="width:140px"></label><span class="hint">Dene: 0.0625, -2.5, 1453, 0.1</span></div>
      <div class="dg-row" data-o="bits" style="font:700 14px var(--mono);gap:2px;flex-wrap:wrap"></div>
      <div class="dg-stats" style="margin-top:8px"><div class="dg-b"><small>Hex (32 bit)</small><b data-o="h"></b></div><div class="dg-b"><small>Üs (e)</small><b data-o="e"></b></div><div class="dg-b"><small>Saklanan değer</small><b data-o="v"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      const draw = () => {
        const x = Number($o(el, 'in').value.replace(',', '.'));
        if (!isFinite(x)) return;
        const dv = new DataView(new ArrayBuffer(4));
        dv.setFloat32(0, x);
        const u = dv.getUint32(0);
        const b = MC.bin(u, 32);
        const s = b[0];
        const e = parseInt(b.slice(1, 9), 2);
        const m = b.slice(9);
        $o(el, 'bits').innerHTML = `<span style="color:#f472b6" title="işaret">${s}</span>&nbsp;<span style="color:#fbbf24" title="üs">${b.slice(1, 9)}</span>&nbsp;<span style="color:#2dd4bf" title="mantis">${m}</span>`;
        $o(el, 'h').textContent = MC.hex(u, 8);
        $o(el, 'e').textContent = `${e} − 127 = ${e - 127}`;
        $o(el, 'v').textContent = dv.getFloat32(0);
        const ip = Math.floor(Math.abs(x));
        $o(el, 'i').innerHTML = x === 0 ? 'Sıfır: tüm bitler 0.' : `<b>Formül:</b> (−1)<sup>işaret</sup> × 1.mantis × 2<sup>üs−127</sup>. <span style="color:#f472b6">İşaret</span> = ${s} (${s === '1' ? 'negatif' : 'pozitif'}). ${Math.abs(x)} ikili: ${ip.toString(2)}${Math.abs(x) % 1 ? '.…' : ''} → normalize: 1.${m.replace(/0+$/, '') || '0'} × 2<sup>${e - 127}</sup>. <span style="color:#fbbf24">Üs</span> = ${e - 127} + 127 (bias) = ${e}. <span style="color:#2dd4bf">Mantis</span>: virgülden sonraki 23 bit (baştaki 1 saklanmaz).${dv.getFloat32(0) !== x ? ' <span class="dg-warn">Bu sayı ikili tabanda tam gösterilemez; en yakın değer saklandı.</span>' : ''}`;
      };
      el.addEventListener('input', draw);
      draw();
    }
  });
})(window.MC);
