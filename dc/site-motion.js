(function () {
  if (window.__gesMotion) return; window.__gesMotion = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = document.createElement('style');
  st.textContent = "" +
    'main > :first-child:not([data-nav-bleed]){border-top:84px solid transparent}html{scroll-behavior:smooth}#ges-progress{position:fixed;top:0;left:0;height:2px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:#199696;z-index:9999;pointer-events:none}' +
    'span[style*="letter-spacing:0.14em"],span[style*="letter-spacing: 0.14em"],span[style*="letter-spacing:1em"],span[style*="letter-spacing: 1em"],h2[style*="letter-spacing:0.14em"]{font-family:"Poppins",sans-serif!important;}';
  document.head.appendChild(st);
  var bar = document.createElement('div'); bar.id = 'ges-progress'; document.body.appendChild(bar);
  var tick = false;
  function prog() { tick = false; var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });

  window.dataLayer = window.dataLayer || [];
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var h = a.getAttribute('href') || '', page = document.title;
    if (h.indexOf('wa.me') > -1) window.dataLayer.push({ event: 'whatsapp_click', page: page });
    else if (h.indexOf('tel:') === 0) window.dataLayer.push({ event: 'phone_click', page: page });
    else if (h.indexOf('mailto:') === 0) window.dataLayer.push({ event: 'email_click', page: page });
    var cta = a.getAttribute('data-cta');
    if (cta) { window.dataLayer.push({ event: 'cta_click', location: cta, page: page }); try { sessionStorage.setItem('ges_cta', cta + ' @ ' + page); } catch (x) {} }
  }, true);
  // Overlapping sections: each top-level section rides up over the previous one as it scrolls into view, no pinning.
  function stack() {
    var main = document.querySelector('main'); if (!main) return;
    var kids = Array.prototype.filter.call(main.children, function (el) { return el.tagName === 'SECTION' || el.tagName === 'DIV'; });
    if (kids.length < 2 || kids[0].__stacked) return;
    kids.forEach(function (el, i) {
      el.__stacked = true;
      el.style.position = 'sticky';
      el.style.top = '0';
      el.style.zIndex = String(i + 1);
      if (getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)' && !el.style.background) el.style.background = '#ffffff';
      if (i > 0) el.style.borderTop = '1px solid rgba(0,0,0,0.2)';
    });
  }
  var ss; function laterStack() { clearTimeout(ss); ss = setTimeout(stack, 120); }
  if (document.readyState === 'complete') laterStack(); else addEventListener('load', laterStack);
  setTimeout(stack, 60);
  new MutationObserver(laterStack).observe(document.body, { childList: true, subtree: true });

  // Scroll-driven overlap motion: each section translates in from below and settles, reversible both directions.
  (function () {
    var reduceM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceM) return;
    var sections = [];
    function collect() { sections = Array.prototype.slice.call(document.querySelectorAll('main > section, main > div')); }
    function tick() { sections.forEach(function (el) { if (el.style.transform !== 'translateY(0px)') el.style.transform = 'translateY(0px)'; }); }
    if (document.readyState === 'complete') { collect(); requestAnimationFrame(tick); }
    else addEventListener('load', function () { collect(); requestAnimationFrame(tick); });
    new MutationObserver(collect).observe(document.body, { childList: true, subtree: true });
  })();

  if (reduce) { window.__gesMotionReady = true; return; }

  var prepCss = document.createElement('style');
  prepCss.textContent = '@keyframes ges-prep-failsafe{to{opacity:1}}html[data-motion-prep] main{opacity:0;animation:ges-prep-failsafe 0s linear 2.5s forwards}main{transition:opacity 280ms cubic-bezier(0.22,1,0.36,1)}main img{backface-visibility:hidden}';
  document.head.appendChild(prepCss);
  document.documentElement.setAttribute('data-motion-prep', '');
  var revealed = false;
  function unhold() { revealed = true; document.documentElement.removeAttribute('data-motion-prep'); window.__gesMotionReady = true; }
  function release() { if (revealed) return; try { scan(); } catch (e) { console.warn('site-motion scan failed', e); } requestAnimationFrame(function () { requestAnimationFrame(unhold); }); setTimeout(unhold, 300); }
  if (document.readyState === 'complete') setTimeout(release, 60); else addEventListener('load', function () { setTimeout(release, 60); });
  setTimeout(function () { try { release(); } catch (e) {} unhold(); }, 1500);

  var held = function () { var d = document.documentElement; return d.hasAttribute('data-intro') || d.hasAttribute('data-curtain'); };
  var holdQ = [];
  function whenFree(fn) { if (!held()) return fn(); holdQ.push(fn); if (holdQ.length === 1) (function poll() { if (held()) return setTimeout(poll, 80); var q = holdQ; holdQ = []; q.forEach(function (f) { f(); }); })(); }

  // Hero image parallax: rises in slower than the text, then drifts against the scroll.
  (function () {
    var EASEH = 'cubic-bezier(0.22, 1, 0.36, 1)', items = [];
    function init() {
      document.querySelectorAll('[data-hero-par]').forEach(function (el) {
        if (el.__hp) return; el.__hp = true; items.push(el);
        var a = el.animate([{ opacity: 0, translate: '0 120px', scale: '0.94' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 1500, easing: EASEH, fill: 'backwards', composite: 'add', delay: 180 });
        a.pause();
        var start = function () { whenFree(function () { a.play(); }); };
        if (!('IntersectionObserver' in window)) return start();
        var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); start(); } }, { threshold: 0.15 });
        o.observe(el);
      });
    }
    var pt = false;
    function par() { pt = false; var vh = innerHeight; items.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; el.style.translate = '0 ' + Math.max(-90, Math.min(90, (r.top + r.height / 2 - vh / 2) * -0.14)).toFixed(1) + 'px'; }); }
    addEventListener('scroll', function () { if (!pt) { pt = true; requestAnimationFrame(par); } }, { passive: true });
    var hi; new MutationObserver(function () { clearTimeout(hi); hi = setTimeout(init, 60); }).observe(document.body, { childList: true, subtree: true });
    setTimeout(init, 30); addEventListener('load', function () { init(); par(); });
  })();

  // Quiet reveal: top-level content blocks fade up once as they enter the viewport.
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var SEL = 'h1, h2, h3, p, ul, ol, dl, figure, form, img, table, [data-reveal], [data-reveal-left]';
  var seen = new WeakSet(), pending = [], bootAt = performance.now();
  function skip(el) {
    if (/transform\s*:/.test(el.getAttribute('style') || '')) return true;
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (p.matches('header, nav, footer, [data-no-motion]') || p.matches(SEL)) return true;
    }
    return false;
  }
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); var t = e.target, a = t.__ga; if (!a) return; t.__ga = null; if (t.tagName === 'IMG' && !t.complete) { var once = false, f = function () { if (!once) { once = true; a.play(); } }; t.addEventListener('load', f); t.addEventListener('error', f); setTimeout(f, 1200); } else a.play(); });
  }, { rootMargin: '0px 0px -6% 0px' });
  var tcss = document.createElement('style');
  tcss.textContent = '[data-typing]::after{content:"";display:inline-block;width:0.07em;height:0.85em;margin-left:0.05em;vertical-align:-0.06em;background:currentColor;opacity:0.85}' +
    '[data-typing="done"]::after{transition:opacity 260ms ease;opacity:0}';
  document.head.appendChild(tcss);
  function typer(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = w.nextNode())) if (n.nodeValue) nodes.push({ n: n, t: n.nodeValue });
    var total = nodes.reduce(function (s, o) { return s + o.t.length; }, 0);
    if (!total) return null;
    var prevMin = el.style.minHeight;
    el.style.minHeight = el.getBoundingClientRect().height + 'px';
    nodes.forEach(function (o) { o.n.nodeValue = ''; });
    var started = false;
    function render(count) {
      var left = count;
      nodes.forEach(function (o) { var take = Math.max(0, Math.min(o.t.length, left)); o.n.nodeValue = o.t.slice(0, take); left -= take; });
    }
    return { play: function () {
      if (started) return; started = true;
      var go = function () {
        if (document.documentElement.hasAttribute('data-intro')) return setTimeout(go, 120);
        el.setAttribute('data-typing', '');
        var dur = Math.max(450, Math.min(900, total * 22)), t0 = 0;
        var ease = function (x) { return 1 - Math.pow(1 - x, 2.2); };
        requestAnimationFrame(function frame(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          render(Math.round(ease(p) * total));
          if (p < 1) return requestAnimationFrame(frame);
          el.setAttribute('data-typing', 'done');
          el.style.minHeight = prevMin;
          setTimeout(function () { el.removeAttribute('data-typing'); }, 300);
        });
      };
      go();
    } };
  }
  function prep(el) {
    seen.add(el);
    if (skip(el)) return;
    var r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
    if (el.tagName === 'H1') {
      if (revealed && !held() && r.top < innerHeight && r.bottom > 0) return;
      var tp = typer(el); if (!tp) return;
      if (r.top < innerHeight && r.bottom > 0) { tp.play(); return; }
      el.__ga = tp; pending.push(el); io.observe(el); return;
    }
    var par = el.parentElement, idx = par ? Array.prototype.indexOf.call(par.children, el) : 0;
    var fromLeft = el.hasAttribute('data-reveal-left');
    var dur = el.hasAttribute('data-reveal-slow') ? 2000 : 900;
    var inView = r.top < innerHeight && r.bottom > 0;
    if (inView && !held() && revealed) return;
    var a = el.animate([{ opacity: 0, transform: fromLeft ? 'translate3d(-28px, 0, 0)' : 'translate3d(0, 16px, 0)' }, { opacity: 1, transform: 'translate3d(0, 0, 0)' }], { duration: dur, easing: EASE, fill: 'backwards', delay: Math.min(idx, 4) * 70 });
    var imgWait = el.tagName === 'IMG' && !el.complete;
    if (inView) {
      a.pause();
      var goA = function () { whenFree(function () { a.play(); }); };
      if (imgWait) { var once = false, f = function () { if (!once) { once = true; goA(); } }; el.addEventListener('load', f); el.addEventListener('error', f); setTimeout(f, 1200); } else goA();
      return;
    }
    a.pause(); el.__ga = a; pending.push(el); io.observe(el);
  }
  function scan() { document.querySelectorAll('main ' + SEL.split(', ').join(', main ')).forEach(function (el) { if (seen.has(el)) return; try { prep(el); } catch (e) { seen.add(el); console.warn('site-motion prep failed', el, e); } }); }
  var se; addEventListener('scroll', function () { clearTimeout(se); se = setTimeout(function () {
    pending = pending.filter(function (el) { if (!el.__ga) return false; var r = el.getBoundingClientRect(); if (r.top < innerHeight * 1.1) { el.__ga.play(); el.__ga = null; io.unobserve(el); return false; } return true; });
  }, 150); }, { passive: true });
  var t; function later() { clearTimeout(t); t = setTimeout(scan, 120); }
  (function () {
    var css = document.createElement('style');
    css.textContent = '@keyframes ges-tgrid-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-76px,0,0)}}' +
      '[data-teal-grid]{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0.06;overflow:hidden}' +
      '[data-teal-grid]>i{position:absolute;top:0;bottom:0;left:0;right:-76px;will-change:transform;background-image:linear-gradient(to bottom,#FFFFFF,#0F6B66);' +
      '-webkit-mask-image:linear-gradient(to right,#000 3px,transparent 3px),linear-gradient(to bottom,#000 3px,transparent 3px);mask-image:linear-gradient(to right,#000 3px,transparent 3px),linear-gradient(to bottom,#000 3px,transparent 3px);' +
      '-webkit-mask-size:76px 76px;mask-size:76px 76px;animation:ges-tgrid-drift 8s linear infinite}' +
      '@media (prefers-reduced-motion: reduce){[data-teal-grid]>i{animation:none}}';
    document.head.appendChild(css);
    function tealGrid() {
      document.querySelectorAll('main div, main section').forEach(function (el) {
        if (el.__tg || el.hasAttribute('data-teal-grid')) return;
        if (el.closest('[data-beam-card], [data-no-teal-grid]')) { el.__tg = true; return; }
        if (getComputedStyle(el).backgroundColor !== 'rgb(15, 107, 102)') return;
        for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) if (p.__tg) { el.__tg = true; return; }
        el.__tg = true;
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.style.isolation = 'isolate';
        var g = document.createElement('div'); g.setAttribute('data-teal-grid', ''); g.setAttribute('aria-hidden', 'true'); g.appendChild(document.createElement('i'));
        el.insertBefore(g, el.firstChild);
      });
    }
    var tg; new MutationObserver(function () { clearTimeout(tg); tg = setTimeout(tealGrid, 150); }).observe(document.body, { childList: true, subtree: true });
    setTimeout(tealGrid, 200); addEventListener('load', tealGrid);
  })();
  if (document.readyState === 'complete') later(); else addEventListener('load', later);
  setTimeout(scan, 60);
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
})();
