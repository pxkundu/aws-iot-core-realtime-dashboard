#!/usr/bin/env node

/**
 * AWS Amplify Environment Variables Sync Script (Node.js)
 * This script reads your local .env file and updates environment variables in AWS Amplify Console
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration - UPDATE THESE VALUES
const AMPLIFY_APP_ID = 'your-amplify-app-id-here';
const BRANCH_NAME = 'main';
const ENV_FILE = '.env';

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
    log('🚀 AWS Amplify Environment Variables Sync', 'yellow');
    log('==========================================');

    // Check if .env file exists
    if (!fs.existsSync(ENV_FILE)) {
        log(`❌ Error: ${ENV_FILE} file not found!`, 'red');
        log('Please create a .env file with your environment variables.');
        process.exit(1);
    }

    // Check if AWS CLI is installed
    try {
        execSync('aws --version', { stdio: 'ignore' });
    } catch (error) {
        log('❌ Error: AWS CLI is not installed!', 'red');
        log('Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html');
        process.exit(1);
    }

    // Check if user is authenticated
    try {
        execSync('aws sts get-caller-identity', { stdio: 'ignore' });
    } catch (error) {
        log('❌ Error: AWS CLI not authenticated!', 'red');
        log('Please run: aws configure');
        process.exit(1);
    }

    // Check if AMPLIFY_APP_ID is set
    if (AMPLIFY_APP_ID === 'your-amplify-app-id-here') {
        log('❌ Error: Please update AMPLIFY_APP_ID in this script!', 'red');
        log('You can find your App ID in the AWS Amplify Console URL or in the app settings.');
        process.exit(1);
    }

    log('✅ Prerequisites check passed', 'green');
}

function parseEnvFile() {
    log(`📖 Reading environment variables from ${ENV_FILE}...`);

    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || line.trim() === '') {
            return;
        }

        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
            const key = line.substring(0, equalIndex).trim();
            const value = line.substring(equalIndex + 1).trim();
            
            if (key) {
                envVars[key] = value;
            }
        }
    });

    log('✅ Environment variables parsed successfully', 'green');
    return envVars;
}

function updateAmplifyEnvVars(envVars) {
    log('🔄 Updating AWS Amplify environment variables...');

    const envJson = JSON.stringify(envVars);

    try {
        execSync(`aws amplify update-branch --app-id "${AMPLIFY_APP_ID}" --branch-name "${BRANCH_NAME}" --environment-variables '${envJson}'`, {
            stdio: 'inherit'
        });

        log('✅ Environment variables updated successfully!', 'green');
        log('');
        log('📋 Next steps:');
        log('1. Go to AWS Amplify Console');
        log(`2. Navigate to your app: ${AMPLIFY_APP_ID}`);
        log('3. Go to Environment variables section');
        log('4. Verify all variables are set correctly');
        log('5. Trigger a new build if needed');

    } catch (error) {
        log('❌ Failed to update environment variables', 'red');
        log('Please check:');
        log('- Your AWS credentials have Amplify permissions');
        log('- The App ID and Branch name are correct');
        log('- You have the necessary IAM permissions');
        process.exit(1);
    }
}

function main() {
    try {
        checkPrerequisites();
        const envVars = parseEnvFile();
        updateAmplifyEnvVars(envVars);
        log('');
        log('🎉 Script completed successfully!', 'green');
    } catch (error) {
        log(`❌ Unexpected error: ${error.message}`, 'red');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { checkPrerequisites, parseEnvFile, updateAmplifyEnvVars }; 