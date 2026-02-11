/**
 * AI Indian Market Intelligence
 * Logic for optimizing creator content for the Indian demographic.
 */

import { GeminiClient } from './gemini';

export interface PricingSuggestion {
    basePrice: number;
    marketTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
    rationale: string;
}

export function suggestIndianPricing(category: string, followerCount: number): PricingSuggestion {
    // Logic based on Indian MSME market trends
    let basePrice = 499; // Default entry point
    let tier: 'Tier 1' | 'Tier 2' | 'Tier 3' = 'Tier 2';

    if (category === 'Consultations') {
        basePrice = followerCount > 50000 ? 4999 : 1999;
        tier = 'Tier 1';
    } else if (category === 'Digital Goods') {
        basePrice = followerCount > 10000 ? 999 : 499;
        tier = 'Tier 2';
    }

    return {
        basePrice,
        marketTier: tier,
        rationale: `Optimized for ${tier} consumers based on your ${followerCount} follower base.`
    };
}

export const CONTENT_TEMPLATES = {
    blog: {
        prompt: (topic: string, context: any) => `
            Write a professional, SEO-optimized blog post about "${topic}".
            Target Audience: ${context.audience || 'Indian lifestyle and business enthusiasts'}
            Tone: ${context.tone || 'Educational and Inspiring'}
            Keywords: ${context.keywords?.join(', ') || 'N/A'}
            
            Structure:
            1. Compelling Title
            2. Introduction with a hook
            3. Key Subheadings (H2, H3)
            4. Conclusion with Call to Action
            
            Context: Focus on how this topic impacts the Indian middle class and the growing digital economy. 
            Use simple but effective language.
        `
    },
    twitter: {
        prompt: (topic: string, context: any) => `
            Create a viral Twitter/X thread about "${topic}".
            Target Audience: ${context.audience || 'Tech-savvy Indians'}
            Tone: ${context.tone || 'Bold and Punchy'}
            
            Format:
            - Thread of 5-7 tweets
            - Include relevant hashtags
            - Use emojis effectively
            - Last tweet should encourage engagement (Reply/RT)
            
            Context: Mention Indian trends, UPI, or Startup India if relevant.
        `
    },
    instagram: {
        prompt: (topic: string, context: any) => `
            Write a captivating Instagram caption for a post about "${topic}".
            Tone: ${context.tone || 'Friendly and Visual'}
            
            Format:
            - Engaging first line
            - Value-driven body
            - 3-5 high-performing Indian hashtags
            - Space for carousel slide descriptions if needed
        `
    },
    email: {
        prompt: (topic: string, context: any) => `
            Write a conversion-focused email sequence (1 email) about "${topic}".
            Tone: ${context.tone || 'Personal and Persuasive'}
            
            Structure:
            1. Subject Line (Open-loop)
            2. Salutation
            3. Problem/Agitation
            4. Solution (The topic)
            5. Sign-off
        `
    },
    product: {
        prompt: (topic: string, context: any) => `
            Generate a compelling, professional product description for a digital product titled "${topic}". 
            The description should be optimized for the Indian creator economy and highlight value for Indian consumers.
            Keywords: ${context.keywords?.join(', ') || 'N/A'}
            Keep it under 150 words.
        `
    }
};

export async function generateContent(type: string, topic: string, context: any = {}) {
    // 1. Get Template
    const template = (CONTENT_TEMPLATES as any)[type] || CONTENT_TEMPLATES.blog;
    const prompt = template.prompt(topic, context);

    // 2. Generate via Gemini
    const text = await GeminiClient.generateText(prompt, context.highQuality ? 'gemini-1.5-pro' : 'gemini-1.5-flash');

    return text;
}

/**
 * @deprecated Use generateContent('product', ...) instead
 */
export async function generateProductDescription(title: string, userId: string) {
    const User = (await import('@/lib/models/User')).default;
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Check limits
    const limit = user.planLimits?.maxAiGenerations || 10;
    if (user.aiUsageCount >= limit) {
        throw new Error(`AI generation limit reached (${limit}). Please upgrade your plan.`);
    }

    const description = await generateContent('product', title);

    // Increment usage
    user.aiUsageCount += 1;
    await user.save();

    return description;
}
