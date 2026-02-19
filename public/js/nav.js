function initNav() {
    var toggle   = document.querySelector('.mobile-menu-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.innerHTML = '';
        for (var i = 0; i < 3; i++) {
            var bar = document.createElement('span');
            bar.className = 'bar';
            toggle.appendChild(bar);
        }

        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            var open = navLinks.classList.toggle('active');
            toggle.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', String(open));
        });

        document.addEventListener('click', function(e) {
            if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        navLinks.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        var docsBtn = navLinks.querySelector('#btn-docs-explorer');
        if (docsBtn) {
            docsBtn.addEventListener('click', function() {
                navLinks.classList.remove('active');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                var navH = (document.querySelector('.navbar') || {}).offsetHeight || 0;
                window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('scroll', function() {
        var navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.boxShadow = window.scrollY > 50 ? '0 2px 10px rgba(0,0,0,0.3)' : 'none';
    }, { passive: true });
}

initNav();
