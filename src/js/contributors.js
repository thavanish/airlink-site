document.addEventListener('DOMContentLoaded', async function() {
    const contributorsGrid = document.getElementById('contributors-grid');
    const repos = ['airlinklabs/panel', 'airlinklabs/daemon'];

    try {
        // 1. Fetch both the GitHub API data AND your custom JSON
        const githubPromises = repos.map(repo => 
            fetch(`https://api.github.com/repos/${repo}/contributors`).then(res => res.ok ? res.json() : [])
        );
        
        // Fetch your local custom data
        const customDataPromise = fetch('contributors.json').then(res => res.ok ? res.json() : {}).catch(() => ({}));

        const [repoResults, customInfo] = await Promise.all([
            Promise.all(githubPromises),
            customDataPromise
        ]);

        // 2. Flatten and Deduplicate GitHub users
        const rawContributors = repoResults.flat();
        const uniqueContributors = Array.from(
            new Map(rawContributors.map(c => [c.id, c])).values()
        );

        contributorsGrid.innerHTML = '';

        uniqueContributors.forEach((contributor, index) => {
            const username = contributor.login;
            
            // 3. Merge: Use GitHub data by default, but override if customInfo exists
            const extra = customInfo[username] || {};
            
            const card = document.createElement('div');
            card.className = `contributor-card fade-in-up delay-${Math.min(index % 6 + 1, 6)}`;
            
            const name = username; 
            const githubUrl = contributor.html_url;
            const avatarUrl = contributor.avatar_url;
            
            // Logic: Custom Role > Contribution Count > Default "Contributor"
            const role = extra.role || (contributor.contributions > 1 ? `${contributor.contributions} Contributions` : 'Contributor');
            const about = extra.about || '';
            const tagline = extra.tagline ? `<div class="contributor-tagline">"${extra.tagline}"</div>` : '';
            
            const initials = name.substring(0, 2).toUpperCase();

            card.innerHTML = `
                <div class="contributor-avatar">
                    <img src="${avatarUrl}" alt="${name}" onerror="this.parentElement.innerHTML='${initials}'" loading="lazy">
                </div>
                <h3 class="contributor-name">${name}</h3>
                <div class="contributor-role">${role}</div>
                ${tagline}
                ${about ? `<p class="contributor-about">${about}</p>` : ''}
                <a href="${githubUrl}" class="contributor-github" target="_blank" rel="noopener noreferrer">@${username}</a>
            `;
            
            contributorsGrid.appendChild(card);
        });

        // 4. Trigger Animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.style.animationPlayState = 'running';
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.contributor-card').forEach(el => {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });

    } catch (error) {
        console.error('Error:', error);
        contributorsGrid.innerHTML = '<div class="loading">Something went wrong.</div>';
    }
});
