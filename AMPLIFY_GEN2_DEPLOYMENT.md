# Amplify Gen 2 Deployment Guide

This guide explains how to deploy the Cognito authentication backend using Amplify Gen 2.

## Prerequisites

- ✅ Amplify app already created and deployed for frontend
- ✅ Repository connected to Amplify Console
- ✅ AWS credentials configured

## Deployment Steps

### 1. Local Development (Optional)

Test the backend locally before deployment:

```bash
npm run amplify:dev
```

This starts the Amplify sandbox for local testing.

### 2. Deploy Backend

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add Cognito authentication with Amplify Gen 2"
   git push origin main
   ```

2. **Amplify Console** will automatically:
   - Detect the backend changes in the `amplify/` directory
   - Build and deploy the Cognito User Pool
   - Generate the `amplify_outputs.json` file

3. **Monitor deployment** in Amplify Console:
   - Go to your Amplify app in AWS Console
   - Check the "Backend environments" tab
   - Monitor the deployment progress

### 3. Download Configuration

After successful deployment:

1. **Go to Amplify Console** → Your App → Backend environments
2. **Download** the `amplify_outputs.json` file
3. **Place it** in your project root directory
4. **Commit** the file to your repository

### 4. Test Authentication

1. **Start your app**:
   ```bash
   npm run dev
   ```

2. **Test the sign-in modal**:
   - Try signing up with a new email
   - Verify email (check console for verification code)
   - Sign in with verified credentials

## File Structure

```
your-project/
├── amplify/
│   ├── backend.ts              # Main backend config
│   ├── auth/resource.ts        # Cognito configuration
│   └── tsconfig.json          # TypeScript config
├── src/
│   ├── amplify-config.ts      # Frontend Amplify config
│   └── main.tsx              # App entry point
└── amplify_outputs.json      # Generated config (after deployment)
```

## Configuration

The frontend automatically uses the `amplify_outputs.json` file when available, or falls back to environment variables for development.

### Environment Variables (Fallback)

If `amplify_outputs.json` is not available, add these to your `.env` file:

```env
VITE_USER_POOL_ID=eu-west-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_IDENTITY_POOL_ID=eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Troubleshooting

### Deployment Issues

- **Check Amplify Console logs** for deployment errors
- **Verify AWS credentials** are properly configured
- **Ensure region is bootstrapped** for CDK deployment

### Local Development Issues

- **Region not bootstrapped**: Run `npx cdk bootstrap aws://ACCOUNT/REGION`
- **Authentication errors**: Check AWS profile configuration
- **Module not found**: Ensure all dependencies are installed

### Frontend Issues

- **Configuration not found**: Verify `amplify_outputs.json` is in project root
- **Authentication not working**: Check browser console for errors
- **Environment variables**: Verify fallback variables are set correctly

## Next Steps

After successful deployment:

1. **Test user registration** and email verification
2. **Test user sign-in** with verified accounts
3. **Integrate authentication** with your existing features
4. **Add user-specific functionality** as needed

## Support

- **Amplify Gen 2 Docs**: https://docs.amplify.aws/react/start/quickstart/
- **Cognito Documentation**: https://docs.aws.amazon.com/cognito/
- **Amplify Console**: Check your app's backend environments 