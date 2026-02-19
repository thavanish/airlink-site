// ── Scroll reveal ─────────────────────────────────────────────────
(function() {
    var lastY=window.scrollY, velocity=0, vTimer;
    window.addEventListener('scroll', function() {
        velocity = Math.abs(window.scrollY - lastY); lastY = window.scrollY;
        clearTimeout(vTimer); vTimer = setTimeout(function(){ velocity=0; }, 120);
    }, { passive: true });

    var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            if (velocity > 40) {
                el.style.transition='none'; el.style.opacity='1'; el.style.transform='none';
            } else { el.style.animationPlayState='running'; }
            obs.unobserve(el);
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fade-in,.fade-in-up').forEach(function(el) {
        el.style.animationPlayState='paused'; obs.observe(el);
    });
})();

// ── Copy buttons ──────────────────────────────────────────────────
(function() {
    document.querySelectorAll('.code-block').forEach(function(block) {
        var btn = document.createElement('button');
        btn.className = 'copy-button'; btn.textContent = 'Copy';
        btn.addEventListener('click', function() {
            var text = Array.from(block.querySelectorAll('code')).map(function(c){return c.textContent;}).join('\n');
            navigator.clipboard.writeText(text).then(function() {
                btn.textContent='Copied!'; btn.classList.add('copied');
                setTimeout(function(){ btn.textContent='Copy'; btn.classList.remove('copied'); }, 2000);
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
                '<button class="feature-popup-close" id="feat-close-2" style="position:absolute;top:14px;right:14px;background:rgba(0,0,0,0.35);border:none;">✕</button>' +
            '</div>' +
            '<div class="feature-popup-body">' +
                '<h2 id="feat-title"></h2>' +
                '<div id="feat-desc"></div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    var featImgWrap=document.getElementById('feat-img-wrap'),
        featImg=document.getElementById('feat-img'),
        featNoImg=document.getElementById('feat-no-img'),
        featTitle=document.getElementById('feat-title'),
        featDesc=document.getElementById('feat-desc'),
        featIconBig=document.getElementById('feat-icon-big');

    function closeFeature() { overlay.classList.remove('active'); document.body.style.overflow=''; }
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeFeature(); });
    document.getElementById('feat-close').addEventListener('click', closeFeature);
    document.getElementById('feat-close-2').addEventListener('click', closeFeature);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeFeature(); });

    document.querySelectorAll('.feature-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var title    = card.dataset.title    || card.querySelector('h3').textContent;
            var desc     = card.dataset.desc     || card.querySelector('p').textContent;
            var longDesc = card.dataset.longdesc || '';
            var img      = card.dataset.img      || '';
            var icon     = card.dataset.icon     || '';

            featTitle.textContent = title;
            featDesc.innerHTML = '';
            var p1 = document.createElement('p'); p1.textContent = desc; featDesc.appendChild(p1);
            if (longDesc) { var p2=document.createElement('p'); p2.textContent=longDesc; featDesc.appendChild(p2); }

            if (img) {
                var testImg = new Image();
                testImg.onload = function() {
                    featImg.src=img; featImg.alt=title;
                    featImgWrap.style.display='block'; featNoImg.style.display='none';
                };
                testImg.onerror = function() {
                    featImgWrap.style.display='none'; featNoImg.style.display='flex'; featIconBig.textContent=icon;
                };
                testImg.src = img;
            } else {
                featImgWrap.style.display='none'; featNoImg.style.display='flex'; featIconBig.textContent=icon;
            }

            overlay.classList.add('active'); document.body.style.overflow='hidden';
        });
    });
})();

// ── Addon popup ───────────────────────────────────────────────────
(function() {
    var overlay = document.createElement('div');
    overlay.className = 'addon-popup-overlay';
    overlay.innerHTML =
        '<div class="addon-popup">' +
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

    function closeAddon() { overlay.classList.remove('active'); document.body.style.overflow=''; }
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeAddon(); });
    document.getElementById('ap-close').addEventListener('click', closeAddon);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeAddon(); });

    // Tab switching
    overlay.querySelectorAll('.addon-popup-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            overlay.querySelectorAll('.addon-popup-tab,.addon-popup-panel').forEach(function(el){ el.classList.remove('active'); });
            tab.classList.add('active');
            document.getElementById('ap-panel-'+tab.dataset.tab).classList.add('active');
        });
    });

    // "Install" button in header jumps to install tab
    document.getElementById('ap-install-tab').addEventListener('click', function() {
        overlay.querySelectorAll('.addon-popup-tab,.addon-popup-panel').forEach(function(el){ el.classList.remove('active'); });
        overlay.querySelector('[data-tab="install"]').classList.add('active');
        document.getElementById('ap-panel-install').classList.add('active');
    });

    function makeCodeBlock(lines) {
        var div = document.createElement('div');
        div.className = 'code-block';
        lines.forEach(function(line) {
            var code = document.createElement('code'); code.textContent = line; div.appendChild(code);
        });
        // copy button
        var btn = document.createElement('button'); btn.className='copy-button'; btn.textContent='Copy';
        btn.addEventListener('click', function() {
            navigator.clipboard.writeText(lines.join('\n')).then(function(){
                btn.textContent='Copied!'; btn.classList.add('copied');
                setTimeout(function(){ btn.textContent='Copy'; btn.classList.remove('copied'); },2000);
            });
        });
        div.appendChild(btn); return div;
    }

    function makeStep(num, title, lines) {
        var step = document.createElement('div'); step.className='addon-install-step';
        step.innerHTML = '<div class="addon-install-step-num">'+num+'</div><div class="addon-install-step-body"><h4>'+title+'</h4></div>';
        var body = step.querySelector('.addon-install-step-body');
        body.appendChild(makeCodeBlock(lines));
        return step;
    }

    window.openAddonPopup = function(data) {
        // reset tabs
        overlay.querySelectorAll('.addon-popup-tab,.addon-popup-panel').forEach(function(el){ el.classList.remove('active'); });
        overlay.querySelector('[data-tab="overview"]').classList.add('active');
        document.getElementById('ap-panel-overview').classList.add('active');

        document.getElementById('ap-icon').textContent = data.icon || '🧩';
        document.getElementById('ap-name').textContent = data.name;
        document.getElementById('ap-byline').textContent = 'by ' + (data.author||'g-flame') + ' · ' + (data.version||'Latest');
        document.getElementById('ap-view-btn').href = data.github || '#';
        document.getElementById('ap-desc').textContent = data.longDesc || data.desc;

        // Features list
        var fl = document.getElementById('ap-features-list'); fl.innerHTML='';
        if (data.features && data.features.length) {
            var title = document.createElement('div');
            title.style.cssText='font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin:16px 0 10px';
            title.textContent='Features';
            fl.appendChild(title);
            data.features.forEach(function(f) {
                var item=document.createElement('div');
                item.style.cssText='font-size:13px;color:var(--text-secondary);padding:5px 0;display:flex;gap:8px;align-items:flex-start';
                item.innerHTML='<span style="color:var(--text-primary);flex-shrink:0">✓</span>'+f;
                fl.appendChild(item);
            });
        }

        // Install steps
        var is = document.getElementById('ap-install-steps'); is.innerHTML='';
        if (data.installSteps) {
            data.installSteps.forEach(function(s,i) {
                is.appendChild(makeStep(i+1, s.title, s.commands));
            });
        }
        if (data.installNote) {
            var note=document.createElement('div'); note.className='addon-popup-note';
            note.textContent=data.installNote; is.appendChild(note);
        }

        overlay.classList.add('active'); document.body.style.overflow='hidden';
    };

    // Wire up addon cards
    document.querySelectorAll('.addon-marketplace-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var name = card.dataset.name;
            var addonDef = window.ADDON_DEFS && window.ADDON_DEFS[name];
            if (addonDef) openAddonPopup(addonDef);
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
                '<span class="docs-explorer-title">📖 Documentation</span>' +
                '<button class="docs-explorer-close">✕</button>' +
            '</div>' +
            '<div class="docs-explorer-path" id="explorer-path"></div>' +
            '<div class="docs-explorer-body" id="explorer-body"></div>' +
        '</div>';
    document.body.appendChild(overlay);

    var explorerBody=document.getElementById('explorer-body'),
        explorerPath=document.getElementById('explorer-path'),
        manifest=[];

    function closeExplorer() { overlay.classList.remove('active'); document.body.style.overflow=''; }
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeExplorer(); });
    overlay.querySelector('.docs-explorer-close').addEventListener('click', closeExplorer);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeExplorer(); });

    function renderManifest() {
        explorerPath.innerHTML = '<span style="opacity:0.5">📁</span> <span style="color:var(--text-primary)">docs</span>';
        explorerBody.innerHTML = '';
        manifest.forEach(function(doc) {
            var item = document.createElement('a');
            item.className='docs-explorer-item'; item.href='docs/'+doc.slug+'/';
            item.innerHTML =
                '<div class="docs-item-icon">📄</div>' +
                '<div class="docs-item-info"><div class="docs-item-name">'+doc.title+'</div><div class="docs-item-desc">'+doc.description+'</div></div>' +
                '<span class="docs-item-arrow">›</span>';
            item.addEventListener('click', closeExplorer);
            explorerBody.appendChild(item);
        });
    }

    async function openExplorer() {
        overlay.classList.add('active'); document.body.style.overflow='hidden';
        if (!manifest.length) {
            explorerBody.innerHTML='<div class="commit-loading" style="padding:20px">Loading...</div>';
            try { manifest = await fetch('docs/manifest.json').then(function(r){return r.json();}); }
            catch(e) { explorerBody.innerHTML='<div style="padding:20px;color:#e57373">Could not load docs.</div>'; return; }
        }
        renderManifest();
    }

    var docsBtn=document.getElementById('btn-docs-explorer');
    if (docsBtn) docsBtn.addEventListener('click', openExplorer);
})();
