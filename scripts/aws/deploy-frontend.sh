#!/usr/bin/env bash
# =========================================================================
# CalTrack AWS Deployment: Deploy Frontend React to S3 + CloudFront
# =========================================================================

set -euo pipefail

# Load environment configuration if present
if [ -f ".env.aws" ]; then
  echo "Loading configurations from .env.aws..."
  export $(grep -v '^#' .env.aws | xargs)
fi

AWS_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-us-east-1}}"
S3_BUCKET_NAME="${S3_BUCKET_NAME:-}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
export VITE_API_URL="${VITE_API_URL:-/api}"

# Verify AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "Error: AWS CLI is not installed or not in PATH."
  exit 1
fi

# Verify required parameters
if [ -z "$S3_BUCKET_NAME" ]; then
  echo "Error: S3_BUCKET_NAME environment variable is not set."
  exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "Error: CLOUDFRONT_DISTRIBUTION_ID environment variable is not set."
  exit 1
fi

echo "Deploying frontend assets to AWS S3 & CloudFront..."
echo "  S3 Bucket:       s3://$S3_BUCKET_NAME"
echo "  Distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
echo "  Vite API URL:    $VITE_API_URL"
echo "  AWS Region:      $AWS_REGION"

# Build the React frontend production bundle
echo "Building React static assets..."
npm run build --workspace=@caltrack/web

# Sync compiled static files to the S3 bucket
echo "Uploading files to S3 bucket..."
aws s3 sync apps/web/dist/ "s3://$S3_BUCKET_NAME/" --delete --region "$AWS_REGION"

# Invalidate the CloudFront distribution cache
echo "Creating CloudFront invalidation for path '/*'..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --region "$AWS_REGION"

echo "Frontend deployment successfully completed."
