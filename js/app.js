/*
 * app.js — adres çubuğundaki #/... rotasına göre sayfayı çizer ve çekmece menüyü yönetir.
 */
(function (MC) {
  'use strict';

  const view = document.getElementById('view');
  const side = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const nav = document.getElementById('nav');

  const openMenu = () => { buildNav(); side.classList.add('open'); scrim.classList.add('show'); };
  const closeMenu = () => { side.classList.remove('open'); scrim.classList.remove('show'); };
  MC.app = { openMenu, closeMenu };

  function buildNav() {
    const prog = MC.learnProgress();
    const hash = location.hash || '#/';
    const item = (href, num, title, sub, extra) => `<a class="nav-item${hash === href || (href.length > 3 && hash.startsWith(href + '/')) ? ' active' : ''}" href="${href}"><span class="nav-num">${num}</span><span><span class="nav-title">${title}</span><span class="nav-sub">${sub}</span></span>${extra || ''}</a>`;
    nav.innerHTML = `<div class="nav-label">Ders · %${prog.overall}</div>
      ${item('#/', '▶', 'Başlangıç', 'Kaldığın yerden devam et')}
      ${item('#/plan', '≡', 'Genel bakış', 'Yöntem, haftalar, değerlendirme')}
      ${MC.lessons.chapters.map((ch) => { const p = prog.chapters.find((x) => x.id === ch.id); return item(`#/b/${ch.id}`, `B${ch.num}`, ch.title, ch.navSub, `<span class="nav-pct${p.pct === 100 ? ' done' : ''}">${p.read}/${p.total}</span>`); }).join('')}
      <div class="nav-label">Tekrar ve pratik</div>
      ${item('#/sorular', '?', 'Hocanın soruları', `${(MC.teacherQuestions || []).length} soru · aralıklı tekrar`)}
      ${item('#/lab', '⚙', 'Laboratuvar araçları', 'Simülatör, hesaplayıcı, alıştırma')}
      <p class="hint" style="margin:18px 8px 0">Kısayollar: <kbd>↓</kbd> <kbd>↑</kbd> <kbd>Boşluk</kbd> kartlar arasında geçer. İlerlemen yalnızca bu tarayıcıda saklanır.</p>`;
  }

  function route() {
    closeMenu();
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    if (parts[0] === 'lab') MC.lab.render(view, parts);
    else MC.learn.render(parts);
  }

  side.addEventListener('click', (e) => { if (e.target.closest('[data-act="menu-close"]') || e.target.closest('a')) closeMenu(); });
  scrim.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('hashchange', route);

  MC.learn.init(view);
  route();
})(window.MC);
