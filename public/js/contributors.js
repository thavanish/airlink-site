function esc(str) {
    return String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Member popup (Discord-style) ──────────────────────────────────
var memberOverlay, memberPopup;
var allUserDetails = {};
var allCustomInfo  = {};

function initMemberPopup() {
    memberOverlay = document.createElement('div');
    memberOverlay.className = 'member-overlay';
    memberOverlay.innerHTML =
        '<div class="member-popup">' +
            '<div class="member-popup-banner" id="mp-banner">' +
                '<button class="member-popup-banner-close" id="mp-close">✕</button>' +
            '</div>' +
            '<div class="member-popup-content">' +
                '<div class="member-popup-left" id="mp-left"></div>' +
                '<div class="member-popup-right" id="mp-right"></div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(memberOverlay);

    memberOverlay.addEventListener('click', function(e) {
        if (e.target === memberOverlay) closeMemberPopup();
    });
    document.getElementById('mp-close').addEventListener('click', closeMemberPopup);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMemberPopup();
    });
}

function closeMemberPopup() {
    memberOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function openMemberPopup(contributor, details, extra, maxContribs) {
    var username    = contributor.login;
    var name        = extra.name    || (details && details.name)    || username;
    var role        = extra.role    || (contributor.contributions > 1 ? contributor.contributions + ' contributions' : 'Contributor');
    var about       = extra.about   || (details && details.bio)     || '';
    var tagline     = extra.tagline || '';
    var location    = (details && details.location) || '';
    var joined      = details && details.created_at ? new Date(details.created_at).getFullYear() : null;
    var publicRepos = details ? details.public_repos : null;
    var followers   = details ? details.followers    : null;
    var blog        = (details && details.blog)      || '';
    var twitterUser = (details && details.twitter_username) || '';
    var contribPct  = maxContribs > 0 ? Math.round((contributor.contributions / maxContribs) * 100) : 0;
    var initials    = name.substring(0, 2).toUpperCase();

    // Banner colour from username hash
    var hue = 0;
    for (var i = 0; i < username.length; i++) hue = (hue + username.charCodeAt(i) * 37) % 360;
    var banner = document.getElementById('mp-banner');
    banner.style.background = 'linear-gradient(135deg, hsl(' + hue + ',45%,20%) 0%, hsl(' + ((hue+40)%360) + ',50%,30%) 100%)';

    // Left column
    var left = document.getElementById('mp-left');
    left.innerHTML =
        '<div class="member-avatar-wrap">' +
            '<img class="member-popup-avatar" src="' + contributor.avatar_url + '" alt="' + esc(name) + '" ' +
                'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'">' +
            '<div class="member-popup-avatar-initials" style="display:none">' + initials + '</div>' +
        '</div>' +
        '<div class="member-popup-name-block">' +
            '<div class="member-popup-name">' + esc(name) + '</div>' +
            '<div class="member-popup-handle">@' + esc(username) + '</div>' +
            '<span class="member-popup-role-badge">' + esc(role) + '</span>' +
        '</div>';

    if (about || tagline) {
        left.innerHTML +=
            '<div class="member-popup-section">' +
                '<div class="member-popup-section-title">About</div>' +
                (tagline ? '<div style="font-size:12px;color:var(--text-secondary);font-style:italic;margin-bottom:6px;">&ldquo;' + esc(tagline) + '&rdquo;</div>' : '') +
                (about   ? '<div style="font-size:12px;color:var(--text-tertiary);line-height:1.6">' + esc(about) + '</div>' : '') +
            '</div>';
    }

    var statsHtml = '<div class="member-popup-section"><div class="member-popup-section-title">Details</div><div class="member-stat-row">';
    if (location)    statsHtml += '<div class="member-stat"><span class="member-stat-icon">📍</span>' + esc(location) + '</div>';
    if (joined)      statsHtml += '<div class="member-stat"><span class="member-stat-icon">🗓</span>Since ' + joined + '</div>';
    if (publicRepos !== null) statsHtml += '<div class="member-stat"><span class="member-stat-icon">📦</span>' + publicRepos + ' public repos</div>';
    if (followers !== null)   statsHtml += '<div class="member-stat"><span class="member-stat-icon">👥</span>' + followers + ' followers</div>';
    statsHtml += '</div></div>';
    left.innerHTML += statsHtml;

    var linksHtml = '<div class="member-popup-section"><div class="member-popup-section-title">Links</div><div class="member-links">';
    linksHtml += '<a href="' + contributor.html_url + '" class="member-link" target="_blank" rel="noopener"><span class="member-link-icon">🐙</span>GitHub Profile</a>';
    if (blog)        linksHtml += '<a href="' + (blog.startsWith('http') ? blog : 'https://'+blog) + '" class="member-link" target="_blank" rel="noopener"><span class="member-link-icon">🌐</span>Website</a>';
    if (twitterUser) linksHtml += '<a href="https://twitter.com/' + twitterUser + '" class="member-link" target="_blank" rel="noopener"><span class="member-link-icon">🐦</span>@' + esc(twitterUser) + '</a>';
    linksHtml += '</div></div>';
    left.innerHTML += linksHtml;

    // Right column
    var right = document.getElementById('mp-right');
    right.innerHTML = '';

    // Contribution activity box
    var box1 = document.createElement('div');
    box1.className = 'member-activity-box';
    box1.innerHTML =
        '<div class="member-right-title">Contribution Activity</div>' +
        '<h4>' + contributor.contributions + ' commits to AirLink</h4>' +
        '<div class="member-contrib-bar">' +
            '<div class="member-contrib-label">' +
                '<span>Contributions</span>' +
                '<span>' + contribPct + '%</span>' +
            '</div>' +
            '<div class="member-contrib-track">' +
                '<div class="member-contrib-fill" style="width:' + contribPct + '%"></div>' +
            '</div>' +
        '</div>' +
        '<p class="activity-meta" style="margin-top:8px;font-size:11px;color:var(--text-tertiary)">Across panel &amp; daemon repositories</p>';
    right.appendChild(box1);

    // GitHub stats box
    if (publicRepos !== null || followers !== null) {
        var box2 = document.createElement('div');
        box2.className = 'member-activity-box';
        box2.innerHTML =
            '<div class="member-right-title">GitHub Stats</div>' +
            (publicRepos !== null ? '<h4>' + publicRepos + ' public repositories</h4>' : '') +
            (followers   !== null ? '<p>' + followers + ' followers · part of the open source community</p>' : '');
        right.appendChild(box2);
    }

    // Languages / tags box
    var box3 = document.createElement('div');
    box3.className = 'member-activity-box';
    box3.innerHTML =
        '<div class="member-right-title">AirLink Roles</div>' +
        '<p>Contributing to: TypeScript codebase, EJS templates, addon ecosystem.</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">' +
            '<span style="font-size:11px;padding:3px 8px;border-radius:20px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-tertiary)">TypeScript</span>' +
            '<span style="font-size:11px;padding:3px 8px;border-radius:20px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-tertiary)">Node.js</span>' +
            '<span style="font-size:11px;padding:3px 8px;border-radius:20px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-tertiary)">Open Source</span>' +
        '</div>';
    right.appendChild(box3);

    // Joined / profile age
    if (joined) {
        var age = new Date().getFullYear() - joined;
        var box4 = document.createElement('div');
        box4.className = 'member-activity-box';
        box4.innerHTML =
            '<div class="member-right-title">Member Since</div>' +
            '<h4>' + joined + ' — ' + age + ' year' + (age !== 1 ? 's' : '') + ' on GitHub</h4>' +
            '<p>Active in open-source development.</p>';
        right.appendChild(box4);
    }

    memberOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ── Main contributor loader ───────────────────────────────────────
async function loadContributors() {
    var grid = document.getElementById('contributors-grid');
    if (!grid) return;

    initMemberPopup();

    var repos = ['airlinklabs/panel', 'airlinklabs/daemon'];

    try {
        var results = await Promise.all([
            Promise.all(repos.map(function(repo) {
                return fetch('https://api.github.com/repos/' + repo + '/contributors')
                    .then(function(r) { return r.ok ? r.json() : []; })
                    .catch(function() { return []; });
            })),
            fetch('./public/contributors.json')
                .then(function(r) { return r.ok ? r.json() : {}; })
                .catch(function() { return {}; })
        ]);

        var repoResults = results[0];
        allCustomInfo   = results[1];

        var map = new Map();
        repoResults.flat().forEach(function(c) { map.set(c.id, c); });
        var unique = Array.from(map.values());

        var statEl = document.getElementById('stat-contributors');
        if (statEl) statEl.textContent = unique.length || '—';

        var totalContribs = repoResults.flat().reduce(function(s,c) { return s + (c.contributions||0); }, 0);
        var commitEl = document.getElementById('stat-commits');
        if (commitEl) commitEl.textContent = totalContribs > 0 ? totalContribs : '—';

        if (!unique.length) { grid.innerHTML = '<div class="loading">No contributors found.</div>'; return; }

        var userDetailArr = await Promise.all(
            unique.map(function(c) {
                return fetch('https://api.github.com/users/' + c.login)
                    .then(function(r) { return r.ok ? r.json() : null; })
                    .catch(function() { return null; });
            })
        );

        var maxContribs = Math.max.apply(null, unique.map(function(c) { return c.contributions; }));

        // Store for popup use
        unique.forEach(function(c, i) { allUserDetails[c.login] = userDetailArr[i]; });

        grid.innerHTML = '';

        unique.forEach(function(contributor, i) {
            var username = contributor.login;
            var extra    = allCustomInfo[username] || {};
            var details  = allUserDetails[username];

            var name     = extra.name    || (details && details.name)    || username;
            var role     = extra.role    || (contributor.contributions > 1 ? contributor.contributions + ' contributions' : 'Contributor');
            var about    = extra.about   || (details && details.bio)     || '';
            var location = (details && details.location) || '';
            var initials = name.substring(0,2).toUpperCase();

            var card = document.createElement('div');
            card.className = 'contributor-card fade-in-up delay-' + Math.min((i%6)+1,6);
            card.style.cursor = 'pointer';
            card.innerHTML =
                '<div class="contributor-avatar">' +
                    '<img src="' + contributor.avatar_url + '" alt="' + esc(name) + '" ' +
                        'onerror="this.parentElement.innerText=\'' + initials + '\'" loading="lazy">' +
                '</div>' +
                '<h3 class="contributor-name">' + esc(name) + '</h3>' +
                '<div class="contributor-role">' + esc(role) + '</div>' +
                (about ? '<p class="contributor-about">' + esc(about) + '</p>' : '') +
                '<div class="contributor-stats">' +
                    (location ? '<span>📍 ' + esc(location) + '</span>' : '') +
                    (details && details.public_repos !== null ? '<span>📦 ' + details.public_repos + ' repos</span>' : '') +
                    (details && details.followers    !== null ? '<span>👥 ' + details.followers    + ' followers</span>' : '') +
                '</div>' +
                '<div class="contributor-github" style="margin-top:12px;display:inline-block;padding:6px 14px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:7px;font-size:12px;color:var(--text-primary)">View Profile →</div>';

            card.addEventListener('click', function() {
                openMemberPopup(contributor, allUserDetails[username], allCustomInfo[username]||{}, maxContribs);
            });

            grid.appendChild(card);
        });

        var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) { e.target.style.animationPlayState = 'running'; obs.unobserve(e.target); }
            });
        }, { threshold: 0.1 });

        grid.querySelectorAll('.contributor-card').forEach(function(el) {
            el.style.animationPlayState = 'paused';
            obs.observe(el);
        });

    } catch (err) {
        console.error('Contributors error:', err);
        grid.innerHTML = '<div class="loading">Something went wrong.</div>';
    }
}

loadContributors();
