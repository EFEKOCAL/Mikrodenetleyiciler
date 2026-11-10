/*
 * diagrams-calc.js — kesme, zamanlayıcı ve ADC şekilleri ile hesap alıştırmaları:
 * intflow, intlogic, counter3, tmr0, timercalc, sampling, adccalc, adcsim, quiz.
 */
(function (MC) {
  'use strict';

  const $o = (el, k) => el.querySelector(`[data-o="${k}"]`);

  /* ------------------------------------------------------------ intflow: kesme işlem adımları */
  MC.dg.add('intflow', {
    title: 'Kesme gelince donanımda ve yazılımda ne olur? (Deney 4 programı)',
    html: () => `<div class="run"><div class="run-panel"><small>Program belleği</small><table class="calc-t"><tbody data-o="pm"></tbody></table></div>
      <div class="run-side"><div class="run-panel"><small>Durum</small><div class="run-regs" data-o="regs"></div></div>
      <div class="run-panel"><small>Donanım yığını (8 seviye)</small><div class="stk" data-o="stk"></div></div>
      <div class="run-panel"><small>RD0 LED</small><div class="dg-row"><span class="led" data-o="led"></span><span class="hint" data-o="mode"></span></div></div></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      const PM = [['0000h', 'GOTO main', 'Reset vektörü: açılışta buradan başlanır'], ['0004h', 'interrupt():', 'KESME VEKTÖRÜ'], ['0005h…', 'bağlamı sakla (W, STATUS, PCLATH)', 'derleyicinin eklediği kod'], ['…', 'portd.f0=0; Delay_ms(1000);', 'ISR gövdesi'], ['…', 'INTCON.INTF=0;', 'bayrağı sil'], ['…', 'bağlamı geri yükle · RETFIE', 'kesmeden dön'], ['0025h', 'main: … while(1)', 'ana program'], ['0026h', '  portd.f0=1;', ''], ['0027h', '  GOTO 0026h', '']];
      const S = (row, pc, stk, gie, intf, led, mode, text) => ({ row, pc, stk, gie, intf, led, mode, text });
      const steps = [
        S(7, '0026h', [], 1, 0, 1, 'ana program', 'Ana program sonsuz döngüde LED\'i yakıyor. GIE=1, INTE=1 (kesmeye izin verildi), INTF=0.'),
        S(7, '0026h', [], 1, 1, 1, 'ana program', '<b>1. Kesme algılanır:</b> RB0 pininde yükselen kenar oldu → donanım <b>INTF = 1</b> yapar. INTE=1 ve GIE=1 olduğu için CPU\'ya kesme isteği gider. O an çalışan komut tamamlanır.'),
        S(7, '0026h', ['0027h'], 0, 1, 1, 'geçiş', '<b>2. Dönüş adresi yığına:</b> Program sayacındaki (PC) bir sonraki komutun adresi <b>STACK</b> belleğe yazılır. Aynı anda donanım <b>GIE = 0</b> yapar: kesme içindeyken yeni kesme gelmesin.'),
        S(1, '0004h', ['0027h'], 0, 1, 1, 'kesme', '<b>3. PC ← 04h:</b> Kesme vektörü adresi program sayacına yüklenir. PIC16\'da tüm kesmeler <b>aynı adrese (0004h)</b> gider; hangi kaynağın kestiğini ISR bayraklara bakarak anlar.'),
        S(2, '0005h', ['0027h'], 0, 1, 1, 'kesme', '<b>Bağlam saklama:</b> W, STATUS ve PCLATH RAM\'e kopyalanır. PIC16\'da donanım yalnızca PC\'yi yığına yazar; STATUS\'u bu <b>derleyicinin eklediği kod</b> saklar. (Slayt "DURUM kaydedicisi de yığında saklanır" der; sonuç aynıdır: kesmeden dönünce STATUS eski hâline gelir.)'),
        S(3, '…', ['0027h'], 0, 1, 0, 'kesme', '<b>Kesme alt programı (ISR) çalışır:</b> LED söndürülür, 1 s beklenir. Bu sırada ana program duruyor.'),
        S(4, '…', ['0027h'], 0, 0, 0, 'kesme', '<b>INTF = 0:</b> Bayrak yazılımla silinir. Silinmezse RETFIE\'den sonra koşul hâlâ doğru olduğu için hemen yeniden kesmeye girilir (Deney 4, adım 9).'),
        S(5, '…', ['0027h'], 0, 0, 0, 'kesme', '<b>Bağlam geri yüklenir</b> (W, STATUS, PCLATH) ve <b>RETFIE</b> komutu çalışır.'),
        S(8, '0027h', [], 1, 0, 0, 'ana program', '<b>4. Geri dönüş:</b> RETFIE, yığından adresi PC\'ye geri yükler ve <b>GIE = 1</b> yapar. Ana program kaldığı yerden devam eder.'),
        S(7, '0026h', [], 1, 0, 1, 'ana program', 'Döngü devam ediyor: LED yeniden yandı. Butona her basışta LED 1 s sönüyor.')
      ];
      $o(el, 'pm').innerHTML = PM.map(([a, c, n], i) => `<tr data-r="${i}"><td>${a}</td><td>${MC.esc(c)}</td><td class="muted">${n}</td></tr>`).join('');
      MC.stepper(el, steps, (s) => {
        el.querySelectorAll('[data-r]').forEach((r) => { r.className = +r.dataset.r === s.row ? 'pick' : ''; });
        $o(el, 'regs').innerHTML = `<span>PC = <b>${s.pc}</b></span><span>GIE = <b>${s.gie}</b></span><span>INTE = <b>1</b></span><span>INTF = <b class="${s.intf ? 'dg-warn' : ''}">${s.intf}</b></span>`;
        $o(el, 'stk').innerHTML = Array.from({ length: 8 }, (_, i) => `<div class="${s.stk[i] ? 'full' : ''}">${i + 1}: ${s.stk[i] ? `${s.stk[i]} (dönüş adresi)` : '—'}</div>`).join('');
        $o(el, 'led').classList.toggle('on', !!s.led);
        $o(el, 'mode').textContent = s.mode;
        $o(el, 'i').innerHTML = s.text;
      });
    }
  });

  /* ------------------------------------------------------------ intlogic: kesme mantık diyagramı */
  const CORE = [['TMR0IF', 'TMR0IE', 'Timer0 taşma'], ['INTF', 'INTE', 'RB0/INT harici'], ['RBIF', 'RBIE', 'RB4–RB7 değişim']];
  const PERI = [['ADIF', 'ADIE', 'A/D çevrim bitti'], ['TMR1IF', 'TMR1IE', 'Timer1 taşma'], ['TMR2IF', 'TMR2IE', 'TMR2 = PR2'], ['RCIF', 'RCIE', 'USART veri geldi']];
  const LPRE = { t0: ['GIE', 'TMR0IE', 'TMR0IF'], rb0: ['GIE', 'INTE', 'INTF'], adc: ['GIE', 'PEIE', 'ADIE', 'ADIF'] };
  MC.dg.add('intlogic', {
    title: 'Kesme mantık diyagramı: bayrak AND izin → OR → GIE',
    html: () => {
      const row = ([f, e, n]) => `<div class="gl-row" data-row="${f}"><span><label><input type="checkbox" data-b="${f}"> ${f}</label> <small class="muted">bayrak</small></span><span class="gl-and">AND</span><span><label><input type="checkbox" data-b="${e}"> ${e}</label> <small class="muted">${n}</small></span><span class="gl-out"></span></div>`;
      return `<div class="dg-ctl"><span class="hint">Hazır ayar:</span><button class="btn btn-sm" type="button" data-pre="t0">Timer0 (Uygulama 15)</button><button class="btn btn-sm" type="button" data-pre="rb0">RB0 (Deney 4)</button><button class="btn btn-sm" type="button" data-pre="adc">ADC (Uygulama 19)</button><button class="btn btn-sm btn-ghost" type="button" data-pre="clr">Temizle</button></div>
      <div class="gl"><div class="gl-group"><small>INTCON içindeki kesmeler</small><div class="gl">${CORE.map(row).join('')}</div></div>
      <div class="gl-group"><small>Çevresel kesmeler (PIR1 bayrak, PIE1 izin)</small><div class="gl">${PERI.map(row).join('')}</div>
        <div class="gl-row" data-row="PEIE" style="margin-top:6px"><span>çevresel OR çıkışı</span><span class="gl-and">AND</span><span><label><input type="checkbox" data-b="PEIE"> PEIE</label></span><span class="gl-out"></span></div></div>
      <div class="gl-row" data-row="GIE"><span>tüm kesmelerin OR çıkışı</span><span class="gl-and">AND</span><span><label><input type="checkbox" data-b="GIE"> GIE</label></span><span class="gl-out"></span></div>
      <div class="gl-final" data-o="fin"></div></div><div class="dg-info" data-o="i"></div>`;
    },
    init(el) {
      const v = (b) => el.querySelector(`[data-b="${b}"]`).checked;
      const draw = () => {
        const hot = (f, e) => v(f) && v(e);
        let core = false;
        CORE.forEach(([f, e]) => { const h = hot(f, e); core = core || h; el.querySelector(`[data-row="${f}"]`).classList.toggle('hot', h); });
        let peri = false;
        PERI.forEach(([f, e]) => { const h = hot(f, e); peri = peri || h; el.querySelector(`[data-row="${f}"]`).classList.toggle('hot', h); });
        const pe = peri && v('PEIE');
        el.querySelector('[data-row="PEIE"]').classList.toggle('hot', pe);
        const all = (core || pe) && v('GIE');
        el.querySelector('[data-row="GIE"]').classList.toggle('hot', all);
        const fin = $o(el, 'fin');
        fin.classList.toggle('hot', all);
        fin.textContent = all ? '⚡ CPU kesmeye gider: PC yığına, PC ← 0004h' : 'Kesme yok: CPU ana programa devam ediyor';
        const why = [];
        if (peri && !v('PEIE')) why.push('Çevresel bir bayrak kurulu ve izinli ama <b>PEIE=0</b>: çevresel kesmeler CPU\'ya ulaşmıyor.');
        if ((core || pe) && !v('GIE')) why.push('Bir kaynak hazır ama <b>GIE=0</b>: tüm kesmeler kapalı. (Ek) Bayrak yine de kurulur; program bayrağı yoklayarak (polling) olayı fark edebilir.');
        CORE.concat(PERI).forEach(([f, e]) => { if (v(f) && !v(e)) why.push(`${f}=1 ama ${e}=0: olay oldu, kesmeye izin yok.`); });
        $o(el, 'i').innerHTML = why.join(' ') || 'Her kaynağın <b>bayrağı (IF)</b> olay olunca donanımca 1 olur; <b>izin (IE)</b> bitini sen ayarlarsın. Timer0 için PEIE gerekmez (INTCON içinde); ADC, Timer1 gibi çevresel birimler için <b>GIE + PEIE + kendi IE biti</b> gerekir.';
      };
      el.addEventListener('change', draw);
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-pre]');
        if (!b) return;
        el.querySelectorAll('[data-b]').forEach((c) => { c.checked = (LPRE[b.dataset.pre] || []).includes(c.dataset.b); });
        draw();
      });
      draw();
    }
  });

  /* ------------------------------------------------------------ counter3: 3 bit asenkron (ripple) sayıcı */
  MC.dg.add('counter3', {
    title: '3 bit asenkron yukarı sayıcı: her flip-flop bir öncekinin çıkışıyla tetiklenir',
    html: () => `<div class="dg-ctl"><label>Başlangıç değeri: <select data-o="st">${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => `<option>${n}</option>`).join('')}</select></label>
      <button class="btn btn-sm btn-primary" type="button" data-c="1">Saat darbesi ▶</button><button class="btn btn-sm" type="button" data-c="8">8 darbe</button><button class="btn btn-sm btn-ghost" type="button" data-c="0">Sıfırla</button></div>
      <div data-o="svg"></div><div class="dg-stats"><div class="dg-b"><small>Darbe sayısı</small><b data-o="n"></b></div><div class="dg-b"><small>Q2 Q1 Q0</small><b data-o="q"></b></div><div class="dg-b"><small>Ondalık</small><b data-o="d"></b></div></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      let n = 0;
      const draw = () => {
        const st = +$o(el, 'st').value;
        const H = 16;
        const W = 600;
        const x = (k) => 60 + k * ((W - 70) / H);
        const sig = (fn, y) => {
          let d = '';
          for (let k = 0; k <= H; k++) { const v = fn(k); d += `${k ? 'L' : 'M'}${x(k)},${y - v * 26}L${x(k + 1 > H ? H : k + 1)},${y - v * 26}`; }
          return d;
        };
        // k. yarım periyot: k çift → saat 1, tek → 0; düşen kenarlar k = 1, 3, 5…
        const cnt = (k) => (st + Math.floor((k + 1) / 2)) % 8;
        const rows = [['CLK', (k) => (k % 2 === 0 ? 1 : 0), '#8a9cab'], ['Q0', (k) => cnt(k) & 1, '#2dd4bf'], ['Q1', (k) => (cnt(k) >> 1) & 1, '#a78bfa'], ['Q2', (k) => (cnt(k) >> 2) & 1, '#fbbf24']];
        const cur = Math.min(2 * n, H);
        $o(el, 'svg').innerHTML = `<svg viewBox="0 0 ${W} 190">${rows.map(([nm, fn, c], i) => `<text x="6" y="${40 + i * 44}" fill="${c}" font-size="12">${nm}</text><path d="${sig(fn, 44 + i * 44)}" fill="none" stroke="${c}" stroke-width="2" opacity=".9"/>`).join('')}
          <rect x="${x(cur)}" y="6" width="${x(H) - x(cur)}" height="182" fill="#080d12" opacity=".75"/><line x1="${x(cur)}" x2="${x(cur)}" y1="6" y2="186" stroke="#2dd4bf" stroke-dasharray="3 3"/></svg>`;
        const c = (st + n) % 8;
        $o(el, 'n').textContent = n;
        $o(el, 'q').textContent = MC.bin(c, 3);
        $o(el, 'd').textContent = c;
        $o(el, 'i').innerHTML = `Q0 her saat darbesinin düşen kenarında, Q1 Q0'ın, Q2 Q1'in düşen kenarında değişir (dalgalanma: <i>ripple</i>). Bu yüzden <b>Q0 = f/2, Q1 = f/4, Q2 = f/8</b> frekansındadır: her flip-flop frekansı ikiye böler. <b>Ön ölçekleyici (prescaler) tam olarak böyle bir asenkron sayıcıdır:</b> yüksek frekansı düşük frekansa böler. ${c === 7 ? 'Sayıcı 7\'de: bir darbe daha gelince 000\'a döner (taşma).' : ''}`;
      };
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; const k = +b.dataset.c; n = k ? Math.min(n + k, 8) : 0; draw(); });
      $o(el, 'st').addEventListener('change', () => { n = 0; draw(); });
      draw();
    }
  });

  /* ------------------------------------------------------------ tmr0: Timer0 içini adım adım izle */
  const PS_LIST = [2, 4, 8, 16, 32, 64, 128, 256];
  MC.dg.add('tmr0', {
    title: 'Timer0 içi: F<sub>OSC</sub>/4 → ön ölçekleyici → TMR0 → taşma bayrağı',
    html: (p) => `<div class="dg-ctl"><label>F<sub>OSC</sub> <select data-o="f">${[4, 8, 16, 20].map((f) => `<option value="${f}"${f === (p.fosc || 4) ? ' selected' : ''}>${f} MHz</option>`).join('')}</select></label>
      <label>Ön ölçek <select data-o="ps">${PS_LIST.map((n, i) => `<option value="${n}"${n === (p.ps || 4) ? ' selected' : ''}>1:${n} (PS=${MC.bin(i, 3)})</option>`).join('')}</select></label>
      <label>TMR0 başlangıç <input type="number" min="0" max="255" value="${p.tmr == null ? 6 : p.tmr}" data-o="t0" style="width:80px"></label></div>
      <div class="dg-stats"><div class="dg-b"><small>Komut döngüsü T<sub>CY</sub> = 4/F<sub>OSC</sub></small><b data-o="tcy"></b></div><div class="dg-b"><small>Ön ölçek sayacı</small><b data-o="pc"></b></div><div class="dg-b"><small>TMR0IF</small><b data-o="if"></b></div><div class="dg-b"><small>Geçen süre</small><b data-o="tm"></b></div></div>
      <div style="margin:10px 0"><div class="tbar"><i data-o="bar"></i><span data-o="tv"></span></div></div>
      <div class="dg-ctl"><button class="btn btn-sm" type="button" data-c="cy">+1 komut döngüsü</button><button class="btn btn-sm" type="button" data-c="tick">+1 TMR0 artışı</button><button class="btn btn-sm btn-primary" type="button" data-c="ov">Taşmaya kadar ▶</button><button class="btn btn-sm btn-ghost" type="button" data-c="rs">Sıfırla</button>
      <label><input type="checkbox" data-o="rl" checked> ISR'de TMR0 yeniden yüklensin ve TMR0IF silinsin</label></div>
      <div class="dg-info" data-o="i"></div>`,
    init(el) {
      let tmr;
      let pre;
      let cyc;
      let flag;
      let ovs;
      const f = () => +$o(el, 'f').value * 1e6;
      const ps = () => +$o(el, 'ps').value;
      const t0 = () => Math.min(255, Math.max(0, +$o(el, 't0').value || 0));
      const reset = () => { tmr = t0(); pre = 0; cyc = 0; flag = 0; ovs = 0; draw('Sıfırlandı. Her komut döngüsünde (T<sub>CY</sub>) ön ölçek sayacı 1 artar; 1:N dolunca TMR0 1 artar.'); };
      const cycle = () => {
        cyc++;
        pre++;
        if (pre < ps()) return false;
        pre = 0;
        tmr++;
        if (tmr > 255) {
          tmr = 0;
          flag = 1;
          ovs++;
          if ($o(el, 'rl').checked) { tmr = t0(); flag = 0; }
          return true;
        }
        return false;
      };
      const draw = (msg) => {
        const tcy = 4 / f();
        $o(el, 'tcy').textContent = MC.fmtTime(tcy);
        $o(el, 'pc').textContent = `${pre} / ${ps()}`;
        $o(el, 'if').textContent = flag;
        $o(el, 'if').className = flag ? 'dg-warn' : '';
        $o(el, 'tm').textContent = `${cyc} T_CY = ${MC.fmtTime(cyc * tcy)}`;
        $o(el, 'bar').style.width = `${(tmr / 255) * 100}%`;
        $o(el, 'tv').textContent = `TMR0 = ${tmr} (${MC.hex(tmr)})`;
        const per = (256 - t0()) * ps() * tcy;
        $o(el, 'i').innerHTML = `${msg ? msg + '<br>' : ''}Formül: taşma süresi = (256 − TMR0) × ön ölçek × 4 / F<sub>OSC</sub> = (256 − ${t0()}) × ${ps()} × 4 / ${f() / 1e6} MHz = <b>${MC.fmtTime(per)}</b>. ${ovs ? `Şimdiye kadar ${ovs} taşma oldu.` : ''}`;
      };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        const c = b.dataset.c;
        if (c === 'rs') { reset(); return; }
        if (c === 'cy') { const o = cycle(); draw(o ? '<b>Taşma!</b> TMR0 FFh → 00h geçti: TMR0IF = 1, kesme açıksa ISR çalışır.' : 'Bir komut döngüsü geçti.'); }
        if (c === 'tick') { let o = false; const t = tmr; do { o = cycle(); } while (pre !== 0); draw(o ? '<b>Taşma!</b> TMR0IF = 1.' : `TMR0 ${t} → ${tmr}: bunun için ${ps()} komut döngüsü geçti.`); }
        if (c === 'ov') { let o = false; let k = 0; while (!o && k < 70000) { o = cycle(); k++; } draw(`<b>Taşma!</b> ${k} komut döngüsü (= ${MC.fmtTime(k * 4 / f())}) sonra TMR0 FFh → 00h: TMR0IF = 1.${$o(el, 'rl').checked ? ' ISR TMR0\'a başlangıç değerini yeniden yazdı, bayrağı sildi: bir sonraki taşma yine aynı sürede.' : ' Yeniden yükleme yapılmadığı için sayma 0\'dan devam edecek: sonraki taşma 256 artış sürer.'}`); }
      });
      el.addEventListener('change', (e) => { if (e.target.matches('select, input[type=number]')) reset(); });
      reset();
    }
  });

  /* ------------------------------------------------------------ timercalc: TMR değeri hesaplayıcı */
  MC.timerRows = (fosc, delay, timer) => {
    const max = timer === 1 ? 65536 : 256;
    const list = timer === 1 ? [1, 2, 4, 8] : PS_LIST;
    return list.map((ps, i) => {
      const count = (delay * fosc) / (ps * 4);
      const val = max - count;
      const ok = count >= 1 && count <= max;
      const exact = Math.abs(count - Math.round(count)) < 1e-9;
      return { ps, bits: timer === 1 ? MC.bin(i, 2) : MC.bin(i, 3), count, val, ok, exact };
    });
  };
  MC.dg.add('timercalc', {
    title: 'Zamanlayıcı hesabı: TMRx = Timer_max − (Gecikme × F<sub>OSC</sub>) / (Prescale × 4)',
    html: (p) => `<div class="dg-ctl"><label>F<sub>OSC</sub> <input type="number" data-o="f" value="${p.fosc || 4}" step="any" style="width:80px"> MHz</label>
      <label>Gecikme <input type="number" data-o="d" value="${p.delay || 1}" step="any" style="width:90px"></label><select data-o="u"><option value="1e-6"${p.unit === 'us' ? ' selected' : ''}>µs</option><option value="1e-3"${p.unit !== 'us' ? ' selected' : ''}>ms</option></select>
      <select data-o="tm"><option value="0">Timer0 (8 bit, max 256)</option><option value="1"${p.timer === 1 ? ' selected' : ''}>Timer1 (16 bit, max 65536)</option></select></div>
      <div class="table-wrap"><table class="calc-t"><thead><tr><th>Prescale</th><th>PS bitleri</th><th>Sayım = G×F/(P×4)</th><th>TMR değeri</th><th>Sonuç</th></tr></thead><tbody data-o="rows"></tbody></table></div>
      <div class="dg-info" data-o="i"></div><div data-o="sq"></div>`,
    init(el) {
      let pick = null;
      const draw = () => {
        const fosc = +$o(el, 'f').value * 1e6;
        const delay = +$o(el, 'd').value * +$o(el, 'u').value;
        const tm = +$o(el, 'tm').value;
        const rows = MC.timerRows(fosc, delay, tm);
        if (pick == null || !rows[pick] || !rows[pick].ok) pick = rows.findIndex((r) => r.ok && r.exact);
        if (pick < 0) pick = rows.findIndex((r) => r.ok);
        $o(el, 'rows').innerHTML = rows.map((r, i) => `<tr data-i="${i}" class="${i === pick ? 'pick' : r.ok ? 'okrow' : 'badrow'}"><td>1:${r.ps}</td><td>${r.bits}</td><td>${+r.count.toFixed(3)}</td><td>${+r.val.toFixed(3)}</td><td>${r.ok ? (r.exact ? '✓ kullanılabilir' : '~ yaklaşık (tam sayı değil)') : r.val < 0 ? '✗ negatif: prescale büyüt' : '✗ sayım < 1'}</td></tr>`).join('');
        const r = rows[pick];
        if (!r) { $o(el, 'i').innerHTML = 'Bu gecikme hiçbir ön ölçekle bu zamanlayıcıya sığmıyor. Timer1\'i dene ya da kesmede ek bir yazılım sayacı kullan (ör. 1 ms × 1000 = 1 s).'; $o(el, 'sq').innerHTML = ''; return; }
        const tmr = Math.round(r.val);
        const real = ((tm ? 65536 : 256) - tmr) * r.ps * 4 / fosc;
        const opt = tm ? null : r.bits;
        $o(el, 'i').innerHTML = `Seçili satır: <b>Prescale 1:${r.ps}, TMR${tm} = ${tmr}</b>${tm ? ` (TMR1H = ${MC.hex(tmr >> 8)}, TMR1L = ${MC.hex(tmr & 255)})` : ''}. Gerçek süre ${MC.fmtTime(real)}.
          ${tm ? `<br>T1CON: T1CKPS1:T1CKPS0 = ${r.bits}, TMR1CS=0, TMR1ON=1 → <code>T1CON = ${MC.hex((parseInt(r.bits, 2) << 4) | 1)};</code>` : `<br>OPTION_REG: T0CS=0 (dahili saat), PSA=0 (ön ölçek Timer0'da), PS2:PS0=${opt} → <code>OPTION_REG = ${parseInt(opt, 2)};</code> (hocanın yazımıyla; RBPU=0 ve INTEDG=0 kalır)`}
          <br>Kesmede pin değillenirse (<code>PORTB.F0 = ~PORTB.F0</code>) <b>kare dalganın periyodu 2 × ${MC.fmtTime(real)}</b> → frekans = <b>${MC.fmtHz(1 / (2 * real))}</b>.`;
        const W = 600;
        let d = 'M20,60';
        for (let k = 0; k < 8; k++) { const x0 = 20 + k * 70; d += `L${x0},${k % 2 ? 60 : 20}L${x0 + 70},${k % 2 ? 60 : 20}`; }
        $o(el, 'sq').innerHTML = `<svg viewBox="0 0 ${W} 90"><path d="${d}" fill="none" stroke="#2dd4bf" stroke-width="2"/><line x1="20" x2="90" y1="78" y2="78" stroke="#fbbf24"/><text x="95" y="82" fill="#fbbf24" font-size="11">${MC.fmtTime(real)} (bir kesme aralığı)</text><line x1="230" x2="370" y1="78" y2="78" stroke="#a78bfa"/><text x="375" y="82" fill="#a78bfa" font-size="11">periyot = 2 × kesme aralığı</text></svg>`;
      };
      el.addEventListener('input', () => { pick = null; draw(); });
      el.addEventListener('change', () => { pick = null; draw(); });
      el.addEventListener('click', (e) => { const r = e.target.closest('[data-i]'); if (r && r.classList.contains('okrow')) { pick = +r.dataset.i; draw(); } });
      draw();
    }
  });

  /* ------------------------------------------------------------ sampling: örnekleme ve Nyquist */
  MC.dg.add('sampling', {
    title: 'Örnekleme: f<sub>s</sub> ≥ 2·f<sub>max</sub> olmazsa ne olur?',
    html: () => `<div class="dg-ctl"><label>Sinyal frekansı f = <b data-o="fv"></b> Hz <input type="range" min="1" max="8" value="2" data-o="f"></label><label>Örnekleme f<sub>s</sub> = <b data-o="sv"></b> Hz <input type="range" min="1" max="40" value="12" data-o="s"></label></div>
      <div data-o="svg"></div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      const draw = () => {
        const f = +$o(el, 'f').value;
        const fs = +$o(el, 's').value;
        $o(el, 'fv').textContent = f;
        $o(el, 'sv').textContent = fs;
        const W = 600;
        const H = 160;
        const x = (t) => 20 + t * (W - 40);
        const y = (v) => H / 2 - v * 60;
        let d = '';
        for (let i = 0; i <= 400; i++) { const t = i / 400; d += `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(Math.sin(2 * Math.PI * f * t)).toFixed(1)}`; }
        const pts = [];
        for (let k = 0; k <= fs; k++) { const t = k / fs; pts.push([t, Math.sin(2 * Math.PI * f * t)]); }
        const rec = pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('');
        $o(el, 'svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}"><line x1="20" x2="${W - 20}" y1="${H / 2}" y2="${H / 2}" stroke="#2a3d4d"/><path d="${d}" fill="none" stroke="#2dd4bf" stroke-width="1.5" opacity=".6"/><path d="${rec}" fill="none" stroke="#fbbf24" stroke-width="2"/>${pts.map(([t, v]) => `<circle cx="${x(t)}" cy="${y(v)}" r="4" fill="#fbbf24"/>`).join('')}<text x="24" y="16" fill="#2dd4bf" font-size="11">analog sinyal (1 saniye)</text><text x="200" y="16" fill="#fbbf24" font-size="11">● örnekler ve örneklerden çizilen sinyal</text></svg>`;
        const alias = Math.abs(f - Math.round(f / fs) * fs);
        $o(el, 'i').innerHTML = fs >= 2 * f
          ? `<span class="dg-ok">f<sub>s</sub> = ${fs} ≥ 2 × ${f} = ${2 * f}: Nyquist şartı sağlanıyor.</span> Örneklerden orijinal frekans geri elde edilebilir. Nyquist frekansı = f<sub>s</sub>/2 = ${fs / 2} Hz.${fs < 4 * f ? ' (Sınırın hemen üstünde örnekler kaba görünür, ama frekans bilgisi korunur.)' : ''}`
          : `<span class="dg-bad">f<sub>s</sub> = ${fs} &lt; 2 × ${f} = ${2 * f}: örnekleme yetersiz!</span> Örnekler ${alias ? `<b>${alias} Hz</b>'lik sahte bir sinyal` : 'sabit bir değer'} gibi görünür (<b>aliasing / örtüşme</b>). Doğru çevrim için en az <b>${2 * f} Hz</b> gerekir.`;
      };
      el.addEventListener('input', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ adccalc: ADC çıkışı ve ADRESH/ADRESL */
  MC.adcValue = (vin, vp, vm, n) => {
    const step = (vp - vm) / 2 ** n;
    return { step, raw: (vin - vm) / step, d: Math.max(0, Math.min(2 ** n - 1, Math.floor((vin - vm) / step + 1e-9))) };
  };
  MC.dg.add('adccalc', {
    title: 'ADC hesabı: 1 bit = (V<sub>REF+</sub> − V<sub>REF−</sub>) / 2<sup>n</sup>',
    html: (p) => `<div class="dg-ctl"><label>V<sub>IN</sub> <input type="number" step="0.01" value="${p.vin == null ? 3.25 : p.vin}" data-o="vin" style="width:80px"> V</label>
      <label>V<sub>REF+</sub> <input type="number" step="0.1" value="5" data-o="vp" style="width:70px"></label><label>V<sub>REF−</sub> <input type="number" step="0.1" value="0" data-o="vm" style="width:70px"></label>
      <label>n <select data-o="n">${[8, 10, 12, 14].map((n) => `<option${n === 10 ? ' selected' : ''}>${n}</option>`).join('')}</select> bit</label>
      <label>ADFM <select data-o="fm"><option value="0">0: sola yaslı</option><option value="1">1: sağa yaslı</option></select></label></div>
      <div class="dg-stats"><div class="dg-b"><small>Çözünürlük 2<sup>n</sup></small><b data-o="res"></b></div><div class="dg-b"><small>1 bit (LSB)</small><b data-o="st"></b></div><div class="dg-b"><small>ADC çıkışı</small><b data-o="d"></b></div><div class="dg-b"><small>İkili</small><b data-o="b"></b></div></div>
      <div data-o="regs" style="margin-top:10px"></div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      const bitsRow = (name, v, mark) => `<div style="display:grid;grid-template-columns:80px repeat(8,minmax(0,1fr));gap:3px;align-items:center;font:12px var(--mono);margin-top:3px"><b>${name}</b>${[7, 6, 5, 4, 3, 2, 1, 0].map((i) => `<span style="text-align:center;padding:3px 0;border-radius:5px;border:1px solid var(--border);${mark(i) ? 'background:var(--accent-soft);color:var(--text)' : 'color:var(--faint)'}">${mark(i) ? (v >> i) & 1 : 0}</span>`).join('')}</div>`;
      const draw = () => {
        const vin = +$o(el, 'vin').value;
        const vp = +$o(el, 'vp').value;
        const vm = +$o(el, 'vm').value;
        const n = +$o(el, 'n').value;
        const fm = +$o(el, 'fm').value;
        const { step, raw, d } = MC.adcValue(vin, vp, vm, n);
        $o(el, 'res').textContent = 2 ** n;
        $o(el, 'st').textContent = `${+(step * 1000).toFixed(3)} mV`;
        $o(el, 'd').textContent = `${d} (${MC.hex(d, Math.ceil(n / 4))})`;
        $o(el, 'b').textContent = MC.bin(d, n);
        if (n === 10) {
          const H = fm ? d >> 8 : d >> 2;
          const L = fm ? d & 255 : (d & 3) << 6;
          $o(el, 'regs').innerHTML = bitsRow('ADRESH', H, (i) => (fm ? i < 2 : true)) + bitsRow('ADRESL', L, (i) => (fm ? true : i >= 6)) +
            `<p class="hint" style="margin:6px 0 0">${fm ? 'Sağa yaslı: 10 bitin tamamını almak için <code>(ADRESH &lt;&lt; 8) | ADRESL</code>.' : `Sola yaslı: <b>yalnızca ADRESH okunursa</b> sonucun üst 8 biti gelir = ${H} (= ${d} / 4). Uygulama 19 bu yöntemle 8 LED'e yazar.`}</p>`;
        } else $o(el, 'regs').innerHTML = '';
        $o(el, 'i').innerHTML = `1 bit = (${vp} − ${vm}) / 2<sup>${n}</sup> = ${+(step * 1000).toFixed(3)} mV. ADC çıkışı = ${+((vin - vm) * 1000).toFixed(2)} mV / ${+(step * 1000).toFixed(3)} mV = ${raw.toFixed(3)} → tam kısmı <b>${d}</b>. ${vin > vp || vin < vm ? '<span class="dg-bad">Giriş referans aralığının dışında: çıkış sınırda kalır.</span>' : ''}`;
      };
      el.addEventListener('input', draw);
      el.addEventListener('change', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ adcsim: potansiyometre → ADC → PORTB */
  MC.dg.add('adcsim', {
    title: 'AN0\'a bağlı potansiyometre → ADC → PORTB LED\'leri',
    html: () => `<div class="dg-ctl"><button class="btn btn-sm on" type="button" data-m="19">Uygulama 19 (kesme + ADRESH)</button><button class="btn btn-sm" type="button" data-m="20">Uygulama 20 (ADC_Get_Sample × 0.249)</button></div>
      <div class="dg-ctl"><label>Potansiyometre (AN0): <b data-o="vv"></b> <input type="range" min="0" max="500" value="325" data-o="v" style="width:240px"></label></div>
      <div class="dg-stats"><div class="dg-b"><small>10 bit ADC sonucu</small><b data-o="d"></b></div><div class="dg-b"><small data-o="ml"></small><b data-o="p"></b></div></div>
      <div class="run-panel" style="margin-top:10px"><small>PORTB</small>${MC.ledRow('RB')}</div><div class="dg-info" data-o="i"></div>`,
    init(el) {
      let m = '19';
      const draw = () => {
        const v = +$o(el, 'v').value / 100;
        const { d } = MC.adcValue(v, 5, 0, 10);
        const pb = m === '19' ? d >> 2 : Math.floor(d * 0.249);
        el.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
        $o(el, 'vv').textContent = `${v.toFixed(2)} V`;
        $o(el, 'd').textContent = `${d} / 1023`;
        $o(el, 'ml').textContent = m === '19' ? 'ADRESH (sola yaslı, üst 8 bit)' : 'adc_degeri × 0.249 → char';
        $o(el, 'p').textContent = `${pb} = ${MC.bin(pb)}`;
        MC.setLeds(el, pb);
        $o(el, 'i').innerHTML = m === '19'
          ? 'ADFM=0 (sola yaslı) seçildiği için 10 bitlik sonucun üst 8 biti ADRESH\'tedir. ADRESH\'i okumak sonucu 4\'e bölmek demektir (alt 2 bit atılır). Kesme her çevrim bitişinde ADRESH\'i <code>adc_degeri</code>\'ne yazar ve <code>GO=1</code> ile yeni çevrim başlatır; ana döngü değeri PORTB\'ye basar.'
          : '<code>ADC_Get_Sample(0)</code> mikroC kütüphane fonksiyonu: AN0\'ı okur, 0–1023 döndürür. 8 LED\'e sığdırmak için 255/1023 ≈ <b>0.249</b> ile çarpılır (float). Sonuç PORTB\'ye (8 bit) yazılırken tam kısmı kalır.';
      };
      el.addEventListener('input', draw);
      el.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (b) { m = b.dataset.m; draw(); } });
      draw();
    }
  });

  /* ------------------------------------------------------------ quiz: rastgele hesap soruları */
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pickN = (arr, n) => { const a = arr.slice(); const out = []; while (out.length < n) out.push(a.splice(R(0, a.length - 1), 1)[0]); return out.sort((x, y) => x - y); };
  const GEN = {
    tris() {
      const port = ['B', 'D', 'C'][R(0, 2)];
      const pins = pickN([0, 1, 2, 3, 4, 5, 6, 7], R(2, 5));
      const asOut = Math.random() < 0.5;
      const mask = pins.reduce((s, b) => s | (1 << b), 0);
      const ans = asOut ? ~mask & 255 : mask;
      return {
        q: `${port} portunun <b>${pins.join(', ')}</b> numaralı pinleri <b>${asOut ? 'çıkış' : 'giriş'}</b>, diğerleri ${asOut ? 'giriş' : 'çıkış'} olarak kullanılacak. TRIS${port}'ye hangi hex sayı atanmalı?`,
        check: (s) => MC.parseNum(s) === ans,
        sol: `Giriş = 1, çıkış = 0. Bitler RB7…RB0: <b>${MC.bin(ans)}</b> → <code>TRIS${port} = ${MC.hex(ans)};</code>`
      };
    },
    port() {
      const pins = pickN([0, 1, 2, 3, 4, 5, 6, 7], R(1, 5));
      const v = pins.reduce((s, b) => s | (1 << b), 0);
      return {
        q: `B portundaki LED'lerden yalnızca <b>RB${pins.join(', RB')}</b> yanacak (diğerleri sönük). TRISB = 0x00 yapıldı. PORTB'ye hangi hex değer yazılmalı?`,
        check: (s) => MC.parseNum(s) === v,
        sol: `Yanacak pinlere 1: ${MC.bin(v)} → <code>PORTB = ${MC.hex(v)};</code> (ondalık ${v})`
      };
    },
    base() {
      const k = R(0, 3);
      const n = R(10, 255);
      if (k === 0) return { q: `(${n})<sub>10</sub> = ( ? )<sub>16</sub>`, check: (s) => MC.parseNum(/^[0-9a-f]+$/i.test(s.trim()) ? '0x' + s.trim() : s) === n, sol: `${n} = ${Math.floor(n / 16)}×16 + ${n % 16} → <b>${MC.hex(n)}</b>` };
      if (k === 1) return { q: `(${MC.hexH(n).slice(0, -1)})<sub>16</sub> = ( ? )<sub>10</sub>`, check: (s) => MC.parseNum(s) === n, sol: `${(n >> 4)}×16 + ${n & 15} = <b>${n}</b>` };
      if (k === 2) return { q: `(${MC.hexH(n).slice(0, -1)})<sub>16</sub> = ( ? )<sub>2</sub>`, check: (s) => parseInt(s.replace(/[^01]/g, ''), 2) === n, sol: `Her hex basamak 4 bit: <b>${MC.binGroup(n)}</b>` };
      return { q: `(${MC.bin(n)})<sub>2</sub> = ( ? )<sub>16</sub>`, check: (s) => MC.parseNum(/^[0-9a-f]+$/i.test(s.trim()) ? '0x' + s.trim() : s) === n, sol: `Sağdan 4'lü grupla: ${MC.binGroup(n)} → <b>${MC.hex(n)}</b>` };
    },
    twos() {
      const n = -R(2, 300);
      const u = (n + 65536) & 0xffff;
      return { q: `${n} sayısını 16 bit ikiye tümleme ile hex olarak yaz.`, check: (s) => (MC.parseNum(/^[0-9a-f]+$/i.test(s.trim()) ? '0x' + s.trim() : s) & 0xffff) === u, sol: `|${n}| = ${-n} = ${MC.binGroup(-n, 16)} → tersle: ${MC.binGroup(~(-n) & 0xffff, 16)} → +1: ${MC.binGroup(u, 16)} = <b>${MC.hex(u, 4)}</b>` };
    },
    timer() {
      for (;;) {
        const fosc = [4, 8, 16, 20][R(0, 3)];
        const unit = Math.random() < 0.5 ? 'us' : 'ms';
        const delay = unit === 'us' ? [20, 50, 100, 200, 250, 400, 500][R(0, 6)] : [0.5, 1, 2, 4][R(0, 3)];
        const sec = delay * (unit === 'us' ? 1e-6 : 1e-3);
        const rows = MC.timerRows(fosc * 1e6, sec, 0).filter((r) => r.ok && r.exact);
        if (!rows.length) continue;
        return {
          q: `F<sub>OSC</sub> = ${fosc} MHz. Timer0 ile <b>${delay} ${unit === 'us' ? 'µs' : 'ms'}</b> gecikme için uygun bir ön ölçek ve TMR0 değeri bul. TMR0 değerini yaz (ön ölçeği seç).`,
          extra: `<select data-o="ps">${PS_LIST.map((p) => `<option value="${p}">1:${p}</option>`).join('')}</select>`,
          check: (s, el) => { const ps = +$o(el, 'ps').value; const r = rows.find((x) => x.ps === ps); return !!r && MC.parseNum(s) === Math.round(r.val); },
          sol: `Formül: TMR0 = 256 − (G × F<sub>OSC</sub>) / (P × 4). Geçerli çözümler: ${rows.map((r) => `1:${r.ps} → <b>${Math.round(r.val)}</b>`).join(', ')}. (Sayım 256'yı aşarsa sonuç negatif çıkar: daha büyük prescale seç.)`
        };
      }
    },
    adc() {
      const v = R(5, 495) / 100;
      const { step, d } = MC.adcValue(v, 5, 0, 10);
      return { q: `10 bit ADC, V<sub>REF+</sub> = 5 V, V<sub>REF−</sub> = GND. Girişte <b>${v.toFixed(2)} V</b> var. ADC çıkışı (ondalık) kaç olur?`, check: (s) => Math.abs(MC.parseNum(s) - d) <= 1, sol: `1 bit = 5 / 1024 = ${(step * 1000).toFixed(3)} mV → ${(v * 1000).toFixed(0)} / ${(step * 1000).toFixed(3)} = ${(v / step).toFixed(2)} → <b>${d}</b> = ${MC.bin(d, 10)} (±1 kabul)` };
    },
    nyq() {
      const f = [50, 300, 1000, 4000, 20000][R(0, 4)];
      return { q: `En yüksek frekansı <b>${f >= 1000 ? f / 1000 + ' kHz' : f + ' Hz'}</b> olan bir sinyal doğru şekilde sayısala çevrilecek. Minimum örnekleme frekansı kaç Hz?`, check: (s) => MC.parseNum(s) === 2 * f, sol: `Nyquist: f<sub>s</sub> ≥ 2·f<sub>max</sub> → <b>${2 * f} Hz</b>` };
    },
    option() {
      const psI = R(0, 7);
      const edge = R(0, 1);
      const v = (edge << 6) | psI;
      return { q: `Timer0 dahili saatle (T0CS=0) çalışacak, ön ölçek Timer0'a atanacak (PSA=0) ve oranı <b>1:${2 << psI}</b> olacak. RBPU=0 ve INTEDG=${edge}, T0SE=0. OPTION_REG'e hangi hex değer yazılmalı?`, check: (s) => MC.parseNum(s) === v, sol: `RBPU INTEDG T0CS T0SE PSA PS2 PS1 PS0 = 0 ${edge} 0 0 0 ${MC.bin(psI, 3).split('').join(' ')} → <b>${MC.hex(v)}</b>` };
    }
  };
  const QNAME = { tris: 'TRIS değeri', port: 'PORT değeri', base: 'Taban dönüşümü', twos: 'İkiye tümleme', timer: 'Timer0 hesabı', adc: 'ADC hesabı', nyq: 'Nyquist', option: 'OPTION_REG' };
  MC.quizTypes = QNAME;
  MC.dg.add('quiz', {
    html: (p) => `<div class="dg-title">Alıştırma · ${(p.types || [p.type]).map((t) => QNAME[t]).join(' / ')} <span class="muted" style="text-transform:none;letter-spacing:0">(her seferinde yeni soru)</span></div>
      <p class="quiz-q" data-o="q"></p><div class="quiz-in"><input type="text" data-o="a" placeholder="cevap" autocomplete="off"><span data-o="x"></span>
      <button class="btn btn-sm btn-primary" type="button" data-c="chk">Kontrol et</button><button class="btn btn-sm" type="button" data-c="sol">Çözüm</button><button class="btn btn-sm btn-ghost" type="button" data-c="new">Yeni soru ↻</button><span class="quiz-score" data-o="sc"></span></div>
      <div class="quiz-res" data-o="r"></div>`,
    init(el, p) {
      const types = p.types || [p.type];
      let cur;
      let ok = 0;
      let tot = 0;
      const next = () => {
        cur = GEN[types[R(0, types.length - 1)]]();
        $o(el, 'q').innerHTML = cur.q;
        $o(el, 'x').innerHTML = cur.extra || '';
        $o(el, 'a').value = '';
        $o(el, 'r').innerHTML = '';
        cur.done = false;
      };
      const score = () => { $o(el, 'sc').textContent = tot ? `${ok} / ${tot} doğru` : ''; };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-c]');
        if (!b) return;
        if (b.dataset.c === 'new') next();
        if (b.dataset.c === 'sol') $o(el, 'r').innerHTML = cur.sol;
        if (b.dataset.c === 'chk') {
          const good = cur.check($o(el, 'a').value, el);
          if (!cur.done) { tot++; if (good) ok++; cur.done = true; }
          $o(el, 'r').innerHTML = good ? `<span class="dg-ok">✓ Doğru!</span> ${cur.sol}` : '<span class="dg-bad">✗ Olmadı.</span> Bir daha dene ya da "Çözüm"e bak.';
          score();
        }
      });
      $o(el, 'a').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.querySelector('[data-c="chk"]').click(); } });
      next();
    }
  });
})(window.MC);
