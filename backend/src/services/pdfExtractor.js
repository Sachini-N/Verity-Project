const axios = require('axios');
const { PDFParse } = require('pdf-parse');

/**
 * Extracts text from a PDF file given its public URL.
 * Uses pdf-parse v2+ (PDFParse class); the old default-export function API no longer exists.
 * @param {string} url - The public URL of the PDF file.
 * @returns {Promise<string>} - The extracted text.
 */
async function extractTextFromUrl(url) {
    let parser;
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 120000,
            maxRedirects: 5,
            validateStatus: (s) => s >= 200 && s < 400,
            headers: {
                'User-Agent': 'Verity-Assignment-Checker/1.0',
                Accept: 'application/pdf,*/*'
            }
        });

        if (response.status >= 400) {
            throw new Error(`HTTP ${response.status} when fetching PDF`);
        }

        const buffer = Buffer.from(response.data);
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return (result && result.text) ? result.text.trim() : '';
    } catch (error) {
        console.error(`Error extracting text from PDF at URL: ${url}`);
        console.error('Error Details:', error.response?.status ? `${error.response.status} ${error.response.statusText}` : error.message);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    } finally {
        if (parser && typeof parser.destroy === 'function') {
            try {
                await parser.destroy();
            } catch (_) {
                /* ignore */
            }
        }
    }
}

module.exports = { extractTextFromUrl };
