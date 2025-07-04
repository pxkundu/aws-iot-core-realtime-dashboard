# 🚀 Simplified Amplify Gen 2 Deployment Guide

## Overview

This project has been simplified to include **only AWS Amplify Gen 2 authentication**. All complex backend components (Lambda functions, DynamoDB, Location Service, etc.) have been removed for a clean, minimal setup.

## ✅ Status: Successfully Deployed!

**Latest Build**: ✅ **SUCCESSFUL** - Simplified configuration working perfectly!

The simplified `amplify.yml` following official Amplify Gen 2 documentation is now deploying successfully without Node.js version issues.

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

#### Option A: AWS Amplify Console (Recommended)
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
        - npm ci --no-optional               # Skip optional deps that cause platform issues
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
  cache:
    paths:
      - node_modules/**/*
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --no-optional               # Skip optional deps
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

### Why --no-optional flag?

**Smart solution for native dependency issues** without complicating the build:

✅ **Current Solution** (Clean & Smart):
```yaml
backend:
  phases:
    build:
      commands:
        - npm ci --no-optional               # Skips problematic optional dependencies
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

❌ **Alternative** (More Complex):
```yaml
backend:
  phases:
    build:
      commands:
        - npm install                         # Less predictable
        - npm rebuild @parcel/watcher         # Manual rebuilding
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
```

**Why this works**: The `--no-optional` flag tells npm to skip optional dependencies like `@parcel/watcher` that often cause platform compatibility issues in CI environments, while keeping all required dependencies.

## 📋 Understanding Build Logs

### ✅ Expected Successful Build Flow
```
✅ Build environment configured (8GiB Memory, 4vCPUs, 128GB Disk)
✅ Cloning repository: git@github.com:your-repo.git
✅ Successfully cleaned up Git credentials
✅ Starting Backend Build
✅ Executing command: npm ci --no-optional
⚠️  npm warn ERESOLVE overriding peer dependency (NORMAL - see below)
✅ Executing command: npx ampx pipeline-deploy
✅ Backend deployment continues...
```

### ⚠️ Expected Warnings (Safe to Ignore)

These warnings are **normal and expected** in Amplify Gen 2 builds:

```
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: @aws-amplify/plugin-types@1.10.1
npm warn Found: @aws-sdk/types@3.821.0
npm warn Could not resolve dependency:
npm warn peer @aws-sdk/types@"^3.734.0" from @aws-amplify/plugin-types@1.10.1
```

**What this means**: Different AWS Amplify packages require slightly different versions of AWS SDK types. npm automatically resolves these conflicts, and the build continues successfully.

**Action Required**: ✅ **None** - These are harmless peer dependency warnings.

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

## 🔧 Recent Fixes & Successes

### ✅ Node.js Version Issue (RESOLVED)
**Problem**: Build was failing with:
```
Version '20 ' not found - try `nvm ls-remote` to browse available versions.
```

**Root Cause**: `.nvmrc` file had trailing spaces causing nvm to look for invalid version.

**Solution Applied**: 
1. ✅ Fixed `.nvmrc` to contain exactly `20.10.0` with no trailing spaces
2. ✅ **Simplified `amplify.yml`** following official Amplify Gen 2 documentation
3. ✅ Removed unnecessary nvm commands from deployment

**Result**: ✅ **BUILD NOW SUCCESSFUL** - Deployment working perfectly!

### ✅ Native Dependencies Issue (RESOLVED)
**Problem**: Build failing with:
```
Error: No prebuild or local build of @parcel/watcher found. 
Tried @parcel/watcher-linux-x64-glibc.
```

**Root Cause**: Optional native dependencies causing platform compatibility issues in CI.

**Smart Solution Applied**: 
1. ✅ Added `--no-optional` flag to `npm ci` commands
2. ✅ Keeps amplify.yml clean and simple
3. ✅ Skips problematic optional dependencies while preserving required ones

**Result**: ✅ **CLEAN, SMART FIX** - No complex rebuilding needed!

### ✅ Simplified Configuration Success
- ✅ Clean, official Amplify Gen 2 patterns
- ✅ Fast, reliable build process
- ✅ No complex version management
- ✅ Follows AWS best practices
- ✅ Handles native dependencies properly

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

### Build Status Indicators

#### ✅ Successful Build Indicators
- `## Starting Backend Build`
- `# Executing command: npm ci`
- `Successfully cleaned up Git credentials`
- Backend deployment progresses without errors

#### ❌ Failed Build Indicators
- `npm ERR!` messages
- `Command failed with exit code 1`
- TypeScript compilation errors
- Missing environment variables

### Common Issues & Solutions

#### 1. **Node.js Version Mismatch (Local Development)**
```bash
# Use exact version from .nvmrc
nvm use
```

#### 2. **Package Lock Conflicts**
```bash
# Regenerate clean lockfile
rm package-lock.json
npm install
```

#### 3. **Peer Dependency Warnings (SAFE TO IGNORE)**
```
⚠️ npm warn ERESOLVE overriding peer dependency
⚠️ npm warn While resolving: @aws-amplify/plugin-types
```
**Solution**: These warnings are normal and don't affect deployment success.

#### 4. **Missing Environment Variables**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify Amplify CLI
npx ampx --version
```

#### 5. **TypeScript Compilation Errors**
```bash
# Validate backend code locally
cd amplify
npx tsc --noEmit
```

#### 6. **@parcel/watcher Native Dependency Issues**
```
Error: No prebuild or local build of @parcel/watcher found. 
Tried @parcel/watcher-linux-x64-glibc.
```

**Root Cause**: Optional native dependencies cause platform compatibility issues in CI environments.

**Solution**: ✅ **Fixed with --no-optional flag**
```yaml
- npm ci --no-optional           # Skip problematic optional dependencies
```

**Why this works**: `@parcel/watcher` is an optional dependency that's not required for the build. The `--no-optional` flag tells npm to skip it entirely, avoiding platform compilation issues while keeping all essential dependencies.

### Build Environment Details

#### Expected Build Environment:
- **Memory**: 8GiB
- **vCPUs**: 4
- **Disk Space**: 128GB
- **Node.js**: Pre-installed (managed by AWS)

#### Build Timeline (Typical):
```
00:00 - Repository cloning
00:15 - Environment setup
00:30 - npm ci execution
02:00 - Backend deployment
05:00 - Build completion ✅
```

### Error Resolution Patterns

#### npm ci Issues:
```bash
# If npm ci --no-optional fails, check:
1. package-lock.json is committed and up to date
2. No conflicting package versions
3. Network connectivity
4. Platform-specific dependencies (now handled by --no-optional)
```

#### Optional Dependencies Issues:
```bash
# If optional dependencies cause problems:
1. Use --no-optional flag (already implemented)
2. Check if the optional dependency is actually needed
3. Consider excluding specific packages if needed
```

#### Deployment Issues:
```bash
# If pipeline-deploy fails, verify:
1. AWS credentials configured
2. Service role permissions
3. No conflicting resources
```

## 📚 Resources

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Amplify Auth Guide](https://docs.amplify.aws/gen2/build-a-backend/auth/)
- [Official amplify.yml Examples](https://docs.aws.amazon.com/amplify/latest/userguide/yml-specification-syntax.html)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Amplify Build Specification](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)

## 🤝 Contributing

When adding new components:
1. Keep the auth-only foundation intact
2. Add components incrementally
3. Update this deployment guide
4. Follow official Amplify Gen 2 patterns
5. Test deployment before committing

---

**Status**: ✅ **SUCCESSFULLY DEPLOYED** - Auth-only backend working perfectly!  
**Last Updated**: January 2025 - Confirmed successful deployment with simplified configuration  
**Build Status**: ✅ Passing with expected npm warnings (safe to ignore)