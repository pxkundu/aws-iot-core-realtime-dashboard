# AWS IoT Core Realtime Dashboard

A React-based web application demonstrating Amazon Location Service features integrated with AWS IoT Core for real-time tracking and geofencing. This project showcases location-based services, IoT device tracking, geofencing, and route planning capabilities.

## Features

- 🗺️ **Interactive Maps** - Amazon Location Service integration with multiple map styles
- 📍 **Real-time IoT Tracking** - Live device location tracking via AWS IoT Core
- 🚧 **Geofencing** - Create and monitor geofences with real-time alerts
- 🛣️ **Route Planning** - Calculate optimal routes between locations
- 🔍 **Place Search** - Search for points of interest and addresses
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🌐 **Multi-language Support** - Internationalization with i18next
- 📊 **Analytics** - Pinpoint analytics integration for user behavior tracking

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **AWS Account** with appropriate permissions
- **AWS CLI** configured with credentials

## Quick Start - Local Development

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/pxkundu/aws-iot-core-realtime-dashboard
cd aws-iot-core-realtime-dashboard

# Install dependencies
npm install --legacy-peer-deps
```

### Step 2: AWS Resources Setup

#### Option A: Use Existing AWS Resources (Recommended)
If you already have AWS resources deployed, skip to Step 3.

#### Option B: Deploy AWS Resources
1. **Deploy CloudFormation Stack** (eu-west-1 region recommended)
   ```bash
   # Deploy the stack using AWS CLI
   aws cloudformation deploy \
     --template-file extra/cloudformation/security-hardened-unauth-resources.yaml \
     --stack-name aws-iot-dashboard-stack \
     --capabilities CAPABILITY_NAMED_IAM \
     --region eu-west-1
   ```

2. **Get Stack Outputs**
   ```bash
   # Retrieve stack outputs
   aws cloudformation describe-stacks \
     --stack-name aws-iot-dashboard-stack \
     --region eu-west-1 \
     --query 'Stacks[0].Outputs'
   ```

### Step 3: Environment Configuration

Create a `.env` file in the project root:

```env
# AWS Location Service Configuration
VITE_MAP_NAME=your-map-name
VITE_REGION=eu-west-1

# AWS Cognito Configuration
VITE_IDENTITY_POOL_ID=eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_USER_POOL_ID=eu-west-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS IoT Core Configuration
VITE_IOT_ENDPOINT=xxxxxxxxxxxxx-ats.iot.eu-west-1.amazonaws.com
VITE_TRACKER_NAME=your-tracker-name

# AWS Location Service - Geofencing
VITE_GEOFENCE_COLLECTION=your-geofence-collection

# AWS Pinpoint Analytics
VITE_PINPOINT_APP_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Natural Language Search
VITE_NL_BASE_URL=https://your-nl-endpoint.com
VITE_NL_API_KEY=your-nl-api-key
```

### Step 4: Run the Application

```bash
# Start development server
npm run dev
```

The application will be available at **http://localhost:3000**

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_MAP_NAME` | Amazon Location Service map name | `explore.map` |
| `VITE_REGION` | AWS region | `eu-west-1` |
| `VITE_IDENTITY_POOL_ID` | Cognito Identity Pool ID | `eu-west-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `VITE_USER_POOL_ID` | Cognito User Pool ID | `eu-west-1_xxxxxxxxx` |
| `VITE_USER_POOL_CLIENT_ID` | Cognito User Pool Client ID | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `VITE_IOT_ENDPOINT` | AWS IoT Core endpoint | `xxxxxxxxxxxxx-ats.iot.eu-west-1.amazonaws.com` |
| `VITE_TRACKER_NAME` | Location tracker name | `my-tracker` |
| `VITE_GEOFENCE_COLLECTION` | Geofence collection name | `my-geofences` |
| `VITE_PINPOINT_APP_ID` | Pinpoint application ID | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_NL_BASE_URL` | Natural Language search endpoint | `https://your-nl-endpoint.com` |
| `VITE_NL_API_KEY` | Natural Language API key | `your-nl-api-key` |

## AWS Services Used

### Core Services
- **Amazon Location Service** - Maps, geocoding, routing, geofencing
- **AWS IoT Core** - Real-time device tracking and messaging
- **Amazon Cognito** - User authentication and identity management
- **Amazon Pinpoint** - Analytics and user engagement tracking

### Supporting Services
- **AWS Lambda** - Serverless compute for backend functions
- **Amazon DynamoDB** - NoSQL database for data storage
- **Amazon S3** - Static asset hosting
- **AWS CloudFormation** - Infrastructure as code

## Solutions Architecture

### Overview
The AWS IoT Core Realtime Dashboard is built on a serverless architecture that leverages multiple AWS services to provide real-time location tracking, geofencing, and analytics capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS IoT Core Realtime Dashboard                   │
│                              Solutions Architecture                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AWS Cognito   │    │  Amazon S3      │
│   (React/Vite)  │◄──►│   Authentication │    │  Static Hosting │
│   localhost:3000│    │   & Identity    │    │  (Amplify)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Backend Services                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Amazon Location │    │   AWS IoT Core  │    │ Amazon Pinpoint │
│    Service      │    │                 │    │   Analytics     │
│                 │    │                 │    │                 │
│ • Maps          │    │ • Device Mgmt   │    │ • User Events   │
│ • Geocoding     │    │ • MQTT Messaging│    │ • Engagement    │
│ • Routing       │    │ • Rules Engine  │    │ • Campaigns     │
│ • Geofencing    │    │ • Device Shadow │    │ • Analytics     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS Lambda    │    │ Amazon DynamoDB │    │ AWS CloudWatch  │
│  Serverless     │    │   NoSQL DB      │    │   Monitoring    │
│   Functions     │    │                 │    │                 │
│                 │    │ • Device Data   │    │ • Logs          │
│ • Data Processing│   │ • User Sessions │    │ • Metrics       │
│ • Geofence Logic│   │ • Analytics Data │    │ • Alerts        │
│ • API Endpoints │    │ • Configuration │    │ • Dashboards    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Interactions

#### 1. **Frontend Application**
- **Technology**: React 18 + Vite + TypeScript
- **Hosting**: AWS Amplify (static hosting) or localhost:3000 (development)
- **Authentication**: AWS Cognito Identity Pool for guest access
- **Real-time Updates**: WebSocket connections to AWS IoT Core

#### 2. **Authentication & Authorization**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │───►│  Cognito User   │───►│ Cognito Identity│
│                 │    │     Pool        │    │     Pool        │
│ • Guest Access  │    │ • User Mgmt     │    │ • Temp Creds    │
│ • User Sessions │    │ • Auth Policies │    │ • IAM Roles     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Flow:**
1. User accesses the application
2. Cognito Identity Pool provides temporary AWS credentials
3. Frontend uses credentials to access AWS services
4. IAM roles control access permissions

#### 3. **Location Services Integration**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───►│ Amazon Location │───►│   Map Tiles     │
│                 │    │    Service      │    │   & Data        │
│ • Map Display   │    │                 │    │                 │
│ • Search        │    │ • Map Rendering │    │ • Vector Tiles  │
│ • Routing       │    │ • Geocoding     │    │ • POI Data      │
│ • Geofencing    │    │ • Route Calc    │    │ • Traffic Data  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Services Used:**
- **Maps**: Vector tile rendering with multiple styles
- **Places**: Point of interest search and geocoding
- **Routes**: Turn-by-turn navigation and route optimization
- **Geofencing**: Real-time geofence monitoring and alerts

#### 4. **IoT Device Tracking**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │───►│  AWS IoT Core   │───►│ Location Tracker│
│                 │    │                 │    │                 │
│ • GPS Sensors   │    │ • MQTT Protocol │    │ • Device Pos    │
│ • Mobile Apps   │    │ • Message Broker│    │ • History       │
│ • Web Clients   │    │ • Rules Engine  │    │ • Geofencing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   WebSocket     │◄──►│   Real-time     │
│   Dashboard     │    │   Connection    │    │   Updates       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Flow:**
1. IoT devices publish location data via MQTT
2. AWS IoT Core processes and routes messages
3. Location Tracker stores device positions
4. Frontend receives real-time updates via WebSocket
5. Dashboard displays live device locations

#### 5. **Geofencing System**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Geofence      │───►│ Location Tracker│───►│   Lambda        │
│   Collection    │    │                 │    │   Functions     │
│                 │    │ • Device Pos    │    │                 │
│ • Polygon Def   │    │ • Geofence Check│    │ • Alert Logic   │
│ • Radius Def    │    │ • Event Trigger │    │ • Notification  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   DynamoDB      │◄──►│   Pinpoint      │
│   Alerts        │    │   Events        │    │   Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Flow:**
1. User creates geofences in the frontend
2. Location Tracker monitors device positions
3. When device enters/exits geofence, event is triggered
4. Lambda function processes the event
5. Alert is sent to frontend and stored in DynamoDB
6. Optional: Pinpoint sends push notifications

#### 6. **Analytics & Monitoring**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───►│ Amazon Pinpoint │───►│   Analytics     │
│   User Actions  │    │                 │    │   Dashboard     │
│                 │    │ • Event Tracking│    │                 │
│ • Page Views    │    │ • User Segments │    │ • User Behavior │
│ • Map Interactions│  │ • Campaign Mgmt │    │ • Engagement    │
│ • Feature Usage │    │ • Push Notifications│ │ • Conversion    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudWatch    │◄──►│   DynamoDB      │◄──►│   Lambda        │
│   Monitoring    │    │   Analytics     │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Flow:**
1. Frontend tracks user interactions and events
2. Events are sent to Amazon Pinpoint
3. Pinpoint processes and segments user data
4. Analytics data is stored in DynamoDB
5. CloudWatch monitors system health and performance
6. Lambda functions process analytics data

### Data Flow Architecture

#### **Real-time Data Flow**
```
IoT Device → MQTT → AWS IoT Core → Location Tracker → WebSocket → Frontend
    ↓           ↓           ↓              ↓              ↓
  GPS Data   Message    Rules Engine   Position     Real-time
  Sensors    Broker     Processing     Storage      Updates
```

#### **User Interaction Flow**
```
User Action → Frontend → AWS Services → Response → UI Update
    ↓           ↓            ↓            ↓          ↓
  Click/Input  API Call   Location/    Data      React
  Search       Cognito    IoT/Pinpoint Return    Re-render
```

#### **Analytics Flow**
```
User Event → Frontend → Pinpoint → Analytics → Dashboard
    ↓           ↓          ↓          ↓           ↓
  Interaction  Tracking   Processing  Storage    Reporting
  Map Usage    SDK        Segments    DynamoDB   CloudWatch
```

### Security Architecture

#### **Authentication Layers**
1. **Cognito Identity Pool**: Provides temporary AWS credentials
2. **IAM Roles**: Controls access to AWS services
3. **API Keys**: Secures Location Service access
4. **WebSocket Authentication**: Secure real-time connections

#### **Data Protection**
- **Encryption at Rest**: All data encrypted in DynamoDB and S3
- **Encryption in Transit**: TLS/SSL for all communications
- **Access Control**: IAM policies and Cognito user pools
- **API Security**: API Gateway with authentication

### Scalability & Performance

#### **Auto-scaling Components**
- **AWS Lambda**: Automatically scales based on demand
- **DynamoDB**: Auto-scaling read/write capacity
- **IoT Core**: Handles millions of concurrent connections
- **Amplify**: Global CDN for static assets

#### **Performance Optimizations**
- **CDN**: CloudFront for global content delivery
- **Caching**: DynamoDB DAX for database acceleration
- **Connection Pooling**: WebSocket connection management
- **Lazy Loading**: React components and map tiles

### Deployment Architecture

#### **Development Environment**
```
Local Development → localhost:3000 → AWS Services
     ↓                    ↓              ↓
  React Dev Server    Vite HMR      Cloud Resources
  Hot Reload         Fast Refresh   (Shared)
```

#### **Production Environment**
```
GitHub → AWS Amplify → S3 + CloudFront → Global Users
   ↓          ↓            ↓              ↓
Source Code  Build      Static Assets   CDN Edge
Repository   Pipeline   Hosting         Locations
```

This architecture provides a robust, scalable, and secure foundation for real-time location tracking and IoT device management with comprehensive analytics capabilities.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run E2E tests
npm run cypress

# Lint code
npm run lint

# Format code
npm run format
```

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run cypress
```

### Test Environment Variables
Create `cypress.env.json` for E2E tests:
```json
{
  "WEB_DOMAIN": "http://localhost:3000",
  "PINPOINT_IDENTITY_POOL_ID": "your-identity-pool-id",
  "PINPOINT_APPLICATION_ID": "your-pinpoint-app-id"
}
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. **ESLint errors**
   ```bash
   # Fix auto-fixable issues
   npm run lint -- --fix
   ```

3. **AWS credentials not found**
   ```bash
   # Configure AWS CLI
   aws configure
   ```

4. **Port 3000 already in use**
   ```bash
   # Kill existing process
   lsof -ti:3000 | xargs kill -9
   ```

### AWS Service Issues

1. **Location Service not working**
   - Verify map name exists in AWS Location Service
   - Check API key permissions
   - Ensure region matches your resources

2. **IoT Core connection issues**
   - Verify IoT endpoint is correct
   - Check Cognito identity pool permissions
   - Ensure tracker exists in Location Service

3. **Pinpoint analytics not working**
   - Verify Pinpoint app ID is correct
   - Check Cognito identity pool permissions
   - Ensure Pinpoint app is active

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## Getting Help

The best way to interact with our team is through GitHub.
You can [open an issue](https://github.com/aws-geospatial/amazon-location-features-demo-web/issues/new) and choose from one of our templates for
[bug reports](https://github.com/aws-geospatial/amazon-location-features-demo-web/issues/new?assignees=&labels=bug%2C+needs-triage&template=---bug-report.md&title=),
[feature requests](https://github.com/aws-geospatial/amazon-location-features-demo-web/issues/new?assignees=&labels=feature-request&template=---feature-request.md&title=)
or [guidance](https://github.com/aws-geospatial/amazon-location-features-demo-web/issues/new?assignees=&labels=guidance%2C+needs-triage&template=---questions---help.md&title=).
If you have a support plan with [AWS Support](https://aws.amazon.com/premiumsupport/), you can also create a new support case.

## Contributing

We welcome community contributions and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to set up a development environment and submit code.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.
