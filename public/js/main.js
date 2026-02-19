// ── Adaptive scroll reveal ────────────────────────────────────────
(function() {
    var lastY    = window.scrollY;
    var velocity = 0;
    var vTimer;

    window.addEventListener('scroll', function() {
        velocity = Math.abs(window.scrollY - lastY);
        lastY    = window.scrollY;
        clearTimeout(vTimer);
        vTimer = setTimeout(function() { velocity = 0; }, 120);
    }, { passive: true });

    var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
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

    document.querySelectorAll('.fade-in, .fade-in-up').forEach(function(el) {
        el.style.animationPlayState = 'paused';
        obs.observe(el);
    });
})();

// ── Copy buttons ──────────────────────────────────────────────────
(function() {
    document.querySelectorAll('.code-block').forEach(function(block) {
        var btn = document.createElement('button');
        btn.className   = 'copy-button';
        btn.textContent = 'Copy';

        btn.addEventListener('click', function() {
            var text = Array.from(block.querySelectorAll('code'))
                .map(function(c) { return c.textContent; }).join('\n');

            navigator.clipboard.writeText(text).then(function() {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });

        block.appendChild(btn);
    });
})();

// ── Feature popup ─────────────────────────────────────────────────
(function() {
    var overlay = document.createElement('div');
    overlay.className = 'feature-overlay';
    overlay.innerHTML =
        '<div class="feature-popup">' +
            '<div class="feature-popup-image" id="feat-img-wrap">' +
                '<img id="feat-img" src="" alt="">' +
                '<button class="feature-popup-close" id="feat-close">✕</button>' +
            '</div>' +
            '<div class="feature-popup-no-image" id="feat-no-img" style="display:none">' +
                '<span id="feat-icon-big"></span>' +
                '<button class="feature-popup-close" id="feat-close-2" style="position:absolute;top:14px;right:14px;background:var(--bg-tertiary);color:var(--text-primary);border:1.5px solid var(--border);">✕</button>' +
            '</div>' +
            '<div class="feature-popup-body">' +
                '<h2 id="feat-title"></h2>' +
                '<div id="feat-desc"></div>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    var featImgWrap = document.getElementById('feat-img-wrap');
    var featImg     = document.getElementById('feat-img');
    var featNoImg   = document.getElementById('feat-no-img');
    var featTitle   = document.getElementById('feat-title');
    var featDesc    = document.getElementById('feat-desc');
    var featIconBig = document.getElementById('feat-icon-big');

    function closeFeature() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeFeature(); });
    document.getElementById('feat-close').addEventListener('click',   closeFeature);
    document.getElementById('feat-close-2').addEventListener('click', closeFeature);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeFeature(); });

    document.querySelectorAll('.feature-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var title   = card.dataset.title   || card.querySelector('h3').textContent;
            var desc    = card.dataset.desc     || card.querySelector('p').textContent;
            var longDesc= card.dataset.longdesc || '';
            var img     = card.dataset.img      || '';
            var icon    = card.dataset.icon     || card.querySelector('.feature-card-icon')?.textContent || '';

            featTitle.textContent = title;
            featDesc.innerHTML = '';

            var mainP = document.createElement('p');
            mainP.textContent = desc;
            featDesc.appendChild(mainP);

            if (longDesc) {
                var longP = document.createElement('p');
                longP.textContent = longDesc;
                featDesc.appendChild(longP);
            }

            if (img) {
                featImg.src = img;
                featImg.alt = title;
                featImgWrap.style.display = 'block';
                featNoImg.style.display   = 'none';
            } else {
                featImgWrap.style.display = 'none';
                featNoImg.style.display   = 'flex';
                featIconBig.textContent   = icon;
            }

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
})();

// ── Docs explorer popup ───────────────────────────────────────────
(function() {
    var overlay = document.createElement('div');
    overlay.className = 'docs-overlay';
    overlay.innerHTML =
        '<div class="docs-explorer">' +
            '<div class="docs-explorer-header">' +
                '<span class="docs-explorer-title">Documentation</span>' +
                '<button class="docs-explorer-close">✕</button>' +
            '</div>' +
            '<div class="docs-explorer-path" id="explorer-path"></div>' +
            '<div class="docs-explorer-body" id="explorer-body"></div>' +
        '</div>';

    document.body.appendChild(overlay);

    var explorerBody = document.getElementById('explorer-body');
    var explorerPath = document.getElementById('explorer-path');
    var manifest     = [];

    function closeExplorer() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeExplorer(); });
    overlay.querySelector('.docs-explorer-close').addEventListener('click', closeExplorer);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeExplorer(); });

    function renderPath() {
        explorerPath.innerHTML =
            '<span class="docs-path-sep">📁</span>' +
            '<span class="docs-path-crumb current">docs</span>';
    }

    function renderManifest() {
        explorerBody.innerHTML = '';
        renderPath();

        manifest.forEach(function(doc) {
            var item = document.createElement('a');
            item.className = 'docs-explorer-item';
            item.href      = 'docs/' + doc.slug + '/';
            item.innerHTML =
                '<div class="docs-item-icon">📄</div>' +
                '<div class="docs-item-info">' +
                    '<div class="docs-item-name">' + doc.title + '</div>' +
                    '<div class="docs-item-desc">' + doc.description + '</div>' +
                '</div>' +
                '<span class="docs-item-arrow">›</span>';

            item.addEventListener('click', function() { closeExplorer(); });
            explorerBody.appendChild(item);
        });
    }

    async function openExplorer() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!manifest.length) {
            explorerBody.innerHTML = '<div class="commit-loading">Loading...</div>';
            try {
                manifest = await fetch('docs/manifest.json').then(function(r) { return r.json(); });
            } catch (e) {
                explorerBody.innerHTML = '<div class="commit-error" style="padding:20px">Could not load docs.</div>';
                return;
            }
        }

        renderManifest();
    }

    var docsBtn = document.getElementById('btn-docs-explorer');
    if (docsBtn) docsBtn.addEventListener('click', openExplorer);
})();

// ── Docs grid on homepage (hidden section, still populated for footer links) ──
(async function() {
    var grid = document.getElementById('docs-grid');
    if (!grid) return;
    try {
        var manifest = await fetch('docs/manifest.json').then(function(r) { return r.json(); });
        grid.innerHTML = '';
        manifest.forEach(function(doc, i) {
            var a = document.createElement('a');
            a.href      = 'docs/' + doc.slug + '/';
            a.className = 'doc-card fade-in-up delay-' + Math.min(i + 1, 6);
            a.innerHTML = '<h3>' + doc.title + '</h3><p>' + doc.description + '</p>';
            grid.appendChild(a);
        });
    } catch (e) { /* silent */ }
})();
