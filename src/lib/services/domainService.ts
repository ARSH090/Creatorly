import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { CustomDomain } from '@/lib/models/CustomDomain';
import { CreatorProfile } from '@/lib/models/CreatorProfile';
import { User } from '@/lib/models/User';
import { getCachedValue, setCachedValue, deleteCachedValue, getOrSet } from '@/lib/cache/redis';
import { verifyDNSConfiguration, isValidDomainFormat, getVerificationRecordDetails } from '@/lib/utils/dns';
import { addDomainToVercel, removeDomainFromVercel } from './vercel';

// Cache TTL constants
const DOMAIN_CACHE_TTL = 3600; // 1 hour
const USERNAME_CACHE_TTL = 3600; // 1 hour

// Cache key prefixes
const CACHE_KEYS = {
    DOMAIN_TO_USERNAME: 'domain:',
    USERNAME_TO_PROFILE: 'username:',
    CUSTOM_DOMAINS_LIST: 'custom_domains:',
};

/**
 * Generate a unique verification token for domain ownership
 */
export function generateVerificationToken(): string {
    return `creatorly-verify-${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Get creator profile by custom domain
 * Uses Redis caching for performance
 * @param domain - The custom domain to look up
 * @returns Creator profile or null if not found
 */
export async function getCreatorByDomain(domain: string): Promise<any | null> {
    const normalizedDomain = domain.toLowerCase();
    const cacheKey = `${CACHE_KEYS.DOMAIN_TO_USERNAME}${normalizedDomain}`;

    // Try to get from cache first
    const cached = await getCachedValue<any>(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from database
    await connectToDatabase();

    // Find the custom domain record
    const customDomain = await CustomDomain.findOne({
        domain: normalizedDomain,
        status: 'verified'
    }).lean();

    if (!customDomain) {
        // Cache negative result for shorter time
        await setCachedValue(cacheKey, null, { ttl: 300 });
        return null;
    }

    // Get the creator profile
    const profile = await CreatorProfile.findOne({
        creatorId: customDomain.creatorId
    }).lean();

    if (!profile) {
        await setCachedValue(cacheKey, null, { ttl: 300 });
        return null;
    }

    // Cache the result
    await setCachedValue(cacheKey, profile, { ttl: DOMAIN_CACHE_TTL });

    return profile;
}

/**
 * Get creator profile by username
 * Uses Redis caching for performance
 * @param username - The username to look up
 * @returns Creator profile or null if not found
 */
export async function getCreatorByUsername(username: string): Promise<any | null> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `${CACHE_KEYS.USERNAME_TO_PROFILE}${normalizedUsername}`;

    // Try to get from cache first
    const cached = await getCachedValue<any>(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from database
    await connectToDatabase();

    const profile = await CreatorProfile.findOne({
        username: normalizedUsername
    }).lean();

    if (!profile) {
        await setCachedValue(cacheKey, null, { ttl: 300 });
        return null;
    }

    // Cache the result
    await setCachedValue(cacheKey, profile, { ttl: USERNAME_CACHE_TTL });

    return profile;
}

/**
 * Initialize custom domain for a creator
 * @param creatorId - The creator's user ID
 * @param domain - The domain to add
 * @returns The created domain record
 */
export async function initializeCustomDomain(creatorId: string, domain: string): Promise<any> {
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Validate domain format
    if (!isValidDomainFormat(normalizedDomain)) {
        throw new Error('Invalid domain format');
    }

    await connectToDatabase();

    // Check if domain is already taken
    const existingDomain = await CustomDomain.findOne({ domain: normalizedDomain });
    if (existingDomain) {
        if (existingDomain.creatorId.toString() === creatorId) {
            // Domain already belongs to this creator
            return existingDomain;
        }
        throw new Error('Domain is already in use by another creator');
    }

    // Check if creator already has a custom domain
    const creatorDomain = await CustomDomain.findOne({ creatorId });
    if (creatorDomain) {
        throw new Error('You already have a custom domain. Please remove it before adding a new one.');
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create domain record
    const customDomain = await CustomDomain.create({
        creatorId,
        domain: normalizedDomain,
        status: 'pending',
        verificationToken,
        dnsRecords: [
            {
                type: 'TXT',
                name: `_creatorly-verify.${normalizedDomain}`,
                value: verificationToken,
                verified: false
            },
            {
                type: 'CNAME',
                name: normalizedDomain,
                value: 'custom.creatorly.com',
                verified: false
            }
        ],
        sslStatus: 'pending'
    });

    // Invalidate cache
    await deleteCachedValue(`${CACHE_KEYS.CUSTOM_DOMAINS_LIST}${creatorId}`);

    return customDomain;
}

/**
 * Verify custom domain DNS configuration
 * @param creatorId - The creator's user ID
 * @param domain - The domain to verify
 * @returns Verification result
 */
export async function verifyCustomDomain(creatorId: string, domain: string): Promise<any> {
    const normalizedDomain = domain.toLowerCase();

    await connectToDatabase();

    // Find the domain record
    const customDomain = await CustomDomain.findOne({
        creatorId,
        domain: normalizedDomain
    });

    if (!customDomain) {
        throw new Error('Domain not found');
    }

    if (customDomain.status === 'verified') {
        return {
            success: true,
            domain: customDomain,
            message: 'Domain is already verified'
        };
    }

    // Perform DNS verification
    const verificationResult = await verifyDNSConfiguration(
        normalizedDomain,
        customDomain.verificationToken!
    );

    // Update domain record based on verification result
    if (verificationResult.success) {
        customDomain.status = 'verified';
        customDomain.verifiedAt = new Date();

        // Update DNS records
        customDomain.dnsRecords = customDomain.dnsRecords.map(record => ({
            ...record,
            verified: record.type === 'TXT' ? true : record.verified
        }));

        await customDomain.save();

        // Add domain to Vercel for SSL
        try {
            const vercelResult = await addDomainToVercel(normalizedDomain);
            customDomain.sslStatus = vercelResult?.verified ? 'active' : 'pending';
            await customDomain.save();
        } catch (error: any) {
            console.error('Failed to add domain to Vercel:', error);
            // Don't fail the verification, just log the error
        }

        // Invalidate domain cache
        await deleteCachedValue(`${CACHE_KEYS.DOMAIN_TO_USERNAME}${normalizedDomain}`);

        return {
            success: true,
            domain: customDomain,
            message: 'Domain verified successfully'
        };
    } else {
        // Update with error
        customDomain.status = 'failed';
        customDomain.dnsRecords = customDomain.dnsRecords.map(record => ({
            ...record,
            verified: false
        }));

        await customDomain.save();

        return {
            success: false,
            domain: customDomain,
            message: verificationResult.error || 'DNS verification failed',
            instructions: getVerificationRecordDetails(normalizedDomain, customDomain.verificationToken!)
        };
    }
}

/**
 * Get custom domain status for a creator
 * @param creatorId - The creator's user ID
 * @returns Domain status or null
 */
export async function getCustomDomainStatus(creatorId: string): Promise<any | null> {
    await connectToDatabase();

    const customDomain = await CustomDomain.findOne({ creatorId }).lean();

    return customDomain;
}

/**
 * Remove custom domain from a creator
 * @param creatorId - The creator's user ID
 * @returns Success result
 */
export async function removeCustomDomain(creatorId: string): Promise<{ success: boolean }> {
    await connectToDatabase();

    // Find and delete the domain record
    const customDomain = await CustomDomain.findOne({ creatorId });

    if (!customDomain) {
        throw new Error('No custom domain found');
    }

    // Remove from Vercel if it's verified
    if (customDomain.status === 'verified') {
        try {
            await removeDomainFromVercel(customDomain.domain);
        } catch (error: any) {
            console.error('Failed to remove domain from Vercel:', error);
            // Continue with deletion even if Vercel removal fails
        }
    }

    // Delete from database
    await CustomDomain.deleteOne({ creatorId });

    // Invalidate caches
    await deleteCachedValue(`${CACHE_KEYS.DOMAIN_TO_USERNAME}${customDomain.domain}`);
    await deleteCachedValue(`${CACHE_KEYS.CUSTOM_DOMAINS_LIST}${creatorId}`);

    // Also clear from CreatorProfile if it was set
    await CreatorProfile.updateOne(
        { creatorId },
        {
            $set: {
                customDomain: null,
                isCustomDomainVerified: false
            }
        }
    );

    return { success: true };
}

/**
 * Check if a domain is available
 * @param domain - The domain to check
 * @returns Boolean indicating availability
 */
export async function isDomainAvailable(domain: string): Promise<boolean> {
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    await connectToDatabase();

    const existing = await CustomDomain.findOne({ domain: normalizedDomain });

    return !existing;
}

/**
 * Get verification instructions for a domain
 * @param domain - The custom domain
 * @param token - The verification token
 * @returns Verification instructions
 */
export function getDomainVerificationInstructions(domain: string, token: string) {
    return getVerificationRecordDetails(domain, token);
}

/**
 * Invalidate domain cache (for admin use)
 * @param domain - The domain to invalidate
 */
export async function invalidateDomainCache(domain: string): Promise<void> {
    const normalizedDomain = domain.toLowerCase();
    await deleteCachedValue(`${CACHE_KEYS.DOMAIN_TO_USERNAME}${normalizedDomain}`);
}
