import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

/**
 * Gemini AI Client for Creatorly
 */
export class GeminiClient {
    /**
     * Generate content based on a prompt
     */
    static async generateText(prompt: string, modelType: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash') {
        try {
            const model = genAI.getGenerativeModel({ model: modelType });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('[Gemini AI] Error:', error.message);
            throw new Error('AI generation failed. Please check your API key and quota.');
        }
    }

    /**
     * Generate structured content for specific types
     */
    static async generateStructuredContent(type: string, brief: any) {
        const prompt = this.buildPrompt(type, brief);
        return this.generateText(prompt);
    }

    private static buildPrompt(type: string, brief: any) {
        const { topic, tone, audience, keywords } = brief;

        return `
            You are an expert content creator for the Indian market.
            Generate a high-quality ${type} about the following topic: "${topic}".
            
            Target Audience: ${audience || 'General Indian creators and entrepreneurs'}
            Tone of Voice: ${tone || 'Professional yet engaging'}
            Keywords to include: ${keywords?.join(', ') || 'N/A'}
            
            The content should be culturally relevant to India, mentioning local context where appropriate (e.g. UPI, digital economy, Tier 2/3 growth).
            
            Format the output with a clear title and body.
        `;
    }
}
