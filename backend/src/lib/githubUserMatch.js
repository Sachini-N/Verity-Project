const { fetchContributorStatsWithRetry } = require('../services/githubContributors');

const extractGithubLogin = (githubUrl) => {
    if (!githubUrl) return null;
    try {
        const raw = String(githubUrl).trim();
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const seg = url.pathname.split('/').filter(Boolean);
        return seg[0] ? seg[0].toLowerCase() : null;
    } catch {
        return String(githubUrl).replace(/^@/, '').trim().toLowerCase() || null;
    }
};

const loginFromNoreplyEmail = (email) => {
    if (!email) return null;
    const lower = String(email).toLowerCase();
    if (!lower.includes('noreply.github.com')) return null;
    const plus = lower.match(/^(\d+)\+([^@]+)@users\.noreply\.github\.com$/);
    if (plus) return plus[2];
    const plain = lower.match(/^([^@]+)@users\.noreply\.github\.com$/);
    return plain ? plain[1] : null;
};

const normalizePersonKey = (s) =>
    String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

const namesLikelyMatch = (authorName, memberName) => {
    const na = normalizePersonKey(authorName);
    const nb = normalizePersonKey(memberName);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const ta = na.split(' ').filter((t) => t.length > 1);
    const tb = nb.split(' ').filter((t) => t.length > 1);
    if (ta.length === 0 || tb.length === 0) return false;
    const inter = ta.filter((t) => tb.includes(t));
    if (inter.length === ta.length || inter.length === tb.length) return true;
    if (ta.length >= 2 && tb.length >= 2 && inter.length >= 2) return true;
    if (ta.length >= 2 && tb.length >= 2 && ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1]) return true;
    return false;
};

function stripGithubHandle(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function githubHandleFuzzyMatchAuthor(authorName, authorEmail, memberUsers) {
    const noreply = loginFromNoreplyEmail(String(authorEmail || ''));
    const nameStrip = stripGithubHandle(authorName);
    const tokens = normalizePersonKey(authorName)
        .split(' ')
        .filter((t) => t.length >= 3);

    const scored = [];
    for (const u of memberUsers) {
        if (!u.githubLogin) continue;
        const gl = stripGithubHandle(u.githubLogin);
        if (!gl || gl.length < 2) continue;
        let confidence = 0;
        if (noreply && stripGithubHandle(noreply) === gl) confidence = 100;
        else if (nameStrip.length >= 4 && gl.includes(nameStrip)) confidence = 85;
        else if (nameStrip.length >= 4 && nameStrip.includes(gl)) confidence = 75;
        else {
            for (const tok of tokens) {
                if (tok.length >= 4 && gl.includes(tok)) {
                    confidence = 65;
                    break;
                }
            }
        }
        if (confidence > 0) scored.push({ u, confidence });
    }
    if (scored.length === 0) return null;
    scored.sort((a, b) => b.confidence - a.confidence);
    if (scored.length === 1) return scored[0].u;
    if (scored[0].confidence > (scored[1]?.confidence || 0)) return scored[0].u;
    return null;
}

function findMemberForCommitStrict(authorEmail, authorName, memberUsers) {
    const email = String(authorEmail || '').toLowerCase().trim();
    const name = String(authorName || '').trim();
    const noreply = loginFromNoreplyEmail(email);

    for (const u of memberUsers) {
        if (u.email && email && u.email === email) return u;
    }
    for (const u of memberUsers) {
        if (u.githubLogin && noreply && u.githubLogin === noreply.toLowerCase()) return u;
    }
    const local = email.includes('@') ? email.split('@')[0] : '';
    for (const u of memberUsers) {
        const ul = (u.email || '').split('@')[0].toLowerCase();
        if (local && ul && local === ul) return u;
        if (local && u.githubLogin && local.toLowerCase() === u.githubLogin) return u;
        if (noreply && u.githubLogin && noreply.toLowerCase() === u.githubLogin) return u;
    }
    for (const u of memberUsers) {
        if (namesLikelyMatch(name, u.name)) return u;
    }
    return null;
}

function findMemberForCommit(authorEmail, authorName, memberUsers) {
    return findMemberForCommitStrict(authorEmail, authorName, memberUsers)
        || githubHandleFuzzyMatchAuthor(authorName, authorEmail, memberUsers);
}

function mapStatsLoginToMember(login, memberUsers) {
    const lgRaw = String(login || '').toLowerCase().trim();
    if (!lgRaw) return null;
    const lg = stripGithubHandle(login);

    const exact = memberUsers.filter((m) => m.githubLogin && m.githubLogin === lgRaw);
    if (exact.length === 1) return exact[0];

    const stripMatch = memberUsers.filter((m) => m.githubLogin && stripGithubHandle(m.githubLogin) === lg);
    if (stripMatch.length === 1) return stripMatch[0];

    const substr = memberUsers.filter((m) => {
        if (!m.githubLogin) return false;
        const ms = stripGithubHandle(m.githubLogin);
        return ms.length >= 4 && lg.length >= 4 && (lg.includes(ms) || ms.includes(lg));
    });
    if (substr.length === 1) return substr[0];

    let u = memberUsers.find((m) => (m.email || '').split('@')[0].toLowerCase() === lgRaw);
    if (u) return u;

    const compact = (s) => normalizePersonKey(s).replace(/\s+/g, '');
    u = memberUsers.find(
        (m) => normalizePersonKey(m.name).replace(/\s+/g, '-') === lgRaw
            || compact(m.name) === lg.replace(/-/g, '')
    );
    return u || null;
}

async function buildGitByUserMap(memberUsers, githubRepo) {
    const gitByUser = new Map();
    memberUsers.forEach((u) => gitByUser.set(u.userId, 0));

    if (!githubRepo) {
        return { gitByUser, usedGithubStats: false, commits: [] };
    }

    const commits = githubRepo.commits || [];
    let usedGithubStats = false;

    if (githubRepo.owner && githubRepo.repoName) {
        try {
            const stats = await fetchContributorStatsWithRetry(githubRepo.owner, githubRepo.repoName);
            if (Array.isArray(stats) && stats.length > 0) {
                usedGithubStats = true;
                for (const stat of stats) {
                    const login = stat.author?.login;
                    const total = typeof stat.total === 'number' ? stat.total : 0;
                    const u = mapStatsLoginToMember(login, memberUsers);
                    if (u && total > 0) {
                        gitByUser.set(u.userId, total);
                    }
                }
            }
        } catch (e) {
            console.error('GitHub stats/contributors failed:', e.message);
        }
    }

    for (const c of commits) {
        const matched = findMemberForCommit(c.authorEmail, c.authorName, memberUsers);
        if (!matched) continue;
        const prev = gitByUser.get(matched.userId) || 0;
        if (usedGithubStats && prev > 0) continue;
        gitByUser.set(matched.userId, prev + 1);
    }

    return { gitByUser, usedGithubStats, commits };
}

module.exports = {
    extractGithubLogin,
    findMemberForCommit,
    buildGitByUserMap
};
