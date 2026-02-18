document.addEventListener('DOMContentLoaded', function() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);

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
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
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
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                window.scrollTo({ top: target.offsetTop - navHeight, behavior: 'smooth' });
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
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.addEventListener('click', function() {
            const text = [...block.querySelectorAll('code')].map(c => c.textContent).join('\n');
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            }).catch(err => console.error('Copy failed:', err));
        });
        block.appendChild(btn);
    });

    // Adaptive scroll reveal - speeds up when scrolling fast
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let velocityTimer;

    window.addEventListener('scroll', function() {
        const current = window.scrollY;
        scrollVelocity = Math.abs(current - lastScrollY);
        lastScrollY = current;
        clearTimeout(velocityTimer);
        velocityTimer = setTimeout(() => { scrollVelocity = 0; }, 100);
    }, { passive: true });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Fast scroll = instant reveal, slow scroll = animated
                const fast = scrollVelocity > 40;
                const el = entry.target;
                if (fast) {
                    el.style.transition = 'none';
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                } else {
                    el.style.animationPlayState = 'running';
                }
                revealObserver.unobserve(el);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fade-in, .fade-in-up').forEach(el => {
        el.style.animationPlayState = 'paused';
        revealObserver.observe(el);
    });

    // Install wizard
    initInstallWizard();

    // Commits section
    loadCommits();

    // Contributors
    loadContributors();
});

function initInstallWizard() {
    const wizard = document.getElementById('install-wizard');
    if (!wizard) return;

    const selection = wizard.querySelector('.install-selection');
    const quickPanel = wizard.querySelector('.install-panel[data-panel="quick"]');
    const manualPanel = wizard.querySelector('.install-panel[data-panel="manual"]');

    function showPanel(panel) {
        selection.style.display = 'none';
        quickPanel.style.display = 'none';
        manualPanel.style.display = 'none';
        panel.style.display = 'block';
        panel.classList.add('panel-enter');
        setTimeout(() => panel.classList.remove('panel-enter'), 300);
    }

    function showSelection() {
        quickPanel.style.display = 'none';
        manualPanel.style.display = 'none';
        selection.style.display = 'flex';
    }

    wizard.querySelector('.btn-quick').addEventListener('click', () => showPanel(quickPanel));
    wizard.querySelector('.btn-manual').addEventListener('click', () => showPanel(manualPanel));
    wizard.querySelectorAll('.btn-back').forEach(btn => btn.addEventListener('click', showSelection));
}

async function loadCommits() {
    const container = document.getElementById('commits-container');
    if (!container) return;

    const repos = ['airlinklabs/panel', 'airlinklabs/daemon'];

    for (const repo of repos) {
        const section = container.querySelector(`[data-repo="${repo}"]`);
        if (!section) continue;

        const list = section.querySelector('.commit-list');
        const toggleBtn = section.querySelector('.btn-show-more');

        let allCommits = [];
        let showing = 1;

        try {
            const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`);
            if (!res.ok) throw new Error('fetch failed');
            allCommits = await res.json();
        } catch {
            list.innerHTML = '<p class="commit-error">Could not load commits.</p>';
            continue;
        }

        function renderCommits() {
            list.innerHTML = '';
            allCommits.slice(0, showing).forEach((c, i) => {
                const date = new Date(c.commit.author.date);
                const rel = timeAgo(date);
                const msg = c.commit.message.split('\n')[0];
                const author = c.author?.login || c.commit.author.name;
                const avatar = c.author?.avatar_url || '';
                const sha = c.sha.slice(0, 7);
                const url = c.html_url;

                const el = document.createElement('div');
                el.className = 'commit-item' + (i === 0 ? ' commit-latest' : '');
                el.innerHTML = `
                    ${i === 0 ? '<span class="commit-badge">Latest</span>' : ''}
                    <div class="commit-meta">
                        ${avatar ? `<img src="${avatar}" alt="${author}" class="commit-avatar" onerror="this.style.display='none'">` : ''}
                        <span class="commit-author">${author}</span>
                        <span class="commit-time">${rel}</span>
                        <span class="commit-date">${date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
                    </div>
                    <a href="${url}" class="commit-msg" target="_blank" rel="noopener noreferrer">${escHtml(msg)}</a>
                    <span class="commit-sha">${sha}</span>
                `;
                list.appendChild(el);
            });

            if (toggleBtn) {
                if (showing < allCommits.length) {
                    toggleBtn.style.display = 'inline-flex';
                    toggleBtn.textContent = `Show ${Math.min(5, allCommits.length - showing)} more`;
                } else {
                    toggleBtn.textContent = 'Show less';
                }
            }
        }

        renderCommits();

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                if (showing < allCommits.length) {
                    showing = Math.min(showing + 5, allCommits.length);
                } else {
                    showing = 1;
                }
                renderCommits();
            });
        }
    }
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

        // Fetch user details for join date etc
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
                    <img src="${contributor.avatar_url}" alt="${name}" onerror="this.parentElement.innerText='${initials}'" loading="lazy">
                </div>
                <h3 class="contributor-name">${name}</h3>
                <div class="contributor-role">${role}</div>
                ${tagline ? `<div class="contributor-tagline">"${tagline}"</div>` : ''}
                ${about ? `<p class="contributor-about">${escHtml(about)}</p>` : ''}
                <div class="contributor-stats">
                    ${location ? `<span title="Location">📍 ${escHtml(location)}</span>` : ''}
                    ${joined ? `<span title="Joined GitHub">🗓 Since ${joined}</span>` : ''}
                    ${publicRepos !== null ? `<span title="Public repos">📦 ${publicRepos} repos</span>` : ''}
                    ${followers !== null ? `<span title="Followers">👥 ${followers} followers</span>` : ''}
                </div>
                <a href="${contributor.html_url}" class="contributor-github" target="_blank" rel="noopener noreferrer">@${username}</a>
            `;
            grid.appendChild(card);
        });

        // Re-observe new cards for reveal animation
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.style.animationPlayState = 'running';
                    obs.unobserve(e.target);
                }
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
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
