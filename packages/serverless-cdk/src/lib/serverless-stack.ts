import { Stack, StackProps } from 'aws-cdk-lib';
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
      handler: 'index.handler',
      code: Code.fromInline(`
      exports.handler = async function(event) {
        console.log("Hello, CDK!");
        return {
          statusCode: 200,
          body: JSON.stringify('Hello from Lambda!'),
        };
      }
    `),
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
