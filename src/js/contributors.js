document.addEventListener('DOMContentLoaded', async function() {
    const contributorsGrid = document.getElementById('contributors-grid');
    
    try {
        const response = await fetch('contributors.json');
        
        if (!response.ok) {
            throw new Error('Failed to load contributors');
        }
        
        const contributors = await response.json();
        
        contributorsGrid.innerHTML = '';
        
        contributors.forEach((contributor, index) => {
            const card = document.createElement('div');
            card.className = `contributor-card fade-in-up delay-${Math.min(index % 6 + 1, 6)}`;
            
            const name = contributor.name || 'Anonymous';
            const github = contributor.github || '';
            const role = contributor.role || 'Contributor';
            const about = contributor.about || '';
            const tagline = contributor.tagline || '';
            const profile = contributor.profile || '';
            
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            let avatarHTML = '';
            if (profile) {
                avatarHTML = `<div class="contributor-avatar"><img src="${profile}" alt="${name}" onerror="this.parentElement.innerHTML='${initials}'"></div>`;
            } else {
                avatarHTML = `<div class="contributor-avatar">${initials}</div>`;
            }
            
            const taglineHTML = tagline ? `<div class="contributor-tagline">"${tagline}"</div>` : '';
            const aboutHTML = about ? `<p class="contributor-about">${about}</p>` : '';
            const githubHTML = github ? `<a href="https://github.com/${github}" class="contributor-github" target="_blank" rel="noopener noreferrer">@${github}</a>` : '';
            
            card.innerHTML = `
                ${avatarHTML}
                <h3 class="contributor-name">${name}</h3>
                <div class="contributor-role">${role}</div>
                ${taglineHTML}
                ${aboutHTML}
                ${githubHTML}
            `;
            
            contributorsGrid.appendChild(card);
        });
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.contributor-card').forEach(el => {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });
        
    } catch (error) {
        console.error('Error loading contributors:', error);
        contributorsGrid.innerHTML = '<div class="loading">Unable to load contributors. Please make sure contributors.json exists.</div>';
    }
});

