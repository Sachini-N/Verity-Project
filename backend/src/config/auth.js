const FALLBACK_JWT_SECRET = 'verity-local-dev-secret';

let hasWarnedAboutFallback = false;

const getJwtSecret = () => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }

    if (!hasWarnedAboutFallback) {
        hasWarnedAboutFallback = true;
        console.warn('JWT_SECRET is not set. Falling back to a local development secret.');
    }

    return FALLBACK_JWT_SECRET;
};

module.exports = { getJwtSecret };
