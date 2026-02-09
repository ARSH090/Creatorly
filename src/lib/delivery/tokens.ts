import jwt from 'jsonwebtoken';

const DELIVERY_SECRET = process.env.DELIVERY_TOKEN_SECRET || 'fallback-secret-for-dev';

export interface DeliveryTokenPayload {
    orderId: string;
    productId: string;
    email: string;
    ip?: string;
}

export function generateDeliveryToken(payload: DeliveryTokenPayload): string {
    return jwt.sign(payload, DELIVERY_SECRET, { expiresIn: '24h' });
}

export function verifyDeliveryToken(token: string): DeliveryTokenPayload | null {
    try {
        return jwt.verify(token, DELIVERY_SECRET) as DeliveryTokenPayload;
    } catch (error) {
        console.error('[Delivery] Token verification failed:', error);
        return null;
    }
}
