# Realtime IoT Dashboard with AWS AppSync and Amazon Location Service

**Update!!!** this project has been updated to use [**Amplify Gen2**](https://docs.amplify.aws/react/) to deploy the backend services in AWS.

This application demonstrates a web application dashboard receiving real-time updates from a series of IoT sensors. It depicts a fictitious set of pH sensors deployed around the San Francisco Bay. The solution is built with React, AWS AppSync, Amazon Location Service, AWS Amplify, and AWS IoT technologies.

![Image description](images/map.jpg)

The sensors are represented as the colored dots. Their color will fluxuate between red, green, and yellow based on the messages received from the sensors.

## Architecture

![Image description](images/architecture.jpg)

1. The sensor component is developed with the AWS IoT Device SDK for JavaScript. The sensors are registered as _Things_ in IoT Core and publish random values to the Cloud on a configurable frequency. Metadata about each sensor, such as its geolocation, is stored in a _Thing Shadow_.

2. Rules in IoT Core subscribe to the message topic and forward the JSON payload to a Lambda function and the IoT Analytics pipeline.

3. The Node.js Lambda function executes a GraphQL mutation in AppSync. The mutation saves the sensor's value in DynamoDB and broadcasts the value in real-time to the web dashboard. The Lambda function uses an IAM role and policy to obtain permissions to interact with AppSync.

4. The React web dashboard application is written in JavaScript and subscribes to the AppSync sensor subscriptions. When new values are received, an Amazon Location Service map is updated in real-time to reflect the new sensor values. The application uses Cognito to authenticate users and allow them to perform the AppSync subscription.

## Getting Started

## **Prerequisites**

The following software was used in the development of this application. While it may work with alternative versions, we recommend you deploy the specified minimum version.

1. An AWS account in which you have Administrator access.

2. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) (v2.15.3) the AWS Command Line Interface (CLI) is used to configure your connection credentials to AWS. These credentials are used by the CDK, Amplify, and the CLI.

3. [Node.js](https://nodejs.org/en/download/) (v18.19.0) with NPM (v10.1.0)

## **Installation**

**Clone this code repository**

```
git clone https://github.com/pxkundu/aws-iot-core-realtime-dashboard.git
```

**Switch to the project's web folder**

```
cd aws-iot-core-realtime-dashboard/web
```

**Install the web app's Node.js packages**

```
npm install
```

**Deploy the Infrastructure with Amplify Gen2**

```
npx ampx sandbox
```

The deployment is complete when you see the following output:

```bash
File written: amplify_outputs.json
```

Press **CTRL-C** to exit the deployment.

Resources created in your account include:

- AppSync GraphQL API
- DynamoDB Table
- Cognito User Pool
- Lambda Functions (2)
- IoT Rule
- Amazon Location Service Map

**Install the IoT sensor simulator**

Open a new terminal window then switch to the app's **sensor** folder (aws-iot-core-realtime-dashboard/sensor).

Install the Node js packages, and run the Node js app to create your sensor as a _Thing_ in AWS IoT Core. It will also create and install the certificates your sensor needs to authenticate to IoT Core.

From the app's **sensor** folder:

```
npm install
node create-sensors.js
```

_Note - the profile and region arguments are optional. If not specified the app will create the sensors using your default AWS Profile in us-east-1_

## Run the web app

**Start the IoT sensor**

From the **sensor** terminal window:

```
node index.js
```

You will see output from the app as it connects to IoT Core and publishes new messages for six sensors every few seconds.

```
published to shadow topic $aws/things/sensor-sf-north/shadow/update {"state":{"reported":{"name":"SF Bay - North","enabled":true,"geo":{"latitude":37.800307,"longitude":-122.354788}}}}

published to telemetry topic dt/bay-health/SF/sensor-sf-north/sensor-value {"pH":5,"temperature":54.7,"salinity":25,"disolvedO2":6.1,"timestamp":1591831843844}
```

**Start the web app**

Switch back to the terminal window pointing to the **web** folder and run:

```
npm run dev
```

This will launch the application in your machine's default web browser.

**Sign-up and Sign-in**

The web app requires users to authenticate via Cognito. The first screen you will see is a logon screen. Click the **Create account** link and create a new account using your email address.

Cognito will then email you a confirmation code. Enter this code into the subsequent confirmation screen and logon to the app with your credentials.

**Use the web app**

You should now see a screen similar to the one at the top of this guide. If you look at the terminal window running the sensor app, you shoud see the values being published to the Cloud reflected in the web app's sensor icon in real-time.

## Cleanup

Once you are finished working with this project, you may want to delete the resources it created in your AWS account.

From the **web** folder:

```
npx ampx sandbox delete
```

From the **sensor** folder:

```
node delete-sensors.js
```

_Note - the profile and region arguments are optional. If not specified the app will delete the sensors using your default AWS Profile in us-east-1_

## License

This sample code is made available under a modified MIT-0 license. See the LICENSE file.
