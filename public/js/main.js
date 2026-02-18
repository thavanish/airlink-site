document.addEventListener('DOMContentLoaded', function() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    html.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // Hamburger
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const bar = document.createElement('span');
            bar.className = 'bar';
            mobileMenuToggle.appendChild(bar);
        }
    }

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const open = navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active', open);
            mobileMenuToggle.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navH = document.querySelector('.navbar')?.offsetHeight || 0;
                window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.boxShadow = window.scrollY > 50 ? '0 2px 10px rgba(0,0,0,0.3)' : 'none';
    });

    // Copy buttons
    document.querySelectorAll('.code-block').forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'copy-button';
        btn.textContent = 'Copy';
        btn.addEventListener('click', function() {
            const text = [...block.querySelectorAll('code')].map(c => c.textContent).join('\n');
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });
        block.appendChild(btn);
    });

    // Adaptive scroll reveal
    let lastY = window.scrollY;
    let velocity = 0;
    let velTimer;
    window.addEventListener('scroll', function() {
        velocity = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
        clearTimeout(velTimer);
        velTimer = setTimeout(() => { velocity = 0; }, 120);
    }, { passive: true });

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (velocity > 40) {
                el.style.transition = 'none';
                el.style.opacity = '1';
                el.style.transform = 'none';
            } else {
                el.style.animationPlayState = 'running';
            }
            revealObs.unobserve(el);
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fade-in, .fade-in-up').forEach(el => {
        el.style.animationPlayState = 'paused';
        revealObs.observe(el);
    });

    initInstallWizard();
    initCommits();
    loadContributors();
});

function initInstallWizard() {
    const wizard = document.getElementById('install-wizard');
    if (!wizard) return;

    const selection = wizard.querySelector('.install-selection');
    const quickPanel = wizard.querySelector('.install-panel[data-panel="quick"]');
    const manualPanel = wizard.querySelector('.install-panel[data-panel="manual"]');

    function show(panel) {
        selection.style.display = 'none';
        quickPanel.style.display = 'none';
        manualPanel.style.display = 'none';
        panel.style.display = 'block';
        panel.classList.add('panel-enter');
        setTimeout(() => panel.classList.remove('panel-enter'), 300);
    }

    function reset() {
        quickPanel.style.display = 'none';
        manualPanel.style.display = 'none';
        selection.style.display = 'flex';
    }

    wizard.querySelector('.btn-quick').addEventListener('click', () => show(quickPanel));
    wizard.querySelector('.btn-manual').addEventListener('click', () => show(manualPanel));
    wizard.querySelectorAll('.btn-back').forEach(b => b.addEventListener('click', reset));
}

// ── Commits popup ────────────────────────────────────────────────────
let commitsCache = {};

function initCommits() {
    // Create popup DOM once
    const overlay = document.createElement('div');
    overlay.className = 'commits-overlay';
    overlay.innerHTML = `
        <div class="commits-popup">
            <div class="commits-popup-header">
                <div>
                    <div class="commits-popup-repo" id="popup-repo-name"></div>
                    <div class="commits-popup-subtitle">Commit history</div>
                </div>
                <button class="commits-popup-close" aria-label="Close">✕</button>
            </div>
            <div class="commits-popup-body" id="popup-body">
                <p class="commit-loading">Loading commits...</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const popupBody = overlay.querySelector('#popup-body');
    const popupRepoName = overlay.querySelector('#popup-repo-name');

    function closePopup() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closePopup();
    });
    overlay.querySelector('.commits-popup-close').addEventListener('click', closePopup);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closePopup();
    });

    async function openPopup(repo) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        popupRepoName.textContent = repo;
        popupBody.innerHTML = '<p class="commit-loading">Loading commits...</p>';

        let commits = commitsCache[repo];
        if (!commits) {
            try {
                const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=30`);
                commits = r.ok ? await r.json() : [];
                commitsCache[repo] = commits;
            } catch {
                commits = [];
            }
        }

        if (!commits.length) {
            popupBody.innerHTML = '<p class="commit-error">Could not load commits.</p>';
            return;
        }

        popupBody.innerHTML = '';
        commits.forEach((c, i) => {
            const date = new Date(c.commit.author.date);
            const msg = c.commit.message.split('\n')[0];
            const author = c.author?.login || c.commit.author.name;
            const avatar = c.author?.avatar_url || '';
            const sha = c.sha.slice(0, 7);

            const el = document.createElement('div');
            el.className = 'commit-item' + (i === 0 ? ' commit-latest' : '');
            el.innerHTML = `
                ${i === 0 ? '<span class="commit-badge">Latest</span>' : ''}
                <div class="commit-meta">
                    ${avatar ? `<img src="${avatar}" alt="${escHtml(author)}" class="commit-avatar" onerror="this.style.display='none'">` : ''}
                    <span class="commit-author">${escHtml(author)}</span>
                    <span class="commit-time">${timeAgo(date)}</span>
                    <span class="commit-date">${date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
                </div>
                <a href="${c.html_url}" class="commit-msg" target="_blank" rel="noopener noreferrer">${escHtml(msg)}</a>
                <span class="commit-sha">${sha}</span>
            `;
            popupBody.appendChild(el);
        });
    }

    // Wire up the "View commits" buttons in the commits section
    document.querySelectorAll('.btn-view-commits').forEach(btn => {
        btn.addEventListener('click', function() {
            openPopup(this.dataset.repo);
        });
    });
}

async function loadContributors() {
    const grid = document.getElementById('contributors-grid');
    if (!grid) return;

    const repos = ['airlinklabs/panel', 'airlinklabs/daemon'];

    try {
        const [repoResults, customInfo] = await Promise.all([
            Promise.all(repos.map(repo =>
                fetch(`https://api.github.com/repos/${repo}/contributors`)
                    .then(r => r.ok ? r.json() : [])
                    .catch(() => [])
            )),
            fetch('./public/contributors.json')
                .then(r => r.ok ? r.json() : {})
                .catch(() => ({}))
        ]);

        const unique = Array.from(
            new Map(repoResults.flat().map(c => [c.id, c])).values()
        );

        if (!unique.length) {
            grid.innerHTML = '<div class="loading">No contributors found.</div>';
            return;
        }

        const userDetails = await Promise.all(
            unique.map(c =>
                fetch(`https://api.github.com/users/${c.login}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            )
        );

        grid.innerHTML = '';

        unique.forEach((contributor, i) => {
            const username = contributor.login;
            const extra = customInfo[username] || {};
            const details = userDetails[i];

            const name = extra.name || details?.name || username;
            const role = extra.role || (contributor.contributions > 1 ? `${contributor.contributions} contributions` : 'Contributor');
            const about = extra.about || details?.bio || '';
            const tagline = extra.tagline || '';
            const location = details?.location || '';
            const joined = details?.created_at ? new Date(details.created_at).getFullYear() : null;
            const publicRepos = details?.public_repos ?? null;
            const followers = details?.followers ?? null;
            const initials = name.substring(0, 2).toUpperCase();

            const card = document.createElement('div');
            card.className = `contributor-card fade-in-up delay-${Math.min((i % 6) + 1, 6)}`;
            card.innerHTML = `
                <div class="contributor-avatar">
                    <img src="${contributor.avatar_url}" alt="${escHtml(name)}" onerror="this.parentElement.innerText='${initials}'" loading="lazy">
                </div>
                <h3 class="contributor-name">${escHtml(name)}</h3>
                <div class="contributor-role">${escHtml(role)}</div>
                ${tagline ? `<div class="contributor-tagline">"${escHtml(tagline)}"</div>` : ''}
                ${about ? `<p class="contributor-about">${escHtml(about)}</p>` : ''}
                <div class="contributor-stats">
                    ${location ? `<span>📍 ${escHtml(location)}</span>` : ''}
                    ${joined ? `<span>🗓 Since ${joined}</span>` : ''}
                    ${publicRepos !== null ? `<span>📦 ${publicRepos} repos</span>` : ''}
                    ${followers !== null ? `<span>👥 ${followers} followers</span>` : ''}
                </div>
                <a href="${contributor.html_url}" class="contributor-github" target="_blank" rel="noopener noreferrer">@${username}</a>
            `;
            grid.appendChild(card);
        });

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.style.animationPlayState = 'running'; obs.unobserve(e.target); }
            });
        }, { threshold: 0.1 });

        grid.querySelectorAll('.contributor-card').forEach(el => {
            el.style.animationPlayState = 'paused';
            obs.observe(el);
        });

    } catch (err) {
        console.error('Contributors error:', err);
        grid.innerHTML = '<div class="loading">Something went wrong.</div>';
    }
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - date) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    if (s < 2592000) return `${Math.floor(s/86400)}d ago`;
    if (s < 31536000) return `${Math.floor(s/2592000)}mo ago`;
    return `${Math.floor(s/31536000)}y ago`;
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
