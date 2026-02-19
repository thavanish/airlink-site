var commitsState = {};

function timeAgo(date) {
    var s = Math.floor((Date.now() - date) / 1000);
    if (s < 60)       return s + 's ago';
    if (s < 3600)     return Math.floor(s / 60) + 'm ago';
    if (s < 86400)    return Math.floor(s / 3600) + 'h ago';
    if (s < 2592000)  return Math.floor(s / 86400) + 'd ago';
    if (s < 31536000) return Math.floor(s / 2592000) + 'mo ago';
    return Math.floor(s / 31536000) + 'y ago';
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildCommitEl(c, isFirst) {
    var date   = new Date(c.commit.author.date);
    var msg    = c.commit.message.split('\n')[0];
    var author = (c.author && c.author.login) || c.commit.author.name;
    var avatar = (c.author && c.author.avatar_url) || '';
    var sha    = c.sha.slice(0, 7);

    var div = document.createElement('div');
    div.className = 'commit-item' + (isFirst ? ' commit-latest' : '');
    div.innerHTML =
        (isFirst ? '<span class="commit-badge">Latest</span>' : '') +
        '<div class="commit-meta">' +
            (avatar ? '<img src="' + avatar + '" class="commit-avatar" onerror="this.style.display=\'none\'">' : '') +
            '<span class="commit-author">' + escHtml(author) + '</span>' +
            '<span class="commit-time">'   + timeAgo(date)   + '</span>' +
            '<span class="commit-date">'   + date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) + '</span>' +
        '</div>' +
        '<a href="' + c.html_url + '" class="commit-msg" target="_blank" rel="noopener noreferrer">' + escHtml(msg) + '</a>' +
        '<span class="commit-sha">' + sha + '</span>';

    return div;
}

function initCommitsPopup() {
    var overlay = document.createElement('div');
    overlay.className = 'commits-overlay';
    overlay.innerHTML =
        '<div class="commits-popup">' +
            '<div class="commits-popup-header">' +
                '<div>' +
                    '<div class="commits-popup-repo" id="popup-repo-name"></div>' +
                    '<div class="commits-popup-subtitle">Commit history</div>' +
                '</div>' +
                '<button class="commits-popup-close" aria-label="Close">✕</button>' +
            '</div>' +
            '<div class="commits-popup-body" id="popup-body"></div>' +
            '<div class="commits-popup-footer" id="popup-footer" style="display:none">' +
                '<button class="btn-load-more" id="btn-load-more">Load more commits</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    var popupBody     = overlay.querySelector('#popup-body');
    var popupFooter   = overlay.querySelector('#popup-footer');
    var loadMoreBtn   = overlay.querySelector('#btn-load-more');
    var popupRepoName = overlay.querySelector('#popup-repo-name');

    function closePopup() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopup(); });
    overlay.querySelector('.commits-popup-close').addEventListener('click', closePopup);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePopup(); });

    async function fetchPage(repo, page) {
        var url = 'https://api.github.com/repos/' + repo + '/commits?per_page=15&page=' + page;
        var r   = await fetch(url);
        if (!r.ok) return [];
        return r.json();
    }

    async function openPopup(repo) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        popupRepoName.textContent = repo;
        popupBody.innerHTML = '<p class="commit-loading">Loading commits...</p>';
        popupFooter.style.display = 'none';
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load more commits';

        // Init or reset state for this repo
        if (!commitsState[repo]) {
            commitsState[repo] = { page: 1, done: false };
        } else {
            // reopening - keep state, just re-render existing
        }

        var state = commitsState[repo];

        // If we have a fresh open (page 1 not yet fetched or first open)
        if (state.page === 1) {
            state.commits = [];
            state.done    = false;
            popupBody.innerHTML = '<p class="commit-loading">Loading...</p>';

            var commits = await fetchPage(repo, 1).catch(function() { return []; });
            state.page    = 2;
            state.commits = commits;
            state.done    = commits.length < 15;

            renderPopupCommits(popupBody, state.commits);

        } else {
            // re-render what we already have
            renderPopupCommits(popupBody, state.commits);
        }

        popupFooter.style.display = state.done ? 'none' : 'block';

        loadMoreBtn.onclick = async function() {
            loadMoreBtn.disabled    = true;
            loadMoreBtn.textContent = 'Loading...';

            var more = await fetchPage(repo, state.page).catch(function() { return []; });
            state.page++;

            more.forEach(function(c) {
                state.commits.push(c);
                popupBody.appendChild(buildCommitEl(c, false));
            });

            if (more.length < 15) {
                state.done = true;
                popupFooter.style.display = 'none';
            } else {
                loadMoreBtn.disabled    = false;
                loadMoreBtn.textContent = 'Load more commits';
            }
        };
    }

    function renderPopupCommits(body, commits) {
        body.innerHTML = '';
        if (!commits.length) {
            body.innerHTML = '<p class="commit-error">Could not load commits.</p>';
            return;
        }
        commits.forEach(function(c, i) { body.appendChild(buildCommitEl(c, i === 0)); });
    }

    document.querySelectorAll('.btn-view-commits').forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Reset state so popup always starts fresh
            var repo = btn.dataset.repo;
            commitsState[repo] = { page: 1, done: false };
            openPopup(repo);
        });
    });
}

async function loadCommitPreviews() {
    var previews = [
        { repo: 'airlinklabs/panel',  el: document.getElementById('preview-panel')  },
        { repo: 'airlinklabs/daemon', el: document.getElementById('preview-daemon') }
    ];

    for (var i = 0; i < previews.length; i++) {
        var p = previews[i];
        if (!p.el) continue;
        try {
            var r       = await fetch('https://api.github.com/repos/' + p.repo + '/commits?per_page=3');
            var commits = r.ok ? await r.json() : [];
            p.el.innerHTML = '';
            commits.forEach(function(c, idx) { p.el.appendChild(buildCommitEl(c, idx === 0)); });
        } catch (e) {
            p.el.innerHTML = '<p class="commit-error">Could not load commits.</p>';
        }
    }
}

initCommitsPopup();
loadCommitPreviews();
