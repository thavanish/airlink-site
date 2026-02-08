document.addEventListener('DOMContentLoaded', async function() {
    const contributorsGrid = document.getElementById('contributors-grid');
    
    // Define your repositories here
    const repos = [
        'airlinklabs/panel',
        'airlinklabs/daemon'
    ];

    try {
        // 1. Fetch from GitHub API for all repos
        const fetchPromises = repos.map(repo => 
            fetch(`https://api.github.com/repos/${repo}/contributors`)
                .then(res => res.ok ? res.json() : [])
        );

        const results = await Promise.all(fetchPromises);
        
        // 2. Flatten and Deduplicate (by GitHub ID)
        const rawContributors = results.flat();
        const uniqueContributors = Array.from(
            new Map(rawContributors.map(c => [c.id, c])).values()
        );

        contributorsGrid.innerHTML = '';

        if (uniqueContributors.length === 0) {
            contributorsGrid.innerHTML = '<div class="loading">No contributors found.</div>';
            return;
        }

        uniqueContributors.forEach((contributor, index) => {
            const card = document.createElement('div');
            card.className = `contributor-card fade-in-up delay-${Math.min(index % 6 + 1, 6)}`;
            
            // GitHub API properties
            const name = contributor.login; // Username
            const githubUrl = contributor.html_url;
            const avatarUrl = contributor.avatar_url;
            const contributions = contributor.contributions;
            
            // GitHub doesn't provide "taglines" or "roles" via this endpoint, 
            // so we use the contribution count as a subtitle.
            const role = contributions > 1 ? `${contributions} Contributions` : 'Contributor';
            
            card.innerHTML = `
                <div class="contributor-avatar">
                    <img src="${avatarUrl}" alt="${name}" loading="lazy">
                </div>
                <h3 class="contributor-name">${name}</h3>
                <div class="contributor-role">${role}</div>
                <a href="${githubUrl}" class="contributor-github" target="_blank" rel="noopener noreferrer">@${name}</a>
            `;
            
            contributorsGrid.appendChild(card);
        });

        // 3. Animation Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.contributor-card').forEach(el => {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });
        
    } catch (error) {
        console.error('Error loading contributors:', error);
        contributorsGrid.innerHTML = '<div class="loading">Unable to load contributors from GitHub.</div>';
    }
});
