/**
 * UPI Logic for Creatorly
 * Generates UPI deep links for Indian payment apps.
 */

export interface UPIPaymentParams {
    pa: string; // Payee Address (VPA)
    pn: string; // Payee Name
    am: string; // Amount in INR
    cu: string; // Always INR
    tn?: string; // Transaction Note
    tr?: string; // Transaction Ref ID
}

export function generateUPILink(params: UPIPaymentParams): string {
    const baseUrl = "upi://pay";
    const searchParams = new URLSearchParams();

    searchParams.append("pa", params.pa);
    searchParams.append("pn", params.pn);
    searchParams.append("am", params.am);
    searchParams.append("cu", "INR");

    if (params.tn) searchParams.append("tn", params.tn);
    if (params.tr) searchParams.append("tr", params.tr);

    return `${baseUrl}?${searchParams.toString()}`;
}
