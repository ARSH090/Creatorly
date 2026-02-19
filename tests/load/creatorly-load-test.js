import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const profileDuration = new Trend('profile_page_duration', true);
const dashboardDuration = new Trend('dashboard_duration', true);
const analyticsHits = new Counter('analytics_hits');

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_USERNAME = __ENV.TEST_USERNAME || 'demo';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'demo@creatorly.in';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'TestPassword123!';

// ─── Load Scenarios ─────────────────────────────────────────────────────────────
export const options = {
    scenarios: {
        // 1. Smoke — sanity check at minimal load
        smoke: {
            executor: 'constant-vus',
            vus: 2,
            duration: '30s',
            tags: { scenario: 'smoke' },
            exec: 'publicProfile',
        },

        // 2. Average load
        average_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 50 },   // ramp-up
                { duration: '3m', target: 50 },   // steady
                { duration: '1m', target: 0 },    // ramp-down
            ],
            tags: { scenario: 'average_load' },
            exec: 'mixedTraffic',
            startTime: '35s',  // after smoke
        },

        // 3. Spike — sudden burst
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 200 },
                { duration: '30s', target: 200 },
                { duration: '10s', target: 0 },
            ],
            tags: { scenario: 'spike' },
            exec: 'publicProfile',
            startTime: '6m',
        },

        // 4. Soak — extended steady load to expose memory leaks
        soak: {
            executor: 'constant-vus',
            vus: 20,
            duration: '10m',
            tags: { scenario: 'soak' },
            exec: 'apiEndpoints',
            startTime: '7m',
        },
    },

    thresholds: {
        // 95th percentile must finish within 2 s
        http_req_duration: ['p(95)<2000'],
        // Error rate below 2%
        errors: ['rate<0.02'],
        // Profile page: median < 800 ms
        profile_page_duration: ['p(50)<800', 'p(95)<2500'],
        // Dashboard: median < 1 s
        dashboard_duration: ['p(50)<1000', 'p(95)<3000'],
    },
};

const PARAMS = {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: '15s',
};

// ─── Scenario Functions ─────────────────────────────────────────────────────────

/**
 * Public profile page — unauthenticated visitors.
 * Most traffic lands here.
 */
export function publicProfile() {
    group('Public Profile', () => {
        const start = Date.now();
        const res = http.get(`${BASE_URL}/u/${TEST_USERNAME}`);
        profileDuration.add(Date.now() - start);

        const ok = check(res, {
            'status 200': (r) => r.status === 200,
            'body contains creator name': (r) => r.body?.toString().includes('creator') ?? false,
        });
        errorRate.add(!ok);
    });
    sleep(Math.random() * 2 + 1);
}

/**
 * Mixed authenticated traffic — login + dashboard + analytics.
 */
export function mixedTraffic() {
    let token: string | null = null;

    group('Auth: Login', () => {
        const start = Date.now();
        const res = http.post(
            `${BASE_URL}/api/auth/login`,
            JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
            PARAMS,
        );
        loginDuration.add(Date.now() - start);

        const ok = check(res, {
            'login 200': (r) => r.status === 200,
        });
        errorRate.add(!ok);

        if (ok && res.json('token')) {
            token = res.json('token') as string;
        }
    });

    if (!token) return;

    const authHeaders = {
        headers: {
            ...PARAMS.headers,
            Authorization: `Bearer ${token}`,
        },
        timeout: '15s',
    };

    group('Dashboard', () => {
        const start = Date.now();
        const res = http.get(`${BASE_URL}/dashboard`, authHeaders);
        dashboardDuration.add(Date.now() - start);

        check(res, { 'dashboard 200': (r) => r.status === 200 });
    });

    sleep(0.5);

    group('Analytics API', () => {
        const res = http.get(`${BASE_URL}/api/creator/analytics`, authHeaders);
        analyticsHits.add(1);
        check(res, { 'analytics 200': (r) => r.status === 200 });
    });

    sleep(0.5);

    group('Links API', () => {
        const res = http.get(`${BASE_URL}/api/creator/links`, authHeaders);
        check(res, { 'links 200': (r) => r.status === 200 });
    });

    sleep(Math.random() * 3 + 1);
}

/**
 * Public-facing API endpoints — for soak testing.
 */
export function apiEndpoints() {
    const endpoints = [
        `/api/health`,
        `/api/creator/profile?username=${TEST_USERNAME}`,
        `/u/${TEST_USERNAME}`,
    ];

    const url = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(`${BASE_URL}${url}`);

    const ok = check(res, {
        'status < 500': (r) => r.status < 500,
        'latency < 3s': (r) => r.timings.duration < 3000,
    });
    errorRate.add(!ok);

    sleep(Math.random() * 1.5 + 0.5);
}

/**
 * Rate-limiting stress test — ensure 429s are returned properly.
 */
export function rateLimitTest() {
    const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: 'bad@example.com', password: 'wrong' }),
        PARAMS,
    );

    // We expect either 401 (bad creds) or 429 (rate limit) — both are valid
    check(res, {
        'expected rejection': (r) => r.status === 401 || r.status === 429,
    });
}
