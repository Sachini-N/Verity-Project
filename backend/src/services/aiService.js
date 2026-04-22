const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();
const { recordIntegrationCall } = require('./systemMetrics');

// Create Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes project data (commits, tasks, activity) using Gemini to produce intelligent insights.
 * It replaces the previous rule-based metrics with genuine AI understanding.
 */
async function generateAIInsights(projectData) {
    try {
        const startedAt = Date.now();
        const prompt = `
        You are the Verity Project Intelligence Engine (PIE).
        Analyze the following student group project data for fairness, participation, and risks.
        
        Project Name: ${projectData.projectName}
        Members: ${JSON.stringify(projectData.members)}
        Recent Actions: ${JSON.stringify(projectData.recentLogs)}
        Task Closing Data: ${JSON.stringify(projectData.taskStats)}
        GitHub Commits Data: ${JSON.stringify(projectData.gitStats)}
        
        Identify any anomalies such as:
        1. Ghost Member: Someone not doing anything.
        2. Fake Worker: Closing tasks without pushing code.
        3. Burnout: Pushing code at completely ungodly hours excessively.
        4. Task Inflation: Closing many tasks instantly to boost stats.
        5. Last-Minute Panic: Massive code pushes right before deadlines.

        Output ONLY valid JSON matching this schema exactly (no markdown formatting, no backticks, just raw JSON text):
        {
            "healthStatus": "Healthy" | "Warning" | "At Risk",
            "summary": "Brief 1-2 sentence summary of team health.",
            "anomalies": [
                {
                    "severity": "high" | "medium",
                    "memberName": "Name of student",
                    "title": "Anomaly Title",
                    "description": "Why this was flagged"
                }
            ],
            "guidance": [
                {
                    "title": "Actionable Tip",
                    "recommendationText": "What the lecturer should do."
                }
            ]
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        recordIntegrationCall('gemini', { success: true, statusCode: 200, durationMs: Date.now() - startedAt });

        const textResponse = response.text;
        
        // Safely parse JSON
        const data = JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
        return data;
    } catch (error) {
        recordIntegrationCall('gemini', { success: false, statusCode: Number(error?.status) || 500, error: error?.message || 'Gemini request failed' });
        console.error('Gemini AI Generation Failed:', error);
        return null;
    }
}

/**
 * Generates narrative content for a lecturer-facing group contribution report.
 */
async function generateGroupProjectReportInsights(reportData) {
    try {
        const startedAt = Date.now();
        const prompt = `
        You are Verity's academic project auditor assistant.
        Based on the structured project data below, produce strict JSON for a lecturer report.

        Project Data:
        ${JSON.stringify(reportData)}

        Return ONLY valid JSON with this exact schema:
        {
          "executiveSummary": "short paragraph",
          "comparativeAnalysis": ["bullet text", "bullet text"],
          "riskAssessment": ["bullet text", "bullet text"],
          "lecturerRecommendations": ["bullet text", "bullet text"],
          "memberNarratives": [
            { "name": "student name", "summary": "concise evidence-based summary" }
          ]
        }

        Rules:
        - Keep statements evidence-based from provided data only.
        - Do not invent marks/grades.
        - Mention suspicious patterns carefully as indicators, not final accusations.
        - Keep tone professional and suitable for academic staff.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        recordIntegrationCall('gemini', { success: true, statusCode: 200, durationMs: Date.now() - startedAt });

        const textResponse = response.text;
        return JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (error) {
        recordIntegrationCall('gemini', { success: false, statusCode: Number(error?.status) || 500, error: error?.message || 'Gemini request failed' });
        console.error('Gemini Group Report Generation Failed:', error);
        return null;
    }
}

module.exports = { generateAIInsights, generateGroupProjectReportInsights };
