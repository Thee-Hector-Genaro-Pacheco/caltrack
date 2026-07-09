#!/usr/bin/env bash
# =========================================================================
# CalTrack AWS Deployment: Run Prisma Migrations
# =========================================================================

set -euo pipefail

# Load environment configuration if present
if [ -f ".env.aws" ]; then
  echo "Loading configurations from .env.aws..."
  export $(grep -v '^#' .env.aws | xargs)
fi

AWS_REGION="${AWS_DEFAULT_REGION:-${AWS_REGION:-us-east-1}}"
ECS_CLUSTER="${ECS_CLUSTER:-caltrack-prod-cluster}"
ECS_TASK_DEFINITION="${ECS_TASK_DEFINITION:-caltrack-api}"
RUN_MIGRATION_ON_ECS="${RUN_MIGRATION_ON_ECS:-false}"

# Check if direct DB connection is configured (e.g. via local environment or Bastion SSH tunnel)
if [ -n "${DATABASE_URL:-}" ] && [ "$RUN_MIGRATION_ON_ECS" != "true" ]; then
  echo "DATABASE_URL is active. Running migrations directly..."
  # Generate Prisma client if needed, then run migrate deploy
  npx prisma generate --schema=apps/api/prisma/schema.prisma
  npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
  echo "Database migrations applied successfully."
else
  echo "DATABASE_URL is not set or RUN_MIGRATION_ON_ECS=true."
  echo "Attempting secure VPC migration using temporary AWS ECS Fargate task..."

  # Verify AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed or not in PATH."
    exit 1
  fi

  # Check required variables for ECS run-task
  if [ -z "${SUBNETS:-}" ] || [ -z "${SECURITY_GROUPS:-}" ]; then
    echo "Error: To run migration via ECS task, you must set SUBNETS and SECURITY_GROUPS environment variables."
    echo "Example:"
    echo "  export SUBNETS=subnet-12345,subnet-67890"
    echo "  export SECURITY_GROUPS=sg-12345"
    echo "Alternatively, set DATABASE_URL (either directly or via SSH tunnel) to run migrate directly."
    exit 1
  fi

  echo "Triggering database migration task on ECS Fargate..."
  echo "  Cluster:         $ECS_CLUSTER"
  echo "  Task Definition: $ECS_TASK_DEFINITION"
  echo "  Subnets:         $SUBNETS"
  echo "  Security Groups: $SECURITY_GROUPS"

  # Run ECS Fargate task with npx prisma migrate deploy command override
  # This container needs access to Secrets Manager to resolve DATABASE_URL at startup
  TASK_ARN=$(aws ecs run-task \
    --cluster "$ECS_CLUSTER" \
    --task-definition "$ECS_TASK_DEFINITION" \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUPS],assignPublicIp=DISABLED}" \
    --overrides '{"containerOverrides": [{"name": "api", "command": ["npx", "prisma", "migrate", "deploy", "--schema=apps/api/prisma/schema.prisma"]}]}' \
    --region "$AWS_REGION" \
    --query "tasks[0].taskArn" \
    --output text)

  echo "Migration task successfully scheduled. Task ARN: $TASK_ARN"
  echo "Waiting for migration task to complete..."
  aws ecs wait tasks-stopped --cluster "$ECS_CLUSTER" --tasks "$TASK_ARN" --region "$AWS_REGION"

  # Describe task to verify exit code
  EXIT_CODE=$(aws ecs describe-tasks \
    --cluster "$ECS_CLUSTER" \
    --tasks "$TASK_ARN" \
    --region "$AWS_REGION" \
    --query "tasks[0].containers[0].exitCode" \
    --output text)

  if [ "$EXIT_CODE" -eq 0 ]; then
    echo "ECS migration task completed successfully."
  else
    echo "Error: ECS migration task failed with exit code $EXIT_CODE."
    exit 1
  fi
fi
