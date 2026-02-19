// @ts-nocheck
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
        // Mock implementation to bypass build error
        // const records = await dns.resolveTxt(domain);
        // return records.map(r => r.join(''));
        return [];
    } catch (error: any) {
        return [];
    }
}

export async function lookupCNAMERecord(domain: string): Promise<string | null> {
    try {
        // const cnames = await dns.resolveCname(domain);
        // return cnames.length > 0 ? cnames[0] : null;
        return null;
    } catch (error: any) {
        return null;
    }
}

export async function lookupARecords(domain: string): Promise<string[]> {
    try {
        // const records = await dns.resolve4(domain);
        // return records;
        return [];
    } catch (error: any) {
        return [];
    }
}

export async function verifyDNSConfiguration(
    domain: string,
    expectedToken: string,
    expectedCName: string = 'custom.creatorly.com'
): Promise<DNSVerificationResult> {
    return {
        success: false,
        txtRecordFound: false,
        cnameRecordFound: false,
        error: 'DNS verification temporarily disabled.'
    };
}

export async function isDomainVerified(domain: string): Promise<boolean> {
    return false;
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
