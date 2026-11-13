// Shared design kit (design standard v1; phase B, Nov 2026: every moving part of the home page lives here). The SAME
// file on every site. Progressive enhancement only: every page works without it. In order: unfold and fold · every
// <details> · sections fading in · the header's menus · the contact panel · the copy-address button.
// Exposes window.Kit for the site's own script (main.js).
(function () {
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var EASE = 'cubic-bezier(.3, .1, .25, 1)', OPEN = 640, CLOSE = 440,   // the same as --t-open and --t-close (Jesse, Nov 10: doubled from 320 and 220)
      STEP = 40, MAX_STAGGER = 10;
  var moving = function () { return !calm.matches && !!document.documentElement.animate; };
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  // Unfold: the panel grows down like a paper card opening; what is inside fades in just behind it.
  function unfold(box, blocks, from, to, done) {
    box.style.overflow = 'hidden';
    var anims = [box.animate({ height: [from + 'px', to + 'px'] }, { duration: OPEN, easing: EASE })];
    each(blocks, function (el, i) {
      anims.push(el.animate({ opacity: [0, 1], transform: ['translateY(-4px)', 'none'] }, { duration: OPEN, easing: EASE, delay: 60 + Math.min(i, MAX_STAGGER) * STEP, fill: 'backwards' }));
    });
    anims[0].onfinish = function () { box.style.overflow = ''; if (done) done(); };
    return anims;
  }
  function fold(box, blocks, from, to, done) {
    box.style.overflow = 'hidden';
    var anims = [box.animate({ height: [from + 'px', to + 'px'] }, { duration: CLOSE, easing: EASE })];
    each(blocks, function (el) { anims.push(el.animate({ opacity: [1, 0] }, { duration: CLOSE * 0.7, easing: EASE, fill: 'forwards' })); });
    anims[0].onfinish = function () { box.style.overflow = ''; if (done) done(); anims.forEach(function (a) { a.cancel(); }); };
    return anims;
  }

  // Every <details> unfolds and folds the same way, and Esc closes the one you are in.
  each(document.querySelectorAll('details'), function (d) {
    var summary = d.querySelector(':scope > summary'), anims = [];
    if (!summary) return;
    var blocks = function () { return Array.prototype.filter.call(d.children, function (el) { return el !== summary; }); };
    var toggle = function (open) {
      if (!moving()) { d.open = open; return; }
      var from = d.offsetHeight;
      anims.forEach(function (a) { a.cancel(); });
      d.removeAttribute('data-closing');
      d.open = true;
      if (open) { anims = unfold(d, blocks(), from, d.offsetHeight); return; }
      d.setAttribute('data-closing', '');
      anims = fold(d, blocks(), from, summary.offsetHeight, function () { d.removeAttribute('data-closing'); d.open = false; });
    };
    summary.addEventListener('click', function (e) {
      if (!moving()) return;
      e.preventDefault();
      toggle(!d.open || d.hasAttribute('data-closing'));
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && d.open) { e.stopPropagation(); toggle(false); summary.focus(); }
    });
  });

  // Sections fade up gently, once, as they come into view.
  if ('IntersectionObserver' in window && moving()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    each(document.querySelectorAll('main > section:not(:first-child)'), function (s) {
      var r = s.getBoundingClientRect();
      if (r.top < window.innerHeight) return;   // already on screen: never hide it
      s.classList.add('reveal'); io.observe(s);
    });
  }

  // The header's menus (design standard §4 and §7): every menu is a fold of the header strip. Its paper grows down by
  // the menu's height (--fold-h; the CSS moves the strip's torn edge over 640ms, back over 440ms) and the links fade
  // in just behind it. One menu at a time; Esc closes it (and puts the keyboard back on its button), and so does a
  // click outside it or the keyboard leaving it. Below the header's own width the links wait under one Menu button;
  // from there up, Services and Resources may each open their own row of links (each button stands in for a link
  // that a page without JavaScript simply follows).
  var head = document.querySelector('header.site-header');
  if (head) {
    var menus = [], current = null, closing = null, menuAnims = [], shut = 0;
    var setH = function (px) { head.style.setProperty('--fold-h', px + 'px'); };
    var links = function (m) { return Array.prototype.slice.call(m.panel.querySelectorAll('li')); };
    var close = function (m, back) {
      if (!m || current !== m) return;
      current = null;
      m.button.setAttribute('aria-expanded', 'false');
      menuAnims.forEach(function (a) { a.cancel(); });
      clearTimeout(shut);
      var done = function () { head.removeAttribute('data-closing'); m.hide(); closing = null; };
      closing = m;
      if (moving()) {
        head.setAttribute('data-closing', '');
        menuAnims = [m.panel.animate({ opacity: [1, 0] }, { duration: CLOSE * 0.7, easing: EASE, fill: 'forwards' })];
        setH(0);
        shut = setTimeout(function () { done(); menuAnims.forEach(function (a) { a.cancel(); }); }, CLOSE);
      } else { setH(0); done(); }
      if (back) m.button.focus();
    };
    var open = function (m) {
      if (current === m) return;
      if (current) { var was = current; current = null; was.button.setAttribute('aria-expanded', 'false'); was.hide(); }
      menuAnims.forEach(function (a) { a.cancel(); });
      clearTimeout(shut);
      if (closing && closing !== m) closing.hide();
      closing = null;
      head.removeAttribute('data-closing');
      current = m;
      m.button.setAttribute('aria-expanded', 'true');
      m.show();
      setH(m.panel.offsetHeight);
      menuAnims = [];
      if (moving()) each(links(m), function (el, i) {
        menuAnims.push(el.animate({ opacity: [0, 1], transform: ['translateY(-4px)', 'none'] }, { duration: OPEN, easing: EASE, delay: 60 + Math.min(i, MAX_STAGGER) * STEP, fill: 'backwards' }));
      });
    };
    var menu = function (button, panel, show, hide, scope) {
      var m = { button: button, panel: panel, show: show, hide: hide, scope: scope };
      button.addEventListener('click', function () { if (current === m) close(m); else open(m); });
      scope.addEventListener('focusout', function (e) { if (current === m && e.relatedTarget && !scope.contains(e.relatedTarget)) close(m); });
      menus.push(m);
    };
    // the phone Menu: the whole list, shown with .is-open
    var toggle = head.querySelector('.nav-toggle'), list = document.getElementById('nav-list');
    if (toggle && list) menu(toggle, list, function () { list.classList.add('is-open'); }, function () { list.classList.remove('is-open'); }, head.querySelector('.site-nav'));
    // Services and Resources from the header's own width up: a button that opens a row of links
    each(head.querySelectorAll('.nav-fold-btn'), function (b) {
      var panel = document.getElementById(b.getAttribute('aria-controls'));
      if (panel) menu(b, panel, function () { panel.hidden = false; }, function () { panel.hidden = true; }, b.parentNode);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && current) { var m = current; close(m, m.scope.contains(document.activeElement) || document.activeElement === document.body); }
    });
    document.addEventListener('click', function (e) {
      if (current && !current.scope.contains(e.target) && !current.panel.contains(e.target)) close(current);
    });
    // the header changes shape at its own width: whatever was open closes, and the strip lies flat again
    var wide = window.matchMedia('(min-width: 1100px)');
    var reset = function () { if (current) close(current); };
    if (wide.addEventListener) wide.addEventListener('change', reset); else if (wide.addListener) wide.addListener(reset);
    // a page restored from the back-forward cache comes back with its menus shut
    window.addEventListener('pageshow', function (e) { if (e.persisted && current) { var m = current; current = null; m.button.setAttribute('aria-expanded', 'false'); m.hide(); setH(0); } });
  }

  // The contact panel: a form that waits behind its button and unfolds in place (design standard §7). The site's
  // own script calls Kit.panel(el) once its form is ready, and gets back { open, close, sent, opened }.
  //   el          the panel (it has an id): a form, a "sent" line (.request-sent) and a close button inside it
  //   openers     its siblings .actions and .first-line: they hide while the panel is open
  //   every link to #<the panel's id> opens it; so does that address itself (shared in emails)
  //   opts.before(link) runs first on every open, so the site can set the form from the link that was pressed
  // Always closable (close button, Esc). After sending, sent() folds the form away and leaves the one "sent" line.
  function panel(request, opts) {
    opts = opts || {};
    var form = request.querySelector('form'), sent = request.querySelector('.request-sent');
    var openers = Array.prototype.filter.call(request.parentNode.children, function (el) { return el !== request && (el.classList.contains('actions') || el.classList.contains('first-line')); });
    var hash = '#' + request.id, opened = 0, anims = [];
    var first = function () { return form.querySelector('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), select, textarea'); };
    var open = function (link, animate) {
      if (opts.before) opts.before(link);
      if (!request.hidden) return;
      opened = Date.now();
      openers.forEach(function (el) { el.hidden = true; });
      request.hidden = false;
      anims.forEach(function (a) { a.cancel(); });
      if (animate && moving()) anims = unfold(request, Array.prototype.slice.call(form.children), 0, request.offsetHeight);
      request.scrollIntoView({ behavior: animate && moving() ? 'smooth' : 'auto', block: 'start' });
      var f = first(); if (f) f.focus({ preventScroll: true });
    };
    request.hidden = true;
    each(document.querySelectorAll('a[href$="' + hash + '"]'), function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        open(a, true);
      });
    });
    if (location.hash === hash) open(null, false);
    window.addEventListener('hashchange', function () { if (location.hash === hash) open(null, true); });
    var close = function () {
      var done = function () {
        request.hidden = true; openers.forEach(function (el) { el.hidden = false; });
        var b = request.parentNode.querySelector('.actions .btn'); if (b) b.focus();
      };
      anims.forEach(function (a) { a.cancel(); });
      if (moving()) anims = fold(request, Array.prototype.slice.call(request.children), request.offsetHeight, 0, done); else done();
    };
    var closer = request.querySelector('[data-request-close]');
    if (closer) { closer.hidden = false; closer.addEventListener('click', close); }
    request.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !request.hidden && !form.hidden) close(); });
    var showSent = function () {
      var from = request.offsetHeight;
      form.hidden = true; sent.hidden = false; if (closer) closer.hidden = true;
      anims.forEach(function (a) { a.cancel(); });
      if (moving()) anims = unfold(request, [sent], from, request.offsetHeight);
      sent.focus();
    };
    return { open: open, close: close, sent: showSent, opened: function () { return opened; } };
  }

  // "Copy address" beside an email address: for people whose phone or browser has no mail app set up.
  //   <button class="copy-btn" data-copy="name@site.org" hidden>…</button> <span class="copy-status" role="status"></span>
  each(document.querySelectorAll('.copy-btn'), function (btn) {
    if (!navigator.clipboard) return;
    btn.hidden = false;
    var status = btn.parentNode.querySelector('.copy-status');
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(function () {
        if (status) status.textContent = 'Copied. Paste it into your email.';
        setTimeout(function () { if (status) status.textContent = ''; }, 6000);
      }, function () {
        if (status) status.textContent = 'Couldn’t copy; the address is ' + btn.getAttribute('data-copy');
      });
    });
  });

  window.Kit = { unfold: unfold, fold: fold, moving: moving, panel: panel };
})();
