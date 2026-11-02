/*
  Ambika Motors - colour palette picker
  -------------------------------------
  Pick colours in the panel, check the live mini-preview, then press APPLY.
  Applying recolours the whole website (all pages) and is remembered in this browser.

  SHOW_PICKER = true   -> the "Colours" button is visible on the site (use while you are choosing)
  SHOW_PICKER = false  -> the button is hidden for visitors. Add ?palette=1 to the URL to bring it back.
  When you are happy, use "Copy CSS" in the panel and paste the values into :root in styles.css
  to make the colours permanent for every visitor.
*/
(function () {
  var SHOW_PICKER = true;
  var STORE = 'ambika-theme-v1';

  /* ---------- colour maths ---------- */
  function hexToRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(c) {
    return '#' + c.map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }
  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(a) {
    var h = a[0], s = a[1], l = a[2];
    function f(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    if (s === 0) return [l * 255, l * 255, l * 255];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
  }
  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  }
  function lum(hex) {
    var c = hexToRgb(hex).map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function setL(hex, fn) {
    var h = rgbToHsl(hexToRgb(hex)); h[2] = Math.max(0, Math.min(1, fn(h[2]))); return rgbToHex(hslToRgb(h));
  }
  function isHex(v) { return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v); }
  function norm(v) { v = String(v).trim(); if (v[0] !== '#') v = '#' + v; return rgbToHex(hexToRgb(v)); }

  /* ---------- build the full set of site colours from 3 chosen colours ---------- */
  function derive(accent, dark, bg) {
    var ink = setL(dark, function (l) { return Math.min(l, 0.24); });   // keep "dark" dark
    var paper = setL(bg, function (l) { return Math.max(l, 0.9); });    // keep background light
    var onAccent = contrast(accent, '#ffffff') >= 4.5 ? '#ffffff' : ink;

    var light = accent, guard = 0;                                       // accent used on dark areas
    while (contrast(light, ink) < 4.5 && guard++ < 40) light = setL(light, function (l) { return l + 0.02; });
    if (lum(light) < lum(accent)) light = accent;

    var rgb = hexToRgb(ink).map(function (v) { return Math.round(v * 0.72); });
    return {
      '--accent': accent,
      '--accent-dark': setL(accent, function (l) { return l * 0.82; }),
      '--accent-light': light,
      '--on-accent': onAccent,
      '--ink': ink,
      '--ink-2': setL(ink, function (l) { return l + 0.045; }),
      '--paper': paper,
      '--surface': mix(paper, '#ffffff', 0.7),
      '--muted': mix(paper, ink, 0.05),
      '--line': mix(paper, ink, 0.14),
      '--text': mix(ink, paper, 0.08),
      '--text-soft': mix(ink, paper, 0.3),
      '--on-dark': mix(paper, ink, 0.03),
      '--on-dark-soft': mix(ink, paper, 0.65),
      '--overlay-rgb': rgb.join(',')
    };
  }

  var PRESETS = [
    { name: 'Original',  a: '#c8281e', d: '#1c1d20', b: '#fbfaf7' },
    { name: 'Blue',      a: '#1f5fbf', d: '#101a2b', b: '#f7f9fc' },
    { name: 'Green',     a: '#1f7a4d', d: '#14201a', b: '#f6faf6' },
    { name: 'Saffron',   a: '#d35f00', d: '#1f1a16', b: '#fcf9f4' },
    { name: 'Teal',      a: '#0e7c86', d: '#0f2024', b: '#f5fafa' },
    { name: 'Plum',      a: '#7b2d8b', d: '#1e1424', b: '#faf7fb' },
    { name: 'Maroon',    a: '#8c1c2c', d: '#231416', b: '#fbf8f7' },
    { name: 'Graphite',  a: '#3d4a5c', d: '#15171a', b: '#f8f8f7' }
  ];
  var ORIGINAL = PRESETS[0];

  /* ---------- applying / saving ---------- */
  var root = document.documentElement;
  var VARS = Object.keys(derive('#c8281e', '#1c1d20', '#fbfaf7'));

  function applyToSite(sel) {
    var v = derive(sel.a, sel.d, sel.b);
    VARS.forEach(function (k) { root.style.setProperty(k, v[k]); });
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', v['--ink']);
  }
  function clearSite() {
    VARS.forEach(function (k) { root.style.removeProperty(k); });
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#1c1d20');
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      if (s && isHex(s.a) && isHex(s.d) && isHex(s.b)) return { a: norm(s.a), d: norm(s.d), b: norm(s.b) };
    } catch (e) {}
    return null;
  }
  function save(sel) { try { localStorage.setItem(STORE, JSON.stringify(sel)); return true; } catch (e) { return false; } }
  function wipe() { try { localStorage.removeItem(STORE); } catch (e) {} }

  var saved = load();
  if (saved) applyToSite(saved);   // runs before first paint (script is in <head>)

  /* ---------- panel UI ---------- */
  var wantPicker = SHOW_PICKER || /[?&]palette=1/.test(location.search);
  if (!wantPicker) return;

  function build() {
    var current = saved || { a: ORIGINAL.a, d: ORIGINAL.d, b: ORIGINAL.b };
    var draft = { a: current.a, d: current.d, b: current.b };

    var fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'tp-fab';
    fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'tp-panel');
    fab.innerHTML = '<span class="tp-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Colours</span>';

    var panel = document.createElement('div');
    panel.className = 'tp-panel'; panel.id = 'tp-panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Website colour palette');

    var presetsHtml = PRESETS.map(function (p, i) {
      return '<button type="button" class="tp-preset" data-i="' + i + '" aria-pressed="false">' +
        '<span class="tp-chips"><i style="background:' + p.a + '"></i><i style="background:' + p.d + '"></i><i style="background:' + p.b + '"></i></span>' +
        p.name + '</button>';
    }).join('');

    function row(key, title, hint) {
      return '<div class="tp-row"><input type="color" data-k="' + key + '" aria-label="' + title + '">' +
        '<b>' + title + ' <span class="tp-hex" data-hex="' + key + '"></span></b><span>' + hint + '</span></div>';
    }

    panel.innerHTML =
      '<div class="tp-head"><h2 class="tp-title">Website colours</h2><button type="button" class="tp-x" aria-label="Close">&times;</button></div>' +
      '<p class="tp-sub">Choose colours, check the preview, then press Apply.</p>' +
      '<span class="tp-label">Ready-made palettes</span><div class="tp-presets">' + presetsHtml + '</div>' +
      '<span class="tp-label">Or pick your own</span>' +
      row('a', 'Main colour', 'Buttons, highlights, numbers, call bar') +
      row('d', 'Dark colour', 'Headings, header text, dark sections, footer') +
      row('b', 'Background', 'Page background (light colours only)') +
      '<span class="tp-label">Preview</span>' +
      '<div class="tp-preview" id="tp-pv">' +
        '<div class="tp-pv-head"><span class="tp-pv-mark">AM</span><span class="tp-pv-name">Ambika Motors</span><span class="tp-pv-btn">Call</span></div>' +
        '<div class="tp-pv-body"><h4>Used cars, Chembur</h4><p>Buy or sell a pre-owned car with a clear process.</p><a href="#" onclick="return false">Read more</a></div>' +
        '<div class="tp-pv-dark"><span>Open 24 hours, daily</span><b>+91 79773 73365</b></div>' +
      '</div>' +
      '<p class="tp-note" id="tp-note" role="status"></p>' +
      '<div class="tp-actions"><button type="button" class="tp-btn" data-act="reset">Reset</button><button type="button" class="tp-btn primary" data-act="apply">Apply to website</button></div>' +
      '<button type="button" class="tp-link" data-act="copy">Copy CSS to make it permanent</button>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    var pv = panel.querySelector('#tp-pv');
    var note = panel.querySelector('#tp-note');
    var presetBtns = panel.querySelectorAll('.tp-preset');
    var inputs = panel.querySelectorAll('input[type=color]');
    var dots = fab.querySelectorAll('.tp-dots i');

    function paintDots(sel) {
      dots[0].style.background = sel.a; dots[1].style.background = sel.d; dots[2].style.background = sel.b;
    }
    function say(msg, warn) { note.textContent = msg; note.className = 'tp-note' + (warn ? ' warn' : ''); }

    function refresh(msg) {
      var v = derive(draft.a, draft.d, draft.b);
      pv.style.setProperty('--p-accent', v['--accent']);
      pv.style.setProperty('--p-on', v['--on-accent']);
      pv.style.setProperty('--p-ink', v['--ink']);
      pv.style.setProperty('--p-paper', v['--paper']);
      pv.style.setProperty('--p-line', v['--line']);
      pv.style.setProperty('--p-soft', v['--text-soft']);
      pv.style.setProperty('--p-ondark', v['--on-dark']);
      pv.style.setProperty('--p-light', v['--accent-light']);
      inputs.forEach(function (i) {
        var k = i.getAttribute('data-k');
        i.value = k === 'a' ? draft.a : k === 'd' ? v['--ink'] : v['--paper'];
        panel.querySelector('[data-hex="' + k + '"]').textContent = i.value.toUpperCase();
      });
      presetBtns.forEach(function (b) {
        var p = PRESETS[+b.getAttribute('data-i')];
        b.setAttribute('aria-pressed', String(p.a === draft.a && p.d === v['--ink'] && p.b === v['--paper']));
      });
      if (msg) { say(msg); return; }
      if (contrast(draft.a, v['--paper']) < 3) say('Main colour is quite light on this background. Links and numbers may be hard to read; try a deeper shade.', true);
      else say('Not applied yet. Press "Apply to website" to use these colours.');
    }

    function open(o) {
      panel.hidden = !o; fab.setAttribute('aria-expanded', String(o));
      if (o) { panel.querySelector('.tp-preset').focus(); }
    }
    fab.addEventListener('click', function () { open(panel.hidden); });
    panel.querySelector('.tp-x').addEventListener('click', function () { open(false); fab.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { open(false); fab.focus(); } });

    presetBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = PRESETS[+b.getAttribute('data-i')];
        draft = { a: p.a, d: p.d, b: p.b }; refresh();
      });
    });
    inputs.forEach(function (i) {
      i.addEventListener('input', function () { draft[i.getAttribute('data-k')] = norm(i.value); refresh(); });
    });

    panel.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'apply') {
        var v = derive(draft.a, draft.d, draft.b);
        current = { a: draft.a, d: v['--ink'], b: v['--paper'] };
        applyToSite(current); paintDots(current);
        var ok = save(current);
        say(ok ? 'Applied to the whole website \u2713' : 'Applied for this visit (this browser would not save it).', !ok);
      } else if (act === 'reset') {
        clearSite(); wipe();
        current = { a: ORIGINAL.a, d: ORIGINAL.d, b: ORIGINAL.b };
        draft = { a: current.a, d: current.d, b: current.b };
        paintDots(current); refresh('Back to the original colours.');
      } else if (act === 'copy') {
        var v2 = derive(draft.a, draft.d, draft.b);
        var css = ':root{\n' + VARS.map(function (k) { return '  ' + k + ':' + v2[k] + ';'; }).join('\n') + '\n}';
        var done = function () { say('CSS copied. Paste these values into :root in styles.css.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(css).then(done, function () { window.prompt('Copy this CSS:', css); });
        else window.prompt('Copy this CSS:', css);
      }
    });

    paintDots(current); refresh();
    say('Pick a palette or colours, then press "Apply to website".');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
