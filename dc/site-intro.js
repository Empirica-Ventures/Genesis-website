(function () {
  if (window.__gesIntro) return; window.__gesIntro = true;
  var KEY = 'ges_intro_seen', de = document.documentElement;
  var seen = false; try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (seen) return;
  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  de.setAttribute('data-intro', '1');
  var st = document.createElement('style');
  st.textContent = 'html[data-intro] body{overflow:hidden}' +
    'html[data-intro] [data-nav-header],html[data-intro] [data-nav-header] *{animation-play-state:paused!important}' +
    '[data-site-intro]{position:fixed;inset:0;z-index:2147483600;background:#FFFFFF;overflow:hidden;transition:opacity 900ms cubic-bezier(0.22,1,0.36,1),visibility 0s linear 900ms}' +
    '[data-site-intro][data-out]{opacity:0;visibility:hidden}' +
    '[data-site-intro] video{position:absolute;left:50%;top:50%;max-width:none;border:0;outline:0;display:block;background:transparent;' +
      'width:min(max(100vw,177.78vh),151.5vw);width:min(max(100vw,177.78dvh),151.5vw);height:auto;aspect-ratio:16/9;' +
      'transform:translate(-50%,-50%);transition:transform 900ms cubic-bezier(0.22,1,0.36,1);' +
      '-webkit-mask-image:linear-gradient(to right,transparent 0,#000 4%,#000 96%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 5%,#000 95%,transparent 100%);-webkit-mask-composite:source-in;' +
      'mask-image:linear-gradient(to right,transparent 0,#000 4%,#000 96%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 5%,#000 95%,transparent 100%);mask-composite:intersect}' +
    '[data-site-intro][data-out] video{transform:translate(-50%,-50%) scale(1.04)}' +
    '[data-site-intro] button{all:unset;position:absolute;right:clamp(16px,3vw,32px);bottom:clamp(16px,3vw,32px);height:40px;padding:0 18px;border-radius:999px;font:700 14px/40px Lato,sans-serif;color:#0F6B66;border:1px solid rgba(15,107,102,0.35);cursor:pointer;transition:color 160ms ease,border-color 160ms ease,background-color 160ms ease}' +
    '[data-site-intro] button:hover{background:#0F6B66;color:#FFFFFF;border-color:#0F6B66}' +
    '[data-site-intro] button:focus-visible{outline:2px solid #0F6B66;outline-offset:2px}' +
    'html[data-intro-out] body > *:not([data-site-intro]){animation:ges-site-in 900ms cubic-bezier(0.22,1,0.36,1) both}' +
    '@keyframes ges-site-in{from{opacity:0}to{opacity:1}}';
  (document.head || de).appendChild(st);
  var wrap = document.createElement('div');
  wrap.setAttribute('data-site-intro', ''); wrap.setAttribute('role', 'presentation');
  var v = document.createElement('video');
  v.src = '/assets/img/genesis-intro.mp4'; v.muted = true; v.defaultMuted = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  var skip = document.createElement('button'); skip.type = 'button'; skip.textContent = 'Skip intro';
  wrap.appendChild(v); wrap.appendChild(skip);
  de.appendChild(wrap);
  var done = false;
  function finish() {
    if (done) return; done = true;
    de.setAttribute('data-intro-out', '1');
    wrap.setAttribute('data-out', '');
    de.removeAttribute('data-intro');
    setTimeout(function () { wrap.remove(); de.removeAttribute('data-intro-out'); }, 950);
  }
  function matchBg() {
    try {
      var c = document.createElement('canvas'); c.width = 8; c.height = 8;
      var x = c.getContext('2d'); x.drawImage(v, 0, 0, 8, 8);
      var d = x.getImageData(0, 0, 1, 1).data;
      if (d[3] > 0 && d[0] + d[1] + d[2] > 600) wrap.style.background = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
    } catch (e) {}
  }
  v.addEventListener('playing', function () { setTimeout(matchBg, 120); });
  v.addEventListener('ended', finish);
  v.addEventListener('error', finish);
  skip.addEventListener('click', finish);
  addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });
  var p = v.play(); if (p && p.catch) p.catch(function () { setTimeout(finish, 400); });
  setTimeout(function () { if (v.paused && v.currentTime === 0) finish(); }, 4000);
  setTimeout(finish, 9000);
})();
