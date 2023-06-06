import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration, Size } from 'aws-cdk-lib';
import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { join } from 'path';

import { getWorkspaceRoot } from '../utils/workspace';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
export class ServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new HttpApi(this, 'httpAPI', {
      apiName: `http-api`,
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
        allowOrigins: ['*'],
      },
    });

    const lambda = new Function(this, 'api-handler', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'serverless-api.handler',
      functionName: 'serverless-api',
      code: Code.fromAsset(
        join(
          getWorkspaceRoot(),
          'dist/packages/serverless-api/serverless-api',
          'handler.zip'
        )
      ),
      memorySize: Size.gibibytes(1).toMebibytes(),
      architecture: Architecture.ARM_64,
      logRetention: RetentionDays.ONE_DAY,
      timeout: Duration.seconds(5),
    });
    const readIntegration = new HttpLambdaIntegration(
      'apiReadIntegration',
      lambda
    );
    const writeIntegration = new HttpLambdaIntegration(
      'apiWriteIntegration',
      lambda
    );
    const dataTable = new Table(this, 'data-table', {
      tableName: `data_table`,
      timeToLiveAttribute: 'ttl',
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: 'id', type: AttributeType.STRING },
    });
    dataTable.grantReadWriteData(lambda);

    api.addRoutes({
      integration: readIntegration,
      methods: [HttpMethod.GET],
      path: '/graphql',
    });
    api.addRoutes({
      integration: writeIntegration,
      methods: [HttpMethod.POST],
      path: '/graphql',
    });
  }
}
