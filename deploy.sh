#!/bin/bash

# Creatorly - Vercel Deployment Script
# This script helps you deploy to Vercel with all necessary checks

echo "🚀 Creatorly Vercel Deployment"
echo "=============================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI found"
echo ""

# Check if we're logged in
echo "🔐 Checking Vercel authentication..."
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Vercel"
    echo "🔑 Please login:"
    vercel login
fi

echo "✅ Authenticated"
echo ""

# Run build check
echo "🔨 Running production build check..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful"
echo ""

# Ask for deployment type
echo "📋 Deployment Options:"
echo "  1) Preview deployment (test before production)"
echo "  2) Production deployment (live)"
echo ""
read -p "Select option (1 or 2): " option

case $option in
    1)
        echo ""
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo ""
        echo "⚠️  WARNING: This will deploy to PRODUCTION"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo "🚀 Deploying to production..."
            vercel --prod
        else
            echo "❌ Deployment cancelled"
            exit 0
        fi
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Check deployment logs in Vercel dashboard"
echo "  2. Test critical user flows"
echo "  3. Monitor error logs"
echo "  4. Verify environment variables are set"
echo ""
echo "📖 See VERCEL_DEPLOYMENT.md for detailed post-deployment checklist"
