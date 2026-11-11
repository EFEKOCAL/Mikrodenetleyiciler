/*
 * lab-view.js — Laboratuvar araçları.
 *   #/lab            araç gruplarının listesi (ne işe yaradıklarıyla)
 *   #/lab/zaman      yalnızca seçilen grup: ekranda tek iş olsun, sayfa uzayıp gitmesin
 *   #/lab/kod/k3     simülatörlü grupta doğrudan bir uygulamayı açar
 */
(function (MC) {
  'use strict';

  const SECTIONS = [
    { id: 'uygulamalar', icon: '▶', title: 'LED simülatörü', sub: 'Hocanın uygulamaları', text: 'GitHub\'daki Uygulama 4–14 ve 21–26 (7 segment), föy kodları ve slayt örneklerinin çözümleri. Kodu satır satır çalıştır, butonlara bas.', blocks: [{ t: 'dg', id: 'run', apps: ['u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'u21', 'u22', 'u23', 'u24', 'u25', 'u26', 'segdizi', 'g3', 'g4', 'd3', 'd3s', 'd4'] }] },
    { id: 'kod', icon: '✎', title: 'Kod sorusu çözümleri', sub: 'Vize kampındaki kod soruları', text: 'Kod yazma sorularının çözümleri satır satır. Önce soruyu kâğıtta çöz (<a href="#/kod">soru listesi</a>), sonra burada çalıştırıp karşılaştır.', blocks: [{ t: 'dg', id: 'run', apps: 'CODE' }] },
    { id: 'seg', icon: '8', title: '7 segment', sub: 'Gösterge, sürücü, multiplexing', text: 'Segmentlere tıkla, ortak katot/anot ve BCD sürücüyü karşılaştır; 4 haneli multiplexing\'i ağır çekimde izle.', blocks: [{ t: 'dg', id: 'seg7', digit: 3 }, { t: 'dg', id: 'run', apps: ['u26', 'u25', 'k12'] }] },
    { id: 'alistirma', icon: '✎', title: 'Hesap alıştırması', sub: 'Her seferinde yeni soru', text: 'Vize hesap soruları bu tiplerden çıkar. Her gün birkaç tur çöz: kısa ve sık tekrar, tek uzun çalışmadan daha kalıcıdır.', blocks: [
      { t: 'dg', id: 'quiz', types: ['tris', 'port'] }, { t: 'dg', id: 'quiz', types: ['timer'] }, { t: 'dg', id: 'quiz', types: ['tmrcode'] },
      { t: 'dg', id: 'quiz', types: ['ieee', 'ieeer'] }, { t: 'dg', id: 'quiz', types: ['size', 'overlap'] }, { t: 'dg', id: 'quiz', types: ['shift'] },
      { t: 'dg', id: 'quiz', types: ['seg', 'digit'] }, { t: 'dg', id: 'quiz', types: ['base', 'twos'] }, { t: 'dg', id: 'quiz', types: ['option'] }, { t: 'dg', id: 'quiz', types: ['adc', 'nyq'] }] },
    { id: 'kaydedici', icon: '▦', title: 'Kaydedici düzenleyici', sub: 'INTCON, OPTION_REG, ADCON…', text: 'Bir kaydedici seç, bitlere tıkla: hex değeri ve her bitin anlamı çıksın.', regs: true },
    { id: 'zaman', icon: '◷', title: 'Zamanlayıcı', sub: 'TMR hesabı, Timer0 içi', text: 'TMR0 / TMR1 hesabı ve Timer0\'ın içini adım adım izleme.', blocks: [{ t: 'dg', id: 'timercalc', fosc: 4, delay: 1 }, { t: 'dg', id: 'tmr0', fosc: 4, ps: 4, tmr: 6 }] },
    { id: 'adc', icon: '∿', title: 'ADC', sub: 'Hesap, potansiyometre, örnekleme', text: 'Çözünürlük, adım ve çıkış hesabı; potansiyometre simülasyonu; örnekleme.', blocks: [{ t: 'dg', id: 'adccalc' }, { t: 'dg', id: 'adcsim' }, { t: 'dg', id: 'sampling' }] },
    { id: 'kesme', icon: '⚡', title: 'Kesmeler', sub: 'Mantık diyagramı, adımlar', text: 'Kesme mantığı ve kesme işlem adımları.', blocks: [{ t: 'dg', id: 'intlogic' }, { t: 'dg', id: 'intflow' }] },
    { id: 'bellek', icon: '▤', title: 'Bellek ve veri tipleri', sub: 'RAM haritası, absolute, ALU', text: 'RAM haritası, değişkenlerin baytları, ALU bayrakları.', blocks: [{ t: 'dg', id: 'memmap' }, { t: 'dg', id: 'mem', preset: 'deney1' }, { t: 'dg', id: 'mem', preset: 'u2' }, { t: 'dg', id: 'mem', preset: 'u3' }, { t: 'dg', id: 'alu' }] },
    { id: 'sayi', icon: '01', title: 'Sayılar ve bitler', sub: 'Taban, ikiye tümleme, IEEE 754', text: 'Taban dönüşümü, ikiye tümleme, IEEE 754 ve bit operatörleri.', blocks: [{ t: 'dg', id: 'numconv' }, { t: 'dg', id: 'float' }, { t: 'dg', id: 'bitops' }] }
  ];

  const REGS = ['TRISB', 'PORTB', 'STATUS', 'INTCON', 'OPTION_REG', 'ADCON0', 'ADCON1', 'PIE1', 'PIR1', 'T1CON'];
  const REG_VALS = { STATUS: 0x18, INTCON: 0xa0, OPTION_REG: 0x01, ADCON0: 0x45, ADCON1: 0x4e, PIE1: 0x40, T1CON: 0x31 };

  function render(root, parts) {
    const s = SECTIONS.find((x) => x.id === parts[1]);
    const tabs = `<div class="lab-toc">${SECTIONS.map((x) => `<a class="tab${x === s ? ' active' : ''}" href="#/lab/${x.id}">${x.title}</a>`).join('')}</div>`;
    let body;
    if (!s) {
      body = `<h1 class="pg-title">Laboratuvar araçları</h1>
        <p class="hint">Derslerdeki simülatör ve hesaplayıcıların hepsi. Bir gruba gir; laboratuvardan önce föydeki kodu burada dene, hesaplarını kontrol et.</p>
        <div class="lab-cards">${SECTIONS.map((x) => `<a class="card lab-card" href="#/lab/${x.id}"><span class="lab-ic">${x.icon}</span><b>${x.title}</b><small>${x.sub}</small></a>`).join('')}</div>`;
    } else {
      body = `${tabs}<section class="lab-sec"><h1 class="pg-title">${s.title}</h1><p class="hint">${s.text}</p>
        ${s.regs ? `<div class="tabs" data-o="regtabs" style="margin:10px 0">${REGS.map((r) => `<button class="tab${r === 'INTCON' ? ' active' : ''}" type="button" data-reg="${r}">${r}</button>`).join('')}</div><div data-o="reghost">${MC.dg.render({ t: 'dg', id: 'reg', reg: 'INTCON', value: 0xa0 })}</div>` : ''}
        ${(s.blocks || []).map((b) => MC.dg.render(b.id === 'run' ? Object.assign({}, b, { apps: b.apps === 'CODE' ? MC.codeApps : b.apps, start: parts[2] }) : b)).join('')}</section>`;
    }
    root.innerHTML = `<div class="page">${MC.pageTop(s ? `<a href="#/lab">Laboratuvar</a> › <b>${s.title}</b>` : '<b>Laboratuvar</b>')}<div class="page-inner">${body}</div></div>`;
    MC.dg.mount(root);
    const rt = root.querySelector('[data-o="regtabs"]');
    if (rt) {
      rt.addEventListener('click', (e) => {
        const b = e.target.closest('[data-reg]');
        if (!b) return;
        rt.querySelectorAll('[data-reg]').forEach((x) => x.classList.toggle('active', x === b));
        const host = root.querySelector('[data-o="reghost"]');
        host.innerHTML = MC.dg.render({ t: 'dg', id: 'reg', reg: b.dataset.reg, value: REG_VALS[b.dataset.reg] || 0 });
        MC.dg.mount(host);
      });
    }
  }

  MC.lab = { render, sections: SECTIONS };
})(window.MC);
