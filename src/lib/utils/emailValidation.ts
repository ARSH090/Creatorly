// Disposable/temporary email domains to block
export const BLOCKED_EMAIL_DOMAINS = [
    // Temporary/disposable email services
    'temp-mail.org',
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
    'getnada.com',
    'maildrop.cc',
    'yopmail.com',
    'fakeinbox.com',
    'trashmail.com',
    'mintemail.com',
    'mytrashmail.com',
    'mailnesia.com',
    'emailondeck.com',
    'temp-mail.io',
    'dispostable.com',
    'sharklasers.com',
    'guerrillamailblock.com',
    'grr.la',
    'spam4.me',
    'mailcatch.com',
    'getairmail.com',
    'tempinbox.com',
    'mohmal.com',
    'filzmail.com',
    'armyspy.com',
    'cuvox.de',
    'dayrep.com',
    'einrot.com',
    'fleckens.hu',
    'gustr.com',
    'jourrapide.com',
    'rhyta.com',
    'superrito.com',
    'teleworm.us',
    '33mail.com',
    'anonbox.net',
    'binkmail.com',
    'deadaddress.com',
    'despam.it',
    'dodgeit.com',
    'emailfreedom.ml',
    'emailproxsy.com',
    'mailforspam.com',
    'mailfreeonline.com',
    'mailmoat.com',
    'mt2009.com',
    'pookmail.com',
    'dodgit.com',
    'anonymbox.com',
];

export function isDisposableEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return true;

    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return true;

    return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
