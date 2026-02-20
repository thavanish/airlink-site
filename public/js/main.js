/*
  main.js — core site utilities, loading screen, GitHub cache proxy,
  feature cards, addon cards, docs explorer, and scroll animations.
  Depends on: icons.js, config.js
*/

/* ══════════════════════════════════════════════════════════════
   LOADING SCREEN
   Shows only when the page takes longer than 400 ms to become
   interactive. Reads under-construction state from config.
   ══════════════════════════════════════════════════════════════ */

(function () {
  var DELAY_MS  = 400; /* only show if load takes longer than this */
  var startTime = Date.now();
  var screen    = null;
  var timer     = null;

  function createLoadingScreen() {
    var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.underConstruction) || {};
    var isUC = cfg.enabled;

    screen = document.createElement('div');
    screen.id = 'loading-screen';
    screen.innerHTML =
      '<div class="loading-inner">' +
        '<div class="loading-logo">' + getIcon('loader') + '</div>' +
        '<div class="loading-title">' + ((window.SITE_CONFIG && window.SITE_CONFIG.site.title) || 'AirLink') + '</div>' +
        (isUC
          ? '<div class="loading-uc-badge">' + getIcon('construction', 16) + '<span>' + (cfg.navbarBadge || 'Under Construction') + '</span></div>'
          : '<div class="loading-sub">Loading...</div>'
        ) +
      '</div>';

    Object.assign(screen.style, {
      position:   'fixed',
      inset:      '0',
      zIndex:     '9999',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      transition: 'opacity 0.35s ease',
      opacity:    '0',
      pointerEvents: 'none'
    });

    document.body.appendChild(screen);
  }

  function showLoadingScreen() {
    if (!screen) createLoadingScreen();
    screen.style.opacity      = '1';
    screen.style.pointerEvents = 'auto';
  }

  function hideLoadingScreen() {
    if (!screen) return;
    screen.style.opacity = '0';
    screen.style.pointerEvents = 'none';
    setTimeout(function () {
      if (screen && screen.parentNode) screen.parentNode.removeChild(screen);
      screen = null;
    }, 380);
  }

  /* Show loading screen only after the delay threshold */
  timer = setTimeout(function () {
    if (document.readyState !== 'complete') {
      showLoadingScreen();
    }
  }, DELAY_MS);

  window.addEventListener('load', function () {
    clearTimeout(timer);
    var elapsed = Date.now() - startTime;
    if (screen) {
      /* Already visible — hide it */
      setTimeout(hideLoadingScreen, 200);
    }
    /* If load was fast enough the screen was never shown — nothing to do */
  });

  /* Safety net: force-hide after 8 seconds no matter what */
  setTimeout(function () {
    if (screen) hideLoadingScreen();
  }, 8000);
})();


/* ══════════════════════════════════════════════════════════════
   UNDER-CONSTRUCTION BANNER / POPUP
   ══════════════════════════════════════════════════════════════ */

function initUnderConstruction() {
  var cfg = window.SITE_CONFIG && window.SITE_CONFIG.underConstruction;
  if (!cfg || !cfg.enabled) return;

  /* Popup on load */
  var popupKey = 'uc-popup-dismissed';
  var dismissed = false;
  try { dismissed = sessionStorage.getItem(popupKey) === '1'; } catch (e) {}

  if (!dismissed) {
    var overlay = document.createElement('div');
    overlay.className = 'uc-popup-overlay';
    overlay.innerHTML =
      '<div class="uc-popup">' +
        '<div class="uc-popup-icon">' + getIcon('warning', 32) + '</div>' +
        '<h2 class="uc-popup-title">' + (cfg.popupTitle || 'Under Construction') + '</h2>' +
        '<p class="uc-popup-msg">' + (cfg.popupMessage || cfg.message || '') + '</p>' +
        '<button class="uc-popup-btn" id="uc-dismiss">Got it</button>' +
      '</div>';
    document.body.appendChild(overlay);

    setTimeout(function () { overlay.classList.add('active'); }, 100);

    document.getElementById('uc-dismiss').addEventListener('click', function () {
      overlay.classList.remove('active');
      try { sessionStorage.setItem(popupKey, '1'); } catch (e) {}
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 350);
    });
  }

  /* Navbar badge */
  var navbar = document.querySelector('.navbar .container');
  if (navbar) {
    var badge = document.createElement('div');
    badge.className = 'uc-navbar-badge';
    badge.innerHTML = getIcon('construction', 14) + '<span>' + (cfg.navbarBadge || 'Under Construction') + '</span>';
    navbar.insertBefore(badge, navbar.firstChild);
  }

  /* Footer note */
  var footerBottom = document.querySelector('.footer-bottom');
  if (footerBottom) {
    var note = document.createElement('p');
    note.className = 'uc-footer-note';
    note.innerHTML = getIcon('warning', 14) + ' ' + (cfg.footerNote || cfg.message || '');
    footerBottom.appendChild(note);
  }
}


/* ══════════════════════════════════════════════════════════════
   GITHUB API CACHE (sessionStorage, 5-minute TTL)
   Reduces API calls to stay under the rate limit.
   ══════════════════════════════════════════════════════════════ */

var CACHE_TTL = 5 * 60 * 1000;

/*
  cachedFetch — three-tier lookup:
  1. sessionStorage (in-memory, fastest, expires after 5 min)
  2. Static JSON files pre-generated by the GitHub Actions workflow
     at public/api-cache/<key>.json  (avoids GitHub API rate limits)
  3. Live GitHub API (fallback, may be rate-limited for anonymous visitors)

  The key naming convention must match what the workflow produces:
    contributors-AirlinkLabs/panel  -> contributors-panel
    commits-AirlinkLabs/panel-p1   -> commits-panel-p1
    repo-AirlinkLabs/panel         -> repo-panel
*/

function keyToFilename(key) {
  /*
    Map session-storage keys to api-cache filenames.
    contributors-AirlinkLabs/panel  -> contributors-panel
    commits-AirlinkLabs/panel-p1   -> commits-panel-p1
    repo-AirlinkLabs/panel         -> repo-panel
    user-somelogin                 -> user-somelogin (unchanged)
  */
  return key
    .replace(/^contributors-[^/]+\/([\w-]+)$/i, 'contributors-$1')
    .replace(/^commits-[^/]+\/([\w-]+)-/i,      'commits-$1-')
    .replace(/^repo-[^/]+\/([\w-]+)$/i,         'repo-$1')
    .replace(/[/\\:*?"<>|]/g, '-');
}

/*
  Determine the correct relative path prefix to public/api-cache/
  depending on whether we are at root or inside docs/slug/.
*/
function apiCachePath(filename) {
  var path = window.location.pathname;
  var prefix = path.indexOf('/docs/') !== -1 ? '../../' : '';
  return prefix + 'public/api-cache/' + filename + '.json';
}

function cachedFetch(key, url) {
  /* 1 — sessionStorage */
  try {
    var entry = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (entry && (Date.now() - entry.ts) < CACHE_TTL) {
      return Promise.resolve(entry.data);
    }
  } catch (e) {}

  /* 2 — static pre-fetched JSON from the workflow */
  var filename = keyToFilename(key);
  return fetch(apiCachePath(filename))
    .then(function (r) {
      if (!r.ok) return Promise.reject('no-cache');
      return r.json();
    })
    .then(function (data) {
      try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
      return data;
    })
    .catch(function () {
      /* 3 — live API fallback */
      return fetch(url)
        .then(function (r) {
          if (!r.ok) return Promise.reject(r.status);
          return r.json();
        })
        .then(function (data) {
          try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
          return data;
        });
    });
}


/* ══════════════════════════════════════════════════════════════
   SCROLL ANIMATIONS
   ══════════════════════════════════════════════════════════════ */

(function () {
  var lastY     = window.scrollY;
  var velocity  = 0;
  var vTimer;

  window.addEventListener('scroll', function () {
    velocity = Math.abs(window.scrollY - lastY);
    lastY    = window.scrollY;
    clearTimeout(vTimer);
    vTimer = setTimeout(function () { velocity = 0; }, 120);
  }, { passive: true });

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      if (velocity > 40) {
        el.style.transition = 'none';
        el.style.opacity    = '1';
        el.style.transform  = 'none';
      } else {
        el.style.animationPlayState = 'running';
      }
      obs.unobserve(el);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.fade-in, .fade-in-up').forEach(function (el) {
    el.style.animationPlayState = 'paused';
    obs.observe(el);
  });
})();


/* ══════════════════════════════════════════════════════════════
   CODE BLOCK COPY BUTTONS
   ══════════════════════════════════════════════════════════════ */

(function () {
  document.querySelectorAll('.code-block').forEach(function (block) {
    var btn = document.createElement('button');
    btn.className   = 'copy-button';
    btn.innerHTML   = getIcon('copy') + '<span>Copy</span>';
    btn.addEventListener('click', function () {
      var text = Array.from(block.querySelectorAll('code'))
        .map(function (c) { return c.textContent; })
        .join('\n');
      navigator.clipboard.writeText(text).then(function () {
        btn.innerHTML = getIcon('check') + '<span>Copied!</span>';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.innerHTML = getIcon('copy') + '<span>Copy</span>';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    block.appendChild(btn);
  });
})();


/* ══════════════════════════════════════════════════════════════
   SLIDESHOW HELPER
   ══════════════════════════════════════════════════════════════ */

/*
  Dynamically scans image folders via the GitHub API (using the
  cached fetch wrapper). Falls back to showing the feature icon.

  imageFolder — e.g. "public/assets/features/server-management"
  The GitHub Actions workflow pre-generates a manifest JSON file
  at <imageFolder>/manifest.json listing all image filenames.
  If that file doesn't exist we fall back gracefully.
*/

function loadImagesFromFolder(imageFolder, callback) {
  /* Try to load the generated manifest first */
  var manifestUrl = imageFolder + '/manifest.json';
  fetch(manifestUrl)
    .then(function (r) { return r.ok ? r.json() : Promise.reject('no manifest'); })
    .then(function (data) {
      /* manifest is { "images": ["1.jpg", "2.jpg", ...] } */
      var images = (data.images || []).map(function (f) { return imageFolder + '/' + f; });
      callback(images);
    })
    .catch(function () {
      /* No manifest — return empty so the icon fallback is used */
      callback([]);
    });
}

function makeSlideshow(containerEl, images, iconKey, arrowClass, imgClass, fallbackClass, dotClass, closeCallback) {
  var current = 0;

  function renderSlide() {
    containerEl.innerHTML = '';

    if (closeCallback) {
      var closeBtn = document.createElement('button');
      closeBtn.className = arrowClass.replace('arrow', 'close');
      closeBtn.innerHTML = getIcon('close');
      closeBtn.addEventListener('click', closeCallback);
      containerEl.appendChild(closeBtn);
    }

    if (!images || !images.length) {
      var fb = document.createElement('div');
      fb.className = fallbackClass;
      fb.innerHTML = getIcon(iconKey || 'puzzle', 64);
      containerEl.appendChild(fb);
      return;
    }

    if (images.length > 1) {
      var counter = document.createElement('div');
      counter.className = 'feat-slide-counter';
      counter.textContent = (current + 1) + ' / ' + images.length;
      containerEl.appendChild(counter);
    }

    var img = document.createElement('img');
    img.className = imgClass;
    img.alt = '';
    img.addEventListener('error', function () {
      var fb2 = document.createElement('div');
      fb2.className = fallbackClass;
      fb2.innerHTML = getIcon(iconKey || 'puzzle', 64);
      if (img.parentNode) img.parentNode.replaceChild(fb2, img);
    });
    img.src = images[current];
    containerEl.appendChild(img);

    if (images.length > 1) {
      var prevBtn = document.createElement('button');
      prevBtn.className = arrowClass + ' prev';
      prevBtn.innerHTML = getIcon('chevronLeft');
      prevBtn.addEventListener('click', function () {
        current = (current - 1 + images.length) % images.length;
        renderSlide();
      });
      containerEl.appendChild(prevBtn);

      var nextBtn = document.createElement('button');
      nextBtn.className = arrowClass + ' next';
      nextBtn.innerHTML = getIcon('chevronRight');
      nextBtn.addEventListener('click', function () {
        current = (current + 1) % images.length;
        renderSlide();
      });
      containerEl.appendChild(nextBtn);

      var dots = document.createElement('div');
      dots.className = dotClass + 's';
      images.forEach(function (_, i) {
        var dot = document.createElement('div');
        dot.className = dotClass + (i === current ? ' active' : '');
        dot.addEventListener('click', function () { current = i; renderSlide(); });
        dots.appendChild(dot);
      });
      containerEl.appendChild(dots);
    }
  }

  renderSlide();
}


/* ══════════════════════════════════════════════════════════════
   FEATURE CARDS POPUP
   Built from config.json features array.
   ══════════════════════════════════════════════════════════════ */

(function () {
  var overlay = document.createElement('div');
  overlay.className = 'feature-overlay';
  overlay.innerHTML =
    '<div class="feature-popup">' +
      '<div class="feat-slideshow" id="feat-slideshow"></div>' +
      '<div class="feature-popup-body">' +
        '<h2 id="feat-title"></h2>' +
        '<div id="feat-desc"></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var slideshowEl = document.getElementById('feat-slideshow');
  var featTitle   = document.getElementById('feat-title');
  var featDesc    = document.getElementById('feat-desc');

  function closeFeature() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeFeature(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeFeature(); });

  /* Event delegation — cards are created dynamically by the page builder */
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.feature-card');
    if (!card) return;

    var title    = card.dataset.title    || '';
    var desc     = card.dataset.desc     || '';
    var longDesc = card.dataset.longdesc || '';
    var iconKey  = card.dataset.icon     || 'puzzle';
    var folder   = card.dataset.folder   || '';

    featTitle.textContent = title;
    featDesc.innerHTML    = '';
    if (desc)     { var p1 = document.createElement('p'); p1.textContent = desc;     featDesc.appendChild(p1); }
    if (longDesc) { var p2 = document.createElement('p'); p2.textContent = longDesc; featDesc.appendChild(p2); }

    slideshowEl.innerHTML = '<div class="feat-slide-fallback" style="display:flex;align-items:center;justify-content:center">' + getIcon('loader') + '</div>';

    if (folder) {
      loadImagesFromFolder(folder, function (images) {
        makeSlideshow(slideshowEl, images, iconKey, 'feat-slide-arrow', 'feat-slide-img', 'feat-slide-fallback', 'feat-slide-dot', closeFeature);
      });
    } else {
      makeSlideshow(slideshowEl, [], iconKey, 'feat-slide-arrow', 'feat-slide-img', 'feat-slide-fallback', 'feat-slide-dot', closeFeature);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
})();


/* ══════════════════════════════════════════════════════════════
   ADDON MARKETPLACE POPUP
   Built from config.json addons array.
   ══════════════════════════════════════════════════════════════ */

(function () {
  var overlay = document.createElement('div');
  overlay.className = 'addon-popup-overlay';
  overlay.innerHTML =
    '<div class="addon-popup">' +
      '<div class="addon-popup-slideshow" id="ap-slideshow"></div>' +
      '<div class="addon-popup-header">' +
        '<div class="addon-popup-top">' +
          '<div class="addon-popup-icon" id="ap-icon"></div>' +
          '<div class="addon-popup-title-block">' +
            '<div class="addon-popup-name"  id="ap-name"></div>' +
            '<div class="addon-popup-byline" id="ap-byline"></div>' +
          '</div>' +
          '<button class="addon-popup-close" id="ap-close">' + getIcon('close') + '</button>' +
        '</div>' +
        '<div class="addon-popup-actions">' +
          '<a id="ap-view-btn" href="#" target="_blank" rel="noopener" class="addon-popup-btn addon-popup-btn-view">' +
            getIcon('github') + ' View on GitHub' +
          '</a>' +
          '<button id="ap-install-tab" class="addon-popup-btn addon-popup-btn-install">' +
            getIcon('download') + ' Install' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="addon-popup-body">' +
        '<div class="addon-popup-tab-bar">' +
          '<button class="addon-popup-tab active" data-tab="overview">Overview</button>' +
          '<button class="addon-popup-tab" data-tab="install">Installation</button>' +
        '</div>' +
        '<div class="addon-popup-panel active" id="ap-panel-overview">' +
          '<p class="addon-popup-desc" id="ap-desc"></p>' +
          '<div id="ap-features-list"></div>' +
        '</div>' +
        '<div class="addon-popup-panel" id="ap-panel-install">' +
          '<div id="ap-install-steps"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var apSlideshow = document.getElementById('ap-slideshow');

  function closeAddon() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeAddon(); });
  document.getElementById('ap-close').addEventListener('click', closeAddon);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAddon(); });

  overlay.querySelectorAll('.addon-popup-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      overlay.querySelectorAll('.addon-popup-tab, .addon-popup-panel').forEach(function (el) { el.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('ap-panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  document.getElementById('ap-install-tab').addEventListener('click', function () {
    overlay.querySelectorAll('.addon-popup-tab, .addon-popup-panel').forEach(function (el) { el.classList.remove('active'); });
    overlay.querySelector('[data-tab="install"]').classList.add('active');
    document.getElementById('ap-panel-install').classList.add('active');
  });

  function makeCodeBlock(lines) {
    var div = document.createElement('div');
    div.className = 'code-block';
    lines.forEach(function (line) {
      var c = document.createElement('code');
      c.textContent = line;
      div.appendChild(c);
    });
    var btn = document.createElement('button');
    btn.className = 'copy-button';
    btn.innerHTML = getIcon('copy') + '<span>Copy</span>';
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(lines.join('\n')).then(function () {
        btn.innerHTML = getIcon('check') + '<span>Copied!</span>';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.innerHTML = getIcon('copy') + '<span>Copy</span>';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
    div.appendChild(btn);
    return div;
  }

  window.openAddonPopup = function (data) {
    overlay.querySelectorAll('.addon-popup-tab, .addon-popup-panel').forEach(function (el) { el.classList.remove('active'); });
    overlay.querySelector('[data-tab="overview"]').classList.add('active');
    document.getElementById('ap-panel-overview').classList.add('active');

    /* Icon */
    var iconEl = document.getElementById('ap-icon');
    iconEl.innerHTML = '';
    if (data.iconFile) {
      var img = document.createElement('img');
      img.src = data.iconFile;
      img.alt = data.name;
      img.addEventListener('error', function () {
        iconEl.innerHTML = getIcon('puzzle', 26);
      });
      iconEl.appendChild(img);
    } else {
      iconEl.innerHTML = getIcon('puzzle', 26);
    }

    document.getElementById('ap-name').textContent   = data.name;
    document.getElementById('ap-byline').textContent = 'by ' + (data.author || 'Unknown') + ' \u00b7 ' + (data.version || 'Latest');
    document.getElementById('ap-view-btn').href      = data.github || '#';
    document.getElementById('ap-desc').textContent   = data.longDescription || data.description;

    /* Slideshow — load images from folder manifest */
    apSlideshow.innerHTML = '<div class="addon-slide-fallback" style="display:flex;align-items:center;justify-content:center">' + getIcon('loader') + '</div>';
    apSlideshow.style.display = '';

    if (data.imageFolder) {
      loadImagesFromFolder(data.imageFolder, function (images) {
        if (!images.length) {
          apSlideshow.style.display = 'none';
        } else {
          apSlideshow.style.display = '';
          makeSlideshow(apSlideshow, images, 'puzzle', 'addon-slide-arrow', 'addon-slide-img', 'addon-slide-fallback', 'addon-slide-dot', null);
        }
      });
    } else {
      apSlideshow.style.display = 'none';
    }

    /* Features list */
    var fl = document.getElementById('ap-features-list');
    fl.innerHTML = '';
    if (data.features && data.features.length) {
      var ftitle = document.createElement('div');
      ftitle.className = 'ap-features-title';
      ftitle.textContent = 'Features';
      fl.appendChild(ftitle);
      data.features.forEach(function (f) {
        var item = document.createElement('div');
        item.className = 'ap-feature-item';
        item.innerHTML = '<span class="ap-feature-check">' + getIcon('check') + '</span>' + escHtml(f);
        fl.appendChild(item);
      });
    }

    /* Install steps */
    var stepsEl = document.getElementById('ap-install-steps');
    stepsEl.innerHTML = '';
    if (data.installSteps) {
      data.installSteps.forEach(function (s, i) {
        var step = document.createElement('div');
        step.className = 'addon-install-step';
        var body = document.createElement('div');
        body.className = 'addon-install-step-body';
        var h4 = document.createElement('h4');
        h4.textContent = s.title;
        body.appendChild(h4);
        body.appendChild(makeCodeBlock(s.commands));

        var num = document.createElement('div');
        num.className   = 'addon-install-step-num';
        num.textContent = i + 1;

        step.appendChild(num);
        step.appendChild(body);
        stepsEl.appendChild(step);
      });
    }
    if (data.installNote) {
      var note = document.createElement('div');
      note.className   = 'addon-popup-note';
      note.innerHTML   = getIcon('info') + ' ' + escHtml(data.installNote);
      stepsEl.appendChild(note);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  /* Event delegation — cards are created dynamically by the page builder */
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.addon-marketplace-card');
    if (!card) return;
    var addonId = card.dataset.addonId;
    var cfg     = window.SITE_CONFIG;
    if (!cfg || !cfg.addons) return;
    var def = cfg.addons.find(function (a) { return a.id === addonId; });
    if (def) openAddonPopup(def);
  });
})();


/* ══════════════════════════════════════════════════════════════
   DOCS EXPLORER POPUP
   Reads manifest from config.json
   ══════════════════════════════════════════════════════════════ */

(function () {
  var overlay = document.createElement('div');
  overlay.className = 'docs-overlay';
  overlay.innerHTML =
    '<div class="docs-explorer">' +
      '<div class="docs-explorer-header">' +
        '<span class="docs-explorer-title">' + getIcon('book') + ' Documentation</span>' +
        '<button class="docs-explorer-close">' + getIcon('close') + '</button>' +
      '</div>' +
      '<div class="docs-explorer-path" id="explorer-path"></div>' +
      '<div class="docs-explorer-body" id="explorer-body"></div>' +
    '</div>';
  document.body.appendChild(overlay);

  var explorerBody = document.getElementById('explorer-body');
  var explorerPath = document.getElementById('explorer-path');

  function closeExplorer() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeExplorer(); });
  overlay.querySelector('.docs-explorer-close').addEventListener('click', closeExplorer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeExplorer(); });

  function renderManifest(manifest) {
    explorerPath.innerHTML =
      getIcon('folder') + '&nbsp;<span style="color:var(--text-primary)">docs</span>';
    explorerBody.innerHTML = '';
    manifest.forEach(function (doc) {
      var item = document.createElement('a');
      item.className = 'docs-explorer-item';
      item.href = 'docs/' + doc.slug + '/';
      item.innerHTML =
        '<div class="docs-item-icon">' + getIcon('fileText') + '</div>' +
        '<div class="docs-item-info">' +
          '<div class="docs-item-name">'  + escHtml(doc.title) + '</div>' +
          '<div class="docs-item-desc">'  + escHtml(doc.description) + '</div>' +
        '</div>' +
        '<span class="docs-item-arrow">' + getIcon('chevronRight') + '</span>';
      item.addEventListener('click', closeExplorer);
      explorerBody.appendChild(item);
    });
  }

  function openExplorer() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    var manifest = (window.SITE_CONFIG && window.SITE_CONFIG.docs && window.SITE_CONFIG.docs.manifest) || [];
    if (manifest.length) {
      renderManifest(manifest);
    } else {
      explorerBody.innerHTML = '<div class="commit-loading" style="padding:20px">No docs found.</div>';
    }
  }

  document.querySelectorAll('#btn-docs-explorer').forEach(function (btn) {
    btn.addEventListener('click', openExplorer);
  });
})();


/* ══════════════════════════════════════════════════════════════
   UTILITY
   ══════════════════════════════════════════════════════════════ */

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/* ══════════════════════════════════════════════════════════════
   INIT SEQUENCE
   ══════════════════════════════════════════════════════════════ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initUnderConstruction();
  });
} else {
  initUnderConstruction();
}
