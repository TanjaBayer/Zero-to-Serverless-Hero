import 'reflect-metadata';
import 'class-validator';
import { ApolloServer } from '@apollo/server';
import 'graphql';
import { buildSchemaSync } from 'type-graphql';
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda';
import { PlantLibraryResolver } from '../resolver/plant-library.resolver';
import Container from 'typedi';
import { getHeader } from '../helper/graphql.helper';
import { customAuthChecker } from '../helper/auth.checker';
import { GraphQLError } from 'graphql';
import { REGION } from '../token/env';
import { COGNITO_USER_POOL_ID } from '../token/cognito';

const API_KEYS = ['your-key'];

Container.set(REGION, process.env.REGION);
Container.set(COGNITO_USER_POOL_ID, process.env.COGNITO_USER_POOL_ID);
const schema = buildSchemaSync({
  resolvers: [PlantLibraryResolver],
  container: Container,
  validate: { forbidUnknownValues: false },
  dateScalarMode: 'timestamp',
  authChecker: customAuthChecker,
});

const server = new ApolloServer({
  schema: schema,
  introspection: true,
  csrfPrevention: true,
});
export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      const apiKey = getHeader('x-api-key', event.headers);
      if (!apiKey || !API_KEYS.includes(apiKey)) {
        throw new GraphQLError(
          'You are not authorized to perform this action.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }
      const authToken = getHeader('authorization', event.headers);
      const clientIp = event.requestContext.http.sourceIp;

      return {
        authToken,
        apiKey,
        clientIp,
      };
    },
  }
);
