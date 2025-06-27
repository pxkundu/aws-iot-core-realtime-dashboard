#!/bin/bash

# Function to validate environment variables
validate_env_vars() {
    if [ -z "$AWS_BRANCH" ]; then
        echo "Error: AWS_BRANCH environment variable is not set"
        exit 1
    fi
    
    if [ -z "$ENV" ]; then
        echo "Warning: ENV environment variable is not set, defaulting to 'dev'"
        export ENV="dev"
    fi
    
    if [ -z "$AWS_APP_ID" ]; then
        echo "Error: AWS_APP_ID environment variable is not set"
        exit 1
    fi

    # Validate email configuration
    if [ -z "$ADMIN_EMAIL_ADDRESS" ]; then
        echo "Error: ADMIN_EMAIL_ADDRESS environment variable is not set"
        exit 1
    fi

    if [ -z "$SENDER_EMAIL_ADDRESS" ]; then
        echo "Error: SENDER_EMAIL_ADDRESS environment variable is not set"
        exit 1
    fi
}

# Function to clean branch name for AWS resource naming
clean_branch_name() {
    echo "$AWS_BRANCH" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
}

# Function to load environment variables from .env file
load_env_file() {
    if [ -f .env ]; then
        echo "Loading environment variables from .env file..."
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo "Warning: .env file not found"
    fi
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    
    # Load environment variables from .env file
    load_env_file
    
    # Validate environment variables
    validate_env_vars
    
    # Clean branch name for AWS resource naming
    export AWS_BRANCH=$(clean_branch_name)
    
    echo "Deployment environment:"
    echo "AWS_BRANCH: $AWS_BRANCH"
    echo "ENV: $ENV"
    echo "AWS_APP_ID: $AWS_APP_ID"
    echo "ADMIN_EMAIL_ADDRESS: $ADMIN_EMAIL_ADDRESS"
    echo "SENDER_EMAIL_ADDRESS: $SENDER_EMAIL_ADDRESS"
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build the application
    echo "Building the application..."
    npm run build
    
    # Deploy using Amplify
    echo "Deploying with Amplify..."
    npx ampx pipeline-deploy --branch "$AWS_BRANCH" --app-id "$AWS_APP_ID"
    
    echo "Deployment completed successfully!"
}

# Run the main function
main 