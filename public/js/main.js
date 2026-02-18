// Adaptive scroll reveal
(function() {
    var lastY     = window.scrollY;
    var velocity  = 0;
    var velTimer;

    window.addEventListener('scroll', function() {
        velocity = Math.abs(window.scrollY - lastY);
        lastY    = window.scrollY;
        clearTimeout(velTimer);
        velTimer = setTimeout(function() { velocity = 0; }, 120);
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

// Copy buttons for .code-block elements
(function() {
    document.querySelectorAll('.code-block').forEach(function(block) {
        var btn = document.createElement('button');
        btn.className   = 'copy-button';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code');

        btn.addEventListener('click', function() {
            var text = Array.from(block.querySelectorAll('code'))
                .map(function(c) { return c.textContent; })
                .join('\n');

            navigator.clipboard.writeText(text).then(function() {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function() {
                    btn.textContent = 'Copy';
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(function(err) {
                console.error('Copy failed:', err);
            });
        });

        block.appendChild(btn);
    });
})();

// Docs grid — populated from manifest.json
(async function() {
    var grid = document.getElementById('docs-grid');
    if (!grid) return;

    try {
        var manifest = await fetch('docs/manifest.json').then(function(r) { return r.json(); });

        grid.innerHTML = '';

        manifest.forEach(function(doc, i) {
            var a = document.createElement('a');
            a.href      = 'docs/' + doc.slug + '/';
            a.className = 'doc-card fade-in-up delay-' + (Math.min(i + 1, 6));
            a.innerHTML = '<h3>' + doc.title + '</h3><p>' + doc.description + '</p>';
            grid.appendChild(a);
        });

        var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.style.animationPlayState = 'running';
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });

        grid.querySelectorAll('.doc-card').forEach(function(el) {
            el.style.animationPlayState = 'paused';
            obs.observe(el);
        });

    } catch (e) {
        console.warn('Could not load docs manifest:', e);
    }
})();
