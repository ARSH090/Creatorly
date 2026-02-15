import '@testing-library/jest-dom';
import 'whatwg-fetch';
// In a real project, we would import the MSW server here
// import { server } from './src/mocks/server';

// Establish API mocking before all tests
// beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests
// afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
// afterAll(() => server.close());

// Mock environment variables
process.env = {
    ...process.env,
    MONGODB_URI: 'mongodb://localhost:27017/creatorly-test',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    JWT_SECRET: 'test-secret',
    RAZORPAY_KEY_ID: 'rzp_test_key',
    RAZORPAY_KEY_SECRET: 'rzp_test_secret',
    RAZORPAY_WEBHOOK_SECRET: 'webhook_secret',
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
    usePathname: () => '',
}));

// Mock Firebase
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
}));
