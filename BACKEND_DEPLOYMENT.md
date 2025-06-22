# Backend Deployment Guide

Since Amplify Console doesn't have the required CDK bootstrap permissions for Amplify Gen 2, we need to deploy the backend manually.

## Prerequisites

- AWS CLI configured with appropriate permissions
- CDK bootstrap completed in your AWS region

## Step 1: Bootstrap CDK (One-time setup)

```bash
# Set your AWS profile
export AWS_PROFILE=866934333672_AWSAdministratorAccess

# Bootstrap CDK in your region
npx cdk bootstrap aws://866934333672/eu-west-1
```

## Step 2: Deploy Backend

```bash
# Deploy the Amplify Gen 2 backend
npx ampx deploy
```

## Step 3: Get Configuration Values

After successful deployment, you'll get the Cognito configuration. Add these to your `.env` file:

```env
VITE_USER_POOL_ID=eu-west-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_IDENTITY_POOL_ID=eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Step 4: Update Amplify Console Environment Variables

1. Go to your Amplify Console app
2. Navigate to Environment Variables
3. Add the Cognito configuration values from Step 3

## Alternative: Use Amplify CLI (Gen 1)

If you prefer to use the traditional Amplify CLI approach:

```bash
# Initialize Amplify (if not already done)
amplify init

# Add auth
amplify add auth

# Push changes
amplify push
```

## Troubleshooting

### CDK Bootstrap Issues
- Ensure you have the correct AWS credentials
- Make sure you're in the right region
- Check that your IAM user/role has CDK permissions

### Permission Issues
- The Amplify Console build role doesn't have CDK bootstrap permissions
- This is why we need to deploy the backend manually
- Frontend deployment will continue to work through Amplify Console

## Current Setup

- **Frontend**: Deployed automatically through Amplify Console
- **Backend**: Deployed manually using CDK/Amplify CLI
- **Configuration**: Environment variables in Amplify Console 