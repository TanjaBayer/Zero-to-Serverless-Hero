import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import 'graphql';
import { buildSchemaSync } from 'type-graphql';
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda';
import { GreetingResolver } from '../resolver/greeting.resolver';

const schema = buildSchemaSync({
  resolvers: [GreetingResolver],
  validate: { forbidUnknownValues: false },
  dateScalarMode: 'timestamp',
});

const server = new ApolloServer({
  schema: schema,
  introspection: true,
  csrfPrevention: true,
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler()
);
