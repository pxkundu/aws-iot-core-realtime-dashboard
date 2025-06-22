# Amplify Gen 2 Backend

This directory contains the AWS Amplify Gen 2 backend configuration for the AWS IoT Core Realtime Dashboard.

## Structure

- `backend.ts` - Main backend configuration file
- `auth/resource.ts` - Cognito User Pool configuration
- `tsconfig.json` - TypeScript configuration for the backend

## Authentication Features

The Cognito User Pool is configured with:

- **Email-based authentication** (no username required)
- **Email verification** required
- **Password policy**: 8+ characters, numbers, uppercase, lowercase
- **Multi-factor authentication**: Disabled
- **Account recovery**: Email only

## Workflow

### 1. Development (Local)
```bash
npm run amplify:dev
```
Starts the Amplify sandbox for local development and testing.

### 2. Deployment
1. **Commit and push** your changes to your connected repository
2. **Amplify Console** will automatically detect the backend changes
3. **Deploy** the backend through Amplify Console
4. **Download** the `amplify_outputs.json` file from Amplify Console

### 3. Local Configuration
After deployment, download the `amplify_outputs.json` file and place it in the project root. The frontend will automatically use this configuration.

## Frontend Integration

The frontend is configured to automatically use the `amplify_outputs.json` file when available, or fall back to environment variables for development.

### Configuration Files
- `src/amplify-config.ts` - Amplify configuration with fallback
- `src/main.tsx` - Initializes Amplify on app start

### Environment Variables (Fallback)
If `amplify_outputs.json` is not available, the app will use these environment variables:

- `VITE_USER_POOL_ID` - Cognito User Pool ID
- `VITE_USER_POOL_CLIENT_ID` - Cognito User Pool Client ID
- `VITE_IDENTITY_POOL_ID` - Cognito Identity Pool ID

## Commands

- `npm run amplify:dev` - Start Amplify sandbox for development
- `npm run amplify:deploy` - Deploy backend (for CI/CD pipelines)
- `npm run amplify:generate` - Generate post-deployment artifacts

## Next Steps

1. **Push your changes** to trigger Amplify Console deployment
2. **Monitor the deployment** in Amplify Console
3. **Download** `amplify_outputs.json` after successful deployment
4. **Test authentication** in your application

## Troubleshooting

- **Sandbox issues**: Ensure AWS region is bootstrapped for CDK
- **Deployment failures**: Check Amplify Console build logs
- **Configuration issues**: Verify `amplify_outputs.json` is in the correct location 