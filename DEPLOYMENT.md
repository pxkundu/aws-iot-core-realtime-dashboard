# 🚀 Simplified Amplify Gen 2 Deployment Guide

## Overview

This project has been simplified to include **only AWS Amplify Gen 2 authentication**. All complex backend components (Lambda functions, DynamoDB, Location Service, etc.) have been removed for a clean, minimal setup.

## 📦 What's Included

### ✅ Current Components
- **Authentication**: AWS Cognito with email login + Admin group
- **Clean Dependencies**: Only essential Amplify packages
- **Optimized Build**: Fast, reliable deployment process

### ❌ Removed Components
- ~~Lambda Functions~~ (createTracker, updateCurrentPosition, etc.)
- ~~DynamoDB Tables~~ (TrackerData, UserData, etc.)
- ~~Amazon Location Service~~ (Maps, geofencing, etc.)
- ~~API Gateway~~ (REST endpoints)
- ~~Complex AWS SDK Dependencies~~

## 🏗️ Project Structure

```
aws-iot-core-realtime-dashboard/
├── amplify/
│   ├── auth/
│   │   └── resource.ts          # Email auth + Admin group
│   ├── backend.ts               # Simplified auth-only backend
│   ├── package.json             # Clean dependencies
│   └── tsconfig.json           # TypeScript config
├── amplify.yml                  # Simple deployment config
├── package.json                 # Root project config
├── .nvmrc                      # Node.js v20.10.0 (for local dev)
└── README.md                   # Original documentation
```

## 🚀 Deployment Instructions

### 1. Prerequisites
```bash
# Node.js 20+ (for local development)
nvm use

# AWS CLI configured
aws configure
```

### 2. Local Development
```bash
# Install dependencies
npm install

# Deploy to Amplify sandbox
npx ampx sandbox
```

### 3. Production Deployment

#### Option A: AWS Amplify Console
1. Connect your GitHub repository
2. Amplify will automatically use `amplify.yml`
3. Set environment variables if needed:
   - `AWS_BRANCH`: Your branch name
   - `AWS_APP_ID`: Your Amplify app ID

#### Option B: CLI Deployment
```bash
# Deploy to specific branch
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

## 🔧 Amplify.yml Configuration

Following **official Amplify Gen 2 documentation**, our `amplify.yml` is clean and simple:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci                              # Install dependencies
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
  cache:
    paths:
      - node_modules/**/*
frontend:
  phases:
    preBuild:
      commands:
        - npm ci                              # Install dependencies
    build:
      commands:
        - npm run build                       # Build frontend
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Why No NVM Commands?

**AWS Amplify build environments come with Node.js pre-installed**, so nvm commands are unnecessary:

✅ **Best Practice** (Current):
```yaml
backend:
  phases:
    build:
      commands:
        - npm ci
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

❌ **Overengineered** (Previous):
```yaml
backend:
  phases:
    preBuild:
      commands:
        - nvm use || nvm install 20.10.0 || echo "Using system Node.js"
        - node --version
        - npm --version
```

### .nvmrc Purpose

The `.nvmrc` file is **only for local development consistency**:
- **Local Development**: `nvm use` ensures all developers use the same Node.js version
- **Amplify Deployment**: AWS handles Node.js version automatically

## 📋 Authentication Features

### User Management
- **Email-based registration/login**
- **Password reset functionality**
- **Admin user group** for privileged access
- **Guest access** for unauthenticated users

### Generated Resources
- Cognito User Pool
- Cognito Identity Pool
- IAM roles (authenticated/unauthenticated)
- Amplify configuration outputs

## 🔧 Recent Fixes

### Node.js Version Issue (Fixed)
**Problem**: Build was failing with:
```
Version '20 ' not found - try `nvm ls-remote` to browse available versions.
```

**Root Cause**: `.nvmrc` file had trailing spaces causing nvm to look for invalid version.

**Solution**: 
1. ✅ Fixed `.nvmrc` to contain exactly `20.10.0` with no trailing spaces
2. ✅ **Simplified `amplify.yml`** following official Amplify Gen 2 documentation
3. ✅ Removed unnecessary nvm commands from deployment

## 🎯 Next Steps

### Adding Components Incrementally

1. **Add Data Layer**:
   ```bash
   npx ampx add data
   ```

2. **Add Storage**:
   ```bash
   npx ampx add storage
   ```

3. **Add Functions**:
   ```bash
   npx ampx add function
   ```

4. **Add Frontend**:
   ```bash
   # Create frontend directory
   mkdir frontend
   cd frontend
   npm create react-app . --template typescript
   ```

### Integration Examples

#### Frontend Auth Integration
```typescript
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import outputs from './amplify_outputs.json';

Amplify.configure(outputs);

// Sign in
await signIn({ username: 'user@example.com', password: 'password' });

// Get current user
const user = await getCurrentUser();

// Sign out
await signOut();
```

## 🔍 Troubleshooting

### Common Issues

1. **Node.js Version Mismatch (Local Development)**
   ```bash
   # Use exact version from .nvmrc
   nvm use
   ```

2. **Package Lock Conflicts**
   ```bash
   # Regenerate clean lockfile
   rm package-lock.json
   npm install
   ```

3. **TypeScript Errors**
   ```bash
   # Validate backend code
   cd amplify
   npx tsc --noEmit
   ```

4. **Deployment Failures**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Verify Amplify CLI
   npx ampx --version
   ```

5. **NVM Version Issues (Local Development Only)** 
   ```bash
   # Check .nvmrc content (should be exactly "20.10.0")
   cat .nvmrc
   
   # If there are trailing spaces, fix with:
   echo -n "20.10.0" > .nvmrc
   ```

### Build Environment Issues

#### Expected Build Flow (Simplified):
```
✅ Clone repository
✅ npm ci                        # AWS handles Node.js version
✅ npx ampx pipeline-deploy      # Deploy auth backend
```

#### Common Build Errors and Solutions:

**Error**: `npm ci failed`
**Solution**: Ensure `package-lock.json` is committed and up to date

**Error**: `pipeline-deploy failed`
**Solution**: Check AWS credentials and service role permissions

**Error**: `Module not found`
**Solution**: Verify all required dependencies are in `package.json`

## 📚 Resources

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Amplify Auth Guide](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [Official amplify.yml Examples](https://docs.aws.amazon.com/amplify/latest/userguide/yml-specification-syntax.html)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

## 🤝 Contributing

When adding new components:
1. Keep the auth-only foundation intact
2. Add components incrementally
3. Update this deployment guide
4. Follow official Amplify Gen 2 patterns

---

**Status**: ✅ Ready for deployment with simplified auth-only backend  
**Last Updated**: July 2025 - Simplified following official Amplify Gen 2 documentation 