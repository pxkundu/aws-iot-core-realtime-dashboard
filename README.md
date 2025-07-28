# 🚀 AWS IoT Dashboard - Simplified

A clean, modern React-based IoT dashboard with real-time device tracking and geofencing capabilities.

## ✨ Features

- 🔐 **User Authentication** - Secure sign up, sign in, and session management
- 📱 **Device Management** - Create, track, and manage IoT devices with real-time status
- 🗺️ **Geofencing** - Create and monitor geographical boundaries
- 🔗 **Device Assignment** - Assign devices to geofences for monitoring
- 📧 **Email Notifications** - Automatic alerts when devices enter/exit geofences
- ⚡ **Real-time Updates** - Live device location tracking via AWS IoT Core

## 🏗️ **Simplified Architecture**

### **Frontend**
- **React 18** with TypeScript and Tailwind CSS
- **Zustand** for state management (single store)
- **Flat component structure** (no atomic design complexity)

### **Backend**
- **AWS Amplify** - Authentication and GraphQL API
- **Single CDK Stack** - IoT Core, Location Service, and Notifications
- **GraphQL-only data layer** (no custom REST APIs)

### **AWS Services**
- **Amazon Cognito** - User authentication
- **AWS AppSync** - GraphQL API with real-time subscriptions
- **AWS IoT Core** - Device messaging and management
- **Amazon Location Service** - Maps, tracking, and geofencing
- **Amazon SNS + SES** - Email notifications


# 🎯 **SIMPLIFIED ARCHITECTURE REFACTORING PLAN**

## **Current Status: 4 Core Features Working**
✅ User Authentication  
✅ Device Management (CRUD)  
✅ Geofence Management (CRUD)  
✅ Device-Geofence Assignments  
✅ Email Notifications  

---

## 🏗️ **SIMPLIFIED ARCHITECTURE OVERVIEW**

graph TB
    subgraph "SIMPLIFIED SOLUTIONS ARCHITECTURE"
        subgraph "Frontend (React)"
            UI["React Dashboard<br/>Auth (Login/Register)<br/>Device Management<br/>Geofence Management<br/>Real-time Map"]
        end
        
        subgraph "AWS Amplify (Managed Services)"
            AUTH["Amplify Auth<br/>Cognito User Pool<br/>User Management"]
            GQL["Amplify GraphQL API<br/>Device CRUD<br/>Geofence CRUD<br/>Assignment CRUD<br/>Auto-generated resolvers"]
        end
        
        subgraph "Custom AWS Resources (Single CDK Stack)"
            IOT["AWS IoT Core<br/>Device Registry<br/>MQTT Messaging"]
            LOC["Amazon Location<br/>Maps, Tracker<br/>Geofences"]
            SNS["Amazon SNS<br/>Notification Topic"]
            SES["Amazon SES<br/>Email Service"]
            LAMBDA["Lambda Function<br/>Geofence Processor<br/>Email Sender"]
        end
        
        subgraph "Real-time Data Flow"
            MQTT["MQTT Messages<br/>Device Locations"]
            WS["WebSocket<br/>Real-time Updates"]
        end
    end
    
    UI --> AUTH
    UI --> GQL
    UI --> WS
    
    AUTH --> GQL
    GQL --> IOT
    GQL --> LOC
    
    IOT --> MQTT
    MQTT --> LOC
    LOC --> LAMBDA
    LAMBDA --> SNS
    SNS --> SES
    
    IOT --> WS
    WS --> UI
    
    classDef amplify fill:#ff9900,stroke:#232f3e,stroke-width:2px,color:#fff
    classDef aws fill:#232f3e,stroke:#ff9900,stroke-width:2px,color:#fff
    classDef frontend fill:#61dafb,stroke:#21232a,stroke-width:2px,color:#000
    classDef realtime fill:#00d4aa,stroke:#232f3e,stroke-width:2px,color:#000
    
    class AUTH,GQL amplify
    class IOT,LOC,SNS,SES,LAMBDA aws
    class UI frontend
    class MQTT,WS realtime

---

## 📁 **FRONTEND SIMPLIFICATION**

graph LR
    subgraph "REFACTORED PROJECT STRUCTURE"
        subgraph "Root"
            README["README.md"]
            ENV[".env.example"]
            PACKAGE["package.json"]
        end
        
        subgraph "amplify/"
            BACKEND["backend.ts<br/>(Single Configuration)"]
            AUTH_R["auth/resource.ts<br/>(Cognito)"]
            DATA_R["data/resource.ts<br/>(GraphQL Schema)"]
            CUSTOM["custom/IoTStack/<br/>resource.ts<br/>(IoT + Location + SNS)"]
        end
        
        subgraph "src/"
            COMPONENTS["components/<br/>auth/, devices/, geofences/<br/>common/, layout/"]
            PAGES["pages/<br/>Dashboard.tsx<br/>Login.tsx"]
            SERVICES["services/<br/>api.ts, auth.ts<br/>realtime.ts"]
            HOOKS["hooks/<br/>useAuth.ts<br/>useDevices.ts<br/>useGeofences.ts"]
            STORE["store/<br/>index.ts<br/>(Single Zustand Store)"]
        end
    end
    
    classDef config fill:#f9f,stroke:#333,stroke-width:2px
    classDef backend fill:#9f9,stroke:#333,stroke-width:2px  
    classDef frontend fill:#99f,stroke:#333,stroke-width:2px
    
    class README,ENV,PACKAGE config
    class BACKEND,AUTH_R,DATA_R,CUSTOM backend
    class COMPONENTS,PAGES,SERVICES,HOOKS,STORE frontend

### **Component Structure (Flat & Functional)**
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── devices/
│   │   ├── DeviceList.tsx
│   │   ├── DeviceForm.tsx
│   │   ├── DeviceCard.tsx
│   │   └── DeviceMap.tsx
│   ├── geofences/
│   │   ├── GeofenceList.tsx
│   │   ├── GeofenceForm.tsx
│   │   └── GeofenceMap.tsx
│   ├── assignments/
│   │   ├── AssignmentList.tsx
│   │   └── AssignmentForm.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Layout.tsx
│       └── Navigation.tsx
├── pages/
│   ├── Dashboard.tsx        # Main dashboard with tabs
│   ├── LoginPage.tsx
│   └── NotFoundPage.tsx
├── hooks/
│   ├── useAuth.ts          # Authentication state
│   ├── useDevices.ts       # Device operations
│   ├── useGeofences.ts     # Geofence operations
│   └── useRealtime.ts      # IoT real-time updates
├── services/
│   ├── api.ts              # GraphQL operations
│   ├── auth.ts             # Authentication service
│   └── realtime.ts         # WebSocket/IoT real-time
├── store/
│   ├── index.ts            # Single Zustand store
│   ├── authSlice.ts
│   ├── deviceSlice.ts
│   └── geofenceSlice.ts
├── types/
│   ├── api.ts              # GraphQL generated types
│   ├── device.ts
│   ├── geofence.ts
│   └── auth.ts
└── utils/
    ├── config.ts
    ├── validation.ts
    └── helpers.ts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS account with IoT and Location Service access

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd aws-iot-core-realtime-dashboard
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Configure your AWS credentials and region in .env
```

### 3. Deploy Backend
```bash
# Deploy Amplify backend (single command!)
npx ampx sandbox

# The command will output your API endpoint and auth configuration
```

### 4. Start Development
```bash
npm start
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

## 📁 **Project Structure**

```
src/
├── components/           # Functional React components
│   ├── auth/            # LoginForm, RegisterForm, AuthGuard
│   ├── devices/         # DeviceList, DeviceCard, DeviceForm
│   ├── geofences/       # GeofenceList, GeofenceCard, GeofenceForm
│   ├── assignments/     # AssignmentList, AssignmentCard
│   ├── common/          # Button, Modal, Input (reusable)
│   └── layout/          # Header, Sidebar, Layout
├── pages/               # Route components
│   ├── Dashboard.tsx    # Main dashboard with tabs
│   ├── LoginPage.tsx    # Authentication page
│   └── NotFoundPage.tsx # 404 page
├── services/            # API and external service integration
│   ├── api.ts           # All GraphQL operations
│   ├── auth.ts          # Authentication service
│   └── realtime.ts      # IoT/WebSocket real-time updates
├── store/               # Zustand state management
│   └── index.ts         # Single application store
└── types/               # TypeScript type definitions
    ├── api.ts           # GraphQL generated types
    ├── device.ts        # Device-related types
    └── geofence.ts      # Geofence-related types

amplify/
├── auth/                # Cognito authentication
├── data/                # GraphQL API schema
└── custom/              # Single CDK stack
    └── IoTStack/        # IoT Core + Location + Notifications
```

## 🔧 **Development**

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run type-check # TypeScript validation
```

### Key Design Principles
- **Simplicity First** - No over-engineering or unnecessary complexity
- **Single Responsibility** - Each component does one thing well
- **Type Safety** - Full TypeScript coverage with proper error handling
- **Performance** - Minimal bundle size and fast loading

## 🧪 **Testing**

Essential E2E tests are located in `/cypress/e2e/`:
- User authentication flow
- Device CRUD operations
- Geofence management
- Device assignment functionality

```bash
npm run cy:open    # Open Cypress test runner
npm run cy:run     # Run tests headlessly
```

## 🚀 **Deployment**

### Production Build
```bash
npm run build
```

### Deploy to AWS
```bash
# Deploy backend changes
npx ampx pipeline-deploy --branch main

# Frontend can be deployed to any static hosting (S3, Netlify, Vercel)
```

## 🔑 **Key Features Details**

### **Device Management**
- Create devices with GPS coordinates
- Real-time status tracking (Active/Inactive/Offline)
- Device metadata and descriptions
- Location history and updates

### **Geofencing**
- Create custom geographical boundaries
- GeoJSON polygon support
- Active/Inactive status management
- Integration with Amazon Location Service

### **Device Assignment**
- Assign devices to multiple geofences
- Monitor assignment status
- Automatic breach detection
- Email notifications on geofence events

### **Real-time Notifications**
- SNS topic for geofence events
- SES email delivery
- Customizable notification templates
- Event-driven architecture

## 🤝 **Contributing**

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 **License**

This project is licensed under the MIT License.

---

**⚡ Simple. Clean. Efficient.** - Focus on what matters: building great IoT experiences!
