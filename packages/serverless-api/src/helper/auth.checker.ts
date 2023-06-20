import { AuthChecker } from 'type-graphql';

export const customAuthChecker: AuthChecker<any> = async (data, roles) => {
  return true;
};
