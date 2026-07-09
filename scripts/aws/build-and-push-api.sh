#!/usr/bin/env bash
# =========================================================================
# CalTrack AWS Deployment: Build and Push Backend API Container
# =========================================================================

set -euo pipefail

# Load environment configuration if present
if [ -f ".env.aws" ]; then
  echo "Loading configurations from .env.aws..."
  export $(grep -v '^#' .env.aws | xargs)
fi

AWS_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-us-east-1}}"
ECR_REPOSITORY="${ECR_REPOSITORY:-caltrack-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Verify AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "Error: AWS CLI is not installed or not in PATH."
  exit 1
fi

# Verify Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed or the docker daemon is not running."
  exit 1
fi

# Fetch AWS Account ID if not set
if [ -z "${AWS_ACCOUNT_ID:-}" ]; then
  echo "AWS_ACCOUNT_ID is not set. Attempting to fetch via STS..."
  if ! AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null); then
    echo "Error: Failed to retrieve AWS Account ID. Please set AWS_ACCOUNT_ID or configure your AWS credentials."
    exit 1
  fi
  echo "Retrieved AWS Account ID: $AWS_ACCOUNT_ID"
fi

ECR_REGISTRY="${ECR_REGISTRY:-$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com}"

echo "Preparing container build for backend API..."
echo "  ECR Registry:   $ECR_REGISTRY"
echo "  ECR Repository: $ECR_REPOSITORY"
echo "  Image Tag:      $IMAGE_TAG"
echo "  AWS Region:     $AWS_REGION"

# Build the docker container from the root directory context
echo "Building Docker image..."
docker build -t "$ECR_REPOSITORY:$IMAGE_TAG" -t "$ECR_REPOSITORY:latest" -f apps/api/Dockerfile .

# Log in to ECR
echo "Logging in to Amazon ECR registry..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Tag and push
echo "Tagging Docker images..."
docker tag "$ECR_REPOSITORY:$IMAGE_TAG" "$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
docker tag "$ECR_REPOSITORY:latest" "$ECR_REGISTRY/$ECR_REPOSITORY:latest"

echo "Pushing Docker images to Amazon ECR..."
docker push "$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
docker push "$ECR_REGISTRY/$ECR_REPOSITORY:latest"

echo "Container build and push successfully completed."
