// "Slide to open" control on the Projects page (The Formula card), added by
// tools/build-from-design.py. The control is a real <a href> so the page curtain,
// keyboard and screen readers treat it like any link. Dragging the knob to the end,
// tapping the track or pressing Enter slides it open, then follows the link.
(function () {
  if (window.__gesSlideOpen) return; window.__gesSlideOpen = true;
  var EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  var drag = null, allow = false, swallowUntil = 0;

  function parts(a) {
    return { k: a.querySelector('[data-slide-knob]'), f: a.querySelector('[data-slide-fill]'), l: a.querySelector('[data-slide-label]') };
  }
  // move the knob to x px (clamped); returns how far along the track it is, 0..1
  function place(a, x, animate) {
    var p = parts(a), pad = p.k.offsetLeft, max = a.clientWidth - p.k.offsetWidth - pad * 2;
    x = Math.max(0, Math.min(max, x));
    var t = animate ? '260ms ' + EASE : '0ms';
    p.k.style.transition = 'transform ' + t;
    p.k.style.transform = 'translate3d(' + x + 'px,0,0)';
    p.f.style.transition = 'width ' + t;
    p.f.style.width = (x + p.k.offsetWidth + pad * 2) + 'px';
    p.l.style.transition = 'opacity ' + t;
    p.l.style.opacity = String(Math.max(0, 1 - x / (max * 0.6)));
    return max > 0 ? x / max : 1;
  }
  function open(a) {
    if (a.hasAttribute('data-slide-done')) return;
    a.setAttribute('data-slide-done', ''); a.setAttribute('data-slide-active', '');
    place(a, 1e6, true);
    setTimeout(function () { allow = true; a.click(); allow = false; }, 300);
  }
  function reset(a) {
    a.removeAttribute('data-slide-done');
    place(a, 0, false);
  }

  document.addEventListener('pointerdown', function (e) {
    var a = e.target.closest && e.target.closest('[data-slide-open]');
    if (!a || e.button > 0 || a.hasAttribute('data-slide-done')) return;
    a.setAttribute('data-slide-active', '');
    if (!e.target.closest('[data-slide-knob]')) return; // a tap on the track opens it via the click below
    e.preventDefault();
    drag = { a: a, sx: e.clientX, id: e.pointerId, moved: false, at: 0 };
    try { a.setPointerCapture(e.pointerId); } catch (x) {}
    parts(a).k.style.cursor = 'grabbing';
  }, true);

  document.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.sx;
    if (Math.abs(dx) > 4) drag.moved = true;
    drag.at = place(drag.a, dx, false);
  }, true);

  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    parts(d.a).k.style.cursor = '';
    swallowUntil = performance.now() + 500; // the click that follows this gesture is already handled here
    if (!d.moved || d.at > 0.8) open(d.a); else place(d.a, 0, true);
  }
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', function (e) {
    if (drag && e.pointerId === drag.id) { place(drag.a, 0, true); parts(drag.a).k.style.cursor = ''; drag = null; }
  }, true);

  // the link only navigates once the slide has finished (allow); any other click starts the slide
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-slide-open]');
    if (!a || allow) return;
    e.preventDefault();
    if (performance.now() < swallowUntil) { swallowUntil = 0; return; }
    open(a);
  }, true);
  document.addEventListener('dragstart', function (e) {
    if (e.target.closest && e.target.closest('[data-slide-open]')) e.preventDefault();
  }, true);
  // coming back with the browser's Back button restores the page from cache: put the knob back
  addEventListener('pageshow', function (e) {
    if (e.persisted) document.querySelectorAll('[data-slide-open]').forEach(reset);
  });

  var css = document.createElement('style');
  css.textContent =
    '@keyframes ges-slide-hint{0%,62%,100%{transform:translate3d(0,0,0)}74%{transform:translate3d(12px,0,0)}86%{transform:translate3d(0,0,0)}}' +
    '[data-slide-open]:not([data-slide-active]) [data-slide-knob]{animation:ges-slide-hint 2.8s ease-in-out 1.2s infinite}' +
    '[data-slide-open]:focus-visible{outline:2px solid #3BC0D5;outline-offset:3px}' +
    '@media (prefers-reduced-motion: reduce){[data-slide-open] [data-slide-knob]{animation:none!important}}';
  (document.head || document.documentElement).appendChild(css);
})();
