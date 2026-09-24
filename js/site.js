// Genesis Education Solutions — site interactions (nav, FAQ accordion,
// partner carousels, contact form). Plain JS, no dependencies.
(function () {
  'use strict';

  // ---------- Header: dropdown groups + mobile menu ----------
  var header = document.querySelector('[data-site-header]');
  if (header) {
    var groups = header.querySelectorAll('[data-nav-group]');
    var setOpen = function (group, open) {
      group.classList.toggle('is-open', open);
      group.querySelector('button').setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    var closeAll = function (except) {
      groups.forEach(function (g) { if (g !== except) setOpen(g, false); });
    };
    groups.forEach(function (g) {
      g.addEventListener('mouseenter', function () { closeAll(g); setOpen(g, true); });
      g.addEventListener('mouseleave', function () { setOpen(g, false); });
      g.querySelector('button').addEventListener('click', function () {
        var open = !g.classList.contains('is-open');
        closeAll(g);
        setOpen(g, open);
      });
    });
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    var toggle = header.querySelector('[data-menu-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = !header.classList.contains('is-menu-open');
        header.classList.toggle('is-menu-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  // ---------- FAQ accordion (one open at a time) ----------
  var faqButtons = document.querySelectorAll('[data-faq-toggle]');
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      faqButtons.forEach(function (b) {
        var open = b === btn && !wasOpen;
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        b.querySelector('[data-faq-sign]').textContent = open ? '−' : '+';
        b.parentNode.querySelector('[data-faq-answer]').style.display = open ? 'block' : 'none';
      });
    });
  });

  // ---------- Partner schools carousel ----------
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-carousel-track]');
    var dots = root.querySelectorAll('[data-carousel-dot]');
    var page = 0, paused = false;
    var go = function (k) {
      page = k;
      track.style.transform = 'translateX(-' + (k * 100) + '%)';
      dots.forEach(function (d, i) {
        d.style.width = i === k ? '32px' : '8px';
        d.style.background = i === k ? 'var(--color-teal-600)' : 'var(--color-gray-300)';
      });
    };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () { if (!paused) go((page + 1) % dots.length); }, 3500);
  });

  // ---------- Teacher training slideshow ----------
  document.querySelectorAll('[data-slideshow]').forEach(function (root) {
    var slides = root.querySelectorAll('[data-slide]');
    var counter = root.querySelector('[data-slide-counter]');
    var progress = root.querySelector('[data-slide-progress]');
    var n = slides.length, idx = 0, paused = false, visible = false;
    // Only the current slide and its neighbours carry a background image,
    // so the 22 photos load progressively instead of all at once — and not
    // at all until the slideshow is close to scrolling into view.
    var load = function (k) {
      if (!visible) return;
      var s = slides[(k + n) % n];
      if (s.dataset.loaded) return;
      s.dataset.loaded = '1';
      s.querySelectorAll('[data-slide-bg]').forEach(function (el) {
        el.style.backgroundImage = 'url("' + s.dataset.src + '")';
      });
    };
    var show = function (k) {
      idx = k;
      [k - 1, k, k + 1].forEach(load);
      slides.forEach(function (s, i) { s.style.opacity = i === k ? '1' : '0'; });
      if (counter) counter.textContent = (k + 1) + ' / ' + n;
      if (progress) progress.style.width = ((k + 1) / n * 100) + '%';
    };
    show(0);
    var reveal = function () { visible = true; show(idx); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); reveal(); }
      }, { rootMargin: '600px 0px' });
      io.observe(root);
    } else {
      reveal();
    }
    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () { if (!paused) show((idx + 1) % n); }, 3000);
  });

  // ---------- Contact form (FormSubmit) ----------
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var submit = form.querySelector('[data-contact-submit]');
    var sent = form.querySelector('[data-contact-sent]');
    var failed = form.querySelector('[data-contact-failed]');
    var field = function (name) { return form.querySelector('[data-field="' + name + '"]'); };
    var val = function (name) { return form.elements[name].value.trim(); };

    form.querySelectorAll('input, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var f = field(el.name);
        if (f) f.classList.remove('has-error');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.disabled) return;
      var nameOk = !!val('name');
      var emailOk = /^\S+@\S+\.\S+$/.test(val('email'));
      field('name').classList.toggle('has-error', !nameOk);
      field('email').classList.toggle('has-error', !emailOk);
      sent.hidden = true;
      failed.hidden = true;
      if (!nameOk || !emailOk) return;

      submit.disabled = true;
      submit.textContent = 'Sending…';
      fetch('https://formsubmit.co/ajax/hello@genesiseducation.solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'Genesis Program enquiry from ' + (val('school') || val('name')),
          _template: 'table',
          _captcha: 'false',
          Name: val('name'),
          School: val('school'),
          Email: val('email'),
          'Contact Number': val('phone'),
          Message: val('message')
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var ok = d && (d.success === true || d.success === 'true');
          if (ok) { form.reset(); sent.hidden = false; } else { failed.hidden = false; }
        })
        .catch(function () { failed.hidden = false; })
        .then(function () {
          submit.disabled = false;
          submit.textContent = 'Send Message';
        });
    });
  }
})();
