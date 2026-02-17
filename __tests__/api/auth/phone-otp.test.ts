import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/verify-phone/route';
import User from '@/lib/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
    __esModule: true,
    default: {
        auth: () => ({
            verifyIdToken: jest.fn(),
        }),
    },
    auth: () => ({
        verifyIdToken: jest.fn(),
    }),
}));

// Mock database
jest.mock('@/lib/db/mongodb');
jest.mock('@/lib/models/User');

describe('POST /api/auth/verify-phone', () => {
    const mockFirebaseAdmin = require('@/lib/firebase-admin').default;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('valid +91 number format accepted', async () => {
        const mockVerifyIdToken = mockFirebaseAdmin.auth().verifyIdToken as jest.Mock;
        mockVerifyIdToken.mockResolvedValue({
            phone_number: '+919876543210',
            uid: 'firebase-uid-123',
        });

        (User.findOne as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'valid-firebase-token',
                phoneNumber: '+919876543210',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.phoneVerified).toBe(true);
    });

    test('invalid phone format returns 400', async () => {
        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'valid-firebase-token',
                phoneNumber: '1234567890', // Missing +91
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('INVALID_PHONE_FORMAT');
    });

    test('missing phone returns 400', async () => {
        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'valid-firebase-token',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('MISSING_PHONE');
    });

    test('missing firebaseToken returns 400', async () => {
        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                phoneNumber: '+919876543210',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('MISSING_TOKEN');
    });

    test('phone number mismatch between token and body returns 400', async () => {
        const mockVerifyIdToken = mockFirebaseAdmin.auth().verifyIdToken as jest.Mock;
        mockVerifyIdToken.mockResolvedValue({
            phone_number: '+919876543210',
            uid: 'firebase-uid-123',
        });

        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'valid-firebase-token',
                phoneNumber: '+919999999999', // Different from token
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(400);
        expect(data.code).toBe('PHONE_MISMATCH');
    });

    test('already registered phone returns 409', async () => {
        const mockVerifyIdToken = mockFirebaseAdmin.auth().verifyIdToken as jest.Mock;
        mockVerifyIdToken.mockResolvedValue({
            phone_number: '+919876543210',
            uid: 'firebase-uid-123',
        });

        // Mock existing user with phone
        (User.findOne as jest.Mock).mockResolvedValue({
            _id: 'existing-user-id',
            phoneHash: 'some-hash',
        });

        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'valid-firebase-token',
                phoneNumber: '+919876543210',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data.code).toBe('PHONE_EXISTS');
    });

    test('expired Firebase token returns 401', async () => {
        const mockVerifyIdToken = mockFirebaseAdmin.auth().verifyIdToken as jest.Mock;
        mockVerifyIdToken.mockRejectedValue(new Error('auth/id-token-expired'));

        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'expired-token',
                phoneNumber: '+919876543210',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(401);
        expect(data.code).toBe('INVALID_TOKEN');
    });

    test('successful verification sets phoneVerified=true in response', async () => {
        const mockVerifyIdToken = mockFirebaseAdmin.auth().verifyIdToken as jest.Mock;
        mockVerifyIdToken.mockResolvedValue({
            phone_number: '+919876543210',
            uid: 'firebase-uid-123',
        });

        (User.findOne as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({
                firebaseToken: 'valid-firebase-token',
                phoneNumber: '+919876543210',
            }),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.phoneVerified).toBe(true);
        expect(data.phoneHash).toBeDefined();
        expect(typeof data.phoneHash).toBe('string');
    });
});
