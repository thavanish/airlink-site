function initTheme() {
    var html = document.documentElement;
    var btn  = document.getElementById('themeToggle');

    // Apply saved theme immediately
    var saved = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', saved);

    if (!btn) return;

    btn.addEventListener('click', function() {
        var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

initTheme();
