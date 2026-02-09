# verify_production.ps1
# Creatorly Production Readiness Automation Script
# Use this script to run final smoke tests and verify environment integrity.

$baseUrl = "http://localhost:3000"
$errors = 0

Write-Host "`n🚀 STARTING PRODUCTION READINESS VERIFICATION`n" -ForegroundColor Cyan

# 1. Connectivity Check
Write-Host "[1/5] Checking connectivity to $baseUrl..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host " [PASS]" -ForegroundColor Green
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "Error: Could not reach $baseUrl. Is the server running?" -ForegroundColor Yellow
    $errors++
}

# 2. Security Headers Audit
Write-Host "[2/5] Auditing Security Headers..."
$securityHeaders = @("Strict-Transport-Security", "Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options")
foreach ($header in $securityHeaders) {
    if ($response.Headers.Keys -contains $header) {
        Write-Host "  - $header: FOUND" -ForegroundColor Green
    } else {
        Write-Host "  - $header: MISSING" -ForegroundColor Red
        $errors++
    }
}

# 3. API Smoke Test
Write-Host "[3/5] Checking API Health (/api/products)..." -NoNewline
try {
    # Expecting 401 or 200 depending on session
    $apiResp = Invoke-WebRequest -Uri "$baseUrl/api/products" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    if ($apiResp.StatusCode -eq 401 -or $apiResp.StatusCode -eq 200) {
        Write-Host " [PASS] (Status: $($apiResp.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] (Status: $($apiResp.StatusCode))" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host " [ERROR]" -ForegroundColor Red
    $errors++
}

# 4. Critical Route Resolution
Write-Host "[4/5] Verifying critical routes (Login, Dashboard)..."
$routes = @("/auth/login", "/dashboard", "/api/admin/analytics")
foreach ($route in $routes) {
    try {
        $r = Invoke-WebRequest -Uri "$baseUrl$route" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 302 -or $r.StatusCode -eq 303 -or $r.StatusCode -eq 307) {
            Write-Host "  - $route: OK" -ForegroundColor Green
        } else {
            Write-Host "  - $route: FAILED (Status: $($r.StatusCode))" -ForegroundColor Red
            $errors++
        }
    } catch {
        Write-Host "  - $route: UNREACHABLE" -ForegroundColor Red
        $errors++
    }
}

# 5. Environment Config Check
Write-Host "[5/5] Environmental requirements..."
if (Test-Path ".env.local") {
    Write-Host "  - .env.local: FOUND" -ForegroundColor Green
} else {
    Write-Host "  - .env.local: MISSING" -ForegroundColor Red
    $errors++
}

Write-Host "`n--- VERIFICATION SUMMARY ---"
if ($errors -eq 0) {
    Write-Host "READINESS STATUS: [READY TO LAUNCH] ✅" -ForegroundColor Green
} else {
    Write-Host "READINESS STATUS: [NOT READY] 🚨 ($errors Errors Found)" -ForegroundColor Red
}
Write-Host "----------------------------`n"
