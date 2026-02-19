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
    return String(str || '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
            '<span class="commit-time">'   + timeAgo(date) + '</span>' +
            '<span class="commit-date">'   + date.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) + '</span>' +
        '</div>' +
        '<a href="' + c.html_url + '" class="commit-msg" target="_blank" rel="noopener noreferrer">' + escHtml(msg) + '</a>' +
        '<span class="commit-sha">' + sha + '</span>';
    return div;
}

function fetchCommits(repo, page) {
    var key = 'commits-' + repo + '-p' + page;
    var url = 'https://api.github.com/repos/' + repo + '/commits?per_page=15&page=' + page;
    return cachedFetch(key, url).catch(function() { return []; });
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

    var popupBody     = document.getElementById('popup-body');
    var popupFooter   = document.getElementById('popup-footer');
    var loadMoreBtn   = document.getElementById('btn-load-more');
    var popupRepoName = document.getElementById('popup-repo-name');

    function closePopup() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePopup(); });
    overlay.querySelector('.commits-popup-close').addEventListener('click', closePopup);
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePopup(); });

    function renderCommits(commits) {
        popupBody.innerHTML = '';
        if (!commits.length) {
            popupBody.innerHTML = '<p class="commit-error">Could not load commits.</p>';
            return;
        }
        commits.forEach(function(c, i) { popupBody.appendChild(buildCommitEl(c, i === 0)); });
    }

    function openPopup(repo) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        popupRepoName.textContent = repo;

        var state = commitsState[repo];
        if (state && state.commits && state.commits.length) {
            renderCommits(state.commits);
            popupFooter.style.display = state.done ? 'none' : 'block';
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load more commits';
            return;
        }

        popupBody.innerHTML = '<p class="commit-loading">Loading...</p>';
        popupFooter.style.display = 'none';

        fetchCommits(repo, 1).then(function(commits) {
            commitsState[repo] = { page: 2, commits: commits, done: commits.length < 15 };
            renderCommits(commits);
            popupFooter.style.display = commitsState[repo].done ? 'none' : 'block';
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load more commits';
        });

        loadMoreBtn.onclick = function() {
            var st = commitsState[repo];
            if (!st || st.done) return;
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading...';
            fetchCommits(repo, st.page).then(function(more) {
                st.page++;
                more.forEach(function(c) {
                    st.commits.push(c);
                    popupBody.appendChild(buildCommitEl(c, false));
                });
                if (more.length < 15) {
                    st.done = true;
                    popupFooter.style.display = 'none';
                } else {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Load more commits';
                }
            });
        };
    }

    document.querySelectorAll('.btn-view-commits').forEach(function(btn) {
        btn.addEventListener('click', function() {
            openPopup(btn.dataset.repo);
        });
    });
}

function loadCommitPreviews() {
    var previews = [
        { repo: 'airlinklabs/panel',  el: document.getElementById('preview-panel')  },
        { repo: 'airlinklabs/daemon', el: document.getElementById('preview-daemon') }
    ];

    previews.forEach(function(p) {
        if (!p.el) return;
        cachedFetch('commits-' + p.repo + '-p1', 'https://api.github.com/repos/' + p.repo + '/commits?per_page=3')
            .then(function(commits) {
                p.el.innerHTML = '';
                commits.forEach(function(c, i) { p.el.appendChild(buildCommitEl(c, i === 0)); });
            })
            .catch(function() {
                p.el.innerHTML = '<p class="commit-error">Could not load commits.</p>';
            });
    });
}

initCommitsPopup();
loadCommitPreviews();
