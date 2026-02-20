import { promises as dns } from 'dns';

export interface DNSRecord {
    type: 'TXT' | 'CNAME' | 'A' | 'AAAA';
    name: string;
    value: string;
}

export interface DNSVerificationResult {
    success: boolean;
    txtRecordFound: boolean;
    txtRecordValue?: string;
    cnameRecordFound: boolean;
    cnameRecordValue?: string;
    error?: string;
}

export async function lookupTXTRecords(domain: string): Promise<string[]> {
    try {
        const records = await dns.resolveTxt(domain);
        return records.map(r => r.join(''));
    } catch (error: any) {
        console.error('DNS TXT lookup error:', error);
        return [];
    }
}

export async function lookupCNAMERecord(domain: string): Promise<string | null> {
    try {
        const cnames = await dns.resolveCname(domain);
        return cnames.length > 0 ? cnames[0] : null;
    } catch (error: any) {
        console.error('DNS CNAME lookup error:', error);
        return null;
    }
}

export async function lookupARecords(domain: string): Promise<string[]> {
    try {
        const records = await dns.resolve4(domain);
        return records;
    } catch (error: any) {
        console.error('DNS A record lookup error:', error);
        return [];
    }
}

export async function verifyDNSConfiguration(
    domain: string,
    expectedToken: string,
    expectedCName: string = 'custom.creatorly.com'
): Promise<DNSVerificationResult> {
    try {
        // Check TXT record for verification token
        const txtRecords = await lookupTXTRecords(`_creatorly-verify.${domain}`);
        const txtRecordFound = txtRecords.some(record => record.includes(expectedToken));
        
        // Check CNAME record
        const cnameRecord = await lookupCNAMERecord(domain);
        const cnameRecordFound = cnameRecord === expectedCName;
        
        const success = txtRecordFound && cnameRecordFound;
        
        return {
            success,
            txtRecordFound,
            txtRecordValue: txtRecords[0],
            cnameRecordFound,
            cnameRecordValue: cnameRecord || undefined,
            error: success ? undefined : 'DNS verification failed'
        };
    } catch (error: any) {
        return {
            success: false,
            txtRecordFound: false,
            cnameRecordFound: false,
            error: error.message || 'DNS verification failed'
        };
    }
}

export async function isDomainVerified(domain: string): Promise<boolean> {
    try {
        const cname = await lookupCNAMERecord(domain);
        return cname === 'custom.creatorly.com' || cname === 'custom.creatorly.app';
    } catch {
        return false;
    }
}

export function isValidDomainFormat(domain: string): boolean {
    if (!domain || typeof domain !== 'string') return false;
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(cleanDomain);
}

export function getVerificationRecordDetails(domain: string, token: string) {
    return {
        txt: {
            host: `_creatorly-verify.${domain}`,
            value: token,
            type: 'TXT'
        },
        cname: {
            host: domain,
            value: 'custom.creatorly.com',
            type: 'CNAME'
        }
    };
}
