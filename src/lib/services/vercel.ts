/**
 * Vercel API Integration Service
 * Handles adding and removing domains from Vercel projects
 */

const VERCEL_API_URL = 'https://api.vercel.com/v9';

/**
 * Get Vercel API headers
 */
function getVercelHeaders() {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
        throw new Error('VERCEL_TOKEN is not configured');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Get Vercel project ID
 */
function getProjectId(): string {
    const projectId = process.env.VERCEL_PROJECT_ID;
    if (!projectId) {
        throw new Error('VERCEL_PROJECT_ID is not configured');
    }
    return projectId;
}

/**
 * Add a domain to Vercel project
 * This triggers SSL certificate provisioning
 * @param domain - The domain to add
 * @returns Result with verification status
 */
export async function addDomainToVercel(domain: string): Promise<{ success: boolean; verified?: boolean; message?: string }> {
    try {
        const projectId = getProjectId();
        const headers = getVercelHeaders();

        // First, check if domain already exists
        const checkResponse = await fetch(
            `${VERCEL_API_URL}/projects/${projectId}/domains/${domain}`,
            { headers }
        );

        if (checkResponse.ok) {
            const existingData = await checkResponse.json();
            return {
                success: true,
                verified: existingData.verified || false,
                message: 'Domain already exists in project'
            };
        }

        // Add the domain
        const response = await fetch(
            `${VERCEL_API_URL}/projects/${projectId}/domains`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: domain })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Vercel API error:', error);
            
            // Handle specific error cases
            if (error.error?.code === 'domain_already_exists') {
                return { success: true, verified: false, message: 'Domain already exists' };
            }
            
            throw new Error(error.error?.message || 'Failed to add domain to Vercel');
        }

        const data = await response.json();

        return {
            success: true,
            verified: data.verified || false,
            message: 'Domain added successfully'
        };
    } catch (error: any) {
        console.error('Vercel add domain error:', error);
        return {
            success: false,
            verified: false,
            message: error.message
        };
    }
}

/**
 * Remove a domain from Vercel project
 * @param domain - The domain to remove
 * @returns Success result
 */
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; message?: string }> {
    try {
        const projectId = getProjectId();
        const headers = getVercelHeaders();

        const response = await fetch(
            `${VERCEL_API_URL}/projects/${projectId}/domains/${domain}`,
            {
                method: 'DELETE',
                headers
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Vercel API error:', error);
            
            // Domain might not exist, which is fine
            if (error.error?.code === 'domain_not_found') {
                return { success: true, message: 'Domain not found in Vercel' };
            }
            
            throw new Error(error.error?.message || 'Failed to remove domain from Vercel');
        }

        return { success: true, message: 'Domain removed successfully' };
    } catch (error: any) {
        console.error('Vercel remove domain error:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Get domain status from Vercel
 * @param domain - The domain to check
 * @returns Domain status information
 */
export async function getDomainStatusFromVercel(domain: string): Promise<any> {
    try {
        const projectId = getProjectId();
        const headers = getVercelHeaders();

        const response = await fetch(
            `${VERCEL_API_URL}/projects/${projectId}/domains/${domain}`,
            { headers }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get domain status');
        }

        return await response.json();
    } catch (error: any) {
        console.error('Vercel get domain status error:', error);
        throw error;
    }
}

/**
 * Verify domain ownership with Vercel
 * @param domain - The domain to verify
 * @returns Verification result
 */
export async function verifyDomainWithVercel(domain: string): Promise<{ success: boolean; verified: boolean }> {
    try {
        const projectId = getProjectId();
        const headers = getVercelHeaders();

        const response = await fetch(
            `${VERCEL_API_URL}/projects/${projectId}/domains/${domain}/verify`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({})
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to verify domain');
        }

        const data = await response.json();

        return {
            success: true,
            verified: data.verified || false
        };
    } catch (error: any) {
        console.error('Vercel verify domain error:', error);
        return {
            success: false,
            verified: false
        };
    }
}

/**
 * Get all domains in Vercel project
 * @returns List of domains
 */
export async function getAllDomainsFromVercel(): Promise<any[]> {
    try {
        const projectId = getProjectId();
        const headers = getVercelHeaders();

        const response = await fetch(
            `${VERCEL_API_URL}/projects/${projectId}/domains`,
            { headers }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get domains');
        }

        const data = await response.json();
        return data.domains || [];
    } catch (error: any) {
        console.error('Vercel get domains error:', error);
        throw error;
    }
}
