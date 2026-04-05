const axios = require('axios');

/**
 * @param {unknown} row
 * @returns {number|null}
 */
function hfRowToFakePercent(row) {
    if (!row || typeof row !== 'object') return null;
    const label = String(row.label || '').toLowerCase();
    const score = typeof row.score === 'number' ? row.score : parseFloat(row.score);
    if (!Number.isFinite(score)) return null;
    if (label.includes('fake') || label === 'label_1') {
        return Math.min(100, Math.max(0, score * 100));
    }
    if (label.includes('real') || label === 'label_0') {
        return Math.min(100, Math.max(0, (1 - score) * 100));
    }
    return null;
}

/**
 * Normalizes Hugging Face classifier output to a single 0–100 "AI-like" score.
 * @param {unknown} data
 * @returns {number|null}
 */
function parseHFClassifierOutput(data) {
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    let fakePct = null;
    for (const row of rows) {
        const p = hfRowToFakePercent(row);
        if (p != null) fakePct = p;
    }
    if (fakePct != null) return Math.round(fakePct * 100) / 100;

    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        return parseHFClassifierOutput(data[0]);
    }
    return null;
}

/**
 * Sapling (free tier with API key): https://sapling.ai/
 * Optional fallback: Hugging Face Inference API with HUGGINGFACE_API_KEY (free tier at huggingface.co/settings/tokens).
 *
 * @param {string} text - The text to analyze.
 * @returns {Promise<{ aiScore: number|null, sentenceScores: Array, source?: string }>}
 */
async function detectAIContent(text) {
    const body = (text || '').trim();
    if (body.length < 80) {
        return { aiScore: null, sentenceScores: [], source: 'insufficient_text' };
    }

    const saplingKey = process.env.SAPLING_API_KEY;
    if (saplingKey) {
        try {
            const response = await axios.post(
                'https://api.sapling.ai/api/v1/aidetect',
                {
                    key: saplingKey,
                    text: body.substring(0, 200000)
                },
                { timeout: 60000 }
            );
            const aiScore = (response.data.score || 0) * 100;
            return {
                aiScore: Math.round(aiScore * 100) / 100,
                sentenceScores: response.data.sentence_scores || [],
                source: 'sapling'
            };
        } catch (error) {
            console.error('Sapling AI detection failed:', error.response?.data || error.message);
        }
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_TOKEN;
    if (hfToken) {
        try {
            const snippet = body.substring(0, 6000);
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/openai-community/roberta-base-openai-detector',
                { inputs: snippet },
                {
                    headers: { Authorization: `Bearer ${hfToken}` },
                    timeout: 60000
                }
            );
            const aiScore = parseHFClassifierOutput(response.data);
            if (aiScore != null) {
                return { aiScore, sentenceScores: [], source: 'huggingface' };
            }
        } catch (error) {
            console.error('Hugging Face AI detection failed:', error.response?.data || error.message);
        }
    }

    if (!saplingKey && !hfToken) {
        console.warn('No AI API keys set. Add SAPLING_API_KEY and/or HUGGINGFACE_API_KEY to .env for AI scores.');
    }

    return { aiScore: null, sentenceScores: [], source: 'unavailable' };
}

module.exports = { detectAIContent };
