import { ScopeEnum } from '../enums/scope.enum';

export class Context {
  clientId: string;
  clientIp: string;
  authToken: string;
  // from auth.checker.ts
  userId?: string;
  scopes: ScopeEnum[];
}
