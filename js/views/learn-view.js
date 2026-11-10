/*
 * learn-view.js — ders akışı. İşletim Sistemleri projesindeki dikey kart akışının bu derse uyarlanmış hali.
 *
 * Rotalar:
 *   #/                         başlangıç ekranı (ilerleme çubuğu + büyük Başla düğmesi)
 *   #/plan                     genel bakış: çalışma yöntemi, bölümler, değerlendirme
 *   #/b/ch3                    bölüm sayfası (ders listesi)
 *   #/b/ch3/tris[/4|/son]      ders: dikey kart akışı (kart numarası isteğe bağlı)
 *   #/b/ch3/konular            bölüm girişi (işlenecek konular ve kavramlar)
 *   #/b/ch3/tekrar             bölüm sonu tekrarı
 *   #/sorular[/d4-1]           hocanın ve föylerin soruları (aralıklı tekrar)
 *
 * Ders blokları: p, h, def, list, compare, table, code, codex, note, dg, solve, br. (Ayrıntı: README)
 * İlerleme tarayıcıda (localStorage) tutulur; erişilemezse site yine çalışır.
 */
(function (MC) {
  'use strict';

  const esc = MC.esc;
  const today = MC.today;

  /* ------------------------------------------------------------ ilerleme kaydı */
  const Store = {
    key: 'uclab.learn.v1',
    data: { read: {}, seen: {}, q: {}, checks: {}, drafts: {} },
    load() { const raw = MC.store.get(this.key, null); if (raw) Object.assign(this.data, raw); },
    save() { MC.store.set(this.key, this.data); }
  };
  Store.load();
  MC.learnStore = Store;

  // Kutu: 0 yeni, 1 tekrar et, 2 gelişiyor, 3 öğrenildi
  const BOX = [{ id: 0, label: 'Yeni', cls: 'b0' }, { id: 1, label: 'Tekrar et', cls: 'b1' }, { id: 2, label: 'Gelişiyor', cls: 'b2' }, { id: 3, label: 'Öğrenildi', cls: 'b3' }];
  const qState = (id) => Store.data.q[id] || { box: 0 };

  /* ------------------------------------------------------------ veri yardımcıları */
  const chapters = () => MC.lessons.chapters;
  const findChapter = (id) => chapters().find((c) => c.id === id);
  const lessonKey = (ch, l) => `${ch.id}/${l.id}`;
  const isRead = (ch, l) => !!Store.data.read[lessonKey(ch, l)];
  const allLessons = () => chapters().flatMap((ch) => ch.lessons.map((l, i) => ({ ch, l, i })));
  const questions = () => MC.teacherQuestions || [];
  const questionsFor = (key) => questions().filter((q) => q.lesson === key || q.lesson.startsWith(key + '/'));
  const lessonHref = (ch, l) => `#/b/${ch.id}/${l.id}`;
  const lessonSource = (l) => l.src;

  function chapterProgress(ch) {
    const read = ch.lessons.filter((l) => isRead(ch, l)).length;
    return { read, total: ch.lessons.length, pct: Math.round((read / ch.lessons.length) * 100) };
  }
  const nextLesson = () => allLessons().find(({ ch, l }) => !isRead(ch, l)) || null;

  /* ------------------------------------------------------------ bölüm girişi ve tekrarı (sanal dersler) */
  const introCache = new Map();
  const introOf = (ch) => { if (!introCache.has(ch)) introCache.set(ch, { id: 'konular', intro: true, title: `Bölüm ${ch.num}: ${ch.title}`, checks: [] }); return introCache.get(ch); };
  const reviewCache = new Map();
  const reviewOf = (ch) => { if (!reviewCache.has(ch)) reviewCache.set(ch, { id: 'tekrar', review: true, title: `Bölüm ${ch.num} tekrarı`, checks: [] }); return reviewCache.get(ch); };

  function nextOf(ch, l) {
    const ci = chapters().indexOf(ch);
    if (l.review) { const nc = chapters()[ci + 1]; return nc ? { ch: nc, l: introOf(nc) } : null; }
    if (l.intro) return { ch, l: ch.lessons[0] };
    const i = ch.lessons.indexOf(l);
    return i < ch.lessons.length - 1 ? { ch, l: ch.lessons[i + 1] } : { ch, l: reviewOf(ch) };
  }
  function prevOf(ch, l) {
    if (l.review) return { ch, l: ch.lessons[ch.lessons.length - 1] };
    if (l.intro) { const pc = chapters()[chapters().indexOf(ch) - 1]; return pc ? { ch: pc, l: reviewOf(pc) } : null; }
    const i = ch.lessons.indexOf(l);
    return i > 0 ? { ch, l: ch.lessons[i - 1] } : { ch, l: introOf(ch) };
  }

  const SOURCE = { teacher: 'Hocanın sorusu', lab: 'Deney föyü', lesson: 'Ders sorusu' };
  const sourceBadge = (kind, label) => `<span class="src-badge src-${kind}">${label || SOURCE[kind]}</span>`;

  function reviewPool(ch) {
    const pool = [];
    questions().filter((q) => q.lesson.split('/')[0] === ch.id)
      .forEach((q) => pool.push({ id: `tq:${q.id}`, kind: q.kind || 'teacher', ch, q: q.q, a: q.a, set: q.set }));
    ch.lessons.forEach((l) => (l.checks || []).forEach((c, n) => pool.push({ id: `${lessonKey(ch, l)}#${n}`, kind: 'lesson', ch, l, q: c.q, a: c.a })));
    return pool;
  }

  // Aynı gün aynı sırayı veren tohumlu karıştırma (kart adresleri gün içinde değişmesin)
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  const shuffle = (xs, rnd) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Önce bilemediklerin, sonra cevaplamadıkların, en son bildiklerin
  const rank = (x) => ({ bad: 0, ok: 2 })[Store.data.checks[x.id]] ?? 1;
  const pick = (xs, n, rnd) => shuffle(xs, rnd).sort((a, b) => rank(a) - rank(b)).slice(0, n);

  function buildReview(ch) {
    const rnd = seeded(`${ch.id}|${today()}`);
    const pool = reviewPool(ch);
    const own = shuffle([...pick(pool.filter((x) => x.kind !== 'lesson'), 9, rnd), ...pick(pool.filter((x) => x.kind === 'lesson'), 6, rnd)], rnd);
    const before = chapters().slice(0, chapters().indexOf(ch));
    const prev = shuffle(pick(before.flatMap((c) => pick(reviewPool(c), 4, rnd)), 10, rnd), rnd);
    const cards = [{ kind: 'open', own: own.length, prev: prev.length, before }];
    own.forEach((item) => cards.push({ kind: 'rq', item }));
    if (prev.length) cards.push({ kind: 'rqsep', before, n: prev.length });
    prev.forEach((item) => cards.push({ kind: 'rq', item }));
    cards.push({ kind: 'end' });
    cards.filter((c) => c.kind === 'rq').forEach((c, i, all) => { c.n = i + 1; c.total = all.length; });
    return cards;
  }

  /* ------------------------------------------------------------ blok çizimi */
  const NOTE = { exam: 'Sınav notu', extra: 'Ek bilgi (slaytta yok)', fix: 'Slayttan farklı / dikkat', lab: 'Laboratuvar', info: 'Not' };

  function renderBlock(bl) {
    switch (bl.t) {
      case 'p': return `<p>${bl.html}</p>`;
      case 'def': return `<div class="l-def"><div class="l-def-term">${bl.term}${bl.en ? ` <span>${bl.en}</span>` : ''}</div><div class="l-def-body">${bl.html}</div></div>`;
      case 'list': { const tag = bl.ordered ? 'ol' : 'ul'; return `<${tag} class="l-list">${bl.items.map((x) => `<li>${x}</li>`).join('')}</${tag}>`; }
      case 'compare': return `<div class="l-compare">${bl.cols.map((c) => `<div class="l-cmp"><b>${c.title}</b><ul>${c.items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>`;
      case 'table': return `<div class="table-wrap l-table"><table><thead><tr>${bl.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${bl.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'code': return `<pre class="l-code">${esc(bl.text)}</pre>`;
      case 'codex': return `<div class="l-codex">${bl.title ? `<div class="cx-title">${bl.title}</div>` : ''}${bl.rows.map(([code, note]) => `<div class="cx-row"><pre class="cx-c">${esc(code)}</pre><div class="cx-n">${note}</div></div>`).join('')}</div>`;
      case 'note': return `<div class="l-note ${bl.kind}"><span class="l-note-label">${bl.label || NOTE[bl.kind] || 'Not'}</span><div>${bl.html}</div></div>`;
      case 'dg': return MC.dg.render(bl);
      case 'solve': return `<div class="l-solve"><span class="tag">${bl.title}</span><p class="l-solve-q">${bl.q}</p><button class="btn btn-primary btn-sm" type="button" data-act="solve">Çözümü göster</button><div class="l-solve-a" hidden>${bl.a}</div></div>`;
      default: return '';
    }
  }
  const progressBar = (pct) => `<div class="l-bar"><i style="width:${pct}%"></i></div>`;

  /* ------------------------------------------------------------ kartlara bölme */
  // Bir kartın görsel yükü bu sınırı geçmez: birlikte akılda tutulacak bilgiler aynı ekranda kalır,
  // ama ekran kitap sayfası gibi cümleyle dolmaz. Başlık (h) yeni bir konu birimidir ve yeni ekran açar.
  const CARD_BUDGET = 1100;
  const textLen = (html) => (html || '').replace(/<[^>]+>/g, '').length;
  function weight(bl) {
    switch (bl.t) {
      case 'p': return textLen(bl.html) * 1.15;
      case 'def': return textLen(bl.html) + 90;
      case 'note': return textLen(bl.html) + 40;
      case 'list': return bl.items.reduce((s, x) => s + textLen(x) + 25, 0);
      case 'compare': return bl.cols.reduce((s, c) => s + c.items.reduce((a, x) => a + textLen(x) + 20, 60), 0);
      case 'table': return (bl.rows.length + 1) * 55 + bl.rows.flat().reduce((s, x) => s + textLen(x), 0) * 0.6;
      case 'code': return bl.text.split('\n').length * 38;
      case 'codex': return bl.rows.reduce((s, [c, n]) => s + Math.max(c.split('\n').length * 50, textLen(n) * 1.9 + 45), 60);
      case 'dg': return 700;
      default: return 400;
    }
  }
  const WIDE = new Set(['dg', 'table', 'compare', 'code', 'codex', 'solve']);
  const cardCache = new Map();

  // Hocanın sorularının değindiği kartlara uyarı kutusu: "focus" ifadesi kart metninde geçiyorsa
  function markTeacherCards(ch, l, cards) {
    const qs = questionsFor(lessonKey(ch, l));
    if (!qs.length) return;
    const content = cards.filter((c) => c.blocks);
    const text = (c) => `${c.h || ''} ${JSON.stringify(c.blocks)}`.replace(/<[^>]+>/g, ' ');
    qs.forEach((q) => {
      const rx = q.focus ? new RegExp(q.focus, 'i') : null;
      let hits = rx ? content.filter((c) => rx.test(text(c))).slice(0, 2) : [];
      if (!hits.length && content.length) hits = [content[0]];
      hits.forEach((c) => (c.tq = c.tq || []).push(q));
    });
  }

  function teacherFlag(list) {
    const shown = list.slice(0, 2);
    return `<aside class="tq-flag" role="note"><span class="tq-flag-label">★ Hocanın / föyün sorularında geçiyor</span>
      <ul>${shown.map((q) => `<li><a href="#/sorular/${q.id}">${esc(q.q.replace(/<[^>]+>/g, '').length > 160 ? `${q.q.replace(/<[^>]+>/g, '').slice(0, 150).replace(/\s+\S*$/, '')} …` : q.q.replace(/<[^>]+>/g, ''))}</a></li>`).join('')}</ul>
      <small>${list.length > 2 ? `ve ${list.length - 2} soru daha. ` : ''}Bu kartı dikkatle oku.</small></aside>`;
  }

  function buildCards(ch, l) {
    if (cardCache.has(l)) return cardCache.get(l);
    let cards;
    if (l.review) cards = buildReview(ch);
    else if (l.intro) cards = [{ kind: 'chintro' }];
    else {
      cards = [{ kind: 'open' }];
      let sec = null;
      let unit = [];
      const kindOf = (blocks) => {
        if (blocks.some((b) => WIDE.has(b.t))) return 'wide';
        if (blocks[0].t === 'def' && blocks.every((b, i) => i === 0 || b.t === 'note')) return 'def';
        return 'read';
      };
      const emit = (blocks, h) => { if (blocks.length) cards.push({ kind: kindOf(blocks), h, blocks }); };
      const closeUnit = () => {
        if (!unit.length) return;
        const groups = [];
        unit.forEach((bl, i) => {
          const prev = groups[groups.length - 1];
          // Şekli veya listeyi tanıtan paragraf onunla kalır; not açıkladığı bloğun yanında durur
          const leadIn = prev && prev.length === 1 && prev[0].t === 'p' && unit[i - 1] === prev[0] && bl.t !== 'p' && bl.t !== 'def';
          if (prev && (bl.t === 'note' || leadIn)) prev.push(bl);
          else groups.push([bl]);
        });
        let cur = [];
        let size = 0;
        groups.forEach((g) => {
          const w = g.reduce((s, b) => s + weight(b), 0);
          if (cur.length && size + w > CARD_BUDGET) { emit(cur, sec); cur = []; size = 0; }
          cur = cur.concat(g);
          size += w;
        });
        emit(cur, sec);
        unit = [];
      };
      l.blocks.forEach((bl) => {
        if (bl.t === 'h') { closeUnit(); sec = bl.text; } else if (bl.t === 'br') closeUnit();
        else if (bl.t === 'solve') { closeUnit(); cards.push({ kind: 'wide', h: sec, blocks: [bl] }); } else unit.push(bl);
      });
      closeUnit();
      markTeacherCards(ch, l, cards);
      (l.checks || []).forEach((c, i) => cards.push({ kind: 'check', check: c, n: i }));
      cards.push({ kind: 'end' });
    }
    cardCache.set(l, cards);
    return cards;
  }

  const lastCard = (ch, l) => buildCards(ch, l).length - 1;
  const seenCard = (ch, l) => Math.min(Store.data.seen[lessonKey(ch, l)] || 0, lastCard(ch, l));
  const lessonFill = (ch, l) => (isRead(ch, l) ? 100 : Math.round((seenCard(ch, l) / lastCard(ch, l)) * 100));
  const overallPct = () => { const all = allLessons(); return Math.round(all.reduce((s, { ch, l }) => s + lessonFill(ch, l), 0) / all.length); };
  MC.learnProgress = () => ({ overall: overallPct(), chapters: chapters().map((ch) => ({ id: ch.id, ...chapterProgress(ch) })) });

  /* ------------------------------------------------------------ üst ilerleme çubuğu */
  function renderTop(active, caption) {
    return `<header class="fx-top">
      <button class="icon-btn" type="button" data-act="menu" aria-label="Menüyü aç">☰</button>
      <div class="fx-progress"><div class="fx-bar">${chapters().map((ch) => `<div class="fx-ch" style="flex-grow:${ch.lessons.length}">
        <div class="fx-segs">${ch.lessons.map((l) => `<a class="fx-seg${isRead(ch, l) ? ' read' : ''}${active === l ? ' active' : ''}" href="${lessonHref(ch, l)}" title="Bölüm ${ch.num} · ${esc(l.title)}" aria-label="Bölüm ${ch.num}: ${esc(l.title)}"><span><i style="width:${lessonFill(ch, l)}%"></i></span></a>`).join('')}</div>
        ${caption ? '' : `<div class="fx-chname"><span>${ch.short || ch.title}</span><small>${chapterProgress(ch).read}/${ch.lessons.length}</small></div>`}
      </div>`).join('')}</div>${caption || ''}</div>
      <span class="fx-pct" id="fx-pct">%${overallPct()}</span>
    </header>`;
  }

  /* ------------------------------------------------------------ sayfalar */
  function pageHome() {
    const nl = nextLesson();
    const started = allLessons().some(({ ch, l }) => isRead(ch, l) || seenCard(ch, l) > 0);
    const toIntro = nl && nl.l === nl.ch.lessons[0] && !seenCard(nl.ch, nl.l) && !isRead(nl.ch, introOf(nl.ch));
    const action = nl
      ? `<a class="fx-start-btn" href="${toIntro ? lessonHref(nl.ch, introOf(nl.ch)) : lessonHref(nl.ch, nl.l)}">▶ ${started ? 'Devam et' : 'Başla'}</a>
         <p class="fx-start-next">Sıradaki: <b>Bölüm ${nl.ch.num} · ${nl.l.title}</b></p>`
      : `<a class="fx-start-btn" href="#/sorular">▶ Tekrar et</a><p class="fx-start-next">Tüm dersleri bitirdin. Şimdi hocanın sorularıyla tekrar et.</p>`;
    return `<div class="fx">${renderTop(null)}
      <section class="fx-start"><span class="tag">BLM3007 · Dr. Timur İnan · Vize hazırlığı</span>
        <h2>Mikrodenetleyiciler</h2><p class="fx-start-sub">PIC16F877A · mikroC · konu konu, simülasyonlu</p>
        ${action}
        <div class="fx-start-links"><a class="btn btn-sm" href="#/plan">Genel bakış</a><a class="btn btn-sm" href="#/sorular">Hocanın soruları</a><a class="btn btn-sm" href="#/lab">Laboratuvar araçları</a></div>
      </section></div>`;
  }

  function pageOverview() {
    const qs = questions();
    const learned = qs.filter((q) => qState(q.id).box === 3).length;
    const total = allLessons().length;
    const readAll = allLessons().filter(({ ch, l }) => isRead(ch, l)).length;
    const method = [
      ['1', 'Tahmin et', 'Okumadan önce düşün', 'Her ders bir soruyla açılır. Bilmesen de tahmin et: önce denemek, sonraki okumayı daha kalıcı yapar (pretesting).'],
      ['2', 'Oku + gör', 'Kısa kartlar, etkileşimli şekiller', 'Tanım, tablo ve şekil aynı ekranda. Bitlere tıkla, kodu satır satır çalıştır: sözel + görsel kodlama (dual coding).'],
      ['3', 'Hesapla', 'Sınırsız alıştırma', 'TRIS, Timer0, ADC soruları her seferinde yeni sayılarla gelir. Hesap sorusu ancak yapılarak öğrenilir.'],
      ['4', 'Hatırla', 'Kendini yokla', 'Ders sonunda cevaba bakmadan cevapla. Hatırlamaya çalışmak tekrar okumaktan daha kalıcıdır (testing effect).'],
      ['5', 'Aralıklı tekrar', 'Hocanın soruları', 'Slayt ve föy soruları. Bilemediklerin sık gelir; "Öğrenildi" için farklı günlerde iki kez bilmen gerekir (spacing effect).']
    ];
    const plan = [
      ['1–2', 'Mikrodenetleyiciye giriş, CPU, anayollar, mimari, PIC16F877A, bellek, assembly, kaydediciler, port yapıları', 'ch1, ch2, ch3', 'Deney 1–2'],
      ['3', 'mikroC ile programlama: tipler, diziler, absolute/org, operatörler; kesmelere giriş', 'ch4, ch6', 'Deney 1'],
      ['4–5', 'Giriş/çıkış işlemleri: TRIS/PORT, LED ve buton uygulamaları', 'ch5', 'Deney 3'],
      ['3 (devam)', 'Kesmeler, INTCON, harici kesme', 'ch6', 'Deney 4'],
      ['6', 'Zamanlayıcılar: Timer0/1/2, ön ölçekleme, gecikme hesabı', 'ch7', 'Deney 5'],
      ['7', 'Analog-sayısal çevrim (ADC)', 'ch8', '—']
    ];
    return `<div class="page"><div class="page-inner">
      <nav class="l-crumbs"><a href="#/">Başlangıç</a> › Genel bakış</nav>
      <section class="card l-chhead"><span class="tag">BLM3007 · Mikrodenetleyiciler · PIC16F877A</span><h2>Genel bakış</h2>
        <div class="qx-stats" style="grid-template-columns:repeat(2,minmax(0,220px))"><div class="mini-stat"><span>Okunan ders</span><b>${readAll} / ${total}</b></div><div class="mini-stat"><span>Öğrenilen soru</span><b>${learned} / ${qs.length}</b></div></div>
        <div class="btn-row"><a class="btn btn-primary" href="#/">▶ Derse dön</a><a class="btn" href="#/sorular">Hocanın soruları</a><a class="btn" href="#/lab">Laboratuvar araçları</a></div></section>
      <h3 class="l-section">Nasıl çalışmalı? 5 adımlı döngü</h3>
      <div class="l-method">${method.map(([n, t, s, d]) => `<div class="l-step"><span class="l-step-n">${n}</span><b>${t}</b><small>${s}</small><p>${d}</p></div>`).join('')}</div>
      <h3 class="l-section">Bölümler</h3>
      <div class="l-chapters">${chapters().map((ch) => { const p = chapterProgress(ch); const qn = questionsFor(ch.id).length; return `<a class="card l-chcard" href="#/b/${ch.id}"><span class="l-chnum">Bölüm ${ch.num} · ${ch.week}</span><b>${ch.title}</b><small>${ch.source}</small>${progressBar(p.pct)}<span class="l-chmeta">${p.read}/${p.total} ders${qn ? ` · ${qn} soru` : ''}</span></a>`; }).join('')}</div>
      <h3 class="l-section">Değerlendirme (slayt 4)</h3>
      <div class="card"><div class="table-wrap"><table><tbody>
        <tr><td>Dönem içi (%50)</td><td>%50 laboratuvar + %50 vize</td></tr>
        <tr><td>Dönem sonu (%50)</td><td>%50 proje + %50 final</td></tr>
        <tr><td>Proje</td><td>Zorunlu, 3 kişilik gruplar; almak ve sunmak şart</td></tr>
        <tr><td>Laboratuvar</td><td>Cuma, 3 kişilik gruplar; föyler önceden çıktı alınıp doldurulur, onaylatılarak teslim edilir</td></tr>
      </tbody></table></div><p class="hint">Laboratuvar dönem içi notunun yarısı olduğu için deney föylerinin soruları da bu sitede "Deney föyü" etiketiyle var.</p></div>
      <h3 class="l-section">Haftalar ve bu sitedeki karşılıkları</h3>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>Hafta</th><th>Konu</th><th>Bölüm</th><th>Lab</th></tr></thead><tbody>
        ${plan.map(([w, t, c, lab]) => `<tr><td class="num">${w}</td><td>${t}</td><td>${c.split(', ').map((id) => `<a class="pill b2" href="#/b/${id}">B${findChapter(id).num}</a>`).join(' ')}</td><td>${lab}</td></tr>`).join('')}
      </tbody></table></div><p class="hint">Bölüm sırası öğrenme sırasıdır: önce donanım (portların yapısı), sonra C, sonra uygulamalar. Kesmeler hafta 3'te başlayıp hafta 6'daki zamanlayıcılara bağlandığı için zamanlayıcılardan hemen önce gelir.</p></div>
    </div></div>`;
  }

  function pageChapter(ch) {
    const p = chapterProgress(ch);
    const firstUnread = ch.lessons.find((l) => !isRead(ch, l)) || ch.lessons[0];
    const qn = questionsFor(ch.id);
    return `<div class="page"><div class="page-inner">
      <nav class="l-crumbs"><a href="#/plan">Genel bakış</a> › Bölüm ${ch.num}</nav>
      <section class="card l-chhead"><span class="tag">Bölüm ${ch.num} · ${ch.week} · ${ch.source}</span>
        <h2>${ch.title}</h2>${progressBar(p.pct)}
        <p class="muted">${p.read}/${p.total} ders tamamlandı · yaklaşık ${ch.lessons.reduce((s, l) => s + l.minutes, 0)} dakika</p>
        <h4>Bu bölümün sonunda şunları yapabilmelisin</h4><ul class="l-list">${ch.objectives.map((o) => `<li>${o}</li>`).join('')}</ul>
        <div class="btn-row"><a class="btn btn-primary" href="${lessonHref(ch, firstUnread)}">▶ ${p.read ? 'Devam et' : 'Başla'}: ${firstUnread.title}</a>
        <a class="btn" href="#/b/${ch.id}/konular">Konular ve kavramlar</a><a class="btn" href="#/b/${ch.id}/tekrar">Bölüm ${ch.num} tekrarı</a>
        ${qn.length ? `<a class="btn" href="#/sorular">Bu bölümden ${qn.length} soru</a>` : ''}</div></section>
      <ol class="l-lessonlist">${ch.lessons.map((l, i) => `<li><a class="card l-lessonrow${isRead(ch, l) ? ' read' : ''}" href="${lessonHref(ch, l)}"><span class="l-ln">${isRead(ch, l) ? '✓' : i + 1}</span>
        <span><b>${l.title}${l.lab ? '<span class="lab-tag">LAB</span>' : ''}</b><small>${lessonSource(l)} · ~${l.minutes} dk${questionsFor(lessonKey(ch, l)).length ? ` · ${questionsFor(lessonKey(ch, l)).length} soru` : ''}</small></span></a></li>`).join('')}</ol>
    </div></div>`;
  }

  /* ------------------------------------------------------------ kart akışı */
  function renderCard(card, i, ctx) {
    const { ch, l, key, idx, cards, next } = ctx;
    let inner;
    if (card.kind === 'chintro') {
      const o = ch.outline;
      const num = (id) => ch.lessons.findIndex((x) => x.id === id) + 1;
      inner = `<span class="tag">Bölüm ${ch.num} · ${ch.lessons.length} ders · ${ch.week}</span>
        <h2 class="fx-title">${ch.title}</h2><p class="fx-sub">${ch.source}</p>
        <div class="ci-grid"><section><h4 class="ci-h">Bu bölümde işlenecek konular</h4>
          <ol class="ci-topics">${o.topics.map(([t, id]) => { const le = ch.lessons.find((x) => x.id === id); return `<li>${le ? `<a href="${lessonHref(ch, le)}">${t}</a><small>Ders ${num(id)}</small>` : t}</li>`; }).join('')}</ol></section>
          <section><h4 class="ci-h">Öğrenilecek kavramlar</h4><div class="ci-chips">${o.concepts.map((c) => `<span>${c}</span>`).join('')}</div>
          ${o.why ? `<p class="hint" style="margin-top:14px">${o.why}</p>` : ''}</section></div>
        <div class="btn-row"><a class="btn btn-primary fx-next" href="${lessonHref(ch, ch.lessons[0])}">Başla: ${ch.lessons[0].title} ▶</a></div>`;
    } else if (l.review && card.kind === 'open') {
      const range = card.before.length > 1 ? `Bölüm 1–${card.before.length}` : 'Bölüm 1';
      inner = `<span class="tag">Bölüm ${ch.num} · Tekrar</span><h2 class="fx-title">${l.title}</h2>
        <p class="fx-sub">${card.own} soru bu bölümden${card.prev ? ` · ardından ${card.prev} soru ${range}'den karışık` : ''}</p>
        <div class="fx-pre"><span class="l-note-label">Nasıl çalışır?</span><p class="rv-legend">${sourceBadge('teacher')} ${sourceBadge('lab')} ${sourceBadge('lesson')}</p>
        <small>Her sorunun üstünde nereden geldiği yazar. Önce cevabı kendin düşün, sonra aç ve "Bildim / Bilemedim" de. Bilemediklerin sonraki tekrarlarda önce gelir.</small></div>`;
    } else if (card.kind === 'rqsep') {
      inner = `<span class="tag">Karışık tekrar</span><h2 class="fx-title">Önceki bölümler</h2><p class="fx-sub">Şimdi ${card.before.map((c) => `Bölüm ${c.num}`).join(', ')} içinden karışık ${card.n} soru geliyor.</p>`;
    } else if (card.kind === 'rq') {
      const it = card.item;
      const st = Store.data.checks[it.id];
      inner = `<div class="rq-head"><span class="tag">Bölüm ${it.ch.num} · Soru ${card.n} / ${card.total}</span>${sourceBadge(it.kind, it.set ? `${SOURCE[it.kind]} · ${it.set}` : null)}</div>
        ${it.l ? `<p class="rq-lesson">${esc(it.l.title)}</p>` : ''}
        <div class="fx-check${st ? ' ' + st : ''}" data-check="${it.id}"><p class="fx-check-q">${it.q}</p>
          <button class="btn" type="button" data-act="reveal">Cevabı göster</button>
          <div class="l-check-a" hidden><div class="rq-answer">${it.a}</div><div class="btn-row"><button class="btn btn-sm l-ok" type="button" data-act="ok">✓ Bildim</button><button class="btn btn-sm l-bad" type="button" data-act="bad">✗ Bilemedim</button></div></div></div>`;
    } else if (l.review && card.kind === 'end') {
      const items = cards.filter((c) => c.kind === 'rq').map((c) => c.item.id);
      const ok = items.filter((id) => Store.data.checks[id] === 'ok').length;
      const bad = items.filter((id) => Store.data.checks[id] === 'bad').length;
      inner = `<div class="fx-end"><span class="fx-end-mark" aria-hidden="true">✓</span><h2 class="fx-title">${l.title} tamam</h2>
        <p class="fx-sub">${ok} bildim · ${bad} bilemedim · ${items.length - ok - bad} işaretlenmedi</p>
        ${next ? `<a class="btn btn-primary fx-next" href="${lessonHref(next.ch, next.l)}">Bölüm ${next.ch.num}: ${next.ch.title} ▶</a>` : '<a class="btn btn-primary fx-next" href="#/sorular">Hocanın soruları ▶</a>'}
        <div class="btn-row"><a class="btn btn-sm" href="#/b/${ch.id}">Bölüm ${ch.num} dersleri</a></div></div>`;
    } else if (card.kind === 'open') {
      const pre = l.checks && l.checks[0];
      const qn = questionsFor(key).length;
      inner = `<span class="tag">Bölüm ${ch.num} · Ders ${idx + 1} / ${ch.lessons.length}${l.lab ? ' · <span style="color:#f472b6">LAB</span>' : ''}</span>
        <h2 class="fx-title">${l.title}</h2><p class="fx-sub">${lessonSource(l)} · ~${l.minutes} dk</p>
        ${qn ? `<p class="tq-lesson">★ Bu derse bağlı <b>${qn} hoca / föy sorusu</b> var. İlgili kartlarda sarı uyarı kutusu çıkar.</p>` : ''}
        ${pre ? `<div class="fx-pre"><span class="l-note-label">Okumadan önce düşün</span><p>${pre.q}</p><small>Bilmiyorsan da tahmin et. Ders sonunda kontrol edeceksin.</small></div>` : ''}`;
    } else if (card.kind === 'check') {
      const c = card.check;
      const id = `${key}#${card.n}`;
      const st = Store.data.checks[id];
      inner = `<div class="rq-head"><span class="tag">Kendini yokla · ${card.n + 1} / ${l.checks.length}</span>${sourceBadge('lesson')}</div>
        <div class="fx-check${st ? ' ' + st : ''}" data-check="${id}"><p class="fx-check-q">${c.q}</p>
          <button class="btn" type="button" data-act="reveal">Cevabı göster</button>
          <div class="l-check-a" hidden><p>${c.a}</p><div class="btn-row"><button class="btn btn-sm l-ok" type="button" data-act="ok">✓ Bildim</button><button class="btn btn-sm l-bad" type="button" data-act="bad">✗ Bilemedim</button></div></div></div>`;
    } else if (card.kind === 'end') {
      const rel = questionsFor(key);
      inner = `<div class="fx-end"><span class="fx-end-mark" aria-hidden="true">✓</span><h2 class="fx-title">Ders tamam</h2><p class="fx-sub">${l.title}</p>
        ${next ? `<a class="btn btn-primary fx-next" href="${lessonHref(next.ch, next.l)}">Sıradaki: ${next.l.title} ▶</a>` : '<a class="btn btn-primary fx-next" href="#/sorular">Hocanın soruları ▶</a>'}
        <div class="btn-row">${rel.length ? `<a class="btn btn-sm" href="#/sorular/${rel[0].id}">Bu dersten ${rel.length} soru</a>` : ''}<button class="btn btn-sm btn-ghost" type="button" data-act="restart">Dersi baştan al</button></div></div>`;
    } else {
      inner = `${card.tq ? teacherFlag(card.tq) : ''}${card.h ? `<h3 class="fx-h">${card.h}</h3>` : ''}<div class="l-body fx-body">${card.blocks.map(renderBlock).join('')}</div>`;
    }
    return `<section class="fx-card fx-${card.kind}" data-i="${i}" aria-label="Kart ${i + 1} / ${cards.length}"><div class="fx-inner">${inner}</div></section>`;
  }

  function pageFeed(ch, l) {
    const ctx = { ch, l, key: lessonKey(ch, l), idx: ch.lessons.indexOf(l), cards: buildCards(ch, l), next: nextOf(ch, l) };
    const caption = `<div class="fx-caption"><span>${ch.title} › <b>${l.title}</b></span><span class="fx-count" id="fx-count"></span></div>`;
    return `<div class="fx">${renderTop(l, caption)}
      <div class="fx-scroll" id="fx-scroll">${ctx.cards.map((c, i) => renderCard(c, i, ctx)).join('')}</div>
      <div class="fx-nav" id="fx-nav"><button class="btn fx-up" type="button" data-act="card-prev" aria-label="Önceki kart">↑</button><button class="btn btn-primary fx-down" type="button" data-act="card-next">Devam ↓</button></div></div>`;
  }

  // Akış durumu: { ch, l, idx, wheelAt, wheelGo } (akış dışında null)
  let F = null;
  let root = null;
  const feedScroller = () => root.querySelector('#fx-scroll');
  const feedCard = (i) => feedScroller().children[i];

  function refreshFeedUi() {
    root.querySelector('#fx-count').textContent = `${F.idx + 1} / ${lastCard(F.ch, F.l) + 1}`;
    root.querySelector('#fx-nav').classList.toggle('end', F.idx === lastCard(F.ch, F.l));
    const seg = root.querySelector('.fx-seg.active');
    if (seg) { seg.querySelector('i').style.width = `${lessonFill(F.ch, F.l)}%`; seg.classList.toggle('read', isRead(F.ch, F.l)); }
    root.querySelector('#fx-pct').textContent = `%${overallPct()}`;
  }

  // İlerleme yalnızca kullanıcı kaydırdığında işlenir; adresle bir karta atlamak dersi bitirmez
  function onFeedScroll() {
    const sc = feedScroller();
    const i = Math.round(sc.scrollTop / sc.clientHeight);
    if (i === F.idx || i < 0 || i > lastCard(F.ch, F.l)) return;
    F.idx = i;
    const key = lessonKey(F.ch, F.l);
    if (!F.l.intro && !F.l.review) {
      Store.data.seen[key] = Math.max(Store.data.seen[key] || 0, i);
      if (i === lastCard(F.ch, F.l) && !Store.data.read[key]) Store.data.read[key] = today();
      Store.save();
    }
    try { history.replaceState(null, '', `${lessonHref(F.ch, F.l)}/${i + 1}`); } catch (e) { /* adres güncellenmese de akış çalışır */ }
    refreshFeedUi();
  }

  function showCard(i) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    feedScroller().scrollTo({ top: feedCard(i).offsetTop, behavior: reduce ? 'auto' : 'smooth' });
  }
  // Kart ekrana sığmıyorsa önce kartın içi kayar, sonra sıradaki karta geçilir
  function scrollInsideCard(dir) {
    const card = feedCard(F.idx);
    const can = dir > 0 ? card.scrollTop + card.clientHeight < card.scrollHeight - 4 : card.scrollTop > 4;
    if (can) card.scrollBy({ top: dir * card.clientHeight * 0.8, behavior: 'smooth' });
    return can;
  }
  function step(dir) {
    if (scrollInsideCard(dir)) return;
    const i = F.idx + dir;
    if (i >= 0 && i <= lastCard(F.ch, F.l)) { showCard(i); return; }
    const to = dir > 0 ? nextOf(F.ch, F.l) : prevOf(F.ch, F.l);
    if (to) location.hash = dir > 0 ? lessonHref(to.ch, to.l) : `${lessonHref(to.ch, to.l)}/son`;
    else if (dir > 0) location.hash = '#/sorular';
  }
  // Tekerlek: tek jest bir kart; kaydırılabilir iç alanlar (kod, tablo) önce kendi içinde kayar
  function onFeedWheel(e) {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const dir = Math.sign(e.deltaY);
    const sc = feedScroller();
    for (let el = e.target; el && el !== sc; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1 || !/auto|scroll/.test(getComputedStyle(el).overflowY)) continue;
      if (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return;
    }
    e.preventDefault();
    const now = Date.now();
    const newGesture = now - F.wheelAt > 140;
    F.wheelAt = now;
    if (Math.abs(e.deltaY) < 4 || (!newGesture && now - F.wheelGo < 900)) return;
    const i = F.idx + dir;
    if (i >= 0 && i <= lastCard(F.ch, F.l)) { F.wheelGo = now; showCard(i); }
  }
  function onKey(e) {
    if (!F || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const onControl = /^(BUTTON|A|SUMMARY)$/.test(e.target.tagName);
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ' && !onControl) dir = e.shiftKey ? -1 : 1;
    if (!dir) return;
    e.preventDefault();
    step(dir);
  }
  function startFeed(ch, l, cardParam) {
    const last = lastCard(ch, l);
    let i = isRead(ch, l) ? 0 : seenCard(ch, l);
    if (cardParam === 'son') i = last;
    else if (cardParam) i = Math.min(Math.max((parseInt(cardParam, 10) || 1) - 1, 0), last);
    F = { ch, l, idx: i, wheelAt: 0, wheelGo: 0 };
    if (l.intro) { Store.data.read[lessonKey(ch, l)] = today(); Store.save(); }
    const sc = feedScroller();
    sc.scrollTop = feedCard(i).offsetTop;
    sc.addEventListener('scroll', () => requestAnimationFrame(() => { if (F && feedScroller() === sc) onFeedScroll(); }), { passive: true });
    sc.addEventListener('wheel', onFeedWheel, { passive: false });
    refreshFeedUi();
  }

  /* ------------------------------------------------------------ hocanın soruları */
  const Q = { mode: 'list', filter: 'all', ch: 'all', current: null, lastShown: null };

  function qCard(q, n) {
    const st = qState(q.id);
    const [chId, lId] = q.lesson.split('/');
    const ch = findChapter(chId);
    const l = ch && ch.lessons.find((x) => x.id === lId);
    return `<article class="card qx" id="q-${q.id}" data-q="${q.id}">
      <header class="qx-head"><span class="q-num">S${n}</span>${sourceBadge(q.kind || 'teacher')}<span class="q-topic">${esc(q.set)}</span>
        ${l ? `<a class="qx-lesson" href="${lessonHref(ch, l)}">Bölüm ${ch.num} · ${l.title}</a>` : ''}<span class="pill ${BOX[st.box].cls}">${BOX[st.box].label}</span></header>
      <p class="qx-q">${q.q}</p>
      <label class="qx-draft-l" for="d-${q.id}">Önce kendi cevabını yaz (isteğe bağlı, bu tarayıcıda saklanır)</label>
      <textarea class="qx-draft" id="d-${q.id}" rows="3" placeholder="Cevabını buraya yaz…">${esc(Store.data.drafts[q.id] || '')}</textarea>
      <div class="btn-row"><button class="btn btn-primary btn-sm" type="button" data-act="qreveal">Model cevabı göster</button>${q.try ? `<a class="btn btn-sm btn-ghost" href="${q.try}">▶ Sitede dene</a>` : ''}</div>
      <div class="qx-answer" hidden><div class="qx-model">${q.a}</div>
        <div class="qx-keys"><b>Cevabında bu anahtar noktalar var mıydı?</b>${q.keys.map((k, i) => `<label class="qx-key"><input type="checkbox" data-key="${i}"><span>${k}</span></label>`).join('')}<div class="qx-score"></div></div>
        <div class="qx-rate"><span>Kendini değerlendir:</span><button class="btn btn-sm l-bad" type="button" data-rate="bad">✗ Bilemedim</button><button class="btn btn-sm" type="button" data-rate="partial">~ Kısmen</button><button class="btn btn-sm l-ok" type="button" data-rate="good">✓ Bildim</button></div>
        <div class="qx-msg"></div></div>
    </article>`;
  }
  function qStats(list) { const c = [0, 0, 0, 0]; list.forEach((q) => c[qState(q.id).box]++); return c; }
  function pickNext(list) {
    const qs = list.filter((q) => q.id !== Q.lastShown);
    if (!qs.length) return list[0];
    const t = today();
    const prio = (q) => { const s = qState(q.id); if (s.box === 1) return 0; if (s.box === 0) return 1; if (s.box === 2) return s.day === t ? 4 : 2; return 5; };
    const best = Math.min(...qs.map(prio));
    const pool = qs.filter((q) => prio(q) === best);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function pageQuestions() {
    const all = questions();
    const qs = all.filter((q) => Q.ch === 'all' || q.lesson.split('/')[0] === Q.ch);
    const c = qStats(qs);
    const filters = [['all', 'Tümü'], ['1', 'Tekrar et'], ['0', 'Yeni'], ['2', 'Gelişiyor'], ['3', 'Öğrenildi']];
    let body;
    if (Q.mode === 'card') {
      if (!Q.current || !qs.find((q) => q.id === Q.current)) Q.current = qs.length ? pickNext(qs).id : null;
      const q = qs.find((x) => x.id === Q.current);
      body = q ? `<p class="hint">Karışık tekrar: sıradaki soru en az bildiklerinden seçilir. "Bildim" dediğin bir soru <b>aynı gün</b> "Öğrenildi" olmaz; başka bir gün yeniden sorulur.</p>${qCard(q, all.indexOf(q) + 1)}<div class="btn-row"><button class="btn btn-primary" type="button" data-act="nextq">Sonraki soru ▶</button></div>` : '<p class="empty">Soru yok.</p>';
    } else {
      const list = qs.filter((q) => Q.filter === 'all' || String(qState(q.id).box) === String(Q.filter));
      body = `<div class="tabs">${filters.map(([k, t]) => `<button type="button" class="tab${String(Q.filter) === k ? ' active' : ''}" data-filter="${k}">${t} (${k === 'all' ? qs.length : c[k]})</button>`).join('')}</div>
        ${list.length ? list.map((q) => qCard(q, all.indexOf(q) + 1)).join('') : '<p class="empty">Bu filtrede soru yok.</p>'}`;
    }
    return `<div class="page"><div class="page-inner">
      <nav class="l-crumbs"><a href="#/">Başlangıç</a> › Hocanın soruları</nav>
      <section class="card l-chhead"><span class="tag">Sınavda çıkabilir · ${all.length} soru</span><h2>Hocanın ve föylerin soruları</h2>
        <p>Slaytlardaki "Konu özeti / Sorular", örnek sorular, "Problemi bulun" soruları ve deney föylerinin soru ve ön çalışma bölümleri. Önce <b>kendi cevabını yaz</b>, sonra model cevabı aç ve <b>anahtar noktaları</b> işaretle. "(Ek)" işaretli bilgiler slaytta yok, veri sayfasından eklendi.</p>
        <div class="qx-stats">${BOX.map((bx) => `<div class="mini-stat ${bx.cls}"><span>${bx.label}</span><b>${c[bx.id]}</b></div>`).join('')}</div>
        <div class="l-bar l-bar-stack">${BOX.slice(1).reverse().map((bx) => `<i class="${bx.cls}" style="width:${qs.length ? (c[bx.id] / qs.length) * 100 : 0}%"></i>`).join('')}</div>
        <div class="tabs" style="margin-top:12px"><button class="tab${Q.ch === 'all' ? ' active' : ''}" type="button" data-qch="all">Tüm bölümler</button>${chapters().map((ch) => `<button class="tab${Q.ch === ch.id ? ' active' : ''}" type="button" data-qch="${ch.id}">B${ch.num} · ${ch.short || ch.title}</button>`).join('')}</div>
        <div class="btn-row"><button class="btn btn-sm${Q.mode === 'list' ? ' on' : ''}" type="button" data-mode="list">≡ Liste</button><button class="btn btn-sm${Q.mode === 'card' ? ' on' : ''}" type="button" data-mode="card">⟳ Kart modu (karışık aralıklı tekrar)</button></div>
      </section><div class="qx-body">${body}</div></div></div>`;
  }

  function rate(id, kind) {
    const s = Object.assign({ box: 0 }, qState(id));
    const t = today();
    let msg;
    if (kind === 'bad') { s.box = 1; msg = 'Tekrar listesine eklendi. İlgili dersi tekrar oku, sonra yeniden dene.'; }
    if (kind === 'partial') { s.box = 1; msg = 'Eksik noktaları işaretlenmemiş anahtar maddelerden tamamla; bu soru yakında tekrar gelecek.'; }
    if (kind === 'good') {
      if (s.box <= 1) { s.box = 2; msg = 'Güzel! "Gelişiyor"a geçti. Başka bir gün tekrar bilirsen "Öğrenildi" olur.'; } else if (s.box === 2 && s.goodDay && s.goodDay !== t) { s.box = 3; msg = 'Farklı bir günde tekrar bildin: "Öğrenildi" ✓'; } else if (s.box === 2) msg = 'Bugün zaten bildin. Aralıklı tekrar için başka bir gün tekrar sorulacak.';
      else msg = 'Hâlâ biliyorsun ✓';
      s.goodDay = s.goodDay && s.box === 2 && s.goodDay === t ? s.goodDay : t;
    }
    s.day = t;
    Store.data.q[id] = s;
    Store.save();
    return msg;
  }

  /* ------------------------------------------------------------ olaylar */
  function onClick(e) {
    const a = e.target.closest('[data-act]');
    if (a) {
      const act = a.dataset.act;
      if (act === 'menu') { MC.app.openMenu(); return; }
      if (act === 'card-next') { step(1); return; }
      if (act === 'card-prev') { step(-1); return; }
      if (act === 'restart') { const key = lessonKey(F.ch, F.l); delete Store.data.read[key]; Store.data.seen[key] = 0; Store.save(); showCard(0); return; }
      if (act === 'solve') { a.hidden = true; const ans = a.nextElementSibling; ans.hidden = false; MC.dg.mount(ans); return; }
      if (act === 'reveal') { const box = a.closest('.fx-check'); a.hidden = true; box.querySelector('.l-check-a').hidden = false; return; }
      if (act === 'ok' || act === 'bad') {
        const box = a.closest('.fx-check');
        Store.data.checks[box.dataset.check] = act;
        Store.save();
        box.classList.remove('ok', 'bad');
        box.classList.add(act);
        box.querySelectorAll('.l-ok, .l-bad').forEach((b) => b.classList.toggle('chosen', b === a));
        return;
      }
      if (act === 'qreveal') { const card = a.closest('.qx'); card.querySelector('.qx-answer').hidden = false; a.hidden = true; return; }
      if (act === 'nextq') { Q.lastShown = Q.current; Q.current = null; render(['sorular']); return; }
    }
    const f = e.target.closest('[data-filter]');
    if (f) { Q.filter = f.dataset.filter; render(['sorular']); return; }
    const m = e.target.closest('[data-mode]');
    if (m) { Q.mode = m.dataset.mode; render(['sorular']); return; }
    const qc = e.target.closest('[data-qch]');
    if (qc) { Q.ch = qc.dataset.qch; Q.current = null; render(['sorular']); return; }
    const r = e.target.closest('[data-rate]');
    if (r) {
      const card = r.closest('.qx');
      const msg = rate(card.dataset.q, r.dataset.rate);
      card.querySelector('.qx-msg').textContent = msg;
      const st = qState(card.dataset.q);
      const pill = card.querySelector('.qx-head .pill');
      pill.className = `pill ${BOX[st.box].cls}`;
      pill.textContent = BOX[st.box].label;
    }
  }
  function onChange(e) {
    const k = e.target.closest('[data-key]');
    if (k) {
      const card = k.closest('.qx');
      const boxes = [...card.querySelectorAll('[data-key]')];
      const n = boxes.filter((b) => b.checked).length;
      card.querySelector('.qx-score').textContent = `${n} / ${boxes.length} anahtar nokta. ${n === boxes.length ? '"Bildim" diyebilirsin.' : n >= boxes.length / 2 ? '"Kısmen" uygun.' : 'Tekrar çalışmalısın.'}`;
    }
  }
  function onInput(e) {
    if (e.target.classList.contains('qx-draft')) { Store.data.drafts[e.target.closest('.qx').dataset.q] = e.target.value; Store.save(); }
  }

  /* ------------------------------------------------------------ çizim */
  function render(parts) {
    F = null;
    const [p0, p1, p2, p3] = parts;
    let html;
    let after = null;
    if (!p0) html = pageHome();
    else if (p0 === 'plan') html = pageOverview();
    else if (p0 === 'sorular') {
      html = pageQuestions();
      if (p1) after = () => { const el = root.querySelector(`#q-${CSS.escape(p1)}`); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash-card'); } };
    } else if (p0 === 'b') {
      const ch = findChapter(p1);
      if (!ch) html = pageHome();
      else if (!p2) html = pageChapter(ch);
      else {
        const l = p2 === 'konular' ? introOf(ch) : p2 === 'tekrar' ? reviewOf(ch) : ch.lessons.find((x) => x.id === p2);
        if (!l) html = pageChapter(ch);
        else { html = pageFeed(ch, l); after = () => startFeed(ch, l, p3); }
      }
    } else html = pageHome();
    root.innerHTML = html;
    MC.dg.mount(root);
    if (after) after();
    if (p0 === 'sorular' && Q.mode === 'card' && p1 === undefined) { /* kart modunda en üstten başla */ }
  }

  MC.learn = {
    init(el) {
      root = el;
      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.addEventListener('input', onInput);
      document.addEventListener('keydown', onKey);
    },
    render,
    owns: (p0) => !p0 || ['plan', 'sorular', 'b'].includes(p0),
    stop() { F = null; }
  };
})(window.MC);
