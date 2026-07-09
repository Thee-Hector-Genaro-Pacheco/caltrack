#!/usr/bin/env bash
# =========================================================================
# CalTrack AWS Deployment: Verify Active Live Services
# =========================================================================

set -euo pipefail

# Load environment configuration if present
if [ -f ".env.aws" ]; then
  echo "Loading configurations from .env.aws..."
  export $(grep -v '^#' .env.aws | xargs)
fi

FRONTEND_URL="${FRONTEND_URL:-}"
API_URL="${API_URL:-}"

# Check required parameters
if [ -z "$FRONTEND_URL" ]; then
  echo "Error: FRONTEND_URL environment variable is not set."
  echo "Please set FRONTEND_URL (e.g. export FRONTEND_URL=https://caltrack.yourdomain.com)."
  exit 1
fi

# Default API URL to FRONTEND_URL/api if not specified
if [ -z "$API_URL" ]; then
  # Strip trailing slash if present
  FRONTEND_URL_STRIPPED="${FRONTEND_URL%/}"
  API_URL="${FRONTEND_URL_STRIPPED}/api"
fi

echo "Verifying live CalTrack deployment..."
echo "  Frontend URL: $FRONTEND_URL"
echo "  API URL:      $API_URL"

FAILED=0

# 1. Verify Frontend SPA Index Page
echo "--------------------------------------------------"
echo "Checking frontend web application..."
FRONTEND_HTML=$(curl -sL --max-time 10 "$FRONTEND_URL") || {
  echo "❌ Error: Failed to connect to frontend URL: $FRONTEND_URL"
  FAILED=1
}

if [ "$FAILED" -eq 0 ]; then
  if echo "$FRONTEND_HTML" | grep -q 'id="root"'; then
    echo "✅ Frontend is reachable and serves the React SPA index page."
  else
    echo "❌ Error: Frontend is reachable but does not contain React SPA root div (id=\"root\")."
    FAILED=1
  fi
fi

# 2. Verify Backend REST API Health
echo "--------------------------------------------------"
echo "Checking backend REST API health endpoint..."
API_HEALTH_URL="${API_URL}/health"
API_RESPONSE=$(curl -sL --max-time 10 "$API_HEALTH_URL") || {
  echo "❌ Error: Failed to connect to backend health endpoint: $API_HEALTH_URL"
  FAILED=1
}

if [ "$FAILED" -eq 0 ]; then
  if echo "$API_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ Backend API is healthy."
    echo "API Details: $API_RESPONSE"
  else
    echo "❌ Error: Backend API returned unhealthy or unexpected response: $API_RESPONSE"
    FAILED=1
  fi
fi

echo "--------------------------------------------------"
if [ "$FAILED" -eq 0 ]; then
  echo "🎉 All services verified and running successfully!"
  exit 0
else
  echo "❌ Service verification failed."
  exit 1
fi
