import {
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from 'aws-lambda';
import 'reflect-metadata';
import { Container } from 'typedi';
import { COGNITO_USER_POOL_ID } from '../token/cognito';

import { UserRepository } from '../repository/user.repository';
import { REGION } from '../token/env';

Container.set(REGION, process.env.REGION);
Container.set(COGNITO_USER_POOL_ID, process.env.COGNITO_USER_POOL_ID);

export const handler: PostConfirmationTriggerHandler = async (
  event: PostConfirmationTriggerEvent
) => {
  try {
    const userRepository = Container.get(UserRepository);
    if (event.userPoolId !== Container.get(COGNITO_USER_POOL_ID)) {
      console.warn(
        `User Pool ID does not match ${event.userPoolId} !== ${Container.get(
          COGNITO_USER_POOL_ID
        )}`
      );
      return event;
    }

    if (
      event.request.userAttributes.email &&
      event.triggerSource === 'PostConfirmation_ConfirmSignUp'
    ) {
      console.log(
        'Create new with cognito user: ',
        event.request.userAttributes.userName
      );

      const mail = event.request.userAttributes.email.toLocaleLowerCase();

      const createdUser = await userRepository.createUser(event.userName, mail);

      console.log(`Created User: ${createdUser.id}`);
      if (event.request.userAttributes.email !== mail) {
        await userRepository.updateCognitoUserMail(
          event.request.userAttributes.userName,
          mail
        );

        console.log(`Updated UserMail: ${createdUser.id}`);
      }
    }
    if (event.triggerSource === 'PostConfirmation_ConfirmForgotPassword') {
      // we can handle some specifics for forgot pw
    } else {
      // Nothing to do, the user's email ID is unknown
    }

    return event;
  } catch (error) {
    console.log(error);
  }

  return event;
};
