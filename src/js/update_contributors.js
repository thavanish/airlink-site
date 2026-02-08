const fs = require('fs');

const repos = ['owner/repo1', 'owner/repo2'];
const outputFile = './contributors.json';

async function updateContributors() {
  try {
    const fetchPromises = repos.map(repo => 
      fetch(`https://api.github.com/repos/${repo}/contributors`)
        .then(res => res.ok ? res.json() : [])
    );

    const results = await Promise.all(fetchPromises);
    const rawContributors = results.flat();
    
    // Deduplicate by GitHub ID
    const uniqueContributors = Array.from(
      new Map(rawContributors.map(c => [c.id, c])).values()
    );

    fs.writeFileSync(outputFile, JSON.stringify(uniqueContributors, null, 2));
    console.log('Contributors updated successfully!');
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

updateContributors();
