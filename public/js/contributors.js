/*
  contributors.js — fetches GitHub contributors and renders the team section.
  Depends on: icons.js, main.js (cachedFetch, escHtml)
*/

var memberOverlay, allUserDetails = {}, allCustomInfo = {};

function initMemberPopup() {
  memberOverlay = document.createElement('div');
  memberOverlay.className = 'member-overlay';
  memberOverlay.innerHTML =
    '<div class="member-popup">' +
      '<div class="member-popup-banner" id="mp-banner">' +
        '<button class="member-popup-banner-close" id="mp-close">' + getIcon('close') + '</button>' +
      '</div>' +
      '<div class="member-popup-content">' +
        '<div class="member-popup-left"  id="mp-left"></div>' +
        '<div class="member-popup-right" id="mp-right"></div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(memberOverlay);

  memberOverlay.addEventListener('click', function (e) {
    if (e.target === memberOverlay) closeMemberPopup();
  });
  document.getElementById('mp-close').addEventListener('click', closeMemberPopup);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMemberPopup();
  });
}

function closeMemberPopup() {
  memberOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function openMemberPopup(contributor, details, extra, maxContribs) {
  var username    = contributor.login;
  var name        = (extra && extra.name)    || (details && details.name)    || username;
  var role        = (extra && extra.role)    || (contributor.contributions > 1
    ? contributor.contributions + ' contributions' : 'Contributor');
  var about       = (extra && extra.about)   || (details && details.bio)     || '';
  var tagline     = (extra && extra.tagline) || '';
  var location    = (details && details.location)         || '';
  var joined      = details && details.created_at
    ? new Date(details.created_at).getFullYear() : null;
  var publicRepos = details ? details.public_repos : null;
  var followers   = details ? details.followers    : null;
  var blog        = (details && details.blog)              || '';
  var twitterUser = (details && details.twitter_username)  || '';
  var contribPct  = maxContribs > 0
    ? Math.round((contributor.contributions / maxContribs) * 100) : 0;
  var initials    = name.substring(0, 2).toUpperCase();

  /* Unique colour per contributor */
  var hue = 0;
  for (var i = 0; i < username.length; i++) hue = (hue + username.charCodeAt(i) * 37) % 360;
  var banner = document.getElementById('mp-banner');
  banner.style.background =
    'linear-gradient(135deg, hsl(' + hue + ',45%,20%) 0%, hsl(' + ((hue + 40) % 360) + ',50%,30%) 100%)';

  var left = document.getElementById('mp-left');
  left.innerHTML =
    '<div class="member-avatar-wrap">' +
      '<img class="member-popup-avatar" src="' + contributor.avatar_url + '" alt="' + escHtml(name) + '" ' +
        'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div class="member-popup-avatar-initials" style="display:none">' + initials + '</div>' +
    '</div>' +
    '<div class="member-popup-name-block">' +
      '<div class="member-popup-name">' + escHtml(name) + '</div>' +
      '<div class="member-popup-handle">@' + escHtml(username) + '</div>' +
      '<span class="member-popup-role-badge">' + escHtml(role) + '</span>' +
    '</div>';

  if (about || tagline) {
    left.innerHTML +=
      '<div class="member-popup-section">' +
        '<div class="member-popup-section-title">About</div>' +
        (tagline
          ? '<div class="member-tagline">&ldquo;' + escHtml(tagline) + '&rdquo;</div>'
          : '') +
        (about
          ? '<div class="member-about">' + escHtml(about) + '</div>'
          : '') +
      '</div>';
  }

  var statsHtml = '<div class="member-popup-section"><div class="member-popup-section-title">Details</div><div class="member-stat-row">';
  if (location)             statsHtml += '<div class="member-stat">' + getIcon('mapPin') + escHtml(location) + '</div>';
  if (joined)               statsHtml += '<div class="member-stat">' + getIcon('calendar') + 'Since ' + joined + '</div>';
  if (publicRepos !== null) statsHtml += '<div class="member-stat">' + getIcon('package') + publicRepos + ' public repos</div>';
  if (followers   !== null) statsHtml += '<div class="member-stat">' + getIcon('userGroup') + followers + ' followers</div>';
  statsHtml += '</div></div>';
  left.innerHTML += statsHtml;

  var linksHtml =
    '<div class="member-popup-section"><div class="member-popup-section-title">Links</div><div class="member-links">' +
    '<a href="' + contributor.html_url + '" class="member-link" target="_blank" rel="noopener">' + getIcon('github') + 'GitHub Profile</a>';
  if (blog) {
    linksHtml += '<a href="' + (blog.startsWith('http') ? blog : 'https://' + blog) + '" class="member-link" target="_blank" rel="noopener">' +
      getIcon('globe') + 'Website</a>';
  }
  if (twitterUser) {
    linksHtml += '<a href="https://twitter.com/' + twitterUser + '" class="member-link" target="_blank" rel="noopener">' +
      getIcon('twitter') + '@' + escHtml(twitterUser) + '</a>';
  }
  linksHtml += '</div></div>';
  left.innerHTML += linksHtml;

  /* Right panel */
  var right = document.getElementById('mp-right');
  right.innerHTML = '';

  var box1 = document.createElement('div');
  box1.className = 'member-activity-box';
  box1.innerHTML =
    '<div class="member-right-title">Contribution Activity</div>' +
    '<h4>' + contributor.contributions + ' commits to AirLink</h4>' +
    '<div class="member-contrib-bar">' +
      '<div class="member-contrib-label"><span>Contributions</span><span>' + contribPct + '%</span></div>' +
      '<div class="member-contrib-track">' +
        '<div class="member-contrib-fill" style="width:' + contribPct + '%"></div>' +
      '</div>' +
    '</div>' +
    '<p class="activity-meta">Across panel &amp; daemon repositories</p>';
  right.appendChild(box1);

  if (publicRepos !== null || followers !== null) {
    var box2 = document.createElement('div');
    box2.className = 'member-activity-box';
    box2.innerHTML =
      '<div class="member-right-title">GitHub Stats</div>' +
      (publicRepos !== null ? '<h4>' + publicRepos + ' public repositories</h4>' : '') +
      (followers   !== null ? '<p>' + followers + ' followers</p>' : '');
    right.appendChild(box2);
  }

  var box3 = document.createElement('div');
  box3.className = 'member-activity-box';
  box3.innerHTML =
    '<div class="member-right-title">AirLink Roles</div>' +
    '<p>Contributing to: TypeScript codebase, EJS templates, addon ecosystem.</p>' +
    '<div class="member-tags">' +
      '<span class="member-tag">TypeScript</span>' +
      '<span class="member-tag">Node.js</span>' +
      '<span class="member-tag">Open Source</span>' +
    '</div>';
  right.appendChild(box3);

  if (joined) {
    var age  = new Date().getFullYear() - joined;
    var box4 = document.createElement('div');
    box4.className = 'member-activity-box';
    box4.innerHTML =
      '<div class="member-right-title">Member Since</div>' +
      '<h4>' + joined + ' \u2014 ' + age + ' year' + (age !== 1 ? 's' : '') + ' on GitHub</h4>' +
      '<p>Active in open-source development.</p>';
    right.appendChild(box4);
  }

  memberOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function loadContributors() {
  var grid = document.getElementById('contributors-grid');
  if (!grid) return;

  initMemberPopup();

  var cfg    = window.SITE_CONFIG && window.SITE_CONFIG.team;
  var repos  = (cfg && cfg.repos) || ['AirlinkLabs/panel', 'AirlinkLabs/daemon'];
  var customInfo = (cfg && cfg.customContributors) || {};

  Promise.all(
    repos.map(function (repo) {
      return cachedFetch(
        'contributors-' + repo,
        'https://api.github.com/repos/' + repo + '/contributors'
      ).catch(function () { return []; });
    })
  ).then(function (repoResults) {
    allCustomInfo = customInfo;

    var map = new Map();
    repoResults.flat().forEach(function (c) {
      var existing = map.get(c.id);
      if (existing) {
        existing.contributions += c.contributions;
      } else {
        map.set(c.id, Object.assign({}, c));
      }
    });

    var unique = Array.from(map.values()).sort(function (a, b) {
      return b.contributions - a.contributions;
    });

    /* Update stats */
    var statContrib = document.getElementById('stat-contributors');
    var statCommits = document.getElementById('stat-commits');
    if (statContrib) statContrib.textContent = unique.length || '\u2014';
    var totalContribs = unique.reduce(function (s, c) { return s + c.contributions; }, 0);
    if (statCommits)  statCommits.textContent = totalContribs || '\u2014';

    if (!unique.length) {
      grid.innerHTML = '<div class="loading">No contributors found.</div>';
      return;
    }

    return Promise.all(
      unique.map(function (c) {
        return cachedFetch(
          'user-' + c.login,
          'https://api.github.com/users/' + c.login
        ).catch(function () { return null; });
      })
    ).then(function (userDetails) {
      var maxContribs = unique[0] ? unique[0].contributions : 1;
      unique.forEach(function (c, i) { allUserDetails[c.login] = userDetails[i]; });

      grid.innerHTML = '';

      unique.forEach(function (contributor, i) {
        var username = contributor.login;
        var extra    = allCustomInfo[username] || {};
        var details  = allUserDetails[username];
        var name     = extra.name || (details && details.name) || username;
        var about    = extra.about || (details && details.bio) || '';
        var location = (details && details.location) || '';
        var initials = name.substring(0, 2).toUpperCase();

        /* unique per-contributor accent colour */
        var hue = 0;
        for (var j = 0; j < username.length; j++) hue = (hue + username.charCodeAt(j) * 37) % 360;
        var accentLight = 'hsl(' + hue + ',65%,62%)';
        var accentDim   = 'hsl(' + hue + ',40%,22%)';

        var contribPct = maxContribs > 0 ? Math.round((contributor.contributions / maxContribs) * 100) : 0;

        var rankBadge = '';
        if      (i === 0) rankBadge = '<span class="contrib-rank rank-1">Lead</span>';
        else if (i === 1) rankBadge = '<span class="contrib-rank rank-2">Core</span>';
        else if (i === 2) rankBadge = '<span class="contrib-rank rank-3">Core</span>';

        var bioText = about.length > 82 ? about.slice(0, 80) + '\u2026' : about;

        var card = document.createElement('div');
        card.className = 'contributor-card fade-in-up delay-' + Math.min((i % 6) + 1, 6);
        card.innerHTML =
          '<div class="contrib-accent-strip" style="background:linear-gradient(90deg,' + accentDim + ',' + accentLight + ')"></div>' +
          '<div class="contrib-card-inner">' +
            '<div class="contrib-top">' +
              '<div class="contrib-avatar-wrap">' +
                '<img src="' + contributor.avatar_url + '" alt="' + escHtml(name) + '" loading="lazy" ' +
                  'onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">' +
                '<div class="contrib-avatar-initials" style="background:' + accentDim + ';color:' + accentLight + '">' + initials + '</div>' +
              '</div>' +
              rankBadge +
            '</div>' +
            '<div class="contrib-identity">' +
              '<div class="contrib-name">' + escHtml(name) + '</div>' +
              '<div class="contrib-handle">@' + escHtml(username) + '</div>' +
            '</div>' +
            '<p class="contrib-bio">' + (bioText ? escHtml(bioText) : '') + '</p>' +
            '<div class="contrib-bar-wrap">' +
              '<div class="contrib-bar-track">' +
                '<div class="contrib-bar-fill" style="width:' + contribPct + '%;background:' + accentLight + '"></div>' +
              '</div>' +
              '<span class="contrib-commits">' + contributor.contributions + ' commits</span>' +
            '</div>' +
            '<div class="contrib-footer">' +
              '<div class="contrib-meta">' +
                (location ? '<span>' + getIcon('mapPin', 11) + escHtml(location.length > 18 ? location.slice(0,16) + '\u2026' : location) + '</span>' : '') +
                (details && details.followers ? '<span>' + getIcon('userGroup', 11) + details.followers + '</span>' : '') +
              '</div>' +
              '<span class="contrib-cta">Profile ' + getIcon('arrowRight', 11) + '</span>' +
            '</div>' +
          '</div>';

        card.addEventListener('click', function () {
          openMemberPopup(contributor, allUserDetails[username], allCustomInfo[username] || {}, maxContribs);
        });

        grid.appendChild(card);
      });

      /* Intersection observer for card animations */
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.style.animationPlayState = 'running';
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });

      grid.querySelectorAll('.contributor-card').forEach(function (el) {
        el.style.animationPlayState = 'paused';
        obs.observe(el);
      });
    });
  }).catch(function (err) {
    console.error('Contributors error:', err);
    grid.innerHTML = '<div class="loading">Something went wrong loading contributors.</div>';
  });
}

loadContributors();
