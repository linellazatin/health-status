// Display the latest main-branch commit time from GitHub.
function formatCommitDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid commit date');
    }

    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(date).map(({ type, value: part }) => [type, part])
    );

    return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year} @ ${parts.hour}:${parts.minute}:${parts.second}`;
}

async function updateTimestamp() {
    const timestampEl = document.querySelector('.ol-timestamp');

    try {
        const response = await fetch(
            'https://api.github.com/repos/linellazatin/health-status/commits?sha=main&per_page=1',
            { headers: { Accept: 'application/vnd.github+json' } }
        );
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

        const [latestCommit] = await response.json();
        const commitDate = latestCommit?.commit?.committer?.date;
        if (!commitDate) throw new Error('GitHub response has no committer date');

        if (timestampEl) timestampEl.textContent = `Last updated: ${formatCommitDate(commitDate)}`;
    } catch (error) {
        console.error('Failed to fetch timestamp:', error);
        if (timestampEl) timestampEl.textContent = 'Last updated: see GitHub';
    }
}

if (typeof window !== 'undefined') updateTimestamp();
