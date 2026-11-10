/*
 * core.js — ortak ad alanı (window.MC) ve küçük yardımcılar.
 * Diğer tüm dosyalar bu nesneye ekleme yapar; dış kütüphane kullanılmaz.
 */
(function () {
  'use strict';

  const MC = (window.MC = window.MC || {});

  MC.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  MC.today = () => new Date().toISOString().slice(0, 10);

  // Sayı biçimleri: hex(0xA0, 2) → "0xA0", bin(5, 8) → "00000101"
  MC.hex = (v, digits = 2) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(digits, '0');
  MC.hexH = (v, digits = 2) => (v >>> 0).toString(16).toUpperCase().padStart(digits, '0') + 'h';
  MC.bin = (v, bits = 8) => (v >>> 0).toString(2).padStart(bits, '0').slice(-bits);
  MC.binGroup = (v, bits = 8) => MC.bin(v, bits).replace(/(\d{4})(?=\d)/g, '$1 ');

  // "0x1F", "1Fh", "0b1010", "1010b" veya ondalık yazımı sayıya çevirir; geçersizse NaN
  MC.parseNum = (s) => {
    const t = String(s).trim().replace(/\s+/g, '').toLowerCase();
    if (!t) return NaN;
    let m;
    if ((m = t.match(/^(-?)0x([0-9a-f]+)$/))) return (m[1] ? -1 : 1) * parseInt(m[2], 16);
    if ((m = t.match(/^(-?)([0-9a-f]+)h$/))) return (m[1] ? -1 : 1) * parseInt(m[2], 16);
    if ((m = t.match(/^(-?)0b([01]+)$/))) return (m[1] ? -1 : 1) * parseInt(m[2], 2);
    if ((m = t.match(/^(-?)([01]+)b$/))) return (m[1] ? -1 : 1) * parseInt(m[2], 2);
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    return NaN;
  };

  // Frekans ve süreleri okunur yaz: 4e6 → "4 MHz", 0.001 → "1 ms"
  MC.fmtHz = (f) => {
    if (!isFinite(f)) return '—';
    if (f >= 1e6) return `${+(f / 1e6).toFixed(3)} MHz`;
    if (f >= 1e3) return `${+(f / 1e3).toFixed(3)} kHz`;
    return `${+f.toFixed(3)} Hz`;
  };
  MC.fmtTime = (t) => {
    if (!isFinite(t)) return '—';
    const a = Math.abs(t);
    if (a >= 1) return `${+t.toFixed(4)} s`;
    if (a >= 1e-3) return `${+(t * 1e3).toFixed(4)} ms`;
    if (a >= 1e-6) return `${+(t * 1e6).toFixed(4)} µs`;
    return `${+(t * 1e9).toFixed(3)} ns`;
  };

  // Tarayıcı deposu: gizli pencerede veya engellenmişse sessizce çalışmaya devam eder
  MC.store = {
    get(key, fallback) {
      try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* yok say */ }
    }
  };

  MC.lessons = MC.lessons || { chapters: [] };

  /* ------------------------------------------------------------ etkileşimli şekil kaydı
   * Ders verisinde { t: 'dg', id: 'alu', ...parametreler } yazılır. render() HTML'i üretir,
   * mount() sayfa DOM'a eklendikten sonra her şeklin init() fonksiyonunu bir kez çağırır.
   */
  MC.dg = {
    defs: {},
    add(id, def) { this.defs[id] = def; },
    render(bl) {
      const def = this.defs[bl.id];
      if (!def) return `<div class="dg"><b>Şekil bulunamadı:</b> ${MC.esc(bl.id)}</div>`;
      const p = Object.assign({}, bl);
      delete p.t;
      const title = p.title || def.title;
      return `<div class="dg dg-${bl.id}" data-dg="${bl.id}" data-p="${MC.esc(JSON.stringify(p))}">${title ? `<div class="dg-title">${title}</div>` : ''}${def.html ? def.html(p) : ''}</div>`;
    },
    mount(root) {
      root.querySelectorAll('[data-dg]:not([data-mounted])').forEach((el) => {
        el.dataset.mounted = '1';
        const def = this.defs[el.dataset.dg];
        if (def && def.init) {
          try { def.init(el, JSON.parse(el.dataset.p || '{}')); } catch (e) { console.error('Şekil hatası', el.dataset.dg, e); }
        }
      });
    }
  };

  // Adım adım ilerleyen şekiller için ortak düğmeler: steps = [{ text, ...durum }]
  MC.stepper = (el, steps, draw) => {
    let i = 0;
    const box = document.createElement('div');
    box.className = 'dg-steps';
    box.innerHTML = '<button class="btn btn-sm" type="button" data-s="-1">◀ Geri</button><button class="btn btn-sm btn-primary" type="button" data-s="1">İleri ▶</button><button class="btn btn-sm btn-ghost" type="button" data-s="0">Baştan</button><span class="dg-stepn"></span>';
    el.appendChild(box);
    const go = () => {
      draw(steps[i], i);
      box.querySelector('.dg-stepn').textContent = `Adım ${i + 1} / ${steps.length}`;
      box.querySelector('[data-s="-1"]').disabled = i === 0;
      box.querySelector('[data-s="1"]').disabled = i === steps.length - 1;
    };
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      const d = +b.dataset.s;
      i = d === 0 ? 0 : Math.min(Math.max(i + d, 0), steps.length - 1);
      go();
    });
    go();
    return { go: (n) => { i = n; go(); } };
  };

  // 8 LED'lik satır (RB7 solda, RB0 sağda: ikili yazımla aynı sıra)
  MC.ledRow = (port = 'RB', green = false) => `<div class="leds">${[7, 6, 5, 4, 3, 2, 1, 0].map((b) => `<div class="led-cell"><span class="led${green ? ' g' : ''}" data-bit="${b}"></span><small>${port}${b}</small></div>`).join('')}</div>`;
  MC.setLeds = (el, v) => el.querySelectorAll('.led[data-bit]').forEach((l) => l.classList.toggle('on', !!((v >> +l.dataset.bit) & 1)));
})();
