#!/bin/bash

# AWS Amplify Environment Variables Sync Script
# This script reads your local .env file and updates environment variables in AWS Amplify Console

set -e  # Exit on any error

# Configuration - UPDATE THESE VALUES
AMPLIFY_APP_ID="your-amplify-app-id-here"
BRANCH_NAME="main"
ENV_FILE=".env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 AWS Amplify Environment Variables Sync${NC}"
echo "=========================================="

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE file not found!${NC}"
    echo "Please create a .env file with your environment variables."
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed!${NC}"
    echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI not authenticated!${NC}"
    echo "Please run: aws configure"
    exit 1
fi

# Check if AMPLIFY_APP_ID is set
if [ "$AMPLIFY_APP_ID" = "your-amplify-app-id-here" ]; then
    echo -e "${RED}❌ Error: Please update AMPLIFY_APP_ID in this script!${NC}"
    echo "You can find your App ID in the AWS Amplify Console URL or in the app settings."
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Read .env file and convert to JSON format for AWS CLI
echo "📖 Reading environment variables from $ENV_FILE..."

# Create temporary file for JSON
TEMP_JSON=$(mktemp)

# Convert .env to JSON format
echo "{" > "$TEMP_JSON"
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Skip if key is empty after trimming
    if [ -z "$key" ]; then
        continue
    fi
    
    # Add to JSON (escape quotes in values)
    value=$(echo "$value" | sed 's/"/\\"/g')
    echo "  \"$key\": \"$value\"," >> "$TEMP_JSON"
done < "$ENV_FILE"

# Remove trailing comma and close JSON
sed -i '' '$ s/,$//' "$TEMP_JSON"
echo "}" >> "$TEMP_JSON"

# Read the JSON content
ENV_JSON=$(cat "$TEMP_JSON")

# Clean up temp file
rm "$TEMP_JSON"

echo -e "${GREEN}✅ Environment variables parsed successfully${NC}"

# Update Amplify branch with environment variables
echo "🔄 Updating AWS Amplify environment variables..."

if aws amplify update-branch \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --environment-variables "$ENV_JSON"; then
    
    echo -e "${GREEN}✅ Environment variables updated successfully!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to AWS Amplify Console"
    echo "2. Navigate to your app: $AMPLIFY_APP_ID"
    echo "3. Go to Environment variables section"
    echo "4. Verify all variables are set correctly"
    echo "5. Trigger a new build if needed"
else
    echo -e "${RED}❌ Failed to update environment variables${NC}"
    echo "Please check:"
    echo "- Your AWS credentials have Amplify permissions"
    echo "- The App ID and Branch name are correct"
    echo "- You have the necessary IAM permissions"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Script completed successfully!${NC}" 