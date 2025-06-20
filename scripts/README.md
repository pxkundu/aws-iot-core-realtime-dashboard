# AWS Amplify Environment Variables Sync Scripts

This directory contains scripts to automatically sync your local `.env` file with AWS Amplify Console environment variables.

## Available Scripts

### 1. Bash Script (`set-amplify-env.sh`)
- **Platform**: Unix/Linux/macOS
- **Usage**: `./scripts/set-amplify-env.sh`

### 2. Node.js Script (`set-amplify-env.js`)
- **Platform**: Cross-platform (requires Node.js)
- **Usage**: `node scripts/set-amplify-env.js`

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
   sudo installer -pkg AWSCLIV2.pkg -target /
   
   # Configure AWS CLI
   aws configure
   ```

2. **AWS Amplify App created**
   - Create your app in AWS Amplify Console
   - Note down your App ID (found in the URL or app settings)

3. **Local `.env` file**
   - Create a `.env` file in your project root
   - Add all required environment variables

## Setup Instructions

### Step 1: Update Script Configuration

Edit either script and update these values:

**For Bash script (`set-amplify-env.sh`):**
```bash
AMPLIFY_APP_ID="your-actual-amplify-app-id"
BRANCH_NAME="main"  # or your branch name
ENV_FILE=".env"
```

**For Node.js script (`set-amplify-env.js`):**
```javascript
const AMPLIFY_APP_ID = 'your-actual-amplify-app-id';
const BRANCH_NAME = 'main';  // or your branch name
const ENV_FILE = '.env';
```

### Step 2: Create Your `.env` File

Create a `.env` file in your project root with your environment variables:

```env
VITE_MAP_NAME=your-map-name
VITE_REGION=eu-west-1
VITE_IDENTITY_POOL_ID=eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_USER_POOL_ID=eu-west-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_IOT_ENDPOINT=xxxxxxxxxxxxx-ats.iot.eu-west-1.amazonaws.com
VITE_TRACKER_NAME=your-tracker-name
VITE_GEOFENCE_COLLECTION=your-geofence-collection
VITE_PINPOINT_APP_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Run the Script

**Using Bash script:**
```bash
./scripts/set-amplify-env.sh
```

**Using Node.js script:**
```bash
node scripts/set-amplify-env.js
```

## What the Script Does

1. **Validates prerequisites:**
   - Checks if `.env` file exists
   - Verifies AWS CLI is installed
   - Confirms AWS authentication
   - Validates App ID configuration

2. **Parses environment variables:**
   - Reads your `.env` file
   - Skips comments and empty lines
   - Converts to JSON format for AWS CLI

3. **Updates Amplify:**
   - Calls AWS CLI to update branch environment variables
   - Provides success/error feedback
   - Gives next steps instructions

## Security Notes

⚠️ **Important Security Considerations:**

- **Never commit your `.env` file** to version control
- **Never commit the scripts with real App IDs** to version control
- **Use IAM roles with minimal permissions** for AWS CLI
- **Consider using AWS Secrets Manager** for sensitive values

## Troubleshooting

### Common Issues

1. **"AWS CLI not authenticated"**
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, Region
   ```

2. **"App ID not found"**
   - Check your Amplify Console URL: `https://console.aws.amazon.com/amplify/home?region=us-east-1#/xxxxxxxxx`
   - The App ID is the long string after the `#/`

3. **"Permission denied"**
   - Ensure your AWS user/role has Amplify permissions
   - Required permissions: `amplify:UpdateBranch`

4. **"Branch not found"**
   - Verify the branch name exists in your Amplify app
   - Default branch is usually `main` or `master`

### IAM Permissions Required

Your AWS user/role needs these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "amplify:UpdateBranch",
                "amplify:GetBranch"
            ],
            "Resource": "arn:aws:amplify:*:*:apps/*/branches/*"
        }
    ]
}
```

## Integration with CI/CD

You can integrate these scripts into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Sync Amplify Environment Variables
  run: |
    chmod +x scripts/set-amplify-env.sh
    ./scripts/set-amplify-env.sh
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: us-east-1
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your AWS credentials and permissions
3. Ensure your Amplify app and branch exist
4. Check the AWS CLI documentation for more details 