#!/usr/bin/env bash
# =========================================================================
# CalTrack AWS Deployment: Create ECR Repository
# =========================================================================

set -euo pipefail

# Load environment configuration if present
if [ -f ".env.aws" ]; then
  echo "Loading configurations from .env.aws..."
  # Export vars safely
  export $(grep -v '^#' .env.aws | xargs)
fi

AWS_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-us-east-1}}"
ECR_REPOSITORY="${ECR_REPOSITORY:-caltrack-api}"

echo "Configuring Amazon ECR repository..."
echo "  Repository Name: $ECR_REPOSITORY"
echo "  AWS Region:      $AWS_REGION"

# Verify AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "Error: AWS CLI is not installed or not in PATH."
  exit 1
fi

# Check if repository already exists
echo "Checking if repository '$ECR_REPOSITORY' exists..."
if aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "Repository '$ECR_REPOSITORY' already exists in region '$AWS_REGION'."
else
  echo "Repository '$ECR_REPOSITORY' not found. Creating..."
  aws ecr create-repository \
    --repository-name "$ECR_REPOSITORY" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256
  echo "ECR repository '$ECR_REPOSITORY' successfully created."
fi
