import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import 'graphql';
import { ForbiddenError, buildSchemaSync } from 'type-graphql';
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda';
import { PlantLibraryResolver } from '../resolver/plant-library.resolver';
import Container from 'typedi';
import { getHeader } from '../helper/graphql.helper';
import { customAuthChecker } from '../helper/auth.checker';
import { GraphQLError } from 'graphql';

const API_KEYS = ['your-key'];

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
    context: async ({ event, context }) => {
      const apiKey = getHeader('x-api-key', event.headers);
      if (!apiKey || !API_KEYS.includes(apiKey)) {
        throw new GraphQLError(
          'You are not authorized to perform this action.',
          {
            extensions: { code: 'FORBIDDEN' },
          }
        );
      }
      return {
        lambdaEvent: event,
        lambdaContext: context,
      };
    },
  }
);
