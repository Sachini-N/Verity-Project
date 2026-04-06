const axios = require('axios');
const { recordIntegrationCall } = require('./systemMetrics');

function getGithubHeaders() {
    const headers = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Verity-Fairness-Node'
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

/**
 * GitHub returns 202 while contributor stats are computed — retry a few times.
 * @returns {Promise<Array>}
 */
async function fetchContributorStatsWithRetry(owner, repoName) {
    const headers = getGithubHeaders();
    for (let i = 0; i < 6; i += 1) {
        const startedAt = Date.now();
        const statsRes = await axios.get(
            `https://api.github.com/repos/${owner}/${repoName}/stats/contributors`,
            { headers, validateStatus: () => true }
        );
        recordIntegrationCall('github', {
            success: statsRes.status < 400,
            statusCode: statsRes.status,
            durationMs: Date.now() - startedAt
        });
        if (statsRes.status === 202) {
            await new Promise((r) => setTimeout(r, 2500));
            continue;
        }
        if (statsRes.status === 200 && Array.isArray(statsRes.data)) {
            return statsRes.data;
        }
        break;
    }
    return [];
}

module.exports = { fetchContributorStatsWithRetry, getGithubHeaders };
