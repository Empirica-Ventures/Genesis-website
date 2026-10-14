(function () {
  if (window.__gesCurtain) return; window.__gesCurtain = true;
  var KEY = 'ges_curtain', COLORS = ['#F16356', '#3BC0D5', '#0F6B66', '#FFFFFF'];
  var EASE = 'cubic-bezier(0.76, 0, 0.24, 1)', DUR = 620, STEP = 110;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function build(y) {
    var root = document.createElement('div');
    root.setAttribute('data-page-curtain', ''); root.setAttribute('aria-hidden', 'true');
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:all;overflow:hidden;';
    COLORS.forEach(function (c, i) {
      var p = document.createElement('div');
      p.style.cssText = 'position:absolute;inset:-2px 0;background:' + c + ';transform:translate3d(0,' + y + ',0);will-change:transform;backface-visibility:hidden;display:flex;align-items:center;justify-content:center;';
      root.appendChild(p);
    });
    (document.body || document.documentElement).appendChild(root);
    return root;
  }
  function run(root, to, order, done) {
    var ps = [].slice.call(root.children);
    void root.offsetHeight;
    order.forEach(function (idx, k) {
      var p = ps[idx];
      p.style.transition = 'transform ' + DUR + 'ms ' + EASE + ' ' + (k * STEP) + 'ms';
      p.style.transform = 'translate3d(0,' + to + ',0)';
    });
    setTimeout(done, DUR + STEP * (order.length - 1) + 40);
  }
  var arriving = false;
  try { arriving = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (arriving && !reduce) {
    document.documentElement.style.backgroundColor = '#FFFFFF';
    document.documentElement.setAttribute('data-curtain', '');
    var early = document.createElement('style');
    early.textContent = 'html{background:#FFFFFF}body{visibility:hidden}';
    document.head.appendChild(early);
    var start = function () {
      var c = build('0%'), t0 = performance.now();
      early.remove();
      var lift = function () { document.documentElement.removeAttribute('data-curtain'); run(c, '-100%', [3, 2, 1, 0], function () { c.remove(); }); };
      var fired = false, t0 = performance.now();
      var ready = function () { return window.__gesMotionReady || !window.__gesMotion && performance.now() - t0 > 1200; };
      var go = function () {
        if (fired) return; fired = true;
        var fontsOk = false; try { document.fonts.ready.then(function () { fontsOk = true; }); } catch (e) { fontsOk = true; }
        (function wait() {
          if ((ready() && fontsOk) || performance.now() - t0 > 3000) return setTimeout(lift, 160);
          setTimeout(wait, 40);
        })();
      };
      if (document.readyState === 'complete') go(); else { addEventListener('load', go); setTimeout(go, 2000); }
    };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }
  var busy = false;
  document.addEventListener('click', function (e) {
    if (busy || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var url; try { url = new URL(a.getAttribute('href'), location.href); } catch (x) { return; }
    if (url.origin !== location.origin || /\.(?!html?$)[a-z0-9]{2,5}$/i.test(url.pathname) || /^\/(api|assets|dc|team-uploads)(\/|$)/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return;
    if (reduce) return;
    e.preventDefault(); busy = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (x) {}
    var c = build('100%');
    run(c, '0%', [0, 1, 2, 3], function () { location.href = url.href; });
  });
  addEventListener('pageshow', function (e) {
    if (e.persisted) { busy = false; document.querySelectorAll('[data-page-curtain]').forEach(function (n) { n.remove(); }); }
  });
})();
