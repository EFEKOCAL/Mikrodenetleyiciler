/*
 * lab-view.js — #/lab: derslerdeki tüm simülatör, hesaplayıcı ve alıştırmalar tek sayfada.
 * Dersi bitirdikten sonra pratik yapmak ve laboratuvar föylerini hazırlamak için.
 */
(function (MC) {
  'use strict';

  const SECTIONS = [
    { id: 'uygulamalar', title: 'Hocanın uygulamaları · LED simülatörü', text: 'GitHub\'daki Uygulama 4–14, föy kodları ve slayt örneklerinin çözümleri. Kodu satır satır çalıştır, butonlara bas.', blocks: [{ t: 'dg', id: 'run', apps: ['u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'g3', 'g4', 'd3', 'd3s', 'd4'] }] },
    { id: 'alistirma', title: 'Sınırsız alıştırma', text: 'Her "Yeni soru" farklı sayılarla gelir. Vize hesap soruları bu tiplerden çıkar.', blocks: [
      { t: 'dg', id: 'quiz', types: ['tris', 'port'] }, { t: 'dg', id: 'quiz', types: ['timer'] }, { t: 'dg', id: 'quiz', types: ['adc', 'nyq'] },
      { t: 'dg', id: 'quiz', types: ['base', 'twos'] }, { t: 'dg', id: 'quiz', types: ['option'] }] },
    { id: 'kaydedici', title: 'Kaydedici düzenleyici', text: 'Bir kaydedici seç, bitlere tıkla: hex değeri ve her bitin anlamı çıksın.', regs: true },
    { id: 'zaman', title: 'Zamanlayıcı', text: 'TMR0 / TMR1 hesabı ve Timer0\'ın içini adım adım izleme.', blocks: [{ t: 'dg', id: 'timercalc', fosc: 4, delay: 1 }, { t: 'dg', id: 'tmr0', fosc: 4, ps: 4, tmr: 6 }] },
    { id: 'adc', title: 'ADC', text: 'Çözünürlük, adım ve çıkış hesabı; potansiyometre simülasyonu; örnekleme.', blocks: [{ t: 'dg', id: 'adccalc' }, { t: 'dg', id: 'adcsim' }, { t: 'dg', id: 'sampling' }] },
    { id: 'kesme', title: 'Kesmeler', text: 'Kesme mantığı ve kesme işlem adımları.', blocks: [{ t: 'dg', id: 'intlogic' }, { t: 'dg', id: 'intflow' }] },
    { id: 'bellek', title: 'Bellek ve veri tipleri', text: 'RAM haritası, değişkenlerin baytları, ALU bayrakları.', blocks: [{ t: 'dg', id: 'memmap' }, { t: 'dg', id: 'mem', preset: 'deney1' }, { t: 'dg', id: 'mem', preset: 'u2' }, { t: 'dg', id: 'alu' }] },
    { id: 'sayi', title: 'Sayılar ve bitler', text: 'Taban dönüşümü, ikiye tümleme, IEEE 754 ve bit operatörleri.', blocks: [{ t: 'dg', id: 'numconv' }, { t: 'dg', id: 'float' }, { t: 'dg', id: 'bitops' }] }
  ];

  const REGS = ['TRISB', 'PORTB', 'STATUS', 'INTCON', 'OPTION_REG', 'ADCON0', 'ADCON1', 'PIE1', 'PIR1', 'T1CON'];

  function render(root, parts) {
    const sec = parts[1];
    root.innerHTML = `<div class="page"><div class="page-inner">
      <div class="pg-head"><button class="icon-btn" type="button" data-act="menu" aria-label="Menüyü aç">☰</button><h1>Laboratuvar araçları</h1></div>
      <p class="hint">Derslerdeki etkileşimli şekillerin hepsi burada. Laboratuvara gitmeden önce föydeki kodu simülatörde dene, hesapları buradan kontrol et.</p>
      <div class="lab-toc">${SECTIONS.map((s) => `<a class="tab${s.id === sec ? ' active' : ''}" href="#/lab/${s.id}">${s.title.split(' · ')[0]}</a>`).join('')}</div>
      <div class="lab-grid">${SECTIONS.map((s) => `<section class="card lab-sec" id="lab-${s.id}"><h2>${s.title}</h2><p>${s.text}</p>
        ${s.regs ? `<div class="tabs" data-o="regtabs">${REGS.map((r, i) => `<button class="tab${i === 3 ? ' active' : ''}" type="button" data-reg="${r}">${r}</button>`).join('')}</div><div data-o="reghost">${MC.dg.render({ t: 'dg', id: 'reg', reg: 'INTCON', value: 0xa0 })}</div>` : ''}
        ${(s.blocks || []).map((b) => MC.dg.render(b)).join('')}</section>`).join('')}</div>
    </div></div>`;
    MC.dg.mount(root);
    root.querySelector('[data-o="regtabs"]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-reg]');
      if (!b) return;
      root.querySelectorAll('[data-reg]').forEach((x) => x.classList.toggle('active', x === b));
      const host = root.querySelector('[data-o="reghost"]');
      const vals = { STATUS: 0x18, INTCON: 0xa0, OPTION_REG: 0x01, ADCON0: 0x45, ADCON1: 0x4e, PIE1: 0x40, T1CON: 0x31 };
      host.innerHTML = MC.dg.render({ t: 'dg', id: 'reg', reg: b.dataset.reg, value: vals[b.dataset.reg] || 0 });
      MC.dg.mount(host);
    });
    if (sec) { const el = root.querySelector(`#lab-${CSS.escape(sec)}`); if (el) el.scrollIntoView({ block: 'start' }); }
  }

  MC.lab = { render, sections: SECTIONS };
})(window.MC);
