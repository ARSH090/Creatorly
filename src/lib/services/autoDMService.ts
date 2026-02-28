/**
 * autoDMService.ts
 * Core AutoDM dispatch service — comment reply variant rotation + DM send helpers.
 */
import { AutoReplyRule, IAutoReplyRule } from '@/lib/models/AutoReplyRule';
import { DMLog } from '@/lib/models/DMLog';
import { InstagramService } from '@/lib/services/instagram';
import { connectToDatabase } from '@/lib/db/mongodb';

// ─── Reply Variant Rotation ────────────────────────────────────────────────────

/**
 * ManyChat-style: pick a random comment reply that is NOT the last one used.
 * Falls back to replyText when no variants set.
 */
export function getRandomReply(
    rule: IAutoReplyRule,
    lastUsedIndex?: number
): { text: string; index: number } {
    const variants = rule.commentReplies ?? [];

    if (variants.length === 0) {
        return { text: rule.replyText, index: -1 };
    }

    if (variants.length === 1) {
        return { text: variants[0].text, index: 0 };
    }

    // Build pool excluding last-used index
    const availableIndices = variants
        .map((_, i) => i)
        .filter(i => i !== lastUsedIndex);

    const pickedIndex =
        availableIndices[Math.floor(Math.random() * availableIndices.length)];

    return { text: variants[pickedIndex].text, index: pickedIndex };
}

// ─── Personalise message with {{name}} etc. ────────────────────────────────────

export function personaliseMessage(
    template: string,
    vars: Record<string, string>
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Find the best matching rule for a creator + trigger ─────────────────────

export async function findMatchingRule(
    creatorIgId: string,
    triggerType: string,
    text: string
): Promise<IAutoReplyRule | null> {
    await connectToDatabase();

    // We store creatorId as ObjectId; find by igUserId via the connected account
    // The caller should pass in creatorId directly where possible
    const rules = await AutoReplyRule.find({
        isActive: true,
        triggerType,
    }).sort({ priority: -1 });

    for (const rule of rules) {
        if (matchesKeywords(rule, text)) {
            return rule;
        }
    }
    return null;
}

export function matchesKeywords(rule: IAutoReplyRule, text: string): boolean {
    const lowerText = text.toLowerCase().trim();
    const keywords = rule.keywords ?? [];

    if (keywords.length === 0) return true; // matches everything

    switch (rule.matchType) {
        case 'exact':
            return keywords.some((k) => k === lowerText);
        case 'contains':
            return keywords.some((k) => lowerText.includes(k));
        case 'starts_with':
            return keywords.some((k) => lowerText.startsWith(k));
        case 'regex':
            return keywords.some((k) => {
                try { return new RegExp(k, 'i').test(lowerText); } catch { return false; }
            });
        default:
            return keywords.some((k) => lowerText.includes(k));
    }
}

// ─── Check deduplication window ───────────────────────────────────────────────

export async function isDuplicate(
    creatorId: string,
    recipientId: string,
    ruleId: string,
    deduplicationWindow: string
): Promise<boolean> {
    if (deduplicationWindow === 'never') return false;

    const windowMap: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        'lifetime': Infinity,
    };

    const windowMs = windowMap[deduplicationWindow] ?? windowMap['24h'];
    const since = windowMs === Infinity ? new Date(0) : new Date(Date.now() - windowMs);

    const existing = await DMLog.findOne({
        creatorId,
        recipientId,
        ruleId,
        createdAt: { $gte: since },
        status: 'success',
    });

    return !!existing;
}

// ─── Send comment public reply ────────────────────────────────────────────────

export async function replyToComment(params: {
    commentId: string;
    replyText: string;
    accessToken: string;
}): Promise<boolean> {
    try {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${params.commentId}/replies`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: params.replyText,
                    access_token: params.accessToken,
                }),
            }
        );
        return res.ok;
    } catch (err) {
        console.error('[autoDMService] replyToComment failed:', err);
        return false;
    }
}
