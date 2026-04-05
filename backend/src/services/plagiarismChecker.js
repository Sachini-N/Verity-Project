const natural = require('natural');
const NGrams = natural.NGrams;

// Use natural's English stopwords
const stopwords = new Set(natural.stopwords);

/**
 * Normalizes text, removes punctuation, stop words, and generates trigrams.
 */
function extractTrigrams(text) {
    if (!text) return new Set();
    const tokenizer = new natural.WordTokenizer();
    let tokens = tokenizer.tokenize(text.toLowerCase());
    
    // Filter stopwords and very short tokens
    tokens = tokens.filter(word => !stopwords.has(word) && word.length > 1);
    
    // NGrams.trigrams returns an array of arrays like [['word1', 'word2', 'word3'], ...]
    const trigramsArray = NGrams.trigrams(tokens);
    const trigramStrings = trigramsArray.map(gram => gram.join(' '));
    
    return new Set(trigramStrings);
}

/**
 * Computes Jaccard Similarity between two sets of trigrams.
 * Formula: Intersect(A, B) / Union(A, B)
 */
function computeJaccardSimilarity(set1, set2) {
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let shorterSet = set1.size < set2.size ? set1 : set2;
    let longerSet = set1.size < set2.size ? set2 : set1;
    
    let intersectionSize = 0;
    for (const item of shorterSet) {
        if (longerSet.has(item)) intersectionSize++;
    }
    
    const unionSize = set1.size + set2.size - intersectionSize;
    if (unionSize === 0) return 0;
    
    return intersectionSize / unionSize;
}

/**
 * Checks for plagiarism between a new submission and existing ones.
 * @param {string} newText - The text of the new submission.
 * @param {Array<{id: string, extractedText: string}>} existingSubmissions - List of other submissions for the same assignment.
 * @returns {{plagiarismScore: number, matches: Array}} - The highest plagiarism score and list of matches.
 */
function checkPlagiarism(newText, existingSubmissions) {
    if (!newText || existingSubmissions.length === 0) {
        return { plagiarismScore: 0, matches: [] };
    }

    // Process newText ONCE before looping over all existing submissions (O(1) instead of O(N))
    const newTrigrams = extractTrigrams(newText);
    
    const matches = [];
    let maxScore = 0;

    // Compare with each existing submission
    existingSubmissions.forEach((sub) => {
        if (!sub.extractedText) return;

        const subTrigrams = extractTrigrams(sub.extractedText);
        
        let score = computeJaccardSimilarity(newTrigrams, subTrigrams);

        // Trigram match requires exact 3-word overlap (excluding stopwords).
        // Since we are taking intersection over union, even heavily plagiarized 
        // texts might top out around 60-80% due to formatting.
        // We calculate a percentage score.
        const rawPercentage = score * 100;
        
        // Boost factor: Jaccard similarity of trigrams usually yields lower raw numbers 
        // than single word overlap. 30% Jaccard on trigrams is MASSIVE plagiarism.
        // We'll apply a mild 1.5x scaling factor to make it visually clearer for users.
        const percentage = Math.min(Math.round(rawPercentage * 1.5), 100);

        if (percentage > maxScore) {
            maxScore = percentage;
        }

        // Track anything over 20% for database relations
        if (percentage >= 20) {
            matches.push({
                submissionId: sub.id,
                score: percentage
            });
        }
    });

    return {
        plagiarismScore: maxScore,
        matches: matches.filter(m => m.score >= 50) // Flag matches over 50% for main UI
    };
}

module.exports = { checkPlagiarism, extractTrigrams, computeJaccardSimilarity };
