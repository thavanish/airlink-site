var CACHE_TTL = 5 * 60 * 1000;

function cachedFetch(key, url) {
    try {
        var entry = JSON.parse(sessionStorage.getItem(key) || 'null');
        if (entry && (Date.now() - entry.ts) < CACHE_TTL) {
            return Promise.resolve(entry.data);
        }
    } catch(e) {}
    return fetch(url)
        .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function(data) {
            try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch(e) {}
            return data;
        });
}

(function() {
    var lastY = window.scrollY, velocity = 0, vTimer;
    window.addEventListener('scroll', function() {
        velocity = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
        clearTimeout(vTimer);
        vTimer = setTimeout(function() { velocity = 0; }, 120);
    }, { passive: true });

    var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            if (velocity > 40) {
                el.style.transition = 'none';
                el.style.opacity = '1';
                el.style.transform = 'none';
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

(function() {
    document.querySelectorAll('.code-block').forEach(function(block) {
        var btn = document.createElement('button');
        btn.className = 'copy-button';
        btn.textContent = 'Copy';
        btn.addEventListener('click', function() {
            var text = Array.from(block.querySelectorAll('code')).map(function(c) { return c.textContent; }).join('\n');
            navigator.clipboard.writeText(text).then(function() {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });
        block.appendChild(btn);
    });
})();

function makeSlideshow(containerEl, images, icon, arrowClass, imgClass, fallbackClass, dotClass, closeCallback) {
    var current = 0;

    function renderSlide() {
        containerEl.innerHTML = '';
        if (closeCallback) {
            var closeBtn = document.createElement('button');
            closeBtn.className = 'feat-slide-close';
            closeBtn.innerHTML = '✕';
            closeBtn.addEventListener('click', closeCallback);
            containerEl.appendChild(closeBtn);
        }

        if (!images || !images.length) {
            var fb = document.createElement('div');
            fb.className = fallbackClass;
            fb.textContent = icon;
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
        img.addEventListener('error', function() {
            var fb2 = document.createElement('div');
            fb2.className = fallbackClass;
            fb2.textContent = icon;
            containerEl.replaceChild(fb2, img);
        });
        img.src = images[current];
        containerEl.appendChild(img);

        if (images.length > 1) {
            var prevBtn = document.createElement('button');
            prevBtn.className = arrowClass + ' prev';
            prevBtn.innerHTML = '‹';
            prevBtn.addEventListener('click', function() {
                current = (current - 1 + images.length) % images.length;
                renderSlide();
            });
            containerEl.appendChild(prevBtn);

            var nextBtn = document.createElement('button');
            nextBtn.className = arrowClass + ' next';
            nextBtn.innerHTML = '›';
            nextBtn.addEventListener('click', function() {
                current = (current + 1) % images.length;
                renderSlide();
            });
            containerEl.appendChild(nextBtn);

            var dots = document.createElement('div');
            dots.className = dotClass + 's';
            images.forEach(function(_, i) {
                var dot = document.createElement('div');
                dot.className = dotClass + (i === current ? ' active' : '');
                dot.addEventListener('click', function() { current = i; renderSlide(); });
                dots.appendChild(dot);
            });
            containerEl.appendChild(dots);
        }
    }

    renderSlide();
}

(function() {
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

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeFeature(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeFeature(); });

    document.querySelectorAll('.feature-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var title    = card.dataset.title    || card.querySelector('h3').textContent;
            var desc     = card.dataset.desc     || '';
            var longDesc = card.dataset.longdesc || '';
            var icon     = card.dataset.icon     || '📦';
            var folder   = card.dataset.folder   || '';

            featTitle.textContent = title;
            featDesc.innerHTML = '';
            if (desc)     { var p1 = document.createElement('p'); p1.textContent = desc; featDesc.appendChild(p1); }
            if (longDesc) { var p2 = document.createElement('p'); p2.textContent = longDesc; featDesc.appendChild(p2); }

            var images = [];
            if (folder) {
                var exts = ['.jpg', '.jpeg', '.png', '.webp'];
                var nums = [1, 2, 3, 4, 5];
                images = nums.map(function(n) { return folder + '/' + n + '.jpg'; });
            } else if (card.dataset.img) {
                images = [card.dataset.img];
            }

            makeSlideshow(slideshowEl, images, icon, 'feat-slide-arrow', 'feat-slide-img', 'feat-slide-fallback', 'feat-slide-dot', closeFeature);

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
})();

(function() {
    var overlay = document.createElement('div');
    overlay.className = 'addon-popup-overlay';
    overlay.innerHTML =
        '<div class="addon-popup">' +
            '<div class="addon-popup-slideshow" id="ap-slideshow"></div>' +
            '<div class="addon-popup-header">' +
                '<div class="addon-popup-top">' +
                    '<div class="addon-popup-icon" id="ap-icon"></div>' +
                    '<div class="addon-popup-title-block">' +
                        '<div class="addon-popup-name" id="ap-name"></div>' +
                        '<div class="addon-popup-byline" id="ap-byline"></div>' +
                    '</div>' +
                    '<button class="addon-popup-close" id="ap-close">✕</button>' +
                '</div>' +
                '<div class="addon-popup-actions">' +
                    '<a id="ap-view-btn" href="#" target="_blank" rel="noopener" class="addon-popup-btn addon-popup-btn-view">🔗 View on GitHub</a>' +
                    '<button id="ap-install-tab" class="addon-popup-btn addon-popup-btn-install">⬇ Install</button>' +
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

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeAddon(); });
    document.getElementById('ap-close').addEventListener('click', closeAddon);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeAddon(); });

    overlay.querySelectorAll('.addon-popup-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            overlay.querySelectorAll('.addon-popup-tab, .addon-popup-panel').forEach(function(el) { el.classList.remove('active'); });
            tab.classList.add('active');
            document.getElementById('ap-panel-' + tab.dataset.tab).classList.add('active');
        });
    });

    document.getElementById('ap-install-tab').addEventListener('click', function() {
        overlay.querySelectorAll('.addon-popup-tab, .addon-popup-panel').forEach(function(el) { el.classList.remove('active'); });
        overlay.querySelector('[data-tab="install"]').classList.add('active');
        document.getElementById('ap-panel-install').classList.add('active');
    });

    function makeCodeBlock(lines) {
        var div = document.createElement('div');
        div.className = 'code-block';
        lines.forEach(function(line) {
            var c = document.createElement('code');
            c.textContent = line;
            div.appendChild(c);
        });
        var btn = document.createElement('button');
        btn.className = 'copy-button';
        btn.textContent = 'Copy';
        btn.addEventListener('click', function() {
            navigator.clipboard.writeText(lines.join('\n')).then(function() {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });
        div.appendChild(btn);
        return div;
    }

    function setIconContent(el, iconData) {
        el.innerHTML = '';
        if (!iconData) return;
        if (iconData.startsWith('http') || iconData.startsWith('/') || iconData.startsWith('./') || iconData.indexOf('.') > -1 && !iconData.match(/^\p{Emoji}/u)) {
            var img = document.createElement('img');
            img.src = iconData;
            img.addEventListener('error', function() { el.textContent = '🧩'; });
            el.appendChild(img);
        } else {
            el.textContent = iconData;
        }
    }

    window.openAddonPopup = function(data) {
        overlay.querySelectorAll('.addon-popup-tab, .addon-popup-panel').forEach(function(el) { el.classList.remove('active'); });
        overlay.querySelector('[data-tab="overview"]').classList.add('active');
        document.getElementById('ap-panel-overview').classList.add('active');

        var iconEl = document.getElementById('ap-icon');
        setIconContent(iconEl, data.icon || '🧩');

        document.getElementById('ap-name').textContent = data.name;
        document.getElementById('ap-byline').textContent = 'by ' + (data.author || 'Unknown') + ' · ' + (data.version || 'Latest');
        document.getElementById('ap-view-btn').href = data.github || '#';
        document.getElementById('ap-desc').textContent = data.longDesc || data.desc;

        var images = data.images || [];
        var icon   = (typeof data.icon === 'string' && (data.icon.length <= 4)) ? data.icon : '🧩';
        makeSlideshow(apSlideshow, images, icon, 'addon-slide-arrow', 'addon-slide-img', 'addon-slide-fallback', 'addon-slide-dot', null);

        if (!images.length) {
            apSlideshow.style.display = 'none';
        } else {
            apSlideshow.style.display = '';
        }

        var fl = document.getElementById('ap-features-list');
        fl.innerHTML = '';
        if (data.features && data.features.length) {
            var ftitle = document.createElement('div');
            ftitle.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin:16px 0 10px';
            ftitle.textContent = 'Features';
            fl.appendChild(ftitle);
            data.features.forEach(function(f) {
                var item = document.createElement('div');
                item.style.cssText = 'font-size:13px;color:var(--text-secondary);padding:5px 0;display:flex;gap:8px;align-items:flex-start';
                item.innerHTML = '<span style="color:var(--text-primary);flex-shrink:0">✓</span>' + f;
                fl.appendChild(item);
            });
        }

        var stepsEl = document.getElementById('ap-install-steps');
        stepsEl.innerHTML = '';
        if (data.installSteps) {
            data.installSteps.forEach(function(s, i) {
                var step = document.createElement('div');
                step.className = 'addon-install-step';
                step.innerHTML = '<div class="addon-install-step-num">' + (i+1) + '</div><div class="addon-install-step-body"><h4>' + s.title + '</h4></div>';
                step.querySelector('.addon-install-step-body').appendChild(makeCodeBlock(s.commands));
                stepsEl.appendChild(step);
            });
        }
        if (data.installNote) {
            var note = document.createElement('div');
            note.className = 'addon-popup-note';
            note.textContent = data.installNote;
            stepsEl.appendChild(note);
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    document.querySelectorAll('.addon-marketplace-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var name = card.dataset.name;
            var def  = window.ADDON_DEFS && window.ADDON_DEFS[name];
            if (def) openAddonPopup(def);
        });
    });
})();

(function() {
    var overlay = document.createElement('div');
    overlay.className = 'docs-overlay';
    overlay.innerHTML =
        '<div class="docs-explorer">' +
            '<div class="docs-explorer-header">' +
                '<span class="docs-explorer-title">📖 Documentation</span>' +
                '<button class="docs-explorer-close">✕</button>' +
            '</div>' +
            '<div class="docs-explorer-path" id="explorer-path"></div>' +
            '<div class="docs-explorer-body" id="explorer-body"></div>' +
        '</div>';
    document.body.appendChild(overlay);

    var explorerBody = document.getElementById('explorer-body');
    var explorerPath = document.getElementById('explorer-path');
    var manifest = [];

    function closeExplorer() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeExplorer(); });
    overlay.querySelector('.docs-explorer-close').addEventListener('click', closeExplorer);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeExplorer(); });

    function renderManifest() {
        explorerPath.innerHTML = '<span style="opacity:0.5">📁</span> <span style="color:var(--text-primary)">docs</span>';
        explorerBody.innerHTML = '';
        manifest.forEach(function(doc) {
            var item = document.createElement('a');
            item.className = 'docs-explorer-item';
            item.href = 'docs/' + doc.slug + '/';
            item.innerHTML =
                '<div class="docs-item-icon">📄</div>' +
                '<div class="docs-item-info"><div class="docs-item-name">' + doc.title + '</div><div class="docs-item-desc">' + doc.description + '</div></div>' +
                '<span class="docs-item-arrow">›</span>';
            item.addEventListener('click', closeExplorer);
            explorerBody.appendChild(item);
        });
    }

    function openExplorer() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (manifest.length) { renderManifest(); return; }
        explorerBody.innerHTML = '<div class="commit-loading" style="padding:20px">Loading...</div>';
        cachedFetch('docs-manifest', 'docs/manifest.json')
            .then(function(data) { manifest = data; renderManifest(); })
            .catch(function() { explorerBody.innerHTML = '<div style="padding:20px;color:#e57373">Could not load docs.</div>'; });
    }

    document.querySelectorAll('#btn-docs-explorer').forEach(function(btn) {
        btn.addEventListener('click', openExplorer);
    });
})();
