(function() {
    var saved = 'dark';
    try { saved = localStorage.getItem('theme') || 'dark'; } catch(e) {}
    document.documentElement.setAttribute('data-theme', saved);
})();

function initTheme() {
    var html = document.documentElement;

    function applyTheme(t) {
        html.setAttribute('data-theme', t);
        try { localStorage.setItem('theme', t); } catch(e) {}
    }

    document.querySelectorAll('#themeToggle, .theme-toggle').forEach(function(btn) {
        btn.addEventListener('click', function() {
            applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
