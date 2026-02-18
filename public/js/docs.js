// Minimal markdown → HTML parser
function parseMarkdown(md) {
    var blocks = [];

    // Fenced code blocks first
    var html = md.replace(/```[\w]*\n([\s\S]*?)```/g, function(_, code) {
        var esc = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        var idx = blocks.length;
        blocks.push('<pre><code>' + esc + '</code><button class="copy-btn">Copy</button></pre>');
        return '%%CB_' + idx + '%%';
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm,  '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm,   '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm,    '<h1>$1</h1>');

    // Blockquote
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Bold / italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g,     '<em>$1</em>');

    // HR
    html = html.replace(/^---$/gm, '<hr>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Unordered lists
    html = html.replace(/((?:^- .+\n?)+)/gm, function(block) {
        var items = block.trim().split('\n').map(function(l) {
            return '<li>' + l.replace(/^- /, '') + '</li>';
        }).join('');
        return '<ul>' + items + '</ul>';
    });

    // Ordered lists
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, function(block) {
        var items = block.trim().split('\n').map(function(l) {
            return '<li>' + l.replace(/^\d+\. /, '') + '</li>';
        }).join('');
        return '<ol>' + items + '</ol>';
    });

    // Paragraphs
    html = html.replace(/^(?!<[a-z%])(.+)$/gm, function(line) {
        if (line.indexOf('%%CB_') === 0) return line;
        return '<p>' + line + '</p>';
    });

    // Restore code blocks
    html = html.replace(/%%CB_(\d+)%%/g, function(_, i) { return blocks[i]; });

    return html;
}

function buildTOC(contentEl) {
    var headings = Array.from(contentEl.querySelectorAll('h2, h3'));
    if (headings.length < 2) return;

    var tocLinks    = document.getElementById('toc-links');
    var tocContainer= document.getElementById('docs-toc');
    if (!tocLinks || !tocContainer) return;

    tocLinks.innerHTML = '';

    headings.forEach(function(h, i) {
        h.id = 'h-' + i;

        var a = document.createElement('a');
        a.href      = '#h-' + i;
        a.className = 'docs-toc-link' + (h.tagName === 'H3' ? ' toc-h3' : '');
        a.textContent = h.textContent;

        a.addEventListener('click', function(e) {
            e.preventDefault();
            var navH = document.querySelector('.navbar')?.offsetHeight || 64;
            var top  = h.getBoundingClientRect().top + window.scrollY - navH - 16;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });

        tocLinks.appendChild(a);
    });

    tocContainer.style.display = 'block';
}

function attachCopyButtons(contentEl) {
    contentEl.querySelectorAll('pre .copy-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var code = btn.previousElementSibling.textContent;
            navigator.clipboard.writeText(code).then(function() {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(function() {
                    btn.textContent = 'Copy';
                    btn.classList.remove('copied');
                }, 2000);
            });
        });
    });
}

function buildFooterNav(manifest, currentSlug, rootPath) {
    var nav = document.getElementById('docs-footer-nav');
    if (!nav) return;

    var idx = manifest.findIndex(function(d) { return d.slug === currentSlug; });
    nav.innerHTML = '';

    if (idx > 0) {
        var prev = manifest[idx - 1];
        nav.innerHTML +=
            '<a href="' + rootPath + 'docs/' + prev.slug + '/">' +
                '<span class="nav-label">← Previous</span>' +
                '<span class="nav-title">' + prev.title + '</span>' +
            '</a>';
    }

    if (idx < manifest.length - 1) {
        var next = manifest[idx + 1];
        nav.innerHTML +=
            '<a href="' + rootPath + 'docs/' + next.slug + '/" class="next">' +
                '<span class="nav-label">Next →</span>' +
                '<span class="nav-title">' + next.title + '</span>' +
            '</a>';
    }
}

async function initDocPage(slug, rootPath) {
    var contentEl = document.getElementById('docs-content');
    var navEl     = document.getElementById('docs-nav');
    if (!contentEl) return;

    var manifest = [];
    try {
        manifest = await fetch(rootPath + 'docs/manifest.json').then(function(r) { return r.json(); });
    } catch (e) { /* manifest missing, continue without sidebar */ }

    // Sidebar links
    if (navEl) {
        navEl.innerHTML = '';
        manifest.forEach(function(doc) {
            var a = document.createElement('a');
            a.href      = rootPath + 'docs/' + doc.slug + '/';
            a.className = 'docs-nav-link' + (doc.slug === slug ? ' active' : '');
            a.textContent = doc.title;
            navEl.appendChild(a);
        });
    }

    // Page title
    var current = manifest.find(function(d) { return d.slug === slug; });
    if (current) {
        document.title = current.title + ' — AirLink Docs';
        var bt = document.getElementById('breadcrumb-title');
        if (bt) bt.textContent = current.title;
    }

    // Fetch and render docs.md
    try {
        var r = await fetch('docs.md');
        if (!r.ok) throw new Error('not found');
        var md = await r.text();
        contentEl.innerHTML = parseMarkdown(md);
        buildTOC(contentEl);
        attachCopyButtons(contentEl);
        buildFooterNav(manifest, slug, rootPath);
    } catch (e) {
        contentEl.innerHTML =
            '<p class="docs-error">Could not load <code>docs.md</code> for this page.</p>';
    }
}
