import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

export class DatabaseConstruct extends Construct {
  public readonly devicesTable: dynamodb.Table;
  public readonly geofenceAssignmentsTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Devices table for storing device information
    this.devicesTable = new dynamodb.Table(this, 'Devices', {
      tableName: 'aws-iot-dashboard-devices',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // For development
      pointInTimeRecovery: true
    });

    // Geofence Assignments table for device-geofence relationships
    this.geofenceAssignmentsTable = new dynamodb.Table(this, 'GeofenceAssignments', {
      tableName: 'aws-iot-dashboard-assignments',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // For development
      pointInTimeRecovery: true
    });

    // Add GSI for querying by device
    this.geofenceAssignmentsTable.addGlobalSecondaryIndex({
      indexName: 'DeviceIndex',
      partitionKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'geofenceId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // Add GSI for querying by geofence
    this.geofenceAssignmentsTable.addGlobalSecondaryIndex({
      indexName: 'GeofenceIndex',
      partitionKey: { name: 'geofenceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'deviceId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });
  }
} 