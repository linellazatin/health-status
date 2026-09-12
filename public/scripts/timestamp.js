// Fetch and display the last commit date from GitHub
async function updateTimestamp() {
    const repo = 'linellazatin/health-status';
    const branch = 'main';
    
    try {
        console.log('Fetching timestamp from GitHub...');
        const response = await fetch(`https://api.github.com/repos/${repo}/commits?sha=${branch}&per_page=1`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('GitHub API error:', errorText);
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Commit data:', data);
        
        // GitHub returns an array, take the first commit
        const commit = data[0];
        const commitDate = new Date(commit.commit.author.date);
        
        // Format: "Wed, 29 Aug 2026 @ 04:06:52" (viewer's local time)
        const dayOfWeek = commitDate.toLocaleDateString('en-US', { weekday: 'short' });
        const day = commitDate.toLocaleDateString('en-US', { day: 'numeric' });
        const month = commitDate.toLocaleDateString('en-US', { month: 'short' });
        const year = commitDate.getFullYear();
        const time = commitDate.toLocaleTimeString('en-US', { hour12: false });
        const formattedDate = `${dayOfWeek}, ${day} ${month} ${year} @ ${time}`;
        
        const timestampEl = document.querySelector('.ol-timestamp');
        if (timestampEl) {
            timestampEl.textContent = `Last updated: ${formattedDate}`;
        }
    } catch (error) {
        console.error('Failed to fetch timestamp:', error);
        const timestampEl = document.querySelector('.ol-timestamp');
        if (timestampEl) {
            timestampEl.textContent = 'Last updated: see GitHub';
        }
    }
}

updateTimestamp();
document.addEventListener('DOMContentLoaded', updateTimestamp);