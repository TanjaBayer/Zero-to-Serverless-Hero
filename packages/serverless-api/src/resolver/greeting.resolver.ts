import { Query, Resolver } from 'type-graphql';

@Resolver()
export class GreetingResolver {
  @Query(() => String, {
    description:
      'Returns a greeting message. This is a sample query that returns a string',
  })
  async hello(): Promise<string> {
    return 'world';
  }
}
