# Creatorly Load Tests (k6)

Load test suite using [k6](https://k6.io). Covers 4 scenarios: smoke, average load, spike, and soak.

## Prerequisites

```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running the Tests

### Quick smoke test (~30 s)
```bash
k6 run --env BASE_URL=http://localhost:3000 --env TEST_USERNAME=demo tests/load/creatorly-load-test.js
```

### Against a deployed environment
```bash
k6 run \
  --env BASE_URL=https://your-app.vercel.app \
  --env TEST_USERNAME=yourusername \
  --env TEST_EMAIL=you@example.com \
  --env TEST_PASSWORD=yourpassword \
  tests/load/creatorly-load-test.js
```

### With HTML report
```bash
k6 run --out json=results.json tests/load/creatorly-load-test.js
# Then view results.json or import into Grafana k6 Cloud
```

## Scenarios

| Scenario | VUs | Duration | Purpose |
|---|---|---|---|
| `smoke` | 2 | 30 s | Sanity check — catches obvious breakage |
| `average_load` | 0 → 50 | 5 min | Normal production traffic simulation |
| `spike` | 0 → 200 → 0 | 50 s | Sudden burst from social media share |
| `soak` | 20 | 10 min | Memory leak / DB connection exhaustion |

## Thresholds (all must pass for a green run)

| Metric | Threshold |
|---|---|
| `http_req_duration` p(95) | < 2000 ms |
| `errors` rate | < 2% |
| `profile_page_duration` p(50) | < 800 ms |
| `dashboard_duration` p(50) | < 1000 ms |

## Exec targets

| Function | What it tests |
|---|---|
| `publicProfile` | GET `/u/{username}` — unauthenticated storefront |
| `mixedTraffic` | Login → Dashboard → Analytics API → Links API |
| `apiEndpoints` | Health, public profile API, storefront — soak friendly |
| `rateLimitTest` | Confirms 429 responses under brute-force |
