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
├── amplify.yml                  # Optimized deployment config
├── package.json                 # Root project config
├── .nvmrc                      # Node.js v20
└── README.md                   # Original documentation
```

## 🚀 Deployment Instructions

### 1. Prerequisites
```bash
# Node.js 20+ (uses .nvmrc)
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

### Backend Phase
```yaml
backend:
  phases:
    preBuild:
      - nvm use || nvm install    # Use Node.js from .nvmrc
      - npm --version             # Verify versions
    build:
      - npm ci --no-audit         # Install clean dependencies
      - cd amplify && npx tsc --noEmit  # Validate TypeScript
      - npx ampx pipeline-deploy   # Deploy auth backend
```

### Frontend Phase (Future-Ready)
```yaml
frontend:
  phases:
    preBuild:
      - test -f package.json && npm ci || echo "No frontend found"
    build:
      - test -f package.json && npm run build || echo "No build script"
```

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

1. **Node.js Version Mismatch**
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

## 📚 Resources

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Amplify Auth Guide](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

## 🤝 Contributing

When adding new components:
1. Keep the auth-only foundation intact
2. Add components incrementally
3. Update this deployment guide
4. Test deployment with `amplify.yml`

---

**Status**: ✅ Ready for deployment with simplified auth-only backend 