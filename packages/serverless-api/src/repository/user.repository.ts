import Container, { Service } from 'typedi';

import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderClientConfig,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoStore } from '@cubesoft/dynamo-easy';

import { UserModel } from '../model/user.model';
import { COGNITO_USER_POOL_ID } from '../token/cognito';
import { REGION } from '../token/env';

@Service()
export class UserRepository {
  private dynamoDb = new DynamoDB({ region: Container.get(REGION) });
  private cognitoUserPoolId = Container.get(COGNITO_USER_POOL_ID);
  private readonly userStore: DynamoStore<UserModel>;

  constructor() {
    this.userStore = new DynamoStore(UserModel, this.dynamoDb);
  }

  /**
   * Create a new user in cognito
   *
   * @param id Unique id of the user can be used for anonymised usage e.g in logs
   * @param email Email address of the user to create
   * @returns The created UserType
   */
  async createUser(id: string, email: string): Promise<UserModel> {
    const user = new UserModel();
    user.id = id;
    user.email = email;
    await this.userStore.put(user).exec();
    return user;
  }

  /**
   * Get a user from cognito by id
   *
   * @param id Unique id of the user can be used for anonymised usage e.g in logs
   * @returns The created UserType
   */
  async getUser(id: string): Promise<UserModel> {
    return this.userStore.get(id).exec();
  }

  /**
   * Update a user in cognito
   *
   * @param email Email address of the user to update
   */
  async updateCognitoUserMail(
    userId: string,
    email: string,
    provider: CognitoIdentityProviderClientConfig = {}
  ): Promise<void> {
    const client = new CognitoIdentityProviderClient(provider);
    const command = new AdminUpdateUserAttributesCommand({
      Username: userId,
      UserPoolId: this.cognitoUserPoolId,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
    });
    const response = await client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error('Failed to create user');
    }
  }
}
