(function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('mobile-nav');
  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setOpen(nav.hidden); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !nav.hidden) { setOpen(false); toggle.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && !nav.hidden) setOpen(false); });
  }
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();

/* ---------- scroll reveals and video play control ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = [].slice.call(document.querySelectorAll('[data-reveal],[data-reveal-group]'));
  var videos = [].slice.call(document.querySelectorAll('.hero-video, video[data-play-on-view]'));

  if (!('IntersectionObserver' in window) || reduce) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    videos.forEach(function (v) { v.pause(); });
    return;
  }

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  var videoObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  videos.forEach(function (v) {
    if (v.autoplay) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    videoObserver.observe(v);
  });
})();

/* ---------- 21st.dev-style motion: split headings, scroll progress, ticker loop ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* word-by-word blur reveal for [data-split] headings */
  var splitEls = [].slice.call(document.querySelectorAll('[data-split]'));
  function splitWords(node) {
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); }
          else {
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          }
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) { splitWords(n); }
    });
  }
  if (!reduce) {
    splitEls.forEach(function (el) {
      splitWords(el);
      [].slice.call(el.querySelectorAll('.w')).forEach(function (w, i) {
        w.style.setProperty('--wd', (i * 0.055).toFixed(3) + 's');
      });
    });
  }

  function show(el) { el.classList.add('split-in'); }
  if ('IntersectionObserver' in window && !reduce) {
    var splitObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { show(entry.target); splitObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.2 });
    splitEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { show(el); }); });
      } else { splitObserver.observe(el); }
    });
  } else {
    splitEls.forEach(show);
  }

  /* thin reading-progress bar under the header */
  var bar = document.querySelector('.progress-bar');
  if (bar) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var top = window.scrollY || h.scrollTop || 0;
      bar.style.setProperty('--sp', max > 0 ? String(top / max) : '0');
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* duplicate ticker content once for a seamless -50% translate loop */
  [].slice.call(document.querySelectorAll('[data-ticker]')).forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });
})();

