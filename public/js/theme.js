function initTheme() {
    const html = document.documentElement;
    const btn = document.getElementById('themeToggle');

    html.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');

    if (btn) {
        btn.addEventListener('click', function() {
            const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }
}

initTheme();
