import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import 'graphql';
import { buildSchemaSync } from 'type-graphql';
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda';
import { PlantLibraryResolver } from '../resolver/plant-library.resolver';
import Container from 'typedi';

const schema = buildSchemaSync({
  resolvers: [PlantLibraryResolver],
  container: Container,
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
