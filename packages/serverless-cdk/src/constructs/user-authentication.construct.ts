import { CfnOutput, RemovalPolicy, Stack, custom_resources } from 'aws-cdk-lib';
import {
  AccountRecovery,
  StringAttribute,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { getWorkspaceRoot } from '../utils/workspace';
import { lambda } from '../utils/lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import {
  Effect,
  Policy,
  PolicyStatement,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';

import { join } from 'path';

interface UserAuthenticationProps {
  userTable: ITable;
}

export class UserAuthentication extends Construct {
  userPool: UserPool;
  webClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: UserAuthenticationProps) {
    super(scope, id);

    this.userPool = new UserPool(this, 'user-pool', {
      standardAttributes: { email: { required: true, mutable: true } },
      customAttributes: {
        authChallenge: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.NONE,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    new UserPoolDomain(this, 'Domain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: 'serverless-hero', // Here you define your domain prefix
      },
    });

    const postConfirmationHandler = lambda(
      this,
      'post-auth',
      join(
        getWorkspaceRoot(),
        'dist/packages/serverless-api/post-auth',
        'handler.zip'
      ),
      {
        environment: {
          REGION: Stack.of(this).region,
          COGNITO_USER_POOL_ID: this.userPool.userPoolId,
        },
      }
    );

    // For being able to add the lambda triggers https://github.com/aws/aws-cdk/issues/10002 we can not add it directly with addTrigger, because of the userPoolId reference which would result in a circular dependency
    new custom_resources.AwsCustomResource(this, 'update-user-pool', {
      logRetention: 30,
      resourceType: 'Custom::UpdateUserPool',
      // https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_UpdateUserPool.html#CognitoUserPools-UpdateUserPool-request-EmailConfiguration
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.custom_resources.AwsCustomResource.html
      onUpdate: {
        region: Stack.of(this).region,
        service: 'CognitoIdentityServiceProvider',
        action: 'updateUserPool',
        parameters: {
          UserPoolId: this.userPool.userPoolId,
          AutoVerifiedAttributes: ['email'],
          LambdaConfig: {
            PostConfirmation: postConfirmationHandler.functionArn,
          },
          Policies: {
            PasswordPolicy: {
              MinimumLength: 8,
              RequireLowercase: false,
              RequireNumbers: true,
              RequireSymbols: true,
              RequireUppercase: false,
            },
          },
        },
        physicalResourceId: custom_resources.PhysicalResourceId.of(
          this.userPool.userPoolId
        ),
      },
      policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
    const invokeCognitoTriggerPermission = {
      principal: new ServicePrincipal('cognito-idp.amazonaws.com'),
      sourceArn: this.userPool.userPoolArn,
    };

    postConfirmationHandler.addPermission(
      'InvokePostConfirmationHandlerPermission',
      invokeCognitoTriggerPermission
    );

    props.userTable.grantReadWriteData(postConfirmationHandler);
    this.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'serverless-hero',
      },
    });

    this.webClient = this.userPool.addClient('web-client', {
      authFlows: { custom: true },
    });
    // Using inline policy as a workaround to fix: https://github.com/aws/aws-cdk/issues/7016
    postConfirmationHandler.role?.attachInlinePolicy(
      new Policy(this, 'allow-update-user', {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['cognito-idp:AdminUpdateUserAttributes'],
            resources: [this.userPool.userPoolArn],
          }),
        ],
      })
    );
    // You do not need this, it is only for logging the information in the end of the deployment process.
    new CfnOutput(this, 'user-pool-id', {
      value: this.userPool.userPoolId,
      description: 'User Pool ID',
    });

    new CfnOutput(this, 'client-id', {
      value: this.webClient.userPoolClientId,
      description: 'User Pool Client ID',
    });
  }
}
