#!/bin/bash

# Deploy to Vercel Script
echo "🚀 Starting Vercel Deployment Process"
echo "===================================="

# Check if logged in
echo "Checking Vercel authentication..."
if ! vercel whoami &>/dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "Please run: vercel login"
    echo "Then run this script again"
    exit 1
fi

echo "✅ Authenticated as: $(vercel whoami)"
echo ""

# Deploy the project
echo "📦 Deploying project to Vercel..."
echo "Please answer the following prompts:"
echo "- Set up and deploy? → Yes"
echo "- Which scope? → Select your account"
echo "- Link to existing project? → No (if first deployment)"
echo "- Project name? → customer-service-agent (or your choice)"
echo "- Directory? → ./"
echo "- Override settings? → No"
echo ""

vercel

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Initial deployment complete!"
echo ""

# Get project name for environment variables
echo "📝 Now let's set up environment variables..."
echo "Enter your Vercel project name (same as above):"
read PROJECT_NAME

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_type=${3:-"production preview development"}
    
    if [ ! -z "$var_value" ] && [ "$var_value" != "skip" ]; then
        echo "Setting $var_name..."
        echo "$var_value" | vercel env add $var_name $env_type --yes 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ $var_name set successfully"
        else
            echo "⚠️  $var_name might already exist or failed to set"
        fi
    fi
}

echo ""
echo "🔐 Setting up environment variables from .env files..."

# Read from .env and .env.local files
if [ -f .env ]; then
    # Parse essential variables from .env
    SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d '=' -f2-)
    OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" .env | cut -d '=' -f2-)
    WOOCOMMERCE_URL=$(grep "^WOOCOMMERCE_URL=" .env | cut -d '=' -f2-)
    WOOCOMMERCE_CONSUMER_KEY=$(grep "^WOOCOMMERCE_CONSUMER_KEY=" .env | cut -d '=' -f2-)
    WOOCOMMERCE_CONSUMER_SECRET=$(grep "^WOOCOMMERCE_CONSUMER_SECRET=" .env | cut -d '=' -f2-)
    ENCRYPTION_KEY=$(grep "^ENCRYPTION_KEY=" .env | cut -d '=' -f2-)
fi

if [ -f .env.local ]; then
    # Parse public variables from .env.local
    NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2-)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d '=' -f2-)
    
    # Override with .env.local values if they exist
    [ -z "$ENCRYPTION_KEY" ] && ENCRYPTION_KEY=$(grep "^ENCRYPTION_KEY=" .env.local | cut -d '=' -f2-)
fi

# Set the environment variables
echo ""
echo "Setting environment variables in Vercel..."

# Essential variables
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
add_env_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"

# Optional variables
add_env_var "WOOCOMMERCE_URL" "$WOOCOMMERCE_URL"
add_env_var "WOOCOMMERCE_CONSUMER_KEY" "$WOOCOMMERCE_CONSUMER_KEY"
add_env_var "WOOCOMMERCE_CONSUMER_SECRET" "$WOOCOMMERCE_CONSUMER_SECRET"

# Redis URL (optional)
echo ""
echo "Do you want to set REDIS_URL? (Enter URL or 'skip'):"
read REDIS_URL
add_env_var "REDIS_URL" "$REDIS_URL"

echo ""
echo "🎉 Environment variables configured!"
echo ""

# Deploy to production
echo "🚀 Deploying to production with environment variables..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ========================================="
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "✅ ========================================="
    echo ""
    echo "Your app should now be live at:"
    vercel ls | grep "customer-service" | head -1
    echo ""
    echo "📋 Next steps:"
    echo "1. Visit your Vercel dashboard to see the deployment"
    echo "2. Check the provided URL to access your app"
    echo "3. Test the chat widget at /chat"
    echo "4. Test the embed functionality at /embed"
    echo "5. Verify API health at /api/health"
else
    echo "❌ Production deployment failed"
    echo "Check the errors above and try again"
fi