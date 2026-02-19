function escHtmlContrib(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadContributors() {
    var grid = document.getElementById('contributors-grid');
    if (!grid) return;

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
        var customInfo  = results[1];

        var map = new Map();
        repoResults.flat().forEach(function(c) { map.set(c.id, c); });
        var unique = Array.from(map.values());

        // Update team stats
        var statEl = document.getElementById('stat-contributors');
        if (statEl) statEl.textContent = unique.length || '—';

        var totalContribs = repoResults.flat().reduce(function(s, c) { return s + (c.contributions || 0); }, 0);
        var commitEl = document.getElementById('stat-commits');
        if (commitEl) commitEl.textContent = totalContribs > 0 ? totalContribs : '—';

        if (!unique.length) {
            grid.innerHTML = '<div class="loading">No contributors found.</div>';
            return;
        }

        var userDetails = await Promise.all(
            unique.map(function(c) {
                return fetch('https://api.github.com/users/' + c.login)
                    .then(function(r) { return r.ok ? r.json() : null; })
                    .catch(function() { return null; });
            })
        );

        grid.innerHTML = '';

        unique.forEach(function(contributor, i) {
            var username   = contributor.login;
            var extra      = customInfo[username] || {};
            var details    = userDetails[i];

            var name        = extra.name    || (details && details.name)         || username;
            var role        = extra.role    || (contributor.contributions > 1
                                ? contributor.contributions + ' contributions'
                                : 'Contributor');
            var about       = extra.about   || (details && details.bio)          || '';
            var tagline     = extra.tagline || '';
            var location    = (details && details.location)                      || '';
            var joined      = details && details.created_at
                                ? new Date(details.created_at).getFullYear()
                                : null;
            var publicRepos = details ? details.public_repos : null;
            var followers   = details ? details.followers    : null;
            var initials    = name.substring(0, 2).toUpperCase();

            var card = document.createElement('div');
            card.className = 'contributor-card fade-in-up delay-' + Math.min((i % 6) + 1, 6);
            card.innerHTML =
                '<div class="contributor-avatar">' +
                    '<img src="' + contributor.avatar_url + '" alt="' + escHtmlContrib(name) + '" ' +
                        'onerror="this.parentElement.innerText=\'' + initials + '\'" loading="lazy">' +
                '</div>' +
                '<h3 class="contributor-name">'  + escHtmlContrib(name) + '</h3>' +
                '<div class="contributor-role">' + escHtmlContrib(role) + '</div>' +
                (tagline ? '<div class="contributor-tagline">&ldquo;' + escHtmlContrib(tagline) + '&rdquo;</div>' : '') +
                (about   ? '<p class="contributor-about">'            + escHtmlContrib(about)   + '</p>' : '') +
                '<div class="contributor-stats">' +
                    (location    ? '<span>📍 ' + escHtmlContrib(location) + '</span>' : '') +
                    (joined      ? '<span>🗓 Since ' + joined              + '</span>' : '') +
                    (publicRepos !== null ? '<span>📦 ' + publicRepos + ' repos</span>'    : '') +
                    (followers   !== null ? '<span>👥 ' + followers   + ' followers</span>': '') +
                '</div>' +
                '<a href="' + contributor.html_url + '" class="contributor-github" ' +
                    'target="_blank" rel="noopener noreferrer">@' + username + '</a>';

            grid.appendChild(card);
        });

        var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.style.animationPlayState = 'running';
                    obs.unobserve(e.target);
                }
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
