# Creatorly - Vercel Deployment Script (PowerShell)
# This script helps you deploy to Vercel with all necessary checks

Write-Host "🚀 Creatorly Vercel Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found" -ForegroundColor Red
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Check if we're logged in
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Cyan
vercel whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel" -ForegroundColor Red
    Write-Host "🔑 Please login:" -ForegroundColor Yellow
    vercel login
}

Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

# Run build check
Write-Host "🔨 Running production build check..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Ask for deployment type
Write-Host "📋 Deployment Options:" -ForegroundColor Cyan
Write-Host "  1) Preview deployment (test before production)"
Write-Host "  2) Production deployment (live)"
Write-Host ""
$option = Read-Host "Select option (1 or 2)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying to preview..." -ForegroundColor Cyan
        vercel
    }
    "2" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will deploy to PRODUCTION" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
            vercel --prod
        }
        else {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Red
            exit 0
        }
    }
    default {
        Write-Host "❌ Invalid option" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check deployment logs in Vercel dashboard"
Write-Host "  2. Test critical user flows"
Write-Host "  3. Monitor error logs"
Write-Host "  4. Verify environment variables are set"
Write-Host ""
Write-Host "📖 See VERCEL_DEPLOYMENT.md for detailed post-deployment checklist" -ForegroundColor Yellow
